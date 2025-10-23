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
      const checkInDay = checkInDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
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

  // Calculate room cost (per stay)
  const roomCost = nights * roomRate;

  const financialSettings = settings.financialSettings || {};
  // Prefer admin-configured rates if > 0, else fall back to standard 12% tax and 10% service
  const taxRatePct = Number(financialSettings.taxRate);
  const serviceFeePct = Number(financialSettings.serviceFee);
  const taxRate = ((taxRatePct && taxRatePct > 0) ? taxRatePct : 12) / 100;
  const serviceFeeRate = ((serviceFeePct && serviceFeePct > 0) ? serviceFeePct : 10) / 100;

  // Calculate taxes and service fees (on subtotal including meals; meals computed below)
  // Note: We'll compute tax/service after we know mealPlanCost to ensure parity with frontend

    // Calculate meal plan costs
  let mealPlanCost = 0;
    let mealBreakdown = {};

    if (bookingData.foodPlan && bookingData.foodPlan !== 'None') {
      const guests = bookingData.guests || 1;
      // ✅ FIX: Use consistent rates with frontend (LKR per person per night)
      const mealPlanRates = {
        'Breakfast': 1500,
        'Half Board': 3500, // Breakfast + Dinner
        'Full Board': 5500, // All meals
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

  // Subtotal should include both room and meal costs
  const subtotal = roomCost + mealPlanCost;

  // Calculate taxes and service fees on the full subtotal (room + meals)
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
  // Expose detailed amounts
  roomCost,
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
        roomCost: roomCost,
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
      let booking = new Booking({
        ...bookingData,
        userId,
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests || bookingData.guestCount?.adults || 1,
        guestCount: bookingData.guestCount || { adults: bookingData.guests || 1, children: 0 },
        specialRequests: bookingData.specialRequests,
        totalPrice: bookingData.totalAmount || costBreakdown.total,
        // ✅ FIX: Always use the backend-calculated costBreakdown (complete with all fields)
        // Never use bookingData.costBreakdown as it may be incomplete from frontend
        costBreakdown: {
          nights: costBreakdown.nights,
          roomRate: costBreakdown.roomRate,
          roomCost: costBreakdown.roomCost,
          subtotal: costBreakdown.subtotal,
          tax: costBreakdown.tax,
          serviceFee: costBreakdown.serviceFee,
          mealPlanCost: costBreakdown.mealPlanCost,
          total: costBreakdown.total,
          currency: costBreakdown.currency,
          deposit: costBreakdown.deposit,
          depositRequired: costBreakdown.depositRequired,
          mealBreakdown: costBreakdown.mealBreakdown
        },
        nights: costBreakdown.nights, // Use calculated nights
        roomBasePrice: costBreakdown.roomRate, // Use calculated room rate
        roomTitle: bookingData.roomTitle || room.title || room.name,
        source: bookingData.source || 'website',
        paymentMethod: bookingData.paymentMethod || 'cash',
        foodPlan: bookingData.foodPlan || 'None',
        selectedMeals: bookingData.selectedMeals || [],
        metadata: bookingData.metadata || {
          ip: 'backend-generated',
          userAgent: 'backend-service',
          timestamp: new Date().toISOString(),
          bookingSource: 'backend_service',
          version: '1.0'
        },
        status: finalStatus, // Use the determined status
        bookingSettings: {
          checkInTime: settings.defaultCheckInTime,
          checkOutTime: settings.defaultCheckOutTime,
          cancellationPolicy: settings.cancellationPolicy,
          operationalHours: settings.operationalSettings || {}
        }
      });

      // --- Overlap prevention ---
      const checkInDate = typeof booking.checkIn === 'string' ? parseISO(booking.checkIn) : booking.checkIn;
      const checkOutDate = typeof booking.checkOut === 'string' ? parseISO(booking.checkOut) : booking.checkOut;

      const blockingStatuses = [
        'Pending Approval',
        'On Hold',
        'Approved - Payment Pending',
        'Approved - Payment Processing',
        'Confirmed'
      ];

      const now = new Date();

      // Find any overlapping booking on the same room that blocks inventory
      const overlap = await Booking.findOne({
        roomId: booking.roomId,
        status: { $in: blockingStatuses },
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
        $or: [
          { status: { $in: ['Pending Approval', 'Approved - Payment Pending', 'Approved - Payment Processing', 'Confirmed'] } },
          { status: 'On Hold', holdUntil: { $gt: now } }
        ]
      }).lean();

      if (overlap) {
        throw new Error('Room is no longer available for the selected dates');
      }

      // --- Hold logic ---
      // If not confirmed instantly, place booking On Hold with holdUntil to reserve inventory
      if (booking.status !== 'Confirmed') {
        const approvalHours = (settings.bookingSettings && settings.bookingSettings.approvalTimeoutHours) || settings.approvalTimeoutHours || 24;
        booking.status = 'On Hold';
        booking.holdUntil = new Date(Date.now() + approvalHours * 60 * 60 * 1000);
      }

      await booking.save();

      // ✅ ALWAYS create invoice for ALL bookings - critical for check-in/out flow
      // Invoice status will be set based on booking status:
      // - Draft: For Pending Approval / On Hold bookings
      // - Sent - Payment Pending: For Approved bookings
      // - Paid: For completed payments
      let invoiceCreated = false;
      try {
        console.log(`📄 [INVOICE] Starting invoice creation for booking ${booking.bookingNumber} (ID: ${booking._id}) with status ${booking.status}`);
        console.log(`📄 [INVOICE] Calling InvoiceService.createInvoiceFromBooking with bookingId: ${booking._id}`);
        
        const invoice = await InvoiceService.createInvoiceFromBooking(booking._id);
        
        console.log(`✅ [INVOICE] Invoice created successfully: ${invoice.invoiceNumber} (ID: ${invoice._id})`);
        
        booking.invoiceId = invoice._id;
        await booking.save(); // Save the invoiceId to booking
        invoiceCreated = true;
        
        console.log(`✅ [INVOICE] Invoice ${invoice.invoiceNumber} linked to booking ${booking.bookingNumber}`);
      } catch (invoiceError) {
        console.error('❌ [INVOICE] Failed to create invoice for booking:', invoiceError);
        console.error('❌ [INVOICE] Error stack:', invoiceError.stack);
        
        // If invoice already exists (edge case), try to link it
        if (invoiceError.message && invoiceError.message.includes('Invoice already exists')) {
          console.log('ℹ️ [INVOICE] Invoice already exists, attempting to link...');
          try {
            const Invoice = (await import("../../models/Invoice.js")).default;
            const existingInvoice = await Invoice.findOne({ bookingId: booking._id }).select('_id invoiceNumber');
            if (existingInvoice) {
              booking.invoiceId = existingInvoice._id;
              await booking.save();
              invoiceCreated = true;
              console.log(`🔗 [INVOICE] Linked existing invoice ${existingInvoice.invoiceNumber} to booking ${booking.bookingNumber}`);
            } else {
              console.error('❌ [INVOICE] Could not find existing invoice to link');
            }
          } catch (linkErr) {
            console.error('❌ [INVOICE] Failed to link existing invoice to booking:', linkErr);
            console.error('❌ [INVOICE] Link error stack:', linkErr.stack);
          }
        } else {
          console.error('❌ [INVOICE] Unexpected invoice creation error - not a duplicate issue');
          console.error('❌ [INVOICE] Full error object:', JSON.stringify(invoiceError, Object.getOwnPropertyNames(invoiceError)));
        }
        // Don't fail the booking creation if invoice creation fails
        // The invoice can be created later manually if needed
      }
      
      if (!invoiceCreated) {
        console.warn('⚠️ [INVOICE] WARNING: Booking created without invoice! Booking ID:', booking._id);
        console.warn('⚠️ [INVOICE] This may cause issues with check-in/check-out flow');
      }

      // Send notifications based on settings (non-blocking)
      if (settings.bookingConfirmations) {
        try {
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
        } catch (notificationError) {
          console.error('❌ Failed to send booking confirmation notification:', notificationError.message);
          // Don't fail booking creation if notification fails
        }
      }

      // Send admin notification if approval is required (non-blocking)
      if (booking.status === 'Pending Approval' || booking.status === 'On Hold') {
        try {
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
        } catch (notificationError) {
          console.error('❌ Failed to send admin approval notification:', notificationError.message);
          // Don't fail booking creation if notification fails
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

      // Send notification to guest about status change (non-blocking)
      if (settings.bookingConfirmations && oldStatus !== status) {
        try {
          let notificationType = 'booking_update';
          let message = `Your booking status has been updated to ${status}.`;

          if (status === 'Confirmed') {
            notificationType = 'booking_confirmation';
            message = `Your booking for ${booking.roomId.title || booking.roomId.name} has been confirmed!`;
          } else if (status === 'Cancelled') {
            notificationType = 'booking_cancellation';
            message = `Your booking for ${booking.roomId.title || booking.roomId.name} has been cancelled.`;
          } else if (status === 'Rejected') {
            notificationType = 'booking_rejection';
            message = `Your booking for ${booking.roomId.title || booking.roomId.name} has been rejected.`;
          } else if (status === 'On Hold') {
            notificationType = 'booking_on_hold';
            message = `Your booking for ${booking.roomId.title || booking.roomId.name} has been put on hold.`;
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
              roomName: booking.roomId.title || booking.roomId.name,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              oldStatus,
              newStatus: status
            }
          });
        } catch (notificationError) {
          console.error('❌ Failed to send booking status update notification:', notificationError.message);
          // Don't fail status update if notification fails
        }
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