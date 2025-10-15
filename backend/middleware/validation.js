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

export const validateReportRequest = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date.'
      });
    }
    
    // Limit date range to prevent excessive queries
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 365 days.'
      });
    }
  }
  
  next();
};

// Food validation functions
export const validateFoodItem = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Food name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),
  body("category")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),
  body("currency")
    .optional()
    .isIn(['LKR', 'USD', 'EUR'])
    .withMessage("Currency must be LKR, USD, or EUR"),
  body("ingredients")
    .optional()
    .isArray()
    .withMessage("Ingredients must be an array"),
  body("allergens")
    .optional()
    .isArray()
    .withMessage("Allergens must be an array"),
  body("dietaryTags")
    .optional()
    .isArray()
    .withMessage("Dietary tags must be an array"),
  body("preparationTime")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Preparation time must be between 1 and 120 minutes"),
  body("spiceLevel")
    .optional()
    .isIn(['Mild', 'Medium', 'Hot', 'Extra Hot'])
    .withMessage("Spice level must be Mild, Medium, Hot, or Extra Hot"),
  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be a boolean"),
  handleValidationErrors,
];

export const validateFoodOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.foodId")
    .isMongoId()
    .withMessage("Invalid food item ID"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be between 1 and 50"),
  body("subtotal")
    .isFloat({ min: 0.01 })
    .withMessage("Subtotal must be a positive number"),
  body("tax")
    .isFloat({ min: 0 })
    .withMessage("Tax must be a non-negative number"),
  body("totalPrice")
    .isFloat({ min: 0.01 })
    .withMessage("Total price must be a positive number"),
  body("currency")
    .isIn(['LKR'])
    .withMessage("Currency must be LKR"),
  body("customerDetails.customerName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Customer name must be between 2 and 100 characters"),
  body("customerDetails.customerEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid customer email"),
  body("customerDetails.customerPhone")
    .isMobilePhone('any')
    .withMessage("Please provide a valid phone number"),
  body("paymentMethod")
    .isIn(['card', 'cash', 'wallet'])
    .withMessage("Payment method must be card, cash, or wallet"),
  body("orderType")
    .optional()
    .isIn(['dine-in', 'takeaway', 'delivery'])
    .withMessage("Order type must be dine-in, takeaway, or delivery"),
  body("specialInstructions")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Special instructions cannot exceed 500 characters"),
  handleValidationErrors,
];

export const validateFoodReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),
  handleValidationErrors,
];

// Menu Item validation
export const validateMenuItem = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Menu item name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Name must be between 2 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty if provided"),
  handleValidationErrors,
];

// Menu Category validation
export const validateMenuCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  handleValidationErrors,
];
