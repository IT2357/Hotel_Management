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
    .matches(/(?=.*[@$!%*?&#+\-_=\[\]{}|\\:";'<>?,./^~`])/)
    .withMessage(
      "Password must contain at least one special character (@$!%*?&#+\\-_=[]{}|\\:\";'<>?,./^~`)"
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  handleValidationErrors,
];

export const validateMenuItem = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Menu item name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("price")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Price must be a positive number and not exceed 100,000 LKR"),
  body("category")
    .isMongoId()
    .withMessage("Invalid category ID"),
  body("image")
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty
      // Allow relative URLs starting with / or full URLs
      if (value.startsWith('/')) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage("Image must be a valid URL or relative path"),
  body("ingredients")
    .optional()
    .isArray()
    .withMessage("Ingredients must be an array"),
  body("ingredients.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each ingredient must be between 1 and 50 characters"),
  body("cookingTime")
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage("Cooking time must be between 1 and 300 minutes"),
  body("portions")
    .optional()
    .isArray()
    .withMessage("Portions must be an array"),
  body("portions.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Portion name must be between 1 and 50 characters"),
  body("portions.*.price")
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Portion price must be a positive number and not exceed 100,000 LKR"),
  handleValidationErrors,
];

export const validateMenuCategory = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must not exceed 200 characters"),
  handleValidationErrors,
];

export const validateImageUpload = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("url")
    .optional()
    .isURL()
    .withMessage("URL must be valid"),
  body("filePath")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("File path must be between 1 and 500 characters"),
  handleValidationErrors,
];
