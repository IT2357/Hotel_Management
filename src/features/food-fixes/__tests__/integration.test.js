const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const foodAdminRoutes = require('../routes/foodAdminRoutes');
const menuExtractionRoutes = require('../routes/menuExtractionRoutes');
const MenuItem = require('../../../models/MenuItem');

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../../../middleware/auth', () => jest.fn((req, res, next) => {
  req.user = { id: 'user123', role: 'admin' };
  next();
}));

// Mock admin auth middleware
jest.mock('../../../middleware/adminAuth', () => jest.fn((req, res, next) => {
  req.user = { id: 'admin123', role: 'admin' };
  next();
}));

// Mock multer
jest.mock('multer', () => () => ({
  single: () => (req, res, next) => {
    req.file = { filename: 'test-image.jpg', path: '/tmp/test-image.jpg' };
    next();
  }
}));

app.use('/food-fixes', foodAdminRoutes);
app.use('/food-fixes', menuExtractionRoutes);

describe('Food Fixes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create menu item through admin routes and retrieve it', async () => {
    // Mock menu item for creation
    const mockMenuItem = {
      _id: 'item123',
      name: { en: 'Test Dish', ta: 'சோதனை உணவு' },
      price: 475, // 5% discount from 500
      originalPrice: 500,
      description: { en: 'Test description', ta: 'சோதனை விளக்கம்' },
      category: 'Test',
      ingredients: ['ingredient1', 'ingredient2'],
      tags: ['tag1', 'tag2'],
      availability: true,
      imageUrl: '/uploads/menu-items/test-image.jpg',
      save: jest.fn().mockResolvedValue(this)
    };

    MenuItem.mockImplementation(() => mockMenuItem);
    MenuItem.findById.mockResolvedValue(mockMenuItem);

    // Create menu item
    const createRes = await request(app)
      .post('/food-fixes/admin/menu')
      .field('name[en]', 'Test Dish')
      .field('name[ta]', 'சோதனை உணவு')
      .field('price', '500')
      .field('description[en]', 'Test description')
      .field('description[ta]', 'சோதனை விளக்கம்')
      .field('category', 'Test')
      .field('ingredients', JSON.stringify(['ingredient1', 'ingredient2']))
      .field('tags', JSON.stringify(['tag1', 'tag2']))
      .field('availability', 'true');

    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name.en).toBe('Test Dish');
    expect(createRes.body.data.price).toBe(475); // 5% discount applied

    // Retrieve the created menu item
    const getRes = await request(app)
      .get('/food-fixes/admin/menu/item123');

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.name.en).toBe('Test Dish');
  });

  it('should process menu image and create menu item from extracted data', async () => {
    // Mock extracted data
    const mockExtractedData = {
      name: { en: 'Crab Curry', ta: 'நண்டு கறி' },
      price: 475,
      originalPrice: 500,
      description: { en: 'Fresh crab in coconut sauce', ta: 'புதிய நண்டு தேங்காய் சோஸில்' },
      ingredients: ['crab', 'coconut', 'spices'],
      tags: ['Jaffna', 'Traditional', 'Sri Lankan', 'Seafood'],
      category: 'Curry'
    };

    // Mock menu item for creation
    const mockMenuItem = {
      _id: 'item456',
      name: mockExtractedData.name,
      price: mockExtractedData.price,
      originalPrice: mockExtractedData.originalPrice,
      description: mockExtractedData.description,
      category: mockExtractedData.category,
      ingredients: mockExtractedData.ingredients,
      tags: mockExtractedData.tags,
      availability: true,
      imageUrl: '/uploads/menu-items/test-image.jpg',
      save: jest.fn().mockResolvedValue(this)
    };

    // Mock AI extractor
    jest.mock('../utils/AIExtractor', () => ({
      extractMenuData: jest.fn().mockResolvedValue(mockExtractedData),
      trainModel: jest.fn().mockResolvedValue()
    }));

    // Mock MenuItem
    MenuItem.mockImplementation(() => mockMenuItem);

    // Process image
    const processRes = await request(app)
      .post('/food-fixes/menu/process-image')
      .attach('image', Buffer.from('test'), 'test.jpg');

    expect(processRes.status).toBe(200);
    expect(processRes.body.success).toBe(true);
    expect(processRes.body.data.name.en).toBe('Crab Curry');
    expect(processRes.body.data.price).toBe(475);

    // Create menu item from extracted data
    const createRes = await request(app)
      .post('/food-fixes/admin/menu')
      .field('name[en]', mockExtractedData.name.en)
      .field('name[ta]', mockExtractedData.name.ta)
      .field('price', mockExtractedData.originalPrice.toString())
      .field('description[en]', mockExtractedData.description.en)
      .field('description[ta]', mockExtractedData.description.ta)
      .field('category', mockExtractedData.category)
      .field('ingredients', JSON.stringify(mockExtractedData.ingredients))
      .field('tags', JSON.stringify(mockExtractedData.tags))
      .field('availability', 'true');

    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name.en).toBe('Crab Curry');
    expect(createRes.body.data.price).toBe(475); // 5% discount applied
  });
});