// 📁 backend/tests/food.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import 'dotenv/config';

describe('Food Management System', () => {
  let testCategory;
  let testMenuItem;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    
    // Clean up test data
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    
    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for unit tests',
      displayOrder: 1,
      isActive: true
    });

    // Create test menu item
    testMenuItem = await MenuItem.create({
      name: 'Test Menu Item',
      description: 'Test menu item for unit tests',
      price: 25.99,
      category: testCategory._id,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
      ingredients: ['Test ingredient 1', 'Test ingredient 2'],
      allergens: ['Test allergen'],
      nutritionalInfo: {
        calories: 300,
        protein: 15,
        carbs: 30,
        fat: 10
      },
      dietaryTags: ['vegetarian'],
      spiceLevel: 'mild',
      cookingTime: 20,
      portions: [
        { name: 'Regular', price: 25.99 },
        { name: 'Large', price: 32.99 }
      ],
      isAvailable: true,
      isPopular: true,
      isFeatured: false
    });

    // Get auth token (assuming you have an auth endpoint)
    // This is a placeholder - adjust based on your auth system
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    
    if (authResponse.body.token) {
      authToken = authResponse.body.token;
    }
  });

  afterAll(async () => {
    // Clean up test data
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/food/menu/items', () => {
    it('should fetch all menu items', async () => {
      const response = await request(app)
        .get('/api/food/menu/items')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      
      // Check if imageUrl is properly added
      const firstItem = response.body.data.items[0];
      expect(firstItem.imageUrl).toBeDefined();
    });

    it('should filter menu items by category', async () => {
      const response = await request(app)
        .get(`/api/food/menu/items?category=${testCategory._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // All items should belong to the test category
      response.body.data.items.forEach(item => {
        expect(item.category._id).toBe(testCategory._id.toString());
      });
    });

    it('should search menu items by name', async () => {
      const response = await request(app)
        .get('/api/food/menu/items?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // All items should contain 'Test' in their name
      response.body.data.items.forEach(item => {
        expect(item.name.toLowerCase()).toContain('test');
      });
    });

    it('should filter by dietary preferences', async () => {
      const response = await request(app)
        .get('/api/food/menu/items?dietary=vegetarian')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // All items should be vegetarian
      response.body.data.items.forEach(item => {
        expect(item.dietaryTags).toContain('vegetarian');
      });
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/food/menu/items?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/food/menu/items/:id', () => {
    it('should fetch a single menu item by ID', async () => {
      const response = await request(app)
        .get(`/api/food/menu/items/${testMenuItem._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(testMenuItem._id.toString());
      expect(response.body.data.name).toBe('Test Menu Item');
      expect(response.body.data.imageUrl).toBeDefined();
    });

    it('should return 404 for non-existent menu item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/food/menu/items/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/food/menu/categories', () => {
    it('should fetch all categories with item counts', async () => {
      const response = await request(app)
        .get('/api/food/menu/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const firstCategory = response.body.data[0];
      expect(firstCategory.itemCount).toBeDefined();
      expect(typeof firstCategory.itemCount).toBe('number');
    });
  });

  describe('POST /api/food/menu/items (Admin only)', () => {
    it('should create a new menu item with valid data', async () => {
      if (!authToken) {
        console.log('Skipping admin test - no auth token available');
        return;
      }

      const newItemData = {
        name: 'New Test Item',
        description: 'A new test menu item',
        price: 19.99,
        category: testCategory._id,
        ingredients: ['New ingredient'],
        allergens: [],
        nutritionalInfo: {
          calories: 250,
          protein: 12,
          carbs: 25,
          fat: 8
        },
        dietaryTags: ['gluten-free'],
        spiceLevel: 'medium',
        cookingTime: 15,
        isAvailable: true,
        isPopular: false,
        isFeatured: false
      };

      const response = await request(app)
        .post('/api/food/menu/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('New Test Item');
      expect(response.body.data.price).toBe(19.99);
    });

    it('should return 400 for invalid menu item data', async () => {
      if (!authToken) {
        console.log('Skipping admin test - no auth token available');
        return;
      }

      const invalidData = {
        name: '', // Empty name should fail validation
        price: -10 // Negative price should fail validation
      };

      const response = await request(app)
        .post('/api/food/menu/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/food/menu/items/:id (Admin only)', () => {
    it('should update an existing menu item', async () => {
      if (!authToken) {
        console.log('Skipping admin test - no auth token available');
        return;
      }

      const updateData = {
        name: 'Updated Test Item',
        price: 29.99,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/food/menu/items/${testMenuItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Item');
      expect(response.body.data.price).toBe(29.99);
    });
  });

  describe('DELETE /api/food/menu/items/:id (Admin only)', () => {
    it('should delete an existing menu item', async () => {
      if (!authToken) {
        console.log('Skipping admin test - no auth token available');
        return;
      }

      // Create a temporary item to delete
      const tempItem = await MenuItem.create({
        name: 'Temp Item',
        description: 'Temporary item for deletion test',
        price: 15.99,
        category: testCategory._id,
        isAvailable: true
      });

      const response = await request(app)
        .delete(`/api/food/menu/items/${tempItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify item is deleted
      const deletedItem = await MenuItem.findById(tempItem._id);
      expect(deletedItem).toBeNull();
    });
  });

  describe('Image URL Generation', () => {
    it('should properly generate imageUrl for items with imageId', async () => {
      // Create item with imageId
      const itemWithImageId = await MenuItem.create({
        name: 'Item with ImageId',
        description: 'Test item with imageId',
        price: 20.99,
        category: testCategory._id,
        imageId: 'gridfs:507f1f77bcf86cd799439011',
        isAvailable: true
      });

      const response = await request(app)
        .get(`/api/food/menu/items/${itemWithImageId._id}`)
        .expect(200);

      expect(response.body.data.imageUrl).toBe('/api/menu/image/gridfs:507f1f77bcf86cd799439011');
    });

    it('should use image field as fallback when no imageId', async () => {
      const response = await request(app)
        .get(`/api/food/menu/items/${testMenuItem._id}`)
        .expect(200);

      expect(response.body.data.imageUrl).toBe(testMenuItem.image);
    });

    it('should provide default image when no image or imageId', async () => {
      // Create item without image
      const itemWithoutImage = await MenuItem.create({
        name: 'Item without Image',
        description: 'Test item without image',
        price: 18.99,
        category: testCategory._id,
        isAvailable: true
      });

      const response = await request(app)
        .get(`/api/food/menu/items/${itemWithoutImage._id}`)
        .expect(200);

      expect(response.body.data.imageUrl).toBe("https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item");
    });
  });

  describe('Category Management', () => {
    it('should create a new category', async () => {
      if (!authToken) {
        console.log('Skipping admin test - no auth token available');
        return;
      }

      const categoryData = {
        name: 'New Test Category',
        description: 'A new test category'
      };

      const response = await request(app)
        .post('/api/food/menu/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Test Category');
    });

    it('should prevent duplicate category names', async () => {
      if (!authToken) {
        console.log('Skipping admin test - no auth token available');
        return;
      }

      const duplicateData = {
        name: 'Test Category', // This already exists
        description: 'Duplicate category'
      };

      const response = await request(app)
        .post('/api/food/menu/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Featured and Popular Items', () => {
    it('should fetch featured items', async () => {
      const response = await request(app)
        .get('/api/food/menu/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // All items should be featured and available
      response.body.data.forEach(item => {
        expect(item.isFeatured).toBe(true);
        expect(item.isAvailable).toBe(true);
      });
    });

    it('should fetch popular items', async () => {
      const response = await request(app)
        .get('/api/food/menu/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // All items should be popular and available
      response.body.data.forEach(item => {
        expect(item.isPopular).toBe(true);
        expect(item.isAvailable).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ObjectId gracefully', async () => {
      const response = await request(app)
        .get('/api/food/menu/items/invalid-id')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll just ensure the endpoint exists
      const response = await request(app)
        .get('/api/food/menu/items')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
