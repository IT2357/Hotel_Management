// 📁 backend/routes/staff.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import * as taskController from "../controllers/staff/taskController.js";
import * as staffController from "../controllers/staff/staffController.js";
import * as scheduleController from "../controllers/staff/scheduleController.js";
import * as notificationController from "../controllers/staff/notificationController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { updateTaskStatus } from '../controllers/staff/taskController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(authorizeRoles(["staff", "manager", "admin"]));

// Task Management Routes
router.get("/tasks", taskController.getTasks);
router.get("/tasks/my", taskController.getMyTasks);
router.post("/tasks", taskController.createTask);
router.put("/tasks/:taskId", taskController.updateTaskStatus);
// New endpoint for updating just the task status
router.put("/tasks/:taskId/status", taskController.updateTaskStatus);
router.delete("/tasks/:taskId", taskController.deleteTask);
router.post("/tasks/:taskId/notes", taskController.addTaskNote);
router.post("/tasks/:taskId/accept-handoff", taskController.acceptHandoff);
router.get("/tasks/stats", taskController.getTaskStats);
// Bulk-assign existing tasks from DB to staff (manager/admin only)
router.post(
  "/tasks/assign-existing",
  authorizeRoles(["manager", "admin"]),
  taskController.assignExistingTasks
);

// Notification Routes
router.get("/notifications", notificationController.getMyNotifications);
router.put("/notifications/:notificationId/read", notificationController.markNotificationAsRead);
router.put("/notifications/read-all", notificationController.markAllNotificationsAsRead);
router.put("/notifications/:notificationId/acknowledge", notificationController.acknowledgeNotification);
router.post("/notifications/announcement", notificationController.createAnnouncement);
router.get("/notifications/stats", notificationController.getNotificationStats);
router.delete("/notifications/:notificationId", notificationController.deleteNotification);
router.get("/notifications/urgent", notificationController.getUrgentAlerts);

// Staff Management Routes (for managers and admins)
router.get("/profile", staffController.getMyProfile);
router.put("/profile", staffController.updateMyProfile);
// Upload profile photo (current user)
// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    cb(null, `user_${req.user.userId}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });
// Wrap to ensure a function is always passed to Router; delegate to controller at runtime
router.post("/profile/photo", upload.single("image"), (req, res, next) => {
  const handler = staffController.uploadProfilePhoto;
  if (typeof handler !== "function") {
    return res.status(500).json({ success: false, message: "Upload handler not available" });
  }
  return handler(req, res, next);
});
router.get("/colleagues", staffController.getColleagues);
router.get("/colleagues/:staffId", staffController.getColleagueProfile);

// Schedule Routes
router.get("/schedule", scheduleController.getMySchedule);
router.get("/schedule/week", scheduleController.getWeeklySchedule);
router.put("/schedule/availability", scheduleController.updateAvailability);

export default router;