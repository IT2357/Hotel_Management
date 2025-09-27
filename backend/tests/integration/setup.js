// 📁 backend/tests/integration/setup.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import 'dotenv/config';

let mongoServer;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Mock middleware
jest.mock('../../middleware/gridfsUpload.js', () => ({
  uploadSingle: jest.fn(),
  uploadToGridFS: jest.fn((req, res, next) => next()), // Mock as middleware
  handleMulterError: jest.fn((req, res, next) => next()),
  uploadForMenuExtraction: jest.fn(),
}));

jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id', role: 'admin' };
    next();
  }),
}));

jest.mock('../../middleware/roleAuth.js', () => ({
  authorizeRoles: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../middleware/validation.js', () => ({
  validateMenuItem: jest.fn((req, res, next) => next()),
  validateMenuCategory: jest.fn((req, res, next) => next()),
  validateImageUpload: jest.fn((req, res, next) => next()),
}));

// Mock the problematic ES module imports
jest.mock('../../controllers/menuExtractionController.js', () => ({
  getMenuImage: jest.fn(),
  extractMenuFromImage: jest.fn(),
  extractMenuFromUrl: jest.fn(),
}));

jest.mock('../../controllers/menu/foodController.js', () => ({
  getFoodItems: jest.fn(),
  getFoodItem: jest.fn(),
  getFoodItemsByCategory: jest.fn(),
  createFoodItem: jest.fn(),
  updateFoodItem: jest.fn(),
  deleteFoodItem: jest.fn(),
}));

jest.mock('../../controllers/food/foodOrderController.js', () => ({
  createFoodOrder: jest.fn(),
  getAllFoodOrders: jest.fn(),
  getFoodOrder: jest.fn(),
  updateFoodOrderStatus: jest.fn(),
  getCustomerOrders: jest.fn(),
  getOrderStats: jest.fn(), // Mock missing function
  updateOrderStatus: jest.fn(),
}));

jest.mock('../../controllers/food/foodReviewController.js', () => ({
  submitOrderReview: jest.fn(),
  getOrderReview: jest.fn(),
  getAllReviews: jest.fn(),
  moderateReview: jest.fn(),
  deleteReview: jest.fn(),
  getReviewStats: jest.fn(), // Mock missing function
}));

// Mock the seed function to avoid ES module issues
const mockSeedValdorMenu = async () => {
  // Simple mock seeding for tests
  const Food = mongoose.models.Food || mongoose.model('Food', {
    name: String,
    category: String,
    price: Number,
    description: String,
    ingredients: [String],
    allergens: [String],
    dietaryTags: [String],
    seasonal: Boolean,
    isAvailable: Boolean,
    sentimentBreakdown: {
      positive: Number,
      neutral: Number,
      negative: Number
    }
  });

  const sampleFoods = [
    {
      name: 'Chicken Lamprais',
      category: 'Lunch',
      price: 950,
      description: 'Traditional Sri Lankan rice dish with chicken',
      ingredients: ['Rice', 'Chicken', 'Spices'],
      allergens: [],
      dietaryTags: ['Non-Vegetarian'],
      seasonal: false,
      isAvailable: true,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
    },
    {
      name: 'Vegetable Kottu',
      category: 'Lunch',
      price: 650,
      description: 'Chopped roti with vegetables and spices',
      ingredients: ['Roti', 'Vegetables', 'Egg'],
      allergens: ['Egg'],
      dietaryTags: ['Vegetarian'],
      seasonal: false,
      isAvailable: true,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
    }
  ];

  await Food.insertMany(sampleFoods);
  console.log('✅ Mock seeded test database with sample foods');
};

beforeAll(async () => {
  try {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to test database');

    // Seed test data with mock function
    await mockSeedValdorMenu();

  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  try {
    // Close database connection
    if (mongoose.connection.readyState > 0) {
      await mongoose.connection.close();
    }

    // Stop in-memory server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
}, 60000);

afterEach(async () => {
  try {
    // Clear all collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Re-seed data for next test
    await seedValdorMenu();

  } catch (error) {
    console.error('❌ Test cleanup between tests failed:', error);
  }
}, 30000);

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

  // Generate admin token
  generateAdminToken: (userId = '507f1f77bcf86cd799439012') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role: 'admin', email: 'admin@test.com' },
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
  }),

  // Create test order data
  createTestOrder: (overrides = {}) => ({
    userId: new mongoose.Types.ObjectId(),
    items: [
      {
        foodId: new mongoose.Types.ObjectId(),
        name: 'Test Food',
        price: 25.99,
        quantity: 2,
        customizations: []
      }
    ],
    totalAmount: 51.98,
    status: 'Pending',
    orderType: 'dine-in',
    customerDetails: {
      name: 'Test Customer',
      phone: '+1234567890',
      email: 'test@example.com'
    },
    ...overrides
  })
};
