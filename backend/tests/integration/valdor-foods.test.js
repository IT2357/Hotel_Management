// 📁 backend/tests/integration/valdor-foods.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import Food from '../../models/Food.js';

describe('Valdor Foods API Integration Tests', () => {
  let adminToken;
  let userToken;
  let testFoodId;

  beforeAll(async () => {
    // Generate test tokens
    adminToken = global.testUtils.generateAdminToken();
    userToken = global.testUtils.generateTestToken();
  });

  describe('GET /api/valdor/foods', () => {
    it('should return seeded food items', async () => {
      const response = await request(app)
        .get('/api/valdor/foods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.foods).toBeInstanceOf(Array);
      expect(response.body.data.foods.length).toBeGreaterThan(0);

      // Check pagination
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalItems).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/valdor/foods?category=Lunch')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods).toBeInstanceOf(Array);

      // All items should be in Lunch category
      response.body.data.foods.forEach(food => {
        expect(food.category).toBe('Lunch');
      });
    });

    it('should filter by dietary tags', async () => {
      const response = await request(app)
        .get('/api/valdor/foods?dietary=Vegetarian')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods).toBeInstanceOf(Array);

      // All items should have Vegetarian tag
      response.body.data.foods.forEach(food => {
        expect(food.dietaryTags).toContain('Vegetarian');
      });
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/valdor/foods?minPrice=800&maxPrice=1000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods).toBeInstanceOf(Array);

      // All items should be in price range
      response.body.data.foods.forEach(food => {
        expect(food.price).toBeGreaterThanOrEqual(800);
        expect(food.price).toBeLessThanOrEqual(1000);
      });
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/valdor/foods?search=Chicken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods).toBeInstanceOf(Array);

      // All items should contain "Chicken" in name or description
      response.body.data.foods.forEach(food => {
        const searchableText = `${food.name} ${food.description}`.toLowerCase();
        expect(searchableText).toContain('chicken');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/valdor/foods?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods).toBeInstanceOf(Array);
      expect(response.body.data.foods.length).toBeLessThanOrEqual(5);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/valdor/foods/:id', () => {
    let existingFoodId;

    beforeAll(async () => {
      // Get an existing food ID
      const food = await Food.findOne();
      existingFoodId = food._id.toString();
    });

    it('should return a specific food item', async () => {
      const response = await request(app)
        .get(`/api/valdor/foods/${existingFoodId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(existingFoodId);
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.price).toBeDefined();
      expect(response.body.data.category).toBeDefined();
    });

    it('should return 404 for non-existent food', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/valdor/foods/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/valdor/foods/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid food item ID');
    });
  });

  describe('GET /api/valdor/categories', () => {
    it('should return categories with item counts', async () => {
      const response = await request(app)
        .get('/api/valdor/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check category structure
      const firstCategory = response.body.data[0];
      expect(firstCategory.category).toBeDefined();
      expect(firstCategory.count).toBeDefined();
      expect(typeof firstCategory.count).toBe('number');
      expect(firstCategory.avgPrice).toBeDefined();
    });
  });

  describe('GET /api/valdor/stats', () => {
    it('should return food statistics', async () => {
      const response = await request(app)
        .get('/api/valdor/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalItems).toBeGreaterThan(0);
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.priceRange).toBeDefined();
      expect(response.body.data.availability).toBeDefined();
      expect(response.body.data.dietaryTags).toBeDefined();
    });
  });

  describe('POST /api/valdor/search', () => {
    it('should search foods with advanced filters', async () => {
      const searchPayload = {
        q: 'chicken',
        filters: {
          category: 'Lunch',
          dietary: ['Non-Vegetarian'],
          priceRange: { min: 800, max: 1200 }
        }
      };

      const response = await request(app)
        .post('/api/valdor/search')
        .send(searchPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.query).toBe('chicken');
      expect(response.body.data.results).toBeInstanceOf(Array);
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .post('/api/valdor/search')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Search query is required');
    });
  });

  describe('POST /api/valdor/foods (Admin only)', () => {
    it('should create a new food item with admin token', async () => {
      const newFoodData = {
        name: 'Test Admin Food',
        category: 'Lunch',
        description: 'A test food item created by admin',
        price: 99.99,
        preparationTimeMinutes: 15,
        ingredients: ['Test Ingredient'],
        allergens: [],
        dietaryTags: ['Vegetarian'],
        seasonal: false,
        isAvailable: true
      };

      const response = await request(app)
        .post('/api/valdor/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newFoodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Test Admin Food');
      expect(response.body.data.price).toBe(99.99);
      expect(response.body.data.sentimentBreakdown).toEqual({
        positive: 0,
        neutral: 0,
        negative: 0
      });

      // Store ID for cleanup
      testFoodId = response.body.data._id;
    });

    it('should reject creation without admin token', async () => {
      const newFoodData = {
        name: 'Unauthorized Food',
        category: 'Lunch',
        price: 50
      };

      const response = await request(app)
        .post('/api/valdor/foods')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newFoodData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        price: -10,
        category: 'InvalidCategory'
      };

      const response = await request(app)
        .post('/api/valdor/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/valdor/foods/:id (Admin only)', () => {
    it('should update an existing food item', async () => {
      const updateData = {
        name: 'Updated Test Food',
        price: 129.99,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/valdor/foods/${testFoodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Food');
      expect(response.body.data.price).toBe(129.99);
    });

    it('should reject update without admin token', async () => {
      const updateData = { price: 150 };

      const response = await request(app)
        .put(`/api/valdor/foods/${testFoodId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/valdor/foods/:id (Admin only)', () => {
    it('should delete an existing food item', async () => {
      const response = await request(app)
        .delete(`/api/valdor/foods/${testFoodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deletedResponse = await request(app)
        .get(`/api/valdor/foods/${testFoodId}`)
        .expect(404);

      expect(deletedResponse.body.success).toBe(false);
    });

    it('should reject deletion without admin token', async () => {
      const response = await request(app)
        .delete(`/api/valdor/foods/${testFoodId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Schema Validation Tests', () => {
    it('should validate Food schema structure', async () => {
      const foods = await Food.find().limit(1);
      const food = foods[0];

      // Check all required fields exist
      expect(food.name).toBeDefined();
      expect(food.category).toBeDefined();
      expect(food.price).toBeDefined();
      expect(food.ingredients).toBeDefined();
      expect(food.allergens).toBeDefined();
      expect(food.dietaryTags).toBeDefined();
      expect(food.sentimentBreakdown).toBeDefined();

      // Check types
      expect(typeof food.name).toBe('string');
      expect(typeof food.price).toBe('number');
      expect(Array.isArray(food.ingredients)).toBe(true);
      expect(Array.isArray(food.allergens)).toBe(true);
      expect(Array.isArray(food.dietaryTags)).toBe(true);
      expect(typeof food.sentimentBreakdown).toBe('object');

      // Check sentimentBreakdown structure
      expect(food.sentimentBreakdown).toHaveProperty('positive');
      expect(food.sentimentBreakdown).toHaveProperty('neutral');
      expect(food.sentimentBreakdown).toHaveProperty('negative');

      // Check category is valid enum
      const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'];
      expect(validCategories).toContain(food.category);

      // Check price is non-negative
      expect(food.price).toBeGreaterThanOrEqual(0);
    });
  });
});
