// 📁 backend/eventListeners/notificationListeners.js
import notificationService from "../services/notification/notificationService.js";
import eventBus from "../utils/eventBus.js";
import Notification from "../models/Notification.js";
import { User } from "../models/User.js";

// Helper function to get user type
async function getUserType(userId) {
  const user = await User.findById(userId);
  return user?.role || "guest";
}

// ========================
// GUEST NOTIFICATION EVENTS
// ========================

// Booking & Payment Events
eventBus.safeOn("booking.created", async (data) => {
  const { guestId, roomNumber, checkInDate, checkOutDate } = data;
  await notificationService.sendNotification({
    userId: guestId,
    userType: "guest",
    type: "booking_confirmation",
    title: "Booking Confirmed",
    message: `Your booking for Room ${roomNumber} is confirmed. Check-in: ${new Date(
      checkInDate
    ).toLocaleDateString()}, Check-out: ${new Date(
      checkOutDate
    ).toLocaleDateString()}`,
    channel: "email",
    priority: "high",
    metadata: data,
    actionUrl: `/bookings/${data.bookingId}`,
  });
});

eventBus.safeOn("payment.processed", async (data) => {
  const userType = await getUserType(data.userId);
  await notificationService.sendNotification({
    userId: data.userId,
    userType,
    type: "payment_receipt",
    title: "Payment Receipt",
    message: `Your payment of $${data.amount.toFixed(2)} for ${
      data.purpose
    } has been processed. Transaction ID: ${data.transactionId}`,
    channel: "email",
    priority: "high",
    metadata: data,
  });
});

eventBus.safeOn("payment.failed", async (data) => {
  const userType = await getUserType(data.userId);
  await notificationService.sendNotification({
    userId: data.userId,
    userType,
    type: "payment_failed",
    title: "Payment Failed",
    message: `Your payment of $${data.amount.toFixed(2)} failed. Reason: ${
      data.reason
    }. Please try again or contact support.`,
    channel: "email",
    priority: "critical",
    metadata: data,
    actionUrl: `/payments/retry/${data.paymentId}`,
  });
});

// Check-in/Check-out Events
eventBus.safeOn("checkin.reminder", async (data) => {
  await notificationService.sendNotification({
    userId: data.guestId,
    userType: "guest",
    type: "checkin_reminder",
    title: "Check-in Reminder",
    message: `Your check-in at ${data.hotelName} is tomorrow at ${data.checkInTime}. Room ${data.roomNumber} is ready for you!`,
    channel: "sms",
    priority: "medium",
    metadata: data,
  });
});

eventBus.safeOn("checkout.reminder", async (data) => {
  await notificationService.sendNotification({
    userId: data.guestId,
    userType: "guest",
    type: "checkout_reminder",
    title: "Check-out Reminder",
    message: `Your check-out is at ${data.checkOutTime} today. Please return your keycard and visit the front desk to complete checkout.`,
    channel: "inApp",
    priority: "medium",
    metadata: data,
  });
});

// Service Events
eventBus.safeOn("food.order.placed", async (data) => {
  await notificationService.sendNotification({
    userId: data.guestId,
    userType: "guest",
    type: "food_order_confirmation",
    title: "Order Confirmed",
    message: `Your order #${data.orderId} has been received. Estimated delivery time: ${data.estimatedTime} minutes.`,
    channel: "inApp",
    priority: "medium",
    metadata: data,
  });
});

eventBus.safeOn("food.order.ready", async (data) => {
  await notificationService.sendNotification({
    userId: data.guestId,
    userType: "guest",
    type: "food_order_ready",
    title: "Order Ready",
    message: `Your order #${data.orderId} is ready for delivery to Room ${data.roomNumber}.`,
    channel: "inApp",
    priority: "medium",
    metadata: data,
  });
});

eventBus.safeOn("service.request.created", async (data) => {
  await notificationService.sendNotification({
    userId: data.guestId,
    userType: "guest",
    type: "service_request_update",
    title: "Service Request Received",
    message: `Your ${data.serviceType} request has been received. Expected response time: ${data.eta}.`,
    channel: "inApp",
    priority: "medium",
    metadata: data,
  });
});

eventBus.safeOn("service.request.completed", async (data) => {
  await notificationService.sendNotification({
    userId: data.guestId,
    userType: "guest",
    type: "service_request_update",
    title: "Service Completed",
    message: `Your ${data.serviceType} request has been completed. We hope you're satisfied with our service!`,
    channel: "inApp",
    priority: "low",
    metadata: data,
  });
});

// ========================
// STAFF NOTIFICATION EVENTS
// ========================

// Task Management Events
eventBus.safeOn("task.assigned", async (data) => {
  await notificationService.sendNotification({
    userId: data.staffId,
    userType: "staff",
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You've been assigned a new task: ${data.taskName}. Priority: ${
      data.priority
    }, Deadline: ${new Date(data.deadline).toLocaleString()}`,
    channel: "inApp",
    priority: data.priority === "high" ? "high" : "medium",
    metadata: data,
    actionUrl: `/tasks/${data.taskId}`,
  });
});

eventBus.safeOn("task.reminder", async (data) => {
  await notificationService.sendNotification({
    userId: data.staffId,
    userType: "staff",
    type: "task_reminder",
    title: "Task Deadline Approaching",
    message: `Your task "${data.taskName}" is due in 1 hour. Please complete it on time.`,
    channel: "sms",
    priority: "high",
    metadata: data,
  });
});

eventBus.safeOn("task.overdue", async (data) => {
  await notificationService.sendNotification({
    userId: data.staffId,
    userType: "staff",
    type: "task_overdue",
    title: "Task Overdue",
    message: `Your task "${data.taskName}" is now overdue. Please complete it immediately and update the status.`,
    channel: "inApp",
    priority: "critical",
    metadata: data,
  });
});

// Shift Management Events
eventBus.safeOn("shift.scheduled", async (data) => {
  await notificationService.sendNotification({
    userId: data.staffId,
    userType: "staff",
    type: "shift_scheduled",
    title: "New Shift Scheduled",
    message: `You've been scheduled for a ${data.shiftType} shift on ${new Date(
      data.startTime
    ).toLocaleDateString()} from ${new Date(
      data.startTime
    ).toLocaleTimeString()} to ${new Date(data.endTime).toLocaleTimeString()}`,
    channel: "email",
    priority: "medium",
    metadata: data,
  });
});

eventBus.safeOn("shift.reminder", async (data) => {
  await notificationService.sendNotification({
    userId: data.staffId,
    userType: "staff",
    type: "shift_reminder",
    title: "Shift Starting Soon",
    message: `Your ${data.shiftType} shift starts in 30 minutes at ${data.location}.`,
    channel: "sms",
    priority: "high",
    metadata: data,
  });
});

eventBus.safeOn("shift.changed", async (data) => {
  await notificationService.sendNotification({
    userId: data.staffId,
    userType: "staff",
    type: "shift_change",
    title: "Shift Schedule Changed",
    message: `Your shift on ${new Date(
      data.originalDate
    ).toLocaleDateString()} has been modified. New time: ${new Date(
      data.newStartTime
    ).toLocaleTimeString()} - ${new Date(
      data.newEndTime
    ).toLocaleTimeString()}`,
    channel: "email",
    priority: "high",
    metadata: data,
  });
});

// ========================
// MANAGER NOTIFICATION EVENTS
// ========================

eventBus.safeOn("staff.performance.alert", async (data) => {
  await notificationService.sendNotification({
    userId: data.managerId,
    userType: "manager",
    type: "staff_alert",
    title: "Staff Performance Alert",
    message: `Staff member ${data.staffName} has ${data.issueType}. ${data.details}`,
    channel: "email",
    priority: "high",
    metadata: data,
  });
});

eventBus.safeOn("guest.complaint.received", async (data) => {
  await notificationService.sendNotification({
    userId: data.managerId,
    userType: "manager",
    type: "guest_complaint",
    title: "Guest Complaint Received",
    message: `New complaint from ${data.guestName} in Room ${data.roomNumber}: ${data.complaintDetails}`,
    channel: "email",
    priority: "critical",
    metadata: data,
    actionUrl: `/complaints/${data.complaintId}`,
  });
});

eventBus.safeOn("inventory.low", async (data) => {
  await notificationService.sendNotification({
    userId: data.managerId,
    userType: "manager",
    type: "inventory_alert",
    title: "Low Inventory Alert",
    message: `Inventory for ${data.itemName} is low (${data.currentQuantity} remaining). Reorder level: ${data.reorderLevel}`,
    channel: "email",
    priority: "medium",
    metadata: data,
  });
});

// ========================
// ADMIN NOTIFICATION EVENTS
// ========================

// From first file
eventBus.safeOn("system.error", async (data) => {
  const admins = await User.find({ role: "admin", isApproved: true });
  for (const admin of admins) {
    await notificationService.sendNotification({
      userId: admin._id,
      userType: "admin",
      type: "system_error",
      title: "System Error Alert",
      message: `A system error occurred in ${data.module}: ${data.errorMessage}`,
      channel: "email",
      priority: "critical",
      metadata: data,
    });
  }
});

eventBus.safeOn("security.alert", async (data) => {
  const admins = await User.find({ role: "admin", isApproved: true });
  for (const admin of admins) {
    await notificationService.sendNotification({
      userId: admin._id,
      userType: "admin",
      type: "security_alert",
      title: "Security Alert",
      message: `Security issue detected: ${data.description}. IP: ${
        data.ipAddress
      }, Time: ${new Date(data.timestamp).toLocaleString()}`,
      channel: "sms",
      priority: "critical",
      metadata: data,
    });
  }
});

// From second file (direct DB insert)
eventBus.safeOn("admin.activity", async (data) => {
  const { adminId, action, target, metadata } = data;
  const admins = await User.find({
    role: "admin",
    isApproved: true,
    _id: { $ne: adminId },
  });
  for (const admin of admins) {
    await Notification.create({
      userId: admin._id,
      userType: "admin",
      type: "admin_activity",
      title: `Admin Activity: ${action}`,
      message: `Admin ${adminId} performed ${action} on ${target}`,
      channel: "inApp",
      priority: "medium",
      metadata,
    });
  }
});

eventBus.safeOn("system.alert", async (data) => {
  const { severity, message, component } = data;
  const admins = await User.find({ role: "admin", isApproved: true });
  const priority =
    severity === "high"
      ? "critical"
      : severity === "medium"
      ? "high"
      : "medium";
  for (const admin of admins) {
    await Notification.create({
      userId: admin._id,
      userType: "admin",
      type: "system_alert",
      title: `System Alert: ${component}`,
      message,
      channel: "inApp",
      priority,
      metadata: data,
    });
  }
});

// ========================
// SYSTEM WIDE EVENTS
// ========================

eventBus.safeOn("notification.test", async (data) => {
  console.log("Notification test event received:", data);
  await notificationService.sendNotification({
    userId: data.userId,
    userType: data.userType || "guest",
    type: "test_notification",
    title: "Test Notification",
    message: "This is a test notification from the system.",
    channel: data.channel || "inApp",
    priority: "low",
    metadata: data,
  });
});

// Error handling
eventBus.safeOn("error", (error) => {
  console.error("Error in notification event listener:", error);
});
