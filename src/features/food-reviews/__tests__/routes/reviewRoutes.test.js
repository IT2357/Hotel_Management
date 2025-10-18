const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const reviewRoutes = require('../../routes/reviewRoutes');
const FoodReview = require('../../models/FoodReview');
const FoodOrder = require('../../../../models/FoodOrder');
const auth = require('../../../../middleware/auth');

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../../../../middleware/auth', () => jest.fn((req, res, next) => {
  req.user = { id: 'user123', role: 'guest' };
  next();
}));

// Mock models
jest.mock('../../models/FoodReview');
jest.mock('../../../../models/FoodOrder');
jest.mock('../../../../models/MenuItem');

app.use('/api/food-reviews', reviewRoutes);

describe('Review Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/food-reviews/submit', () => {
    it('should submit a food review successfully', async () => {
      const mockOrder = { _id: 'order123', user: 'user123' };
      const mockReview = {
        _id: 'review123',
        orderId: 'order123',
        userId: 'user123',
        orderType: 'dine-in',
        ratings: {
          food: { taste: 5, freshness: 4, presentation: 5 },
          service: { staff: 5, speed: 4, ambiance: 5 },
          overall: 4.5
        },
        feedback: 'Great food and service!',
        isAnonymous: false
      };

      FoodOrder.findById.mockResolvedValue(mockOrder);
      FoodReview.findOne.mockResolvedValue(null);
      FoodReview.mockImplementation(() => {
        return {
          save: jest.fn().mockResolvedValue(mockReview)
        };
      });

      const res = await request(app)
        .post('/api/food-reviews/submit')
        .send({
          orderId: 'order123',
          orderType: 'dine-in',
          ratings: {
            food: { taste: 5, freshness: 4, presentation: 5 },
            service: { staff: 5, speed: 4, ambiance: 5 },
            overall: 4.5
          },
          feedback: 'Great food and service!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockReview);
    });

    it('should return error if order not found', async () => {
      FoodOrder.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/food-reviews/submit')
        .send({
          orderId: 'nonexistent',
          orderType: 'dine-in',
          ratings: {
            food: { taste: 5, freshness: 4, presentation: 5 },
            service: { staff: 5, speed: 4, ambiance: 5 },
            overall: 4.5
          }
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('Order not found');
    });

    it('should return error if user is not authorized', async () => {
      const mockOrder = { _id: 'order123', user: 'differentUser' };
      FoodOrder.findById.mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/food-reviews/submit')
        .send({
          orderId: 'order123',
          orderType: 'dine-in',
          ratings: {
            food: { taste: 5, freshness: 4, presentation: 5 },
            service: { staff: 5, speed: 4, ambiance: 5 },
            overall: 4.5
          }
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('User not authorized');
    });

    it('should return error if review already exists', async () => {
      const mockOrder = { _id: 'order123', user: 'user123' };
      const existingReview = { _id: 'review123' };

      FoodOrder.findById.mockResolvedValue(mockOrder);
      FoodReview.findOne.mockResolvedValue(existingReview);

      const res = await request(app)
        .post('/api/food-reviews/submit')
        .send({
          orderId: 'order123',
          orderType: 'dine-in',
          ratings: {
            food: { taste: 5, freshness: 4, presentation: 5 },
            service: { staff: 5, speed: 4, ambiance: 5 },
            overall: 4.5
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('Review already submitted for this order');
    });

    it('should return validation errors for invalid data', async () => {
      const res = await request(app)
        .post('/api/food-reviews/submit')
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/food-reviews/fetch/:orderId', () => {
    it('should fetch a review by order ID', async () => {
      const mockReview = {
        _id: 'review123',
        orderId: 'order123',
        userId: 'user123'
      };

      FoodReview.findOne.mockResolvedValue(mockReview);

      const res = await request(app)
        .get('/api/food-reviews/fetch/order123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockReview);
    });

    it('should return error if review not found', async () => {
      FoodReview.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/food-reviews/fetch/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('Review not found');
    });

    it('should return error if user is not authorized', async () => {
      const mockReview = {
        _id: 'review123',
        orderId: 'order123',
        userId: 'differentUser'
      };

      FoodReview.findOne.mockResolvedValue(mockReview);

      const res = await request(app)
        .get('/api/food-reviews/fetch/order123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('User not authorized');
    });
  });

  describe('GET /api/food-reviews/analytics', () => {
    it('should return 401 if user is not admin', async () => {
      const res = await request(app)
        .get('/api/food-reviews/analytics');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toBe('User not authorized');
    });

    it('should return analytics data for admin', async () => {
      // Mock auth to return admin user
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 'admin123', role: 'admin' };
        next();
      });

      const mockAnalytics = [
        {
          _id: null,
          totalReviews: 10,
          avgOverallRating: 4.2,
          avgFoodTaste: 4.5,
          avgServiceStaff: 4.0
        }
      ];

      FoodReview.aggregate.mockResolvedValue(mockAnalytics);

      const res = await request(app)
        .get('/api/food-reviews/analytics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalReviews).toBe(10);
    });
  });
});