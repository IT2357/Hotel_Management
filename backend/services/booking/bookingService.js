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
        console.log('🔧 Loading AdminSettings from database...');
        this.settingsCache = await AdminSettings.findOne().lean();
        console.log('📋 AdminSettings loaded:', JSON.stringify(this.settingsCache, null, 2));
        this.settingsCacheTime = now;
      } catch (error) {
        console.error("Failed to fetch settings for booking:", error);
        // Use defaults if database fails
        console.log('⚠️ Using default settings due to database error');
        this.settingsCache = {
          allowGuestBooking: true,
          requireApproval: false,
          maxAdvanceBooking: 365,
          defaultCheckInTime: '15:00',
          defaultCheckOutTime: '11:00',
          maxGuestsPerRoom: 4,
          cancellationPolicy: '24 hours before check-in',
          bookingSettings: {
            autoApprovalEnabled: false,
            autoApprovalThreshold: 5000,
            requireCashApproval: true,
            requireBankApproval: true,
            requireCardApproval: false,
            approvalTimeoutHours: 24
          },
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

  // Calculate booking cost based on settings with meal plans
  async calculateBookingCost(checkIn, checkOut, room, bookingData = {}) {
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

    // Get base room rate
    let roomRate = room.basePrice || 0;

    // Check for seasonal pricing
    if (room.seasonalPricing && room.seasonalPricing.length > 0) {
      const applicableSeason = room.seasonalPricing.find(season =>
        season.isActive &&
        checkInDate >= season.startDate &&
        checkInDate <= season.endDate
      );
      if (applicableSeason) {
        roomRate = applicableSeason.price;
      }
    }

    // Calculate room cost
    const subtotal = nights * roomRate;

    const financialSettings = settings.financialSettings || {};
    const taxRate = (financialSettings.taxRate || 0) / 100;
    const serviceFeeRate = (financialSettings.serviceFee || 0) / 100;

    // Calculate taxes and service fees
    const tax = subtotal * taxRate;
    const serviceFee = subtotal * serviceFeeRate;

    // Calculate meal plan costs
    let mealPlanCost = 0;
    let mealBreakdown = {};

    if (bookingData.foodPlan && bookingData.foodPlan !== 'None') {
      const guests = bookingData.guests || 1;
      const mealPlanRates = {
        'Breakfast': 15,
        'Half Board': 35, // Breakfast + Dinner
        'Full Board': 50, // All meals
        'A la carte': 0 // Will be calculated separately based on selected meals
      };

      if (bookingData.foodPlan === 'A la carte' && bookingData.selectedMeals) {
        // Calculate cost for selected meals
        mealPlanCost = bookingData.selectedMeals.reduce((total, meal) => {
          return total + (meal.price * guests * nights);
        }, 0);
        mealBreakdown = {
          meals: bookingData.selectedMeals.map(meal => ({
            name: meal.name,
            price: meal.price,
            quantity: guests * nights,
            total: meal.price * guests * nights
          }))
        };
      } else {
        const mealRate = mealPlanRates[bookingData.foodPlan] || 0;
        mealPlanCost = mealRate * guests * nights;
        mealBreakdown = {
          plan: bookingData.foodPlan,
          rate: mealRate,
          guests: guests,
          nights: nights,
          total: mealPlanCost
        };
      }
    }

    const total = subtotal + tax + serviceFee + mealPlanCost;

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
      mealPlanCost,
      total,
      deposit,
      depositRequired,
      currency: settings.currency || 'LKR',
      roomRate,
      mealBreakdown,
      breakdown: {
        roomCost: subtotal,
        taxes: tax,
        serviceFees: serviceFee,
        meals: mealPlanCost,
        total: total
      }
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
      if (!room.basePrice) {
        throw new Error('Room pricing information is not available');
      }

      // Calculate cost with meal plans
      const costBreakdown = await this.calculateBookingCost(
        bookingData.checkIn,
        bookingData.checkOut,
        room,
        bookingData
      );

      // Determine booking status based on payment method and settings
      let finalStatus = bookingData.status || 'Pending Approval'; // Respect status passed from controller
      
      // Check settings for approval requirements
      const bookingSettings = settings && settings.bookingSettings ? settings.bookingSettings : {};
      
      console.log('🔍 Booking creation debug:', {
        paymentMethod: bookingData.paymentMethod,
        initialStatus: bookingData.status,
        finalStatusBeforeLogic: finalStatus,
        settingsExist: !!settings,
        bookingSettings: bookingSettings,
        oldRequireApproval: settings ? settings.requireApprovalForAllBookings : 'undefined'
      });
      
      // Always require admin approval for cash payments - this overrides all other settings
      if (bookingData.paymentMethod === 'cash') {
        finalStatus = 'Pending Approval';
        console.log('💰 Cash payment detected - FORCED Pending Approval status');
      } else if (bookingData.paymentMethod === 'bank') {
        // For bank transfers, check if approval is required
        finalStatus = bookingSettings.requireBankApproval !== false ? 'Pending Approval' : 'Confirmed';
        console.log(`🏦 Bank payment, approval required: ${bookingSettings.requireBankApproval !== false}`);
      } else if (bookingData.paymentMethod === 'card' || bookingData.paymentMethod === 'paypal') {
        // For card payments, check auto-approval settings
        if (bookingSettings.autoApprovalEnabled && bookingSettings.requireCardApproval === false && 
            costBreakdown.total <= (bookingSettings.autoApprovalThreshold || 0)) {
          finalStatus = 'Confirmed';
          console.log('💳 Card payment auto-approved');
        } else if (bookingSettings.requireCardApproval) {
          finalStatus = 'Pending Approval';
          console.log('💳 Card payment requires approval');
        } else {
          finalStatus = 'Confirmed'; // Default to confirmed for card payments
          console.log('💳 Card payment default to confirmed');
        }
      }
      
      console.log('✅ Final booking status:', finalStatus);

      // Create booking
      const booking = new Booking({
        ...bookingData,
        userId,
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests || bookingData.guestCount || 1,
        guestCount: bookingData.guestCount || { adults: bookingData.guests || 1, children: 0 },
        specialRequests: bookingData.specialRequests,
        costBreakdown,
        status: finalStatus, // Use the determined status
        bookingSettings: {
          checkInTime: settings.defaultCheckInTime,
          checkOutTime: settings.defaultCheckOutTime,
          cancellationPolicy: settings.cancellationPolicy,
          operationalHours: settings.operationalSettings || {}
        }
      });

      await booking.save();

      // Only create invoice for confirmed bookings, NEVER for pending approval
      if (booking.status === 'Confirmed') {
        try {
          // Create invoice for confirmed bookings
          const InvoiceService = (await import("../payment/invoiceService.js")).default;
          const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
          booking.invoiceId = invoice._id;
          await booking.save(); // Save the invoiceId
          console.log(`✅ Invoice created for confirmed booking ${booking.bookingNumber}`);
        } catch (invoiceError) {
          console.error('❌ Failed to create invoice for confirmed booking:', invoiceError.message);
          // For confirmed bookings, invoice creation failure is critical
          if (!invoiceError.message.includes('Invoice already exists')) {
            console.error('❌ Unexpected invoice creation error for confirmed booking:', invoiceError);
            // Don't fail the booking creation if invoice creation fails, but log it
          }
        }
      } else {
        console.log(`📋 Booking ${booking.bookingNumber} created with status ${booking.status} - no invoice created`);
      }

      // Send notifications based on settings
      if (settings.bookingConfirmations) {
        await NotificationService.sendNotification({
          userId,
          userType: user.role,
          type: booking.status === 'Confirmed' ? 'booking_confirmation' : 'booking_pending_approval',
          title: booking.status === 'Confirmed' ? 'Booking Confirmed' : 'Booking Pending Approval',
          message: booking.status === 'Confirmed' 
            ? `Your booking for ${room.title} has been confirmed!`
            : `Your booking for ${room.title} has been received and is pending admin approval.`,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            roomName: room.title,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            total: costBreakdown.total,
            currency: costBreakdown.currency,
            status: booking.status
          }
        });
      }

      // Send admin notification if approval is required
      if (booking.status === 'Pending Approval') {
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
              roomName: room.title,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              paymentMethod: booking.paymentMethod,
              total: costBreakdown.total
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