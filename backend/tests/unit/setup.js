// 📁 backend/tests/unit/setup.js
import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/hotel_management_test';

// Mock external services
jest.mock('../../services/notification/emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/notification/smsService.js', () => ({
  sendSMS: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/smsService.js', () => ({
  sendSMS: jest.fn().mockResolvedValue(true),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Global test utilities
global.testUtils = {
  // Generate test ObjectId
  generateObjectId: () => new mongoose.Types.ObjectId(),

  // Generate test JWT
  generateTestToken: (userId = '507f1f77bcf86cd799439011', role = 'user') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  // Create test user data
  createTestUser: (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    isActive: true,
    ...overrides
  }),

  // Create test food data
  createTestFood: (overrides = {}) => ({
    name: 'Test Food Item',
    category: 'Lunch',
    description: 'A delicious test food item',
    price: 25.99,
    preparationTimeMinutes: 20,
    ingredients: ['Test Ingredient 1', 'Test Ingredient 2'],
    allergens: [],
    dietaryTags: ['Vegetarian'],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
    ...overrides
  })
};
