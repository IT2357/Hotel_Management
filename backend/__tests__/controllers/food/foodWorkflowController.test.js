// 📁 backend/__tests__/controllers/food/foodWorkflowController.test.js
// Unit tests for foodWorkflowController
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const FoodOrder = require('../../../models/FoodOrder');
const FoodTaskQueue = require('../../../models/FoodTaskQueue');
const { 
  confirmFoodOrder,
  assignFoodOrderToStaff,
  updateFoodOrderStatus,
  modifyFoodOrderEnhanced,
  cancelFoodOrderEnhanced,
  submitFoodReview
} = require('../../../controllers/food/foodWorkflowController');

// Mock dependencies
jest.mock('../../../utils/socket.js', () => ({
  getIO: () => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  })
}));

jest.mock('../../../utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Create express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 'user-123', role: 'guest' };
  next();
};

const mockStaffAuth = (req, res, next) => {
  req.user = { id: 'staff-456', role: 'staff' };
  next();
};

const mockManagerAuth = (req, res, next) => {
  req.user = { id: 'manager-789', role: 'manager' };
  next();
};

// Mock routes for testing controller functions
app.post('/test/confirm/:orderId', mockAuth, confirmFoodOrder);
app.put('/test/assign/:orderId', mockManagerAuth, assignFoodOrderToStaff);
app.put('/test/status/:orderId', mockStaffAuth, updateFoodOrderStatus);
app.put('/test/modify/:orderId', mockAuth, modifyFoodOrderEnhanced);
app.delete('/test/cancel/:orderId', mockAuth, cancelFoodOrderEnhanced);
app.post('/test/review/:orderId', mockAuth, submitFoodReview);

describe('foodWorkflowController', () => {
  let orderId;
  
  beforeAll(async () => {
    // Connect to MongoDB (use in-memory server for testing)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Create a test order
    const order = new FoodOrder({
      userId: 'user-123',
      items: [
        {
          foodId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 350,
          name: 'Chicken Curry'
        }
      ],
      totalPrice: 700,
      subtotal: 700,
      tax: 70,
      currency: 'LKR',
      orderType: 'dine-in',
      customerDetails: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      },
      paymentStatus: 'Pending',
      status: 'Pending'
    });
    
    const savedOrder = await order.save();
    orderId = savedOrder._id.toString();
  });

  afterEach(async () => {
    // Clean up database
    await FoodOrder.deleteMany({});
    await FoodTaskQueue.deleteMany({});
  });

  describe('confirmFoodOrder', () => {
    test('should confirm order and create task queue entry', async () => {
      const response = await request(app)
        .post(`/test/confirm/${orderId}`)
        .send({
          paymentId: 'PAY_123',
          transactionId: 'TXN_456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBe('PAY_123');
      expect(response.body.data.paymentStatus).toBe('Paid');
      
      // Check that task queue entry was created
      const task = await FoodTaskQueue.findOne({ orderId: mongoose.Types.ObjectId(orderId) });
      expect(task).not.toBeNull();
      expect(task.taskType).toBe('prep');
      expect(task.status).toBe('queued');
    });

    test('should return 404 for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();
      
      await request(app)
        .post(`/test/confirm/${fakeOrderId}`)
        .send({
          paymentId: 'PAY_123'
        })
        .expect(404);
    });

    test('should set priority to urgent for room service orders', async () => {
      // Update order to be room service
      await FoodOrder.findByIdAndUpdate(orderId, {
        orderType: 'room-service'
      });

      const response = await request(app)
        .post(`/test/confirm/${orderId}`)
        .send({
          paymentId: 'PAY_123'
        })
        .expect(200);

      const task = await FoodTaskQueue.findOne({ orderId: mongoose.Types.ObjectId(orderId) });
      expect(task.priority).toBe('urgent');
      expect(task.isRoomService).toBe(true);
    });
  });

  describe('assignFoodOrderToStaff', () => {
    beforeEach(async () => {
      // Confirm the order first
      await request(app)
        .post(`/test/confirm/${orderId}`)
        .send({
          paymentId: 'PAY_123'
        });
    });

    test('should assign order to staff and update task queue', async () => {
      const response = await request(app)
        .put(`/test/assign/${orderId}`)
        .send({
          staffId: 'staff-456',
          taskType: 'prep'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedTo).toBe('staff-456');
      
      // Check that task queue was updated
      const task = await FoodTaskQueue.findOne({ orderId: mongoose.Types.ObjectId(orderId) });
      expect(task.status).toBe('assigned');
      expect(task.assignedTo.toString()).toBe('staff-456');
    });

    test('should return 400 for invalid staff ID', async () => {
      await request(app)
        .put(`/test/assign/${orderId}`)
        .send({
          staffId: 'invalid-staff-id'
        })
        .expect(400);
    });

    test('should return 404 for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/test/assign/${fakeOrderId}`)
        .send({
          staffId: 'staff-456'
        })
        .expect(404);
    });
  });

  describe('updateFoodOrderStatus', () => {
    beforeEach(async () => {
      // Confirm and assign the order
      await request(app)
        .post(`/test/confirm/${orderId}`)
        .send({
          paymentId: 'PAY_123'
        });
        
      await request(app)
        .put(`/test/assign/${orderId}`)
        .send({
          staffId: 'staff-456'
        });
    });

    test('should update order status to preparing', async () => {
      const response = await request(app)
        .put(`/test/status/${orderId}`)
        .send({
          kitchenStatus: 'preparing',
          status: 'Preparing'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kitchenStatus).toBe('preparing');
      
      // Check that task queue was updated
      const task = await FoodTaskQueue.findOne({ orderId: mongoose.Types.ObjectId(orderId) });
      expect(task.status).toBe('in-progress');
    });

    test('should update order status to ready and create delivery task', async () => {
      // First set to preparing
      await request(app)
        .put(`/test/status/${orderId}`)
        .send({
          kitchenStatus: 'preparing'
        });
        
      const response = await request(app)
        .put(`/test/status/${orderId}`)
        .send({
          kitchenStatus: 'ready',
          status: 'Ready'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check that delivery task was created
      const deliveryTask = await FoodTaskQueue.findOne({ 
        orderId: mongoose.Types.ObjectId(orderId),
        taskType: 'delivery'
      });
      expect(deliveryTask).not.toBeNull();
      expect(deliveryTask.status).toBe('queued');
    });

    test('should return 400 for invalid status', async () => {
      await request(app)
        .put(`/test/status/${orderId}`)
        .send({
          status: 'InvalidStatus'
        })
        .expect(400);
    });
  });

  describe('modifyFoodOrderEnhanced', () => {
    test('should modify order items and recalculate total', async () => {
      const response = await request(app)
        .put(`/test/modify/${orderId}`)
        .send({
          items: [
            {
              foodId: new mongoose.Types.ObjectId(),
              quantity: 1,
              price: 200,
              name: 'Vegetable Rice'
            }
          ],
          notes: 'Changed to vegetable rice'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Modified');
      expect(response.body.data.totalPrice).toBe(220); // 200 + 10% tax
      expect(response.body.data.notes).toBe('Changed to vegetable rice');
    });

    test('should return 400 when trying to modify delivered order', async () => {
      // Set order to delivered
      await FoodOrder.findByIdAndUpdate(orderId, {
        status: 'Delivered'
      });

      await request(app)
        .put(`/test/modify/${orderId}`)
        .send({
          notes: 'Test modification'
        })
        .expect(400);
    });

    test('should return 403 for unauthorized user', async () => {
      // Create order with different user
      const otherOrder = new FoodOrder({
        userId: 'user-456',
        items: [{ foodId: new mongoose.Types.ObjectId(), quantity: 1, price: 100, name: 'Test' }],
        totalPrice: 110,
        subtotal: 100,
        tax: 10,
        currency: 'LKR'
      });
      
      const savedOrder = await otherOrder.save();
      
      await request(app)
        .put(`/test/modify/${savedOrder._id}`)
        .send({
          notes: 'Test modification'
        })
        .expect(403);
    });
  });

  describe('cancelFoodOrderEnhanced', () => {
    test('should cancel order and update status', async () => {
      const response = await request(app)
        .delete(`/test/cancel/${orderId}`)
        .send({
          reason: 'Changed plans'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Cancelled');
      
      // Check that task queue entries were cancelled
      const tasks = await FoodTaskQueue.find({ orderId: mongoose.Types.ObjectId(orderId) });
      tasks.forEach(task => {
        expect(task.status).toBe('cancelled');
      });
    });

    test('should return 400 when trying to cancel delivered order', async () => {
      // Set order to delivered
      await FoodOrder.findByIdAndUpdate(orderId, {
        status: 'Delivered'
      });

      await request(app)
        .delete(`/test/cancel/${orderId}`)
        .send({
          reason: 'Test cancellation'
        })
        .expect(400);
    });
  });

  describe('submitFoodReview', () => {
    beforeEach(async () => {
      // Set order to delivered
      await FoodOrder.findByIdAndUpdate(orderId, {
        status: 'Delivered'
      });
    });

    test('should submit review and save to order', async () => {
      const response = await request(app)
        .post(`/test/review/${orderId}`)
        .send({
          rating: 5,
          comment: 'Excellent food!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.comment).toBe('Excellent food!');
      
      // Check that review was saved to order
      const order = await FoodOrder.findById(orderId);
      expect(order.review).not.toBeNull();
      expect(order.review.rating).toBe(5);
      expect(order.review.comment).toBe('Excellent food!');
    });

    test('should return 400 for invalid rating', async () => {
      await request(app)
        .post(`/test/review/${orderId}`)
        .send({
          rating: 6, // Invalid rating
          comment: 'Test review'
        })
        .expect(400);
    });

    test('should return 400 when trying to review non-delivered order', async () => {
      // Set order back to pending
      await FoodOrder.findByIdAndUpdate(orderId, {
        status: 'Pending'
      });

      await request(app)
        .post(`/test/review/${orderId}`)
        .send({
          rating: 5,
          comment: 'Test review'
        })
        .expect(400);
    });
  });
});
