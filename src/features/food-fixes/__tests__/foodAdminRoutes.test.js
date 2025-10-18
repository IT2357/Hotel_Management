const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const foodAdminRoutes = require('../routes/foodAdminRoutes');
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
    req.file = { filename: 'test-image.jpg' };
    next();
  }
}));

app.use('/food-fixes', foodAdminRoutes);

describe('Food Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /food-fixes/admin/menu', () => {
    it('should create a new menu item', async () => {
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
        imageUrl: '/uploads/menu-items/test-image.jpg'
      };

      MenuItem.mockImplementation(() => {
        return {
          save: jest.fn().mockResolvedValue(mockMenuItem)
        };
      });

      const res = await request(app)
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

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name.en).toBe('Test Dish');
      expect(res.body.data.price).toBe(475); // 5% discount applied
    });

    it('should return validation errors for missing fields', async () => {
      const res = await request(app)
        .post('/food-fixes/admin/menu')
        .field('price', '500');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /food-fixes/admin/menu', () => {
    it('should retrieve menu items with pagination', async () => {
      const mockMenuItems = [
        {
          _id: 'item1',
          name: { en: 'Dish 1', ta: 'உணவு 1' },
          price: 475,
          category: 'Category 1'
        },
        {
          _id: 'item2',
          name: { en: 'Dish 2', ta: 'உணவு 2' },
          price: 570,
          category: 'Category 2'
        }
      ];

      MenuItem.countDocuments.mockResolvedValue(2);
      MenuItem.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMenuItems)
          })
        })
      });

      const res = await request(app)
        .get('/food-fixes/admin/menu');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.totalCount).toBe(2);
    });
  });

  describe('PUT /food-fixes/admin/menu/:id', () => {
    it('should update a menu item', async () => {
      const mockUpdatedItem = {
        _id: 'item123',
        name: { en: 'Updated Dish', ta: 'புதுப்பிக்கப்பட்ட உணவு' },
        price: 570, // 5% discount from 600
        originalPrice: 600,
        category: 'Updated Category'
      };

      MenuItem.findByIdAndUpdate.mockResolvedValue(mockUpdatedItem);

      const res = await request(app)
        .put('/food-fixes/admin/menu/item123')
        .field('name[en]', 'Updated Dish')
        .field('name[ta]', 'புதுப்பிக்கப்பட்ட உணவு')
        .field('price', '600')
        .field('category', 'Updated Category');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name.en).toBe('Updated Dish');
      expect(res.body.data.price).toBe(570); // 5% discount applied
    });

    it('should return 404 for non-existent menu item', async () => {
      MenuItem.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put('/food-fixes/admin/menu/nonexistent')
        .field('name[en]', 'Updated Dish');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /food-fixes/admin/menu/:id', () => {
    it('should delete a menu item', async () => {
      const mockMenuItem = {
        _id: 'item123',
        remove: jest.fn().mockResolvedValue()
      };

      MenuItem.findById.mockResolvedValue(mockMenuItem);

      const res = await request(app)
        .delete('/food-fixes/admin/menu/item123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockMenuItem.remove).toHaveBeenCalled();
    });

    it('should return 404 for non-existent menu item', async () => {
      MenuItem.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/food-fixes/admin/menu/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});