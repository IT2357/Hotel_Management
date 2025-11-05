import { body, param, query } from 'express-validator';

// Category validation
export const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon must be less than 10 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

export const updateCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  ...createCategoryValidation
];

// Review validation
export const submitReviewValidation = [
  param('menuItemId').isMongoId().withMessage('Invalid menu item ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('helpful')
    .optional()
    .isBoolean()
    .withMessage('helpful must be a boolean')
];

export const voteReviewValidation = [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('isHelpful')
    .isBoolean()
    .withMessage('isHelpful must be a boolean')
];

export const reportReviewValidation = [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('reason')
    .isIn(['Inappropriate content', 'Spam', 'Fake review', 'Offensive language', 'Other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

// Kitchen validation
export const updateOrderStatusValidation = [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('status')
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

export const assignOrderValidation = [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('staffId')
    .isMongoId()
    .withMessage('Invalid staff ID')
];

// Query validation
export const getReviewsValidation = [
  param('menuItemId').isMongoId().withMessage('Invalid menu item ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['recent', 'oldest', 'highest', 'lowest', 'most_helpful'])
    .withMessage('Invalid sort option'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating filter must be between 1 and 5')
];

export const getKitchenOrdersValidation = [
  query('status')
    .optional()
    .isIn(['all', 'pending', 'preparing', 'ready', 'completed'])
    .withMessage('Invalid status filter'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status', 'total'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];
