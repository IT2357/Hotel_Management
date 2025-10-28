import CheckInOut from "../models/CheckInOut.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import GuestServiceRequest from '../models/GuestServiceRequest.js';
import FoodOrder from '../models/FoodOrder.js';
import KeyCard from '../models/KeyCard.js';
import StaffTask from '../models/StaffTask.js';
import { validateCheckInData, validateCheckOutData } from "../validations/checkInOutValidation.js";
import config from "../config/environment.js";
import OverstayService from "../services/payment/overstayService.js";

// Helper function to create pre_checkin record when booking is confirmed
export const createPreCheckInRecord = async (bookingId) => {
  try {
    console.log(' Creating pre-check-in record for booking:', bookingId);

    const booking = await Booking.findById(bookingId).populate('userId').populate('roomId');
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if pre-check-in record already exists
    const existingRecord = await CheckInOut.findOne({
      booking: bookingId,
      status: { $in: ['pre_checkin', 'checked_in'] }
    });

    if (existingRecord) {
      console.log('⚠️ Pre-check-in record already exists for booking:', bookingId);
      return existingRecord;
    }

    // Create pre-check-in record
    const preCheckIn = new CheckInOut({
      booking: bookingId,
      guest: booking.userId._id,
      room: booking.roomId._id,
      status: 'pre_checkin',
      documentScan: {
        documentType: 'passport', // Default
        verified: false
      },
      preferences: {
        roomService: false,
        housekeeping: 'morning',
        doNotDisturb: false,
        specialRequests: booking.specialRequests || ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      }
    });

    await preCheckIn.save();
    console.log('✅ Pre-check-in record created:', preCheckIn._id);

    return preCheckIn;
  } catch (error) {
    console.error('❌ Failed to create pre-check-in record:', error);
    throw error;
  }
};

export const checkInGuest = async (req, res) => {
  try {
    const { error } = validateCheckInData(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { bookingId, guestId, roomId, documentType, preferences, emergencyContact } = req.body;

    // Verify booking exists and is Confirmed (fully paid)
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'Confirmed') {
      return res.status(400).json({ message: 'Invalid booking or booking not fully confirmed/paid' });
    }

    // ⚠️ SECURITY: Validate check-in date is within booking period (only in production)
    if (!config.DEVELOPMENT.SKIP_DATE_VALIDATION) {
      const now = new Date();
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      
      // Set time to start of day for date comparison
      now.setHours(0, 0, 0, 0);
      bookingCheckIn.setHours(0, 0, 0, 0);
      bookingCheckOut.setHours(0, 0, 0, 0);

      if (now < bookingCheckIn) {
        return res.status(400).json({ 
          message: `Check-in is only available from ${bookingCheckIn.toLocaleDateString()}. Early check-in is not permitted.`
        });
      }

      if (now > bookingCheckOut) {
        return res.status(400).json({ 
          message: 'Your check-in date has passed the checkout date. Please contact the hotel.'
        });
      }
    } else {
      console.log('⏭️ Development mode: Skipping check-in date validation for booking:', bookingId);
    }

    // Verify room is available
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'Available') {
      return res.status(400).json({ message: 'Room not available for check-in' });
    }

    // Find an available key card
    const availableKeyCard = await KeyCard.findOne({ status: 'inactive' });
    if (!availableKeyCard) {
      return res.status(400).json({ message: 'No key cards available for check-in' });
    }

    // Assign the key card to the guest
    availableKeyCard.assignedTo = guestId;
    availableKeyCard.assignedRoom = roomId;
    availableKeyCard.status = 'active';
    availableKeyCard.activationDate = new Date();
    availableKeyCard.expirationDate = booking.checkOut;
    await availableKeyCard.save();

    const documentScan = {};
    if (req.files.frontImage) {
      documentScan.frontImage = req.files.frontImage[0].path;
    }
    if (req.files.backImage) {
      documentScan.backImage = req.files.backImage[0].path;
    }
    documentScan.documentType = documentType;

    const checkIn = new CheckInOut({
      booking: bookingId,
      guest: guestId,
      room: roomId,
      checkInTime: new Date(),
      checkedInBy: req.user.id,
      documentScan,
      keyCardNumber: availableKeyCard.cardNumber,
      keyCard: availableKeyCard._id, // Reference to the key card
      preferences,
      emergencyContact,
      status: 'checked_in'
    });

    await checkIn.save();

    // Update booking status to Checked In
    booking.status = 'Checked In';
    booking.lastStatusChange = new Date();
    await booking.save();

    // ✅ Update invoice status to reflect check-in
    try {
      const InvoiceService = (await import("../services/payment/invoiceService.js")).default;
      await InvoiceService.updateInvoiceStatusFromBooking(bookingId);
      console.log(`✅ Invoice status synchronized after check-in`);
    } catch (invoiceError) {
      console.error('❌ Failed to update invoice status after check-in:', invoiceError);
      // Don't fail check-in if invoice update fails
    }

    // Update room status to Booked
    room.status = 'Booked';
    await room.save();

    res.status(201).json({
      checkIn,
      assignedKeyCard: {
        id: availableKeyCard._id,
        cardNumber: availableKeyCard.cardNumber,
        expirationDate: availableKeyCard.expirationDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkOutGuest = async (req, res) => {
  try {
    const { error } = validateCheckOutData(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { checkInOutId, damageReport, keyCardReturned, additionalCharges } = req.body;

    const checkInOut = await CheckInOut.findById(checkInOutId)
      .populate('room')
      .populate('guest', 'firstName lastName')
      .populate('booking', 'checkOut')
      .populate('overstay.invoiceId'); // Add this to check overstay payment status
      
    if (!checkInOut || checkInOut.status !== 'checked_in') {
      return res.status(400).json({ message: 'Invalid check-in record or guest already checked out' });
    }

    const checkoutTime = new Date();
    
    // ⚠️ SECURITY: Validate checkout against booking period (only in production)
    // Guests can check out on or before their scheduled checkout date
    if (!config.DEVELOPMENT.SKIP_DATE_VALIDATION) {
      const bookingCheckOut = new Date(checkInOut.booking?.checkOut);
      bookingCheckOut.setHours(23, 59, 59, 999); // End of checkout day
      
      if (checkoutTime > bookingCheckOut) {
        // Guest is checking out LATE - they exceeded their paid booking period
        const daysOverstay = Math.ceil((checkoutTime - bookingCheckOut) / (1000 * 60 * 60 * 24));
        console.warn(`⚠️ OVERSTAY DETECTED: Guest checked out ${daysOverstay} days late. Booking ended on ${bookingCheckOut.toLocaleDateString()}, actual checkout: ${checkoutTime.toLocaleDateString()}`);
        
        // CRITICAL FIX: Block checkout if there's an overstay and payment isn't handled
        if (!checkInOut.overstay || !checkInOut.overstay.detected) {
          // First time detecting this overstay - create the overstay record
          checkInOut.overstay = {
            detected: true,
            daysOverstayed: daysOverstay,
            detectedAt: checkoutTime,
            scheduledCheckoutDate: bookingCheckOut,
            actualCheckoutDate: checkoutTime,
            chargePending: true,
            paymentStatus: 'pending_payment',
            canCheckout: false
          };
          
          // Save the updated check-in record with overstay information
          await checkInOut.save();
          
          // Create an overstay invoice
          try {
            const roomRate = checkInOut.room.basePrice || 5000; // Default rate if not specified
            const chargeAmount = roomRate * 1.5 * daysOverstay; // 1.5x room rate per day
            
            const invoice = await OverstayService.createOverstayInvoice(
              checkInOutId,
              daysOverstay,
              chargeAmount
            );
            
            // Return response that checkout is blocked due to overstay
            return res.status(402).json({ 
              message: `Checkout blocked due to ${daysOverstay} day(s) overstay. Payment of रु${chargeAmount} is required before checkout.`,
              overstay: {
                daysOverstayed: daysOverstay,
                invoiceId: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                amount: chargeAmount
              }
            });
          } catch (invoiceError) {
            console.error('❌ Error creating overstay invoice:', invoiceError);
            return res.status(500).json({ message: 'Error processing overstay. Please contact reception.' });
          }
        } else if (checkInOut.overstay && !checkInOut.overstay.canCheckout) {
          // Overstay already detected but payment not completed/approved
          return res.status(402).json({
            message: `Checkout blocked due to unpaid overstay charges. Please settle your overstay invoice before checking out.`,
            overstay: {
              daysOverstayed: checkInOut.overstay.daysOverstayed,
              invoiceId: checkInOut.overstay.invoiceId?._id,
              invoiceNumber: checkInOut.overstay.invoiceId?.invoiceNumber,
              amount: checkInOut.overstay.invoiceId?.amount || 0
            }
          });
        }
        
        // If we reach here, overstay is detected but canCheckout is true (payment completed)
        console.log(`✅ Overstay payment completed/approved. Allowing checkout.`);
      }
    } else {
      console.log('⏭️ Development mode: Skipping check-out date validation, allowing any checkout time');
    }
    
    // Proceed with checkout (we've already handled and blocked overstay cases above)
    checkInOut.checkOutTime = checkoutTime;
    checkInOut.checkedOutBy = req.user.id;
    checkInOut.damageReport = damageReport;
    checkInOut.keyCardReturned = keyCardReturned || false;
    checkInOut.status = 'checked_out';

    // If additionalCharges are specified, add them to the record
    if (additionalCharges && additionalCharges > 0) {
      checkInOut.additionalCharges = additionalCharges;
    }

    await checkInOut.save();

    // Return/deactivate the key card if it exists; otherwise, deactivate any active card for this guest/room
    let deactivated = false;
    if (checkInOut.keyCard) {
      const keyCard = await KeyCard.findById(checkInOut.keyCard);
      if (keyCard) {
        console.log(`🔑 Returning key card ${keyCard.cardNumber} from guest ${checkInOut.guest.firstName} ${checkInOut.guest.lastName}`);
        keyCard.assignedTo = null;
        keyCard.assignedRoom = null;
        keyCard.status = 'inactive';
        keyCard.activationDate = null;
        keyCard.expirationDate = checkoutTime; // record actual expiration at checkout
        await keyCard.save();
        console.log(`✅ Key card ${keyCard.cardNumber} returned to inactive status`);
        deactivated = true;
      } else {
        console.log('⚠️ Key card reference exists but key card not found in database');
      }
    }
    if (!deactivated) {
      // Fallback: find any active card assigned to this guest/room and deactivate
      const activeCards = await KeyCard.find({
        status: 'active',
        assignedTo: checkInOut.guest,
        assignedRoom: checkInOut.room,
      });
      if (activeCards && activeCards.length > 0) {
        for (const card of activeCards) {
          console.log(`🔑 Fallback deactivation for key card ${card.cardNumber}`);
          card.assignedTo = null;
          card.assignedRoom = null;
          card.status = 'inactive';
          card.activationDate = null;
          card.expirationDate = checkoutTime;
          await card.save();
        }
        console.log(`✅ Deactivated ${activeCards.length} active key card(s) via fallback search`);
      } else {
        console.log('ℹ️ No active key cards found for guest/room during fallback search');
      }
    }

    // Determine if this is an early checkout and update booking + room accordingly
    const room = await Room.findById(checkInOut.room);
    const booking = await Booking.findById(checkInOut.booking);

    if (booking) {
      const scheduledCheckout = new Date(booking.checkOut);
      const isEarlyCheckout = checkoutTime < scheduledCheckout;

      // Mark booking as Completed on checkout (early or on-time)
      booking.status = 'Completed';
      // If early checkout, persist the actual checkout timestamp for auditing
      if (isEarlyCheckout) {
        booking.checkOut = checkoutTime;
      }
      booking.lastStatusChange = new Date();
      await booking.save();

      // ✅ Update invoice status to reflect completion
      try {
        const InvoiceService = (await import("../services/payment/invoiceService.js")).default;
        await InvoiceService.updateInvoiceStatusFromBooking(booking._id);
        console.log(`✅ Invoice status synchronized after check-out - booking completed`);
      } catch (invoiceError) {
        console.error('❌ Failed to update invoice status after check-out:', invoiceError);
        // Don't fail check-out if invoice update fails
      }

      // Free the room immediately if early checkout, otherwise keep Cleaning workflow
      if (room) {
        room.status = isEarlyCheckout ? 'Available' : 'Cleaning';
        await room.save();
      }

      // Always create a cleaning task (even on early checkout)
      if (room) {
        try {
          const cleaningTask = new StaffTask({
            title: `Clean Room ${room.roomNumber}`,
            description: `Room cleaning required after guest checkout. Guest: ${checkInOut.guest.firstName} ${checkInOut.guest.lastName}`,
            department: 'Housekeeping',
            priority: 'high',
            category: 'deep_cleaning',
            location: 'room',
            roomNumber: room.roomNumber,
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            estimatedDuration: 60, // 60 minutes
            assignedBy: req.user.id,
            tags: ['checkout', 'cleaning']
          });

          await cleaningTask.save();
          console.log('✅ Cleaning task created for room:', room.roomNumber);

          // Schedule hourly priority escalation until completed/cancelled or reaches urgent
          schedulePriorityEscalation(cleaningTask._id);
        } catch (taskError) {
          console.error('❌ Failed to create cleaning task:', taskError);
          // Don't fail the checkout if task creation fails
        }
      }
    } else if (room) {
      // Fallback: if no booking found, at least move room to Cleaning to avoid blocking
      room.status = 'Cleaning';
      await room.save();
    }

    res.status(200).json(checkInOut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Schedules hourly priority escalation for a StaffTask until it reaches 'urgent' or is completed/cancelled
function schedulePriorityEscalation(taskId) {
  const ONE_HOUR = 60 * 60 * 1000;
  const ladder = ['low', 'medium', 'high', 'urgent'];

  const escalate = async () => {
    try {
      const task = await StaffTask.findById(taskId);
      if (!task) return; // Task deleted
      if (['completed', 'cancelled'].includes(task.status)) return; // Stop escalating

      const current = task.priority || 'medium';
      const idx = ladder.indexOf(current);
      if (idx >= 0 && idx < ladder.length - 1) {
        task.priority = ladder[idx + 1];
        await task.save();
        console.log(`⬆️ Escalated task ${task._id} priority to ${task.priority}`);
      }

      // Re-schedule if not yet urgent and still not completed
      if (task.priority !== 'urgent' && !['completed', 'cancelled'].includes(task.status)) {
        setTimeout(escalate, ONE_HOUR);
      }
    } catch (err) {
      console.error('❌ Failed to escalate task priority:', err.message);
      // Try again in one hour to be resilient
      setTimeout(escalate, ONE_HOUR);
    }
  };

  // Initial schedule
  setTimeout(escalate, ONE_HOUR);
}

// List eligible bookings for the authenticated guest to self check-in
export const getEligibleBookingsForGuest = async (req, res) => {
  try {
    const guestId = req.user.id;
    const now = new Date();
    
    // ⚠️ SECURITY: Only show bookings within their check-in date range
    // Guests can see bookings that:
    // 1. Are confirmed or approved (payment may be pending for cash)
    // 2. Have a checkOut date that is today or in the future (not yet passed)
    // 3. Don't have an active check-in record already

    const confirmedBookings = await Booking.find({
      userId: guestId,
      status: { $in: ['Confirmed', 'Approved - Payment Pending', 'Approved - Payment Processing'] },
      checkOut: { $gte: now }, // Only future or today's checkouts
    })
      .populate('roomId', 'roomNumber type')
      .select('bookingNumber status checkIn checkOut roomId');

    if (!confirmedBookings.length) {
      return res.status(200).json([]);
    }

    // Filter out bookings that already have an active check-in
    const bookingIds = confirmedBookings.map(b => b._id);
    const activeCheckIns = await CheckInOut.find({
      booking: { $in: bookingIds },
      status: { $in: ['pre_checkin', 'checked_in'] },
    }).select('booking status');

    // Build maps for quick lookup of status and pre_checkin id
    const statusByBookingId = new Map();
    const preCheckInIdByBookingId = new Map();
    for (const ci of activeCheckIns) {
      const key = ci.booking.toString();
      statusByBookingId.set(key, ci.status);
      if (ci.status === 'pre_checkin') {
        preCheckInIdByBookingId.set(key, ci._id);
      }
    }

    const eligible = confirmedBookings
      .filter(b => !statusByBookingId.has(b._id.toString()) || statusByBookingId.get(b._id.toString()) === 'pre_checkin')
      .map(b => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        room: b.roomId ? { roomNumber: b.roomId.roomNumber, type: b.roomId.type } : null,
        preCheckInId: preCheckInIdByBookingId.get(b._id.toString()) || null
      }));

    console.log(`✅ Found ${eligible.length} eligible bookings for guest ${guestId}`);
    return res.status(200).json(eligible);
  } catch (error) {
    console.error('❌ Backend: Error fetching eligible bookings:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const getCheckInDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const checkIn = await CheckInOut.findById(id)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber type floor')
      .populate('booking', 'checkIn checkOut bookingNumber status');
    
    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }
    
    res.status(200).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listCurrentGuests = async (req, res) => {
  try {
    // Enhanced query to only return valid, active check-ins
    const guests = await CheckInOut.find({ 
      status: 'checked_in',
      // Ensure we don't include any entries that have a check-out time
      checkOutTime: { $exists: false }
    })
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber type')
      .populate('booking', 'checkIn checkOut status')  // Add booking info to check dates
      .sort({ checkInTime: -1 });
    
    // Additional validation - filter out any bookings that have been marked as Completed
    const filteredGuests = guests.filter(guest => {
      // Skip guests whose bookings are already completed
      if (guest.booking && guest.booking.status === 'Completed') {
        console.log(`⚠️ Found anomaly: Guest ${guest.guest._id} shows as checked-in but booking ${guest.booking._id} is Completed`);
        return false;
      }
      return true;
    });
    
    console.log(`✅ Found ${filteredGuests.length} current guests (filtered from ${guests.length} total records)`);
    res.status(200).json(filteredGuests);
  } catch (error) {
    console.error('❌ Error fetching current guests:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateGuestPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    
    const checkIn = await CheckInOut.findById(id);
    if (!checkIn || checkIn.status !== 'checked_in') {
      return res.status(400).json({ message: 'Invalid check-in record or guest already checked out' });
    }
    
    checkIn.preferences = preferences;
    await checkIn.save();
    
    res.status(200).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGuestCheckInStatus = async (req, res) => {
  try {
    const guestId = req.user.id;
    console.log('🔍 Backend: Getting check-in status for guest:', guestId);

    const checkInStatus = await CheckInOut.findOne({
      guest: guestId,
      status: { $in: ['pre_checkin', 'checked_in'] } // Include both pre_checkin and checked_in
    })
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber type basePrice floor') // Added basePrice for overstay charge calculation
      .populate('booking', 'checkIn checkOut bookingNumber status')
      .populate('keyCard', 'cardNumber status expirationDate')
      .sort({ checkInTime: -1 });

    console.log('📊 Backend: Found check-in record:', checkInStatus ? checkInStatus._id : 'None found');
    console.log('📊 Backend: Record status:', checkInStatus?.status);

    if (!checkInStatus) {
      console.log('❌ Backend: No active check-in found for guest:', guestId);
      return res.status(404).json({ message: 'No active check-in found' });
    }

    console.log('✅ Backend: Returning check-in data:', {
      id: checkInStatus._id,
      room: checkInStatus.room?.roomNumber,
      status: checkInStatus.status,
      checkInTime: checkInStatus.checkInTime || '(Not checked in yet - status: pre_checkin)'
    });

    // Return status as-is, frontend will gate UI; backend also enforces on completion
    res.status(200).json(checkInStatus);
  } catch (error) {
    console.error('❌ Backend: Error getting guest check-in status:', error);
    res.status(500).json({ message: error.message });
  }
};

export const completeGuestCheckIn = async (req, res) => {
  try {
    const { checkInOutId, documentType } = req.body;

    // Parse JSON strings from FormData
    let preferences = {};
    let emergencyContact = {};

    try {
      preferences = req.body.preferences ? JSON.parse(req.body.preferences) : {};
      emergencyContact = req.body.emergencyContact ? JSON.parse(req.body.emergencyContact) : {};
    } catch (parseError) {
      console.error('❌ Failed to parse preferences or emergencyContact JSON:', parseError);
      return res.status(400).json({ message: 'Invalid preferences or emergency contact data' });
    }

    // Find the pre_checkin record
    const checkInOut = await CheckInOut.findById(checkInOutId).populate('booking', 'status checkIn checkOut userId');
    if (!checkInOut || checkInOut.status !== 'pre_checkin') {
      return res.status(400).json({ message: 'Invalid pre-check-in record' });
    }

    // Verify the record belongs to the authenticated guest
    if (checkInOut.guest.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Debug: Log booking information
    console.log('📋 Check-in record booking:', {
      bookingRef: checkInOut.booking,
      bookingStatus: checkInOut.booking?.status,
      guestId: checkInOut.guest,
      authUserId: req.user.id,
      checkInOutId: checkInOutId
    });

    // Enforce booking must be confirmed or approved for check-in
    let booking = checkInOut.booking;
    
    if (!booking) {
      // If booking is not populated, try to find it via guest + room
      console.warn('⚠️ Booking not populated on CheckInOut record. Searching by guest and room...');
      booking = await Booking.findOne({
        userId: checkInOut.guest,
        roomId: checkInOut.room,
        status: { $in: ['Confirmed', 'Approved - Payment Pending', 'Approved - Payment Processing'] }
      }).select('status checkIn checkOut userId');
      
      if (!booking) {
        console.error('❌ No confirmed/approved booking found for guest:', checkInOut.guest);
        return res.status(400).json({ message: 'Booking reference is missing or booking is not confirmed. Please contact support.' });
      }
    }
    
    // ✅ FIX: Allow check-in for Confirmed AND approved bookings (payment may be pending for cash)
    const allowedStatuses = ['Confirmed', 'Approved - Payment Pending', 'Approved - Payment Processing'];
    if (!allowedStatuses.includes(booking.status)) {
      console.error('❌ Booking status is not eligible for check-in:', booking.status);
      return res.status(400).json({ 
        message: 'Booking is not confirmed. Please complete payment or approval before checking in.',
        currentStatus: booking.status 
      });
    }

    // ⚠️ SECURITY: Validate check-in date is within booking period (only in production)
    if (!config.DEVELOPMENT.SKIP_DATE_VALIDATION) {
      const now = new Date();
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      
      // Set time to start of day for date comparison
      now.setHours(0, 0, 0, 0);
      bookingCheckIn.setHours(0, 0, 0, 0);
      bookingCheckOut.setHours(0, 0, 0, 0);

      if (now < bookingCheckIn) {
        return res.status(400).json({ 
          message: `Check-in is only available from ${bookingCheckIn.toLocaleDateString()}. Early check-in is not permitted.`,
          expectedCheckInDate: bookingCheckIn
        });
      }

      if (now > bookingCheckOut) {
        return res.status(400).json({ 
          message: 'Your check-in date has passed the checkout date. Please contact the hotel.',
          bookingCheckOut: bookingCheckOut
        });
      }
    } else {
      console.log('⏭️ Development mode: Skipping check-in date validation for check-in record:', checkInOutId);
    }

    // Find an available key card
    const availableKeyCard = await KeyCard.findOne({ status: 'inactive' });
    if (!availableKeyCard) {
      return res.status(400).json({ message: 'No key cards available for check-in' });
    }

    // Assign the key card to the guest
    availableKeyCard.assignedTo = checkInOut.guest;
    availableKeyCard.assignedRoom = checkInOut.room;
    availableKeyCard.status = 'active';
    availableKeyCard.activationDate = new Date();
    availableKeyCard.expirationDate = booking.checkOut;
    await availableKeyCard.save();

    // Update document scan
    const documentScan = {};
    if (req.files.frontImage) {
      documentScan.frontImage = req.files.frontImage[0].path;
    }
    if (req.files.backImage) {
      documentScan.backImage = req.files.backImage[0].path;
    }
    documentScan.documentType = documentType;
    documentScan.verified = true; // Auto-verify for self-service
    documentScan.verifiedBy = req.user.id;
    documentScan.verifiedAt = new Date();

    // Update the check-in record
    checkInOut.checkInTime = new Date();
    checkInOut.checkedInBy = req.user.id;
    checkInOut.documentScan = documentScan;
    checkInOut.keyCardNumber = availableKeyCard.cardNumber;
    checkInOut.keyCard = availableKeyCard._id;
    checkInOut.preferences = preferences || checkInOut.preferences;
    checkInOut.emergencyContact = emergencyContact || checkInOut.emergencyContact;
    checkInOut.status = 'checked_in';

    await checkInOut.save();

    // Update room status to Booked
    const room = await Room.findById(checkInOut.room);
    if (room) {
      room.status = 'Booked';
      await room.save();
    }

    res.status(200).json({
      checkIn: checkInOut,
      assignedKeyCard: {
        id: availableKeyCard._id,
        cardNumber: availableKeyCard.cardNumber,
        expirationDate: availableKeyCard.expirationDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkInOut = await CheckInOut.findById(id)
      .populate('guest', 'firstName lastName email')
      .populate('room', 'roomNumber type basePrice')
      .populate('booking', 'checkIn checkOut bookingNumber status');
    
    if (!checkInOut) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    const serviceRequests = await GuestServiceRequest.find({ booking: checkInOut.booking });
    const foodOrders = await FoodOrder.find({ userId: checkInOut.guest });

    const nights = Math.ceil((new Date(checkInOut.checkOutTime) - new Date(checkInOut.booking.checkIn)) / (1000 * 60 * 60 * 24));
    const baseCharge = nights * (checkInOut.room.basePrice || 0);
    const servicesCharges = serviceRequests.reduce((acc, req) => acc + (req.cost || 0), 0);
    const foodCharges = foodOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    const taxes = Math.round((baseCharge + servicesCharges + foodCharges) * 0.18); // 18% tax
    const totalAmount = baseCharge + servicesCharges + foodCharges + taxes;
    
    const receipt = {
      guestName: `${checkInOut.guest.firstName} ${checkInOut.guest.lastName}`,
      guestEmail: checkInOut.guest.email,
      roomNumber: checkInOut.room.roomNumber,
      roomType: checkInOut.room.type,
      checkInDate: checkInOut.booking.checkIn,
      checkOutDate: checkInOut.checkOutTime,
      charges: {
        baseCharge,
        servicesCharges,
        foodCharges,
        taxes,
        totalAmount,
      },
      serviceRequests,
      foodOrders,
      paymentMethod: 'Credit Card', // Would come from payment system
      receiptNumber: `RC-${Date.now()}`,
      issuedAt: new Date()
    };
    
    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ⚠️ NEW: Handle overstay payment
export const processOverstayPayment = async (req, res) => {
  try {
    const guestId = req.user._id;
    const { checkInOutId, paymentMethod, paymentData, amount, daysOverstay } = req.body;

    // Validate required fields
    if (!checkInOutId || !paymentMethod || !amount || !daysOverstay) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Find the check-in record
    const checkInOut = await CheckInOut.findById(checkInOutId)
      .populate('guest', 'firstName lastName email')
      .populate('room', 'roomNumber basePrice')
      .populate('booking', 'checkOut');

    if (!checkInOut) {
      return res.status(404).json({
        success: false,
        message: 'Check-in record not found'
      });
    }

    // Verify guest is making this request
    if (checkInOut.guest._id.toString() !== guestId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot process payment for another guest'
      });
    }

    // Verify guest is still checked in
    if (checkInOut.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in status for overstay payment'
      });
    }

    // ⚠️ SECURITY: Verify overstay actually occurred
    const bookingCheckOut = new Date(checkInOut.booking.checkOut);
    bookingCheckOut.setHours(23, 59, 59, 999);
    const now = new Date();

    if (now <= bookingCheckOut) {
      return res.status(400).json({
        success: false,
        message: 'No overstay detected. Guest can check out normally.'
      });
    }

    // Calculate actual overstay days
    const actualDaysOverstay = Math.ceil((now - bookingCheckOut) / (1000 * 60 * 60 * 24));
    
    // Validate amount is reasonable (should match room rate * 1.5 * days)
    const roomRate = checkInOut.room.basePrice || 5000;
    const expectedCharge = roomRate * 1.5 * actualDaysOverstay;
    const variance = Math.abs(amount - expectedCharge) / expectedCharge;

    if (variance > 0.1) { // Allow 10% variance
      console.warn(`⚠️ Overstay charge variance detected: expected ${expectedCharge}, received ${amount}`);
    }

    // Process payment based on method
    let paymentStatus = 'pending_payment';
    let paymentReference = null;

    if (paymentMethod === 'card') {
      // Mock card payment processing - in production, integrate with payment gateway
      if (paymentData?.cardNumber && paymentData?.cvv && paymentData?.cardholderName) {
        paymentStatus = 'completed';
        paymentReference = `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('✅ Card payment processed for overstay');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid card details'
        });
      }
    } else if (paymentMethod === 'bank') {
      // Bank transfer - requires manual verification
      paymentStatus = 'pending_verification';
      paymentReference = `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Bank transfer initiated for overstay');
    } else if (paymentMethod === 'cash') {
      // Cash payment - create invoice and set as pending approval
      paymentStatus = 'pending_approval';
      paymentReference = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Cash payment initiated for overstay - awaiting admin approval');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Create or update overstay invoice (especially important for cash payments)
    let invoice = null;
    try {
      invoice = await OverstayService.createOverstayInvoice(checkInOutId, actualDaysOverstay, amount);
      console.log(`✅ Overstay invoice created/updated: ${invoice.invoiceNumber}`);
    } catch (invoiceError) {
      console.error('⚠️ Warning: Could not create overstay invoice:', invoiceError.message);
      // Don't fail the payment if invoice creation fails, but log it
    }

    // Record overstay payment
    checkInOut.overstay = {
      detected: true,
      daysOverstayed: actualDaysOverstay,
      detectedAt: new Date(),
      scheduledCheckoutDate: bookingCheckOut,
      actualCheckoutDate: now,
      chargeAmount: amount,
      chargePending: paymentStatus !== 'completed',
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      paymentReference: paymentReference,
      invoiceId: invoice?._id,
      canCheckout: paymentStatus === 'completed' // Only completed payments allow checkout
    };

    await checkInOut.save();

    console.log('✅ Overstay payment recorded:', {
      checkInOutId,
      paymentMethod,
      amount,
      daysOverstay: actualDaysOverstay,
      paymentStatus,
      paymentReference,
      invoiceId: invoice?._id
    });

    // Prepare response based on payment method
    let nextStep = 'Please contact reception for next steps.';
    if (paymentStatus === 'completed') {
      nextStep = 'Payment completed. You can now proceed with checkout.';
    } else if (paymentStatus === 'pending_verification') {
      nextStep = 'Your bank transfer is pending verification. Please contact reception.';
    } else if (paymentStatus === 'pending_approval') {
      nextStep = 'Your cash payment has been recorded. Please wait for admin approval before checkout.';
    }

    return res.status(200).json({
      success: true,
      message: `Overstay payment of රු${amount} processed successfully`,
      data: {
        checkInOutId,
        invoiceId: invoice?._id,
        invoiceNumber: invoice?.invoiceNumber,
        daysOverstayed: actualDaysOverstay,
        chargeAmount: amount,
        paymentMethod,
        paymentStatus,
        paymentReference,
        nextStep,
        canCheckout: paymentStatus === 'completed'
      }
    });
  } catch (error) {
    console.error('❌ Error processing overstay payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing overstay payment',
      error: error.message
    });
  }
};

/**
 * Admin approves overstay cash payment
 * Allows guest to proceed with checkout
 */
export const approveOverstayPayment = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { invoiceId } = req.params;
    const { approvalNotes = '' } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    const invoice = await OverstayService.approveOverstayPayment(invoiceId, adminId, approvalNotes);

    return res.status(200).json({
      success: true,
      message: 'Overstay payment approved successfully',
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        approvedAt: invoice.paymentApproval.approvedAt,
        approvalNotes: invoice.paymentApproval.approvalNotes
      }
    });

  } catch (error) {
    console.error('❌ Error approving overstay payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving overstay payment',
      error: error.message
    });
  }
};

/**
 * Admin rejects overstay cash payment
 * Requires guest to pay more or provide additional evidence
 */
export const rejectOverstayPayment = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { invoiceId } = req.params;
    const { rejectionReason = '' } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const invoice = await OverstayService.rejectOverstayPayment(invoiceId, adminId, rejectionReason);

    return res.status(200).json({
      success: true,
      message: 'Overstay payment rejected',
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        rejectionReason: invoice.paymentApproval.rejectionReason,
        rejectionDate: invoice.paymentApproval.rejectionDate
      }
    });

  } catch (error) {
    console.error('❌ Error rejecting overstay payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting overstay payment',
      error: error.message
    });
  }
};

/**
 * Admin adjusts overstay charges
 */
export const adjustOverstayCharges = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { invoiceId } = req.params;
    const { newAmount, adjustmentNotes = '' } = req.body;

    if (!invoiceId || newAmount === undefined || newAmount === null) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID and new amount are required'
      });
    }

    if (newAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'New amount cannot be negative'
      });
    }

    const invoice = await OverstayService.adjustOverstayCharges(invoiceId, adminId, newAmount, adjustmentNotes);

    return res.status(200).json({
      success: true,
      message: 'Overstay charges adjusted successfully',
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        newAmount: invoice.amount,
        adjustmentNotes: invoice.overstayTracking.adjustmentNotes,
        updatedAt: invoice.overstayTracking.lastUpdatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error adjusting overstay charges:', error);
    res.status(500).json({
      success: false,
      message: 'Error adjusting overstay charges',
      error: error.message
    });
  }
};

/**
 * Get pending overstay invoices (for admin dashboard)
 */
export const getPendingOverstayInvoices = async (req, res) => {
  try {
    const { approvalStatus = 'pending', page = 1, limit = 20 } = req.query;

    const invoices = await OverstayService.getPendingOverstayInvoices({
      approvalStatus,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      data: invoices,
      total: invoices.length
    });

  } catch (error) {
    console.error('❌ Error fetching pending overstay invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending overstay invoices',
      error: error.message
    });
  }
};

