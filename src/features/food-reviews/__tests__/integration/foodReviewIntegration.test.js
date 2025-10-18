const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const reviewRoutes = require('../../routes/reviewRoutes');
const foodWorkflowRoutes = require('../../../../../backend/routes/foodWorkflowRoutes');
const FoodReview = require('../../models/FoodReview');
const FoodOrder = require('../../../../../backend/models/FoodOrder');

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../../../../../backend/middleware/auth', () => jest.fn((req, res, next) => {
  req.user = { id: 'user123', role: 'guest' };
  next();
}));

// Mock manager auth middleware
jest.mock('../../../../../backend/middleware/managerAuth', () => jest.fn((req, res, next) => {
  req.user = { id: 'manager123', role: 'manager' };
  next();
}));

// Mock models
jest.mock('../../models/FoodReview');
jest.mock('../../../../../backend/models/FoodOrder');
jest.mock('../../../../../backend/models/MenuItem');

app.use('/api/food-reviews', reviewRoutes);
app.use('/api/food/workflow', foodWorkflowRoutes);

describe('Food Review Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit a review after order delivery', async () => {
    // First, simulate an order being delivered
    const mockOrder = {
      _id: 'order123',
      userId: 'user123',
      status: 'Delivered',
      items: [{ foodId: 'item1', quantity: 2 }],
      totalPrice: 1000
    };

    FoodOrder.findById.mockResolvedValue(mockOrder);
    FoodReview.findOne.mockResolvedValue(null);

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
      feedback: 'Great food and service!'
    };

    FoodReview.mockImplementation(() => {
      return {
        save: jest.fn().mockResolvedValue(mockReview)
      };
    });

    // Submit a review for the delivered order
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

  it('should not allow review submission for non-delivered orders', async () => {
    const mockOrder = {
      _id: 'order123',
      userId: 'user123',
      status: 'Preparing', // Not delivered yet
      items: [{ foodId: 'item1', quantity: 2 }]
    };

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
        },
        feedback: 'Great food and service!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.msg).toBe('Can only review delivered orders');
  });
});