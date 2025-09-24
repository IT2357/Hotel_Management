import KeyCard from '../models/KeyCard.js';
import CheckInOut from '../models/CheckInOut.js';

export const createKeyCard = async (req, res) => {
  try {
    const { cardNumber } = req.body;
    const keyCard = new KeyCard({ cardNumber });
    await keyCard.save();
    res.status(201).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignKeyCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedRoom, activationDate, expirationDate } = req.body;
    const keyCard = await KeyCard.findById(id);
    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }
    keyCard.assignedTo = assignedTo;
    keyCard.assignedRoom = assignedRoom;
    keyCard.activationDate = activationDate;
    keyCard.expirationDate = expirationDate;
    keyCard.status = 'active';
    await keyCard.save();
    res.status(200).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available key cards for assignment
export const getAvailableKeyCards = async (req, res) => {
  try {
    const availableCards = await KeyCard.find({ status: 'inactive' });
    res.status(200).json(availableCards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign key to guest during check-in
export const assignKeyToGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { guestId, roomId, checkInOutId } = req.body;

    const keyCard = await KeyCard.findById(id);
    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }

    if (keyCard.status !== 'inactive') {
      return res.status(400).json({ message: 'Key card is not available' });
    }

    // Assign the key card
    keyCard.assignedTo = guestId;
    keyCard.assignedRoom = roomId;
    keyCard.status = 'active';
    keyCard.activationDate = new Date();

    // Set expiration to check-out date from CheckInOut record
    const checkInOut = await CheckInOut.findById(checkInOutId);
    if (checkInOut && checkInOut.booking) {
      // Get check-out date from booking
      const Booking = (await import('../models/Booking.js')).default;
      const booking = await Booking.findById(checkInOut.booking);
      if (booking) {
        keyCard.expirationDate = booking.checkOutDate;
      }
    }

    await keyCard.save();
    res.status(200).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return key from guest during check-out
export const returnKeyFromGuest = async (req, res) => {
  try {
    const { id } = req.params;

    const keyCard = await KeyCard.findById(id);
    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }

    // Deactivate the key card
    keyCard.assignedTo = null;
    keyCard.assignedRoom = null;
    keyCard.status = 'inactive';
    keyCard.activationDate = null;
    keyCard.expirationDate = null;

    await keyCard.save();
    res.status(200).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const activateKeyCard = async (req, res) => {
  try {
    const { id } = req.params;
    const keyCard = await KeyCard.findById(id);
    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }
    keyCard.status = 'active';
    await keyCard.save();
    res.status(200).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deactivateKeyCard = async (req, res) => {
  try {
    const { id } = req.params;
    const keyCard = await KeyCard.findById(id);
    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }
    keyCard.status = 'inactive';
    await keyCard.save();
    res.status(200).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateKeyCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'lost', 'damaged', 'expired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: active, inactive, lost, damaged, expired' });
    }

    const keyCard = await KeyCard.findById(id);
    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }

    // Store previous status for audit trail
    const previousStatus = keyCard.status;

    // If marking as lost or damaged, clear assignment data
    if (status === 'lost' || status === 'damaged') {
      keyCard.assignedTo = null;
      keyCard.assignedRoom = null;
      keyCard.activationDate = null;
      keyCard.expirationDate = null;
    }

    // Update status and audit fields
    keyCard.status = status;
    keyCard.previousStatus = previousStatus;
    keyCard.statusChangedBy = req.user._id; // Assuming user is authenticated
    keyCard.statusChangedAt = new Date();
    keyCard.statusChangeReason = reason || '';

    await keyCard.save();

    res.status(200).json(keyCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listKeyCards = async (req, res) => {
  try {
    const keyCards = await KeyCard.find()
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedRoom', 'number type');
    res.status(200).json(keyCards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getKeyCardDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const keyCard = await KeyCard.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedRoom', 'number type')
      .populate('statusChangedBy', 'firstName lastName email');

    if (!keyCard) {
      return res.status(404).json({ message: 'Key card not found' });
    }

    // If card is assigned, get check-in details
    let checkInDetails = null;
    if (keyCard.assignedTo && keyCard.assignedRoom) {
      const checkInOut = await CheckInOut.findOne({
        guest: keyCard.assignedTo,
        room: keyCard.assignedRoom,
        status: { $in: ['checked_in', 'checked_out'] }
      }).populate('booking', 'checkInDate checkOutDate');

      if (checkInOut) {
        checkInDetails = {
          checkInTime: checkInOut.checkInTime,
          status: checkInOut.status,
          booking: checkInOut.booking,
          preferences: checkInOut.preferences
        };
      }
    }

    const response = {
      ...keyCard.toObject(),
      checkInDetails
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
