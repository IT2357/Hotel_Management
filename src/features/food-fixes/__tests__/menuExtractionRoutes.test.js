const request = require('supertest');
const express = require('express');
const menuExtractionRoutes = require('../routes/menuExtractionRoutes');
const AIExtractor = require('../utils/AIExtractor');

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
    req.file = { path: '/tmp/test-image.jpg' };
    next();
  }
}));

app.use('/food-fixes', menuExtractionRoutes);

describe('Menu Extraction Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /food-fixes/menu/process-image', () => {
    it('should process menu image and extract data', async () => {
      const mockExtractedData = {
        name: { en: 'Crab Curry', ta: 'நண்டு கறி' },
        price: 475,
        originalPrice: 500,
        description: { en: 'Fresh crab in coconut sauce', ta: 'புதிய நண்டு தேங்காய் சோஸில்' },
        ingredients: ['crab', 'coconut', 'spices'],
        tags: ['Jaffna', 'Traditional', 'Sri Lankan', 'Seafood'],
        category: 'Curry'
      };

      AIExtractor.extractMenuData = jest.fn().mockResolvedValue(mockExtractedData);

      const res = await request(app)
        .post('/food-fixes/menu/process-image')
        .attach('image', Buffer.from('test'), 'test.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name.en).toBe('Crab Curry');
      expect(res.body.data.price).toBe(475);
      expect(AIExtractor.extractMenuData).toHaveBeenCalledWith('/tmp/test-image.jpg');
    });

    it('should return error when no image is provided', async () => {
      const res = await request(app)
        .post('/food-fixes/menu/process-image');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('No image file provided');
    });

    it('should handle extraction errors', async () => {
      AIExtractor.extractMenuData = jest.fn().mockRejectedValue(new Error('OCR failed'));

      const res = await request(app)
        .post('/food-fixes/menu/process-image')
        .attach('image', Buffer.from('test'), 'test.jpg');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('Error processing image');
    });
  });

  describe('POST /food-fixes/menu/train-model', () => {
    it('should start model training', async () => {
      AIExtractor.trainModel = jest.fn().mockResolvedValue();

      const res = await request(app)
        .post('/food-fixes/menu/train-model')
        .send({ trainingDataPath: '/path/to/training/data' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Model training started successfully');
      expect(AIExtractor.trainModel).toHaveBeenCalledWith('/path/to/training/data');
    });

    it('should return error when training data path is missing', async () => {
      const res = await request(app)
        .post('/food-fixes/menu/train-model')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('Training data path is required');
    });

    it('should handle training errors', async () => {
      AIExtractor.trainModel = jest.fn().mockRejectedValue(new Error('Training failed'));

      const res = await request(app)
        .post('/food-fixes/menu/train-model')
        .send({ trainingDataPath: '/path/to/training/data' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('Error training model');
    });
  });
});