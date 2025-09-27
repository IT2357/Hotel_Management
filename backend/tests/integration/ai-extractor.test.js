// 📁 backend/tests/integration/ai-extractor.test.js
import request from 'supertest';
import app from '../../server.js';
import AIMenuExtractor from '../../services/aiMenuExtractor.js';
import fs from 'fs';
import path from 'path';

describe('AI Menu Extractor Integration Tests', () => {
  let adminToken;

  beforeAll(async () => {
    // Generate admin token for protected routes
    adminToken = global.testUtils.generateAdminToken();
  });

  describe('POST /api/valdor/extract-menu (URL Extraction)', () => {
    it('should extract menu from Valampuri URL', async () => {
      const extractPayload = {
        url: 'https://valampuri.foodorders.lk/'
      };

      const response = await request(app)
        .post('/api/valdor/extract-menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(extractPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.extractedItems).toBeGreaterThan(0);
      expect(response.body.data.savedItems).toBeGreaterThan(0);
      expect(response.body.data.extractionMethod).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.items).toBeInstanceOf(Array);
    }, 60000); // Extended timeout for AI processing

    it('should reject extraction without admin token', async () => {
      const extractPayload = {
        url: 'https://valampuri.foodorders.lk/'
      };

      const response = await request(app)
        .post('/api/valdor/extract-menu')
        .send(extractPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate URL input', async () => {
      const invalidPayload = {
        url: 'not-a-valid-url'
      };

      const response = await request(app)
        .post('/api/valdor/extract-menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should require URL or image input', async () => {
      const emptyPayload = {};

      const response = await request(app)
        .post('/api/valdor/extract-menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(emptyPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('URL, image path, or image URL is required');
    });
  });

  describe('POST /api/valdor/scrape-website', () => {
    it('should scrape Valampuri website and save to database', async () => {
      const response = await request(app)
        .post('/api/valdor/scrape-website')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalScraped).toBeGreaterThan(0);
      expect(response.body.data.newItems).toBeGreaterThanOrEqual(0);
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.items).toBeInstanceOf(Array);
    }, 60000); // Extended timeout for scraping

    it('should handle duplicate items gracefully', async () => {
      // First scrape
      await request(app)
        .post('/api/valdor/scrape-website')
        .set('Authorization', `Bearer ${adminToken}`);

      // Second scrape should not create duplicates
      const response = await request(app)
        .post('/api/valdor/scrape-website')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // New items count should be 0 (all duplicates)
      expect(response.body.data.newItems).toBe(0);
      expect(response.body.data.totalScraped).toBeGreaterThan(0);
    });
  });

  describe('AI Extractor Service Unit Tests', () => {
    let extractor;

    beforeAll(() => {
      extractor = new AIMenuExtractor();
    });

    describe('URL Validation', () => {
      it('should identify valid URLs', () => {
        expect(extractor.isUrl('https://valampuri.foodorders.lk/')).toBe(true);
        expect(extractor.isUrl('http://example.com')).toBe(true);
        expect(extractor.isUrl('not-a-url')).toBe(false);
      });

      it('should identify image URLs', () => {
        expect(extractor.isImageUrl('https://example.com/image.jpg')).toBe(true);
        expect(extractor.isImageUrl('https://example.com/image.png')).toBe(true);
        expect(extractor.isImageUrl('https://example.com/document.pdf')).toBe(false);
      });

      it('should identify image files', () => {
        expect(extractor.isImageFile('/path/to/image.jpg')).toBe(true);
        expect(extractor.isImageFile('menu.png')).toBe(true);
        expect(extractor.isImageFile('document.pdf')).toBe(false);
      });
    });

    describe('Food Schema Validation', () => {
      it('should validate complete food objects', () => {
        const validFoods = [
          {
            name: 'Chicken Lamprais',
            category: 'Lunch',
            price: 950,
            description: 'Traditional Sri Lankan dish',
            ingredients: ['Rice', 'Chicken'],
            allergens: ['Egg'],
            dietaryTags: ['Non-Vegetarian'],
            preparationTimeMinutes: 40,
            seasonal: false,
            isAvailable: true,
            sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
          }
        ];

        const validated = extractor.validateFoodSchema(validFoods);
        expect(validated).toHaveLength(1);
        expect(validated[0].name).toBe('Chicken Lamprais');
      });

      it('should filter out invalid food objects', () => {
        const invalidFoods = [
          { name: '', price: 100 }, // Missing category
          { category: 'Lunch', price: 100 }, // Missing name
          { name: 'Test', category: 'Lunch', price: -10 }, // Negative price
          { name: 'Test', category: 'Invalid', price: 100 } // Invalid category
        ];

        const validated = extractor.validateFoodSchema(invalidFoods);
        expect(validated).toHaveLength(0);
      });

      it('should enrich incomplete food objects', () => {
        const incompleteFoods = [
          {
            name: 'Test Food',
            category: 'Lunch',
            price: 25
          }
        ];

        const validated = extractor.validateFoodSchema(incompleteFoods);
        expect(validated).toHaveLength(1);
        expect(validated[0].description).toBeDefined();
        expect(validated[0].ingredients).toEqual([]);
        expect(validated[0].allergens).toEqual([]);
        expect(validated[0].dietaryTags).toEqual([]);
        expect(validated[0].preparationTimeMinutes).toBeDefined();
        expect(validated[0].sentimentBreakdown).toEqual({
          positive: 0,
          neutral: 0,
          negative: 0
        });
      });
    });

    describe('Categorization Logic', () => {
      it('should categorize foods correctly', () => {
        expect(extractor.categorizeBasic('Chicken Lamprais')).toBe('Lunch');
        expect(extractor.categorizeBasic('Idli with Sambar')).toBe('Breakfast');
        expect(extractor.categorizeBasic('Chicken Shawarma')).toBe('Snacks');
        expect(extractor.categorizeBasic('Fresh Lime Juice')).toBe('Beverage');
        expect(extractor.categorizeBasic('Watalappan')).toBe('Dessert');
      });

      it('should estimate preparation times', () => {
        expect(extractor.estimatePreparationTime('Chicken Lamprais', 'Lunch')).toBe(45);
        expect(extractor.estimatePreparationTime('Chicken Shawarma', 'Snacks')).toBe(20);
        expect(extractor.estimatePreparationTime('Fresh Lime Juice', 'Beverage')).toBe(5);
      });
    });

    describe('Ingredient and Allergen Extraction', () => {
      it('should generate ingredients based on food name', () => {
        const chickenIngredients = extractor.generateIngredients('Chicken Lamprais');
        expect(chickenIngredients).toContain('Chicken');

        const riceIngredients = extractor.generateIngredients('Vegetable Rice');
        expect(riceIngredients).toContain('Rice');
      });

      it('should identify allergens', () => {
        const eggAllergens = extractor.generateAllergens('Egg Hoppers');
        expect(eggAllergens).toContain('Egg');

        const dairyAllergens = extractor.generateAllergens('Cheese Sandwich');
        expect(dairyAllergens).toContain('Dairy');
      });

      it('should generate dietary tags', () => {
        const vegTags = extractor.generateDietaryTags('Vegetable Curry');
        expect(vegTags).toContain('Vegetarian');

        const nonVegTags = extractor.generateDietaryTags('Chicken Biryani');
        expect(nonVegTags).toContain('Non-Vegetarian');

        const spicyTags = extractor.generateDietaryTags('Spicy Chicken Curry');
        expect(spicyTags).toContain('Spicy');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      const extractPayload = {
        url: 'https://httpstat.us/504' // Always returns 504
      };

      const response = await request(app)
        .post('/api/valdor/extract-menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(extractPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid image files', async () => {
      // This would require mocking file upload
      // For now, just test the validation
      const extractor = new AIMenuExtractor();

      expect(extractor.isImageFile('document.pdf')).toBe(false);
      expect(extractor.isImageFile('menu.jpg')).toBe(true);
    });

    it('should handle Wikipedia enrichment failures gracefully', async () => {
      const extractor = new AIMenuExtractor();

      // Test with a non-existent food name
      const enriched = await extractor.enrichWithWikipedia([{
        name: 'NonExistentFoodItem12345',
        category: 'Lunch',
        price: 25,
        ingredients: [],
        allergens: [],
        dietaryTags: []
      }]);

      expect(enriched).toHaveLength(1);
      expect(enriched[0].ingredients).toEqual([]); // Should remain empty
      expect(enriched[0].allergens).toEqual([]); // Should remain empty
    });
  });

  describe('OCR and Vision Analysis Mocks', () => {
    it('should handle OCR failures gracefully', async () => {
      // Mock OCR failure
      const mockOCR = jest.spyOn(AIMenuExtractor.prototype, 'performOCR')
        .mockRejectedValue(new Error('OCR service unavailable'));

      const extractor = new AIMenuExtractor();

      const result = await extractor.extractFromImage('/fake/path/image.jpg');

      expect(result).toBeDefined();
      // Should still return a result even with OCR failure

      mockOCR.mockRestore();
    });

    it('should handle vision analysis failures gracefully', async () => {
      // Mock vision failure
      const mockVision = jest.spyOn(AIMenuExtractor.prototype, 'performVisionAnalysis')
        .mockRejectedValue(new Error('Vision service unavailable'));

      const extractor = new AIMenuExtractor();

      const result = await extractor.extractFromImage('/fake/path/image.jpg');

      expect(result).toBeDefined();
      // Should still return a result

      mockVision.mockRestore();
    });
  });
});
