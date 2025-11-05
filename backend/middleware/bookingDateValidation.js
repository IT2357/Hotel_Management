import Booking from '../models/Booking.js';
import CheckInOut from '../models/CheckInOut.js';
import config from '../config/environment.js';

/**
 * ⚠️ SECURITY MIDDLEWARE: Validates all check-in/out operations against booking dates
 * Prevents guests from:
 * 1. Checking in before their booking start date
 * 2. Staying longer than their paid booking period
 * 3. Exploiting the system with unauthorized overstays
 * 
 * NOTE: In development mode (NODE_ENV !== 'production'), these validations are disabled
 * to allow developers to test the functionality without date restrictions.
 */

/**
 * Middleware: Validate check-in request against booking dates
 * Should be used before checkInGuest and completeGuestCheckIn
 */
export const validateCheckInDate = async (req, res, next) => {
  try {
    // ⚠️ SECURITY: Skip validation in development mode
    if (config.DEVELOPMENT.SKIP_DATE_VALIDATION) {
      console.log('⏭️ Development mode: Skipping check-in date validation');
      return next();
    }

    const { bookingId, checkInOutId } = req.body;
    
    // Determine which booking to validate
    let booking;
    
    if (bookingId) {
      // Direct check-in flow
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(400).json({ 
          message: 'Booking not found',
          errorCode: 'BOOKING_NOT_FOUND'
        });
      }
    } else if (checkInOutId) {
      // Pre-check-in completion flow
      const checkInOut = await CheckInOut.findById(checkInOutId).populate('booking');
      if (!checkInOut) {
        return res.status(400).json({ 
          message: 'Check-in record not found',
          errorCode: 'CHECKIN_RECORD_NOT_FOUND'
        });
      }
      booking = checkInOut.booking;
    } else {
      return res.status(400).json({ 
        message: 'Missing booking information',
        errorCode: 'MISSING_BOOKING_INFO'
      });
    }

    // ⚠️ SECURITY: Validate booking dates
    const now = new Date();
    const bookingCheckIn = new Date(booking.checkIn);
    const bookingCheckOut = new Date(booking.checkOut);
    
    // Set times to start/end of day for date comparison
    now.setHours(0, 0, 0, 0);
    bookingCheckIn.setHours(0, 0, 0, 0);
    bookingCheckOut.setHours(23, 59, 59, 999);

    // Check 1: Is today before the booking check-in date?
    if (now < bookingCheckIn) {
      const daysUntilCheckIn = Math.ceil((bookingCheckIn - now) / (1000 * 60 * 60 * 24));
      return res.status(400).json({ 
        message: `Early check-in not permitted. Check-in available from ${bookingCheckIn.toLocaleDateString()}`,
        errorCode: 'EARLY_CHECKIN_ATTEMPT',
        bookingCheckIn: bookingCheckIn.toISOString(),
        daysUntilCheckIn,
        attemptedDate: now.toISOString()
      });
    }

    // Check 2: Has the checkout date already passed?
    if (now > bookingCheckOut) {
      return res.status(400).json({ 
        message: 'Your booking period has expired. Please contact the hotel to reschedule.',
        errorCode: 'BOOKING_PERIOD_EXPIRED',
        bookingCheckOut: bookingCheckOut.toISOString(),
        currentDate: now.toISOString()
      });
    }

    // Attach booking info to request for use in controller
    req.validatedBooking = booking;
    req.bookingDates = {
      checkIn: bookingCheckIn,
      checkOut: bookingCheckOut,
      validatedAt: new Date()
    };

    next();
  } catch (error) {
    console.error('❌ Booking date validation middleware error:', error);
    res.status(500).json({ 
      message: 'Error validating booking dates',
      errorCode: 'VALIDATION_ERROR',
      error: error.message
    });
  }
};

/**
 * Middleware: Validate check-out request against booking dates
 * Detects overstays and flags them for billing
 */
export const validateCheckOutDate = async (req, res, next) => {
  try {
    // ⚠️ SECURITY: Skip validation in development mode
    if (config.DEVELOPMENT.SKIP_DATE_VALIDATION) {
      console.log('⏭️ Development mode: Skipping check-out date validation');
      return next();
    }

    const { checkInOutId } = req.body;
    
    const checkInOut = await CheckInOut.findById(checkInOutId)
      .populate('booking', 'checkOut');
    
    if (!checkInOut) {
      return res.status(400).json({ 
        message: 'Check-in record not found',
        errorCode: 'CHECKIN_RECORD_NOT_FOUND'
      });
    }

    if (checkInOut.status !== 'checked_in') {
      return res.status(400).json({ 
        message: 'Invalid check-in state for checkout',
        errorCode: 'INVALID_CHECKIN_STATE'
      });
    }

    const booking = checkInOut.booking;
    if (!booking) {
      return res.status(400).json({ 
        message: 'Associated booking not found',
        errorCode: 'BOOKING_NOT_FOUND'
      });
    }

    // ⚠️ SECURITY: Check for overstay
    const now = new Date();
    const bookingCheckOut = new Date(booking.checkOut);
    bookingCheckOut.setHours(23, 59, 59, 999); // End of checkout day

    let overstayInfo = null;
    if (now > bookingCheckOut) {
      const hoursOverstay = Math.ceil((now - bookingCheckOut) / (1000 * 60 * 60));
      const daysOverstay = Math.ceil(hoursOverstay / 24);
      
      overstayInfo = {
        detected: true,
        daysOverstay,
        hoursOverstay,
        scheduledCheckout: bookingCheckOut.toISOString(),
        actualCheckout: now.toISOString(),
        requiresCharge: daysOverstay > 0
      };

      console.warn(`⚠️ OVERSTAY DETECTED: Guest ${checkInOut.guest} overstayed by ${daysOverstay} days`);
    }

    // Attach validation info to request
    req.bookingDates = {
      checkOut: bookingCheckOut,
      validatedAt: new Date(),
      overstay: overstayInfo
    };

    next();
  } catch (error) {
    console.error('❌ Check-out date validation middleware error:', error);
    res.status(500).json({ 
      message: 'Error validating check-out',
      errorCode: 'VALIDATION_ERROR',
      error: error.message
    });
  }
};

/**
 * Helper function: Calculate overstay charges
 * Can be used to charge guests for extended stays
 */
export const calculateOverstayCharges = (room, daysOverstay) => {
  if (!daysOverstay || daysOverstay <= 0) {
    return 0;
  }

  // Overstay charges are typically 1.5x the normal room rate
  const baseRate = room.basePrice || room.price || 0;
  const overstayRate = baseRate * 1.5;
  
  return overstayRate * daysOverstay;
};

export default {
  validateCheckInDate,
  validateCheckOutDate,
  calculateOverstayCharges
};
