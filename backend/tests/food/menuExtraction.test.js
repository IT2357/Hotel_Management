import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import AIJaffnaTrainer from '../../../services/aiJaffnaTrainer.js';
import OCRService from '../../../services/ocrService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Jaffna Menu Extraction Tests', () => {
  let jaffnaTrainer;
  let ocrService;

  beforeAll(async () => {
    // Initialize services
    jaffnaTrainer = new AIJaffnaTrainer();
    ocrService = OCRService;
    
    // Initialize OCR service
    await ocrService.initialize();
  });

  afterAll(async () => {
    // Cleanup
    await jaffnaTrainer.cleanup();
    await ocrService.cleanup();
  });

  beforeEach(() => {
    // Reset any state before each test
  });

  describe('AI Jaffna Trainer', () => {
    it('should initialize Tesseract worker with Tamil support', async () => {
      const result = await jaffnaTrainer.initializeWorker();
      expect(result).toBe(true);
    });

    it('should parse Tamil dish names correctly', () => {
      const testText = 'நண்டு கறி LKR 1200\nஅப்பம் LKR 80\nமீன் கறி LKR 600';
      const result = jaffnaTrainer.parseMenuText(testText);
      
      expect(result.totalItems).toBe(3);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].items[0].tamilName).toBe('நண்டு கறி');
      expect(result.categories[0].items[0].englishName).toBe('Jaffna Crab Curry');
      expect(result.categories[0].items[0].price).toBe(1140); // 1200 * 0.95
    });

    it('should detect spice level correctly', () => {
      const spicyDish = 'நண்டு கறி காரம் LKR 1200';
      const mildDish = 'அப்பம் LKR 80';
      
      const spicyResult = jaffnaTrainer.detectSpiceLevel(spicyDish);
      const mildResult = jaffnaTrainer.detectSpiceLevel(mildDish);
      
      expect(spicyResult).toBe(true);
      expect(mildResult).toBe(false);
    });

    it('should detect vegetarian dishes correctly', () => {
      const vegDish = 'அப்பம் LKR 80';
      const nonVegDish = 'நண்டு கறி LKR 1200';
      
      const vegResult = jaffnaTrainer.detectVegetarian(vegDish);
      const nonVegResult = jaffnaTrainer.detectVegetarian(nonVegDish);
      
      expect(vegResult).toBe(true);
      expect(nonVegResult).toBe(false);
    });

    it('should extract ingredients from dish names', () => {
      const dishName = 'நண்டு கறி with coconut milk and curry leaves';
      const ingredients = jaffnaTrainer.extractIngredients(dishName);
      
      expect(ingredients).toContain('coconut');
      expect(ingredients).toContain('curry leaves');
    });

    it('should calculate confidence scores correctly', () => {
      const jaffnaDish = {
        tamil: 'நண்டு கறி',
        english: 'Jaffna Crab Curry'
      };
      
      const exactMatch = jaffnaTrainer.calculateDishConfidence('நண்டு கறி', jaffnaDish);
      const partialMatch = jaffnaTrainer.calculateDishConfidence('Crab Curry', jaffnaDish);
      const noMatch = jaffnaTrainer.calculateDishConfidence('Unknown Dish', null);
      
      expect(exactMatch).toBeGreaterThan(0.9);
      expect(partialMatch).toBeGreaterThan(0.5);
      expect(noMatch).toBeLessThan(0.5);
    });
  });

  describe('OCR Service', () => {
    it('should initialize OCR service', async () => {
      expect(ocrService.isInitialized).toBe(true);
    });

    it('should parse menu text with Tamil and English', () => {
      const testText = `
        Rice Dishes
        நண்டு கறி LKR 1200
        ஆட்டுக்கறி LKR 800
        மீன் கறி LKR 600
        
        Bread
        அப்பம் LKR 80
        இடியாப்பம் LKR 120
      `;
      
      const result = ocrService.parseMenuText(testText);
      
      expect(result.totalItems).toBe(5);
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('Rice Dishes');
      expect(result.categories[1].name).toBe('Bread');
    });

    it('should detect category headers correctly', () => {
      const categoryHeaders = [
        'Rice Dishes',
        'கறி',
        'Bread',
        'ரொட்டி',
        'Breakfast',
        'காலை'
      ];
      
      categoryHeaders.forEach(header => {
        expect(ocrService.isCategoryHeader(header)).toBe(true);
      });
    });

    it('should extract category names correctly', () => {
      const testCases = [
        { input: 'Rice Dishes', expected: 'Rice' },
        { input: 'கறி', expected: 'Curries' },
        { input: 'Bread', expected: 'Bread' },
        { input: 'ரொட்டி', expected: 'Bread' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(ocrService.extractCategory(input)).toBe(expected);
      });
    });

    it('should extract dish information correctly', () => {
      const testLine = 'நண்டு கறி LKR 1200';
      const result = ocrService.extractDishInfo(testLine, 'Curries');
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('நண்டு கறி');
      expect(result.price).toBe(1140); // 1200 * 0.95
      expect(result.category).toBe('Curries');
      expect(result.isTamil).toBe(true);
    });

    it('should find Jaffna dishes correctly', () => {
      const testDishes = [
        'நண்டு கறி',
        'Jaffna Crab Curry',
        'அப்பம்',
        'Hoppers'
      ];
      
      testDishes.forEach(dishName => {
        const result = ocrService.findJaffnaDish(dishName);
        expect(result).toBeTruthy();
      });
    });

    it('should detect dietary tags correctly', () => {
      const testDishes = [
        { name: 'நண்டு கறி', expectedTags: ['Spicy'] },
        { name: 'அப்பம்', expectedTags: ['Vegetarian'] },
        { name: 'Halal Chicken Curry', expectedTags: ['Halal', 'Spicy'] }
      ];
      
      testDishes.forEach(({ name, expectedTags }) => {
        const tags = ocrService.extractDietaryTags(name);
        expectedTags.forEach(tag => {
          expect(tags).toContain(tag);
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should process a complete Jaffna menu', async () => {
      const menuText = `
        Jaffna Restaurant Menu
        
        Rice Dishes
        நண்டு கறி (Jaffna Crab Curry) LKR 1200
        ஆட்டுக்கறி (Mutton Curry) LKR 800
        மீன் கறி (Fish Curry) LKR 600
        கத்தரிக்கை கறி (Brinjal Curry) LKR 300
        
        Bread
        அப்பம் (Hoppers) LKR 80
        இடியாப்பம் (String Hoppers) LKR 120
        புட்டு (Puttu) LKR 100
        
        Breakfast
        இட்லி (Idli) LKR 60
        தோசை (Dosa) LKR 80
        வடை (Vadai) LKR 40
      `;
      
      const result = ocrService.parseMenuText(menuText);
      
      expect(result.totalItems).toBe(10);
      expect(result.categories).toHaveLength(3);
      
      // Check specific dishes
      const crabCurry = result.categories[0].items.find(item => 
        item.tamilName === 'நண்டு கறி'
      );
      expect(crabCurry).toBeTruthy();
      expect(crabCurry.price).toBe(1140); // 1200 * 0.95
      expect(crabCurry.isSpicy).toBe(true);
      
      const hoppers = result.categories[1].items.find(item => 
        item.tamilName === 'அப்பம்'
      );
      expect(hoppers).toBeTruthy();
      expect(hoppers.price).toBe(76); // 80 * 0.95
      expect(hoppers.isVegetarian).toBe(true);
    });

    it('should handle mixed Tamil and English menus', () => {
      const mixedMenu = `
        Main Course
        Jaffna Crab Curry (நண்டு கறி) LKR 1200
        Mutton Curry (ஆட்டுக்கறி) LKR 800
        Fish Curry (மீன் கறி) LKR 600
        
        Bread Items
        Hoppers (அப்பம்) LKR 80
        String Hoppers (இடியாப்பம்) LKR 120
      `;
      
      const result = ocrService.parseMenuText(mixedMenu);
      
      expect(result.totalItems).toBe(5);
      
      // Check that both Tamil and English names are preserved
      const crabCurry = result.categories[0].items.find(item => 
        item.name.includes('Jaffna Crab Curry')
      );
      expect(crabCurry).toBeTruthy();
      expect(crabCurry.tamilName).toBe('நண்டு கறி');
      expect(crabCurry.englishName).toBe('Jaffna Crab Curry');
    });

    it('should validate menu structure correctly', () => {
      const validMenu = {
        categories: [
          {
            name: 'Curries',
            items: [
              {
                name: 'Test Curry',
                price: 500,
                category: 'Curries',
                isAvailable: true,
                confidence: 0.8
              }
            ]
          }
        ]
      };
      
      const result = ocrService.validateMenuStructure(validMenu.categories);
      
      expect(result).toHaveLength(1);
      expect(result[0].items[0].name).toBe('Test Curry');
      expect(result[0].items[0].confidence).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty text gracefully', () => {
      const result = jaffnaTrainer.parseMenuText('');
      expect(result.totalItems).toBe(0);
      expect(result.categories).toHaveLength(0);
    });

    it('should handle invalid price formats', () => {
      const invalidPriceText = 'Test Dish Invalid Price';
      const result = jaffnaTrainer.parseMenuText(invalidPriceText);
      expect(result.totalItems).toBe(0);
    });

    it('should handle missing category headers', () => {
      const noCategoryText = 'Dish 1 LKR 100\nDish 2 LKR 200';
      const result = jaffnaTrainer.parseMenuText(noCategoryText);
      expect(result.totalItems).toBe(2);
      expect(result.categories[0].name).toBe('Main Course'); // Default category
    });
  });

  describe('Performance Tests', () => {
    it('should process large menu within reasonable time', () => {
      const largeMenu = Array.from({ length: 100 }, (_, i) => 
        `Dish ${i} LKR ${100 + i * 10}`
      ).join('\n');
      
      const startTime = Date.now();
      const result = jaffnaTrainer.parseMenuText(largeMenu);
      const endTime = Date.now();
      
      expect(result.totalItems).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
