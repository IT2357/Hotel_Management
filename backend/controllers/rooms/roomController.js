// Placeholder for backend/controllers/rooms/roomController.js
import Room from "../../models/Room.js";
/**
 * @desc    Create a new room
 * @route   POST /api/admin/rooms
 * @access  Admin
 */
export const createRoom = async (req, res) => {
  try {
    const room = new Room(req.body);
    const savedRoom = await room.save();
    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: savedRoom,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create room",
    });
  }
};

/**
 * @desc    Get all rooms
 * @route   GET /api/admin/rooms
 * @access  Admin
 */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch rooms",
    });
  }
};

/**
 * @desc    Get single room by ID
 * @route   GET /api/admin/rooms/:id
 * @access  Admin
 */
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch room",
    });
  }
};

/**
 * @desc    Update a room
 * @route   PUT /api/admin/rooms/:id
 * @access  Admin
 */
export const updateRoom = async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update room",
    });
  }
};
/**
 * @desc    Delete a room
 * @route   DELETE /api/admin/rooms/:id
 * @access  Admin
 */
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete room",
    });
  }
};

/**
 * @desc    Get featured rooms for homepage display
 * @route   GET /api/rooms/featured
 * @access  Public
 */
export const getFeaturedRooms = async (req, res) => {
  try {
    // Get a few featured rooms (limit to 6 for homepage display)
    const rooms = await Room.find({ isAvailable: true })
      .sort({ basePrice: 1 }) // Sort by price ascending
      .limit(6)
      .select('title description basePrice capacity images amenities type roomNumber');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured rooms",
    });
  }
};
