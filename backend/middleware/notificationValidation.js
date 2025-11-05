// 📁 backend/middleware/notificationValidation.js
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { getDefaultPreferences } from "../models/NotificationPreferences.js";

// Validation for notification preferences
export const validateNotificationPreferences = [
  body().isObject().withMessage("Preferences must be an object"),

  // Validate the nested preference structure
  body("*.email")
    .optional()
    .isBoolean()
    .withMessage("Email preference must be boolean"),
  body("*.inApp")
    .optional()
    .isBoolean()
    .withMessage("InApp preference must be boolean"),
  body("*.sms")
    .optional()
    .isBoolean()
    .withMessage("SMS preference must be boolean"),

  // Custom validator for allowed keys based on userType
  body().custom((prefs, { req }) => {
    const userType =
      req.body.userType || req.query.userType || req.params.userType;
    if (
      !userType ||
      !["guest", "staff", "manager", "admin"].includes(userType)
    ) {
      throw new Error("Missing or invalid userType for preference validation");
    }

    const allowedKeys = Object.keys(getDefaultPreferences(userType));
    const incomingKeys = Object.keys(prefs);

    const invalidKeys = incomingKeys.filter(
      (key) => !allowedKeys.includes(key)
    );
    if (invalidKeys.length > 0) {
      throw new Error(
        `Invalid preference keys for userType "${userType}": ${invalidKeys.join(
          ", "
        )}`
      );
    }

    return true;
  }),

  handleValidationErrors,
];

// Validation for sending notifications
export const validateNotificationSend = [
  body("userId").optional().isMongoId().withMessage("Invalid user ID"),
  body("userIds").optional().isArray().withMessage("User IDs must be an array"),
  body("userIds.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid user ID in array"),
  body("userType")
    .optional()
    .isIn(["guest", "staff", "manager", "admin"])
    .withMessage("Invalid user type"),
  body("type").notEmpty().withMessage("Notification type is required"),
  body("title").notEmpty().withMessage("Title is required"),
  body("message").notEmpty().withMessage("Message is required"),
  body("channel")
    .optional()
    .isIn(["email", "inApp", "sms", "push"])
    .withMessage("Invalid channel"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority"),
  body("metadata").optional().isObject(),
  body("actionUrl")
    .optional()
    .isURL()
    .withMessage("Action URL must be a valid URL"),
  body("expiryDate").optional().isISO8601(),
  handleValidationErrors,
];

// Validation for notification ID
export const validateNotificationId = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
  handleValidationErrors,
];

// Validation for notification queries
export const validateNotificationQuery = [
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("page").optional().isInt({ min: 1 }),
  query("read").optional().isBoolean(),
  query("channel").optional().isIn(["email", "inApp", "sms", "push"]),
  query("priority").optional().isIn(["low", "medium", "high", "critical"]),
  query("type").optional().notEmpty(),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("search").optional().isString().trim().escape(), // Add validation for search query
  query("userType").optional().isIn(["guest", "staff", "manager", "admin"]), // Add validation for userType query
  query("status")
    .optional()
    .isIn(["pending", "sent", "delivered", "failed", "read"]), // Add validation for status query
  handleValidationErrors,
];
