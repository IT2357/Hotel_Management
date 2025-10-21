import CheckInOut from "../models/CheckInOut.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import GuestServiceRequest from '../models/GuestServiceRequest.js';
import FoodOrder from '../models/FoodOrder.js';
import KeyCard from '../models/KeyCard.js';
import StaffTask from '../models/StaffTask.js';
import { validateCheckInData, validateCheckOutData } from "../validations/checkInOutValidation.js";

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

    const checkInOut = await CheckInOut.findById(checkInOutId).populate('room').populate('guest', 'firstName lastName');
    if (!checkInOut || checkInOut.status !== 'checked_in') {
      return res.status(400).json({ message: 'Invalid check-in record or guest already checked out' });
    }

    const checkoutTime = new Date();
    checkInOut.checkOutTime = checkoutTime;
    checkInOut.checkedOutBy = req.user.id;
    checkInOut.damageReport = damageReport;
    checkInOut.keyCardReturned = keyCardReturned || false;
    checkInOut.status = 'checked_out';

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

    // Find confirmed bookings for this user that are current or upcoming
    const confirmedBookings = await Booking.find({
      userId: guestId,
      status: 'Confirmed',
      checkOut: { $gte: now },
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

    const activeMap = new Map(activeCheckIns.map(ci => [ci.booking.toString(), ci.status]));

    const eligible = confirmedBookings
      .filter(b => !activeMap.has(b._id.toString()) || activeMap.get(b._id.toString()) === 'pre_checkin')
      .map(b => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        room: b.roomId ? { roomNumber: b.roomId.roomNumber, type: b.roomId.type } : null,
      }));

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
    const guests = await CheckInOut.find({ status: 'checked_in' })
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber type')
      .sort({ checkInTime: -1 });
    
    res.status(200).json(guests);
  } catch (error) {
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
      .populate('room', 'roomNumber type')
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
      checkInTime: checkInStatus.checkInTime
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
    const checkInOut = await CheckInOut.findById(checkInOutId).populate('booking', 'status checkOut');
    if (!checkInOut || checkInOut.status !== 'pre_checkin') {
      return res.status(400).json({ message: 'Invalid pre-check-in record' });
    }

    // Verify the record belongs to the authenticated guest
    if (checkInOut.guest.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Enforce booking must be fully Confirmed (paid) before allowing check-in completion
    if (!checkInOut.booking || checkInOut.booking.status !== 'Confirmed') {
      return res.status(400).json({ message: 'Booking is not confirmed. Please complete payment before checking in.' });
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
    availableKeyCard.expirationDate = checkInOut.booking.checkOut;
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