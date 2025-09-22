import InvoiceService from "../payment/invoiceService.js";
import NotificationService from "../notification/notificationService.js";
import AdminSettings from "../../models/AdminSettings.js";
import Booking from "../../models/Booking.js";
import { User } from "../../models/User.js";
import Room from "../../models/Room.js";
import { parseISO, isBefore, isAfter, differenceInDays, addDays } from 'date-fns';

class BookingService {
  constructor() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached settings
  async getSettings() {
    const now = Date.now();
    if (!this.settingsCache || (now - this.settingsCacheTime) > this.CACHE_DURATION) {
      try {
        this.settingsCache = await AdminSettings.findOne().lean();
        this.settingsCacheTime = now;
      } catch (error) {
        console.error("Failed to fetch settings for booking:", error);
        // Use defaults if database fails
        this.settingsCache = {
          allowGuestBooking: true,
          requireApproval: false,
          maxAdvanceBooking: 365,
          defaultCheckInTime: '15:00',
          defaultCheckOutTime: '11:00',
          maxGuestsPerRoom: 4,
          cancellationPolicy: '24 hours before check-in',
          financialSettings: {
            taxRate: 0,
            serviceFee: 0,
            depositRequired: true,
            depositAmount: 100,
            depositType: 'fixed'
          }
        };
      }
    }
    return this.settingsCache;
  }

  // Validate booking based on settings
  async validateBooking(bookingData, user) {
    const settings = await this.getSettings();
    const errors = [];

    // Check if guest booking is allowed
    if (user.role === 'guest' && !settings.allowGuestBooking) {
      errors.push('Guest bookings are not allowed. Please register for an account.');
    }

    // Validate dates
    const checkInDate = typeof bookingData.checkIn === 'string' ? parseISO(bookingData.checkIn) : bookingData.checkIn;
    const checkOutDate = typeof bookingData.checkOut === 'string' ? parseISO(bookingData.checkOut) : bookingData.checkOut;
    const today = new Date();

    if (isBefore(checkInDate, today)) {
      errors.push('Check-in date cannot be in the past');
    }

    if (!isAfter(checkOutDate, checkInDate)) {
      errors.push('Check-out date must be after check-in date');
    }

    // Validate operational hours
    const operationalSettings = settings.operationalSettings || {};
    if (operationalSettings.enabled) {
      // Check if booking is within allowed days
      const checkInDay = checkInDate.toLocaleLowerCase('en-US', { weekday: 'long' });
      const allowedDays = operationalSettings.allowedDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      if (!allowedDays.includes(checkInDay)) {
        errors.push(`Bookings are not allowed on ${checkInDay.toUpperCase()}. Allowed days: ${allowedDays.join(', ')}`);
      }

      // Check if booking is within operational hours
      const checkInTime = checkInDate.toTimeString().slice(0, 5); // HH:MM format
      const checkOutTime = checkOutDate.toTimeString().slice(0, 5);

      if (operationalSettings.startTime && operationalSettings.endTime) {
        if (checkInTime < operationalSettings.startTime ||
            checkInTime > operationalSettings.endTime) {
          errors.push(`Check-in time must be between ${operationalSettings.startTime} and ${operationalSettings.endTime}`);
        }

        if (checkOutTime < operationalSettings.startTime ||
            checkOutTime > operationalSettings.endTime) {
          errors.push(`Check-out time must be between ${operationalSettings.startTime} and ${operationalSettings.endTime}`);
        }
      }

      // Check check-in/check-out windows
      if (operationalSettings.checkInWindowStart && operationalSettings.checkInWindowEnd) {
        if (checkInTime < operationalSettings.checkInWindowStart ||
            checkInTime > operationalSettings.checkInWindowEnd) {
          errors.push(`Check-in must be between ${operationalSettings.checkInWindowStart} and ${operationalSettings.checkInWindowEnd}`);
        }
      }

      if (operationalSettings.checkOutWindowStart && operationalSettings.checkOutWindowEnd) {
        if (checkOutTime < operationalSettings.checkOutWindowStart ||
            checkOutTime > operationalSettings.checkOutWindowEnd) {
          errors.push(`Check-out must be between ${operationalSettings.checkOutWindowStart} and ${operationalSettings.checkOutWindowEnd}`);
        }
      }

      // Check minimum stay hours
      const stayHours = (checkOutDate - checkInDate) / (1000 * 60 * 60);
      if (operationalSettings.minStayHours && stayHours < operationalSettings.minStayHours) {
        errors.push(`Minimum stay is ${operationalSettings.minStayHours} hours`);
      }

      // Check maximum stay days
      if (operationalSettings.maxStayDays && differenceInDays(checkOutDate, checkInDate) > operationalSettings.maxStayDays) {
        errors.push(`Maximum stay is ${operationalSettings.maxStayDays} days`);
      }

      // Check maintenance days and special closures
      const maintenanceDays = operationalSettings.maintenanceDays || [];
      const specialClosures = operationalSettings.specialClosures || [];

      // Check maintenance days
      const isMaintenanceDay = maintenanceDays.some(day =>
        day.isActive &&
        new Date(day.date).toDateString() === checkInDate.toDateString()
      );

      if (isMaintenanceDay) {
        errors.push('The hotel is closed for maintenance on the selected date');
      }

      // Check special closures
      const isSpecialClosure = specialClosures.some(closure =>
        closure.isActive &&
        checkInDate >= new Date(closure.startDate) &&
        checkInDate <= new Date(closure.endDate)
      );

      if (isSpecialClosure) {
        errors.push('The hotel is closed during the selected period');
      }

      // Check advance booking days
      if (operationalSettings.advanceBookingDays) {
        const maxAdvanceDate = addDays(today, operationalSettings.advanceBookingDays);
        if (isAfter(checkInDate, maxAdvanceDate)) {
          errors.push(`Bookings can only be made up to ${operationalSettings.advanceBookingDays} days in advance`);
        }
      }
    }

    // Check stay duration
    const stayDuration = differenceInDays(checkOutDate, checkInDate);
    const roomSettings = settings.roomSettings || {};
    
    if (roomSettings.minimumStay && stayDuration < roomSettings.minimumStay) {
      errors.push(`Minimum stay is ${roomSettings.minimumStay} ${roomSettings.minimumStay === 1 ? 'night' : 'nights'}`);
    }

    if (roomSettings.maximumStay && stayDuration > roomSettings.maximumStay) {
      errors.push(`Maximum stay is ${roomSettings.maximumStay} nights`);
    }

    // Validate guest count
    if (bookingData.guests > (settings.maxGuestsPerRoom || 4)) {
      errors.push(`Maximum ${settings.maxGuestsPerRoom || 4} guests allowed per room`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      stayDuration
    };
  }

  // Calculate booking cost based on settings
  async calculateBookingCost(checkIn, checkOut, roomRate) {
    const settings = await this.getSettings();
    const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
    const checkOutDate = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;

    if (!checkInDate || !checkOutDate || isNaN(checkInDate) || isNaN(checkOutDate)) {
      throw new Error('Invalid check-in or check-out dates');
    }

    const nights = differenceInDays(checkOutDate, checkInDate);

    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date');
    }

    const rate = parseFloat(roomRate) || 0;
    const subtotal = nights * rate;

    const financialSettings = settings.financialSettings || {};
    const taxRate = (financialSettings.taxRate || 0) / 100;
    const serviceFeeRate = (financialSettings.serviceFee || 0) / 100;

    const tax = subtotal * taxRate;
    const serviceFee = subtotal * serviceFeeRate;
    const total = subtotal + tax + serviceFee;

    const depositRequired = financialSettings.depositRequired !== false;
    const depositAmount = financialSettings.depositAmount || 100;
    const depositType = financialSettings.depositType || 'fixed';

    let deposit = 0;
    if (depositRequired) {
      deposit = depositType === 'percentage'
        ? (total * depositAmount / 100)
        : depositAmount;
    }

    return {
      nights,
      subtotal,
      tax,
      serviceFee,
      total,
      deposit,
      depositRequired,
      currency: settings.currency || 'USD'
    };
  }

  // Create booking with settings integration
  async createBooking(bookingData) {
    try {
      const settings = await this.getSettings();

      // For now, we'll need userId from controller - this should be extracted from JWT
      // The controller should pass userId from req.user._id
      const userId = bookingData.userId;
      if (!userId) {
        throw new Error('User ID is required');
      }

      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Validate booking
      const validation = await this.validateBooking(bookingData, user);
      if (!validation.isValid) {
        throw new Error(`Booking validation failed: ${validation.errors.join(', ')}`);
      }

      // Check room availability
      const room = await Room.findById(bookingData.roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Validate room pricing
      if ((!room.basePrice && !room.price) && !bookingData.roomBasePrice) {
        throw new Error('Room pricing information is not available');
      }

      // Calculate cost
      const costBreakdown = await this.calculateBookingCost(
        bookingData.checkIn,
        bookingData.checkOut,
        bookingData.roomBasePrice || room.basePrice || room.price || 0
      );

      // Create booking
      const booking = new Booking({
        ...bookingData,
        userId,
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        specialRequests: bookingData.specialRequests,
        costBreakdown,
        status: settings.requireApproval ? 'Pending Approval' : 'Confirmed',
        bookingSettings: {
          checkInTime: settings.defaultCheckInTime,
          checkOutTime: settings.defaultCheckOutTime,
          cancellationPolicy: settings.cancellationPolicy,
          operationalHours: settings.operationalSettings || {}
        }
      });

      await booking.save();

      // Create invoice for the booking
      try {
        const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
        booking.invoiceId = invoice._id;
        await booking.save();
      } catch (invoiceError) {
        console.error('Failed to create invoice for booking:', invoiceError);
        // Don't fail the booking creation if invoice creation fails
      }

      // Send notifications based on settings
      if (settings.bookingConfirmations) {
        await NotificationService.sendNotification({
          userId,
          userType: user.role,
          type: 'booking_confirmation',
          title: 'Booking Confirmation',
          message: `Your booking for ${room.name} has been ${booking.status === 'Confirmed' ? 'confirmed' : 'received and is pending approval'}.`,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            roomName: room.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            total: costBreakdown.total,
            currency: costBreakdown.currency
          }
        });
      }

      // Send admin notification if approval is required
      if (settings.requireApproval && settings.adminNotifications) {
        const admins = await User.find({ role: 'admin', isActive: true });
        for (const admin of admins) {
          await NotificationService.sendNotification({
            userId: admin._id,
            userType: 'admin',
            type: 'booking_approval_required',
            title: 'Booking Approval Required',
            message: `New booking from ${user.name} requires approval.`,
            channel: 'email',
            metadata: {
              bookingId: booking._id,
              guestName: user.name,
              roomName: room.name,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut
            }
          });
        }
      }

      return booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Update booking status with notifications
  async updateBookingStatus(bookingId, status, adminId) {
    try {
      const settings = await this.getSettings();
      const booking = await Booking.findById(bookingId).populate('userId roomId');
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      const oldStatus = booking.status;
      booking.status = status;
      booking.updatedBy = adminId;
      await booking.save();

      // Send notification to guest about status change
      if (settings.bookingConfirmations && oldStatus !== status) {
        let notificationType = 'booking_update';
        let message = `Your booking status has been updated to ${status}.`;

        if (status === 'Confirmed') {
          notificationType = 'booking_confirmation';
          message = `Your booking for ${booking.roomId.name} has been confirmed!`;
        } else if (status === 'Cancelled') {
          notificationType = 'booking_cancellation';
          message = `Your booking for ${booking.roomId.name} has been cancelled.`;
        } else if (status === 'Rejected') {
          notificationType = 'booking_rejection';
          message = `Your booking for ${booking.roomId.name} has been rejected.`;
        } else if (status === 'On Hold') {
          notificationType = 'booking_on_hold';
          message = `Your booking for ${booking.roomId.name} has been put on hold.`;
        }

        await NotificationService.sendNotification({
          userId: booking.userId._id,
          userType: booking.userId.role,
          type: notificationType,
          title: 'Booking Status Update',
          message,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            roomName: booking.roomId.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            oldStatus,
            newStatus: status
          }
        });
      }

      return booking;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Clear settings cache when settings are updated
  clearSettingsCache() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
  }
}

export default new BookingService();