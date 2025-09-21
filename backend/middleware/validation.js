// 📁 backend/middleware/validation.js
import { body, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Get the first error message for more specific feedback
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errors.array(),
    });
  }
  next();
};

export const validateRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/(?=.*[a-z])/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/(?=.*[A-Z])/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/(?=.*\d)/)
    .withMessage("Password must contain at least one number")
    .matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage(
      "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
    ),
  body("phone")
    .optional()
    .matches(/^(\+94|0)([1-9]\d{8})$/)
    .withMessage(
      "Phone number must be a valid Sri Lankan number (e.g., 0771234567 or +94771234567)"
    ),
  body("role")
    .optional()
    .isIn(["guest", "staff", "manager", "admin"])
    .withMessage("Invalid role specified"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Address must be between 5 and 100 characters"),
  handleValidationErrors,
];

export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]/)
    .withMessage(
      "New password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
    ),
  handleValidationErrors,
];
