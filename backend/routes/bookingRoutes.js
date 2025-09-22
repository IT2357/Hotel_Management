import express from "express";
import {
  createBooking,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  getAllBookings,
  getPendingApprovals,
  approveBooking,
  rejectBooking,
  putOnHold,
  getBookingStats,
  bulkApproveBookings,
  bulkRejectBookings,
  bulkHoldBookings,
  processBookingPayment,
} from "../controllers/bookings/bookingController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import BookingScheduler from "../services/booking/bookingScheduler.js";

const router = express.Router();

// ===== GUEST ROUTES (Authenticated users) =====

// Create new booking
router.post("/", authenticateToken, createBooking);

// Get user's bookings
router.get("/my-bookings", authenticateToken, getUserBookings);

// Get specific booking details
router.get("/:bookingId", authenticateToken, getBookingDetails);

// Put booking on hold
router.put("/admin/:bookingId/hold", authenticateToken, requireRole(['admin', 'manager']), putOnHold);

// Cancel booking
router.put("/:bookingId/cancel", authenticateToken, cancelBooking);

// Process booking payment
router.put("/:bookingNumber/process-payment", authenticateToken, processBookingPayment);

// ===== ADMIN ROUTES (Admin only) =====

// Get all bookings with filtering
router.get("/admin/all", authenticateToken, requireRole(['admin', 'manager']), getAllBookings);

// Get bookings requiring approval
router.get("/admin/pending-approvals", authenticateToken, requireRole(['admin', 'manager']), getPendingApprovals);

// Get booking statistics
router.get("/admin/stats", authenticateToken, requireRole(['admin', 'manager']), getBookingStats);

// Approve booking
router.put("/admin/:bookingId/approve", authenticateToken, requireRole(['admin', 'manager']), approveBooking);

// Reject booking
router.put("/admin/:bookingId/reject", authenticateToken, requireRole(['admin', 'manager']), rejectBooking);

// Put booking on hold
router.put("/admin/:bookingId/hold", authenticateToken, requireRole(['admin', 'manager']), putOnHold);

// ===== ADMIN BULK OPERATIONS =====

// Bulk approve bookings
router.post("/admin/bulk/approve", authenticateToken, requireRole(['admin', 'manager']), bulkApproveBookings);

// Bulk reject bookings
router.post("/admin/bulk/reject", authenticateToken, requireRole(['admin', 'manager']), bulkRejectBookings);

// Bulk put bookings on hold
router.post("/admin/bulk/hold", authenticateToken, requireRole(['admin', 'manager']), bulkHoldBookings);

// ===== ADMIN SCHEDULER ROUTES =====

// Process expired bookings manually
router.post("/admin/scheduler/process-expired", authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await BookingScheduler.processExpiredBookings();
    res.json({
      success: true,
      message: `Processed ${result.processed} expired bookings`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process expired bookings",
      error: error.message
    });
  }
});

// Get booking scheduler statistics
router.get("/admin/scheduler/stats", authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const stats = await BookingScheduler.getBookingStats();
    res.json({
      success: true,
      message: "Scheduler statistics retrieved",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get scheduler stats",
      error: error.message
    });
  }
});

// Send expiry reminders
router.post("/admin/scheduler/send-reminders", authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { hoursBefore = 24 } = req.body;
    const result = await BookingScheduler.sendExpiryReminders(hoursBefore);
    res.json({
      success: true,
      message: `Sent ${result.sent} expiry reminders`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send expiry reminders",
      error: error.message
    });
  }
});

// Cleanup old bookings
router.post("/admin/scheduler/cleanup", authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    const deletedCount = await BookingScheduler.cleanupOldBookings(daysOld);
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old bookings`,
      data: { deletedCount, daysOld }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cleanup old bookings",
      error: error.message
    });
  }
});

// ===== ADMIN AUTO-APPROVAL ROUTES =====

// Get auto-approval statistics
router.get("/admin/auto-approval/stats", authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const AutoApprovalService = (await import("../services/booking/autoApprovalService.js")).default;
    const stats = await AutoApprovalService.getAutoApprovalStats();
    res.json({
      success: true,
      message: "Auto-approval statistics retrieved",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get auto-approval stats",
      error: error.message
    });
  }
});

// Check if a booking should be auto-approved (for testing)
router.post("/admin/auto-approval/check", authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { bookingData, userId } = req.body;
    const AutoApprovalService = (await import("../services/booking/autoApprovalService.js")).default;
    const result = await AutoApprovalService.shouldAutoApprove(bookingData, userId);
    res.json({
      success: true,
      message: "Auto-approval check completed",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check auto-approval",
      error: error.message
    });
  }
});

export default router;
