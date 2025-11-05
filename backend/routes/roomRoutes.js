// 📁 backend/routes/roomRoutes.js
import express from "express";
import RoomService from "../services/rooms/roomService.js";
import { getAllRooms, getRoomById } from "../controllers/rooms/roomController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllRooms);
// Note: Keep static routes (like "/available") before dynamic routes (like "/:id") to avoid conflicts

// Get available rooms for specific dates
router.get("/available", optionalAuth, async (req, res) => {
  try {
    const { checkIn, checkOut, type, minCapacity, maxPrice, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out dates are required",
      });
    }

    const filters = {
      type,
      minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      guests: guests ? parseInt(guests) : 1
    };

    const availableRooms = await RoomService.getAvailableRooms(checkIn, checkOut, filters);

    res.json({
      success: true,
      message: "Available rooms retrieved successfully",
      data: availableRooms,
      count: availableRooms.length
    });

  } catch (error) {
    console.error('Error getting available rooms:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get available rooms",
    });
  }
});

// Get room details with availability
router.get("/:roomId/details", optionalAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const roomDetails = await RoomService.getRoomDetails(roomId, checkIn, checkOut);

    res.json({
      success: true,
      message: "Room details retrieved successfully",
      data: roomDetails
    });

  } catch (error) {
    console.error('Error getting room details:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get room details",
    });
  }
});

// Get room statistics (admin only)
router.get("/admin/stats", authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo, roomType } = req.query;

    const filters = {
      dateFrom,
      dateTo,
      roomType
    };

    const stats = await RoomService.getRoomStats(filters);

    res.json({
      success: true,
      message: "Room statistics retrieved successfully",
      data: stats
    });

  } catch (error) {
    console.error('Error getting room statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get room statistics",
    });
  }
});

// Check specific room availability
router.get("/:roomId/availability", optionalAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Room ID, check-in and check-out dates are required",
      });
    }

    const availability = await RoomService.checkRoomAvailability(roomId, checkIn, checkOut);

    res.json({
      success: true,
      message: "Room availability checked successfully",
      data: availability
    });

  } catch (error) {
    console.error('Error checking room availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check room availability",
    });
  }
});

// Keep this generic dynamic route last to avoid catching static paths like "/available"
router.get("/:id", getRoomById);

export default router;
