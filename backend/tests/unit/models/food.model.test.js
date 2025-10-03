// 📁 backend/tests/unit/models/food.model.test.js
import Food from '../../../models/Food.js';

describe('Food Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid Food document', () => {
      const foodData = {
        name: 'Chicken Lamprais',
        category: 'Lunch',
        description: 'Chicken lamprais with rice, egg and accompaniments',
        imageUrl: 'https://valampuri.foodorders.lk/images/food/phpf3MSqd.jpg',
        price: 950,
        preparationTimeMinutes: 40,
        ingredients: ['Rice', 'Chicken', 'Egg', 'Sambol', 'Spices'],
        allergens: ['Egg'],
        dietaryTags: ['Non-Vegetarian', 'Spicy'],
        seasonal: false,
        isAvailable: true,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
      };

      const food = new Food(foodData);
      const validationError = food.validateSync();

      expect(validationError).toBeUndefined();
      expect(food.name).toBe('Chicken Lamprais');
      expect(food.category).toBe('Lunch');
      expect(food.price).toBe(950);
      expect(food.isAvailable).toBe(true);
    });

    it('should require name, price, and category', () => {
      const invalidFood = new Food({});

      const validationError = invalidFood.validateSync();

      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.price).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
    });

    it('should validate category enum values', () => {
      const invalidCategoryFood = new Food({
        name: 'Test Food',
        price: 10,
        category: 'InvalidCategory'
      });

      const validationError = invalidCategoryFood.validateSync();

      expect(validationError.errors.category).toBeDefined();
    });

    it('should validate price is non-negative', () => {
      const negativePriceFood = new Food({
        name: 'Test Food',
        category: 'Lunch',
        price: -10
      });

      const validationError = negativePriceFood.validateSync();

      expect(validationError.errors.price).toBeDefined();
    });

    it('should have default sentimentBreakdown', () => {
      const food = new Food({
        name: 'Test Food',
        category: 'Lunch',
        price: 25,
        description: 'Test description'
      });

      expect(food.sentimentBreakdown).toEqual({
        positive: 0,
        neutral: 0,
        negative: 0
      });
    });

    it('should validate arrays are properly typed', () => {
      const food = new Food({
        name: 'Test Food',
        category: 'Lunch',
        price: 25,
        ingredients: ['Rice', 'Chicken', 'Spices'],
        allergens: ['Egg', 'Dairy'],
        dietaryTags: ['Non-Vegetarian']
      });

      expect(Array.isArray(food.ingredients)).toBe(true);
      expect(Array.isArray(food.allergens)).toBe(true);
      expect(Array.isArray(food.dietaryTags)).toBe(true);
      expect(food.ingredients).toContain('Rice');
      expect(food.allergens).toContain('Egg');
    });

    it('should handle optional fields correctly', () => {
      const minimalFood = new Food({
        name: 'Minimal Food',
        category: 'Snack',
        price: 15
      });

      expect(minimalFood.description).toBeUndefined();
      expect(minimalFood.imageUrl).toBeUndefined();
      expect(minimalFood.preparationTimeMinutes).toBeUndefined();
      expect(minimalFood.ingredients).toEqual([]);
      expect(minimalFood.allergens).toEqual([]);
      expect(minimalFood.dietaryTags).toEqual([]);
      // These now have defaults
      expect(minimalFood.seasonal).toBe(false);
      expect(minimalFood.isAvailable).toBe(true);
    });
  });

  describe('Schema Structure', () => {
    it('should have all required schema fields', () => {
      const food = new Food({
        name: 'Test Food',
        category: 'Lunch',
        price: 25,
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
        preparationTimeMinutes: 30,
        ingredients: ['Ingredient 1'],
        allergens: ['Allergen 1'],
        dietaryTags: ['Tag 1'],
        seasonal: false,
        isAvailable: true,
        sentimentBreakdown: { positive: 1, neutral: 2, negative: 3 }
      });

      // Check all fields are present (timestamps are only set after saving)
      expect(food.name).toBeDefined();
      expect(food.category).toBeDefined();
      expect(food.price).toBeDefined();
      expect(food.description).toBeDefined();
      expect(food.imageUrl).toBeDefined();
      expect(food.preparationTimeMinutes).toBeDefined();
      expect(food.ingredients).toBeDefined();
      expect(food.allergens).toBeDefined();
      expect(food.dietaryTags).toBeDefined();
      expect(food.seasonal).toBeDefined();
      expect(food.isAvailable).toBeDefined();
      expect(food.sentimentBreakdown).toBeDefined();
      // Timestamps are undefined until saved
      expect(food.createdAt).toBeUndefined();
      expect(food.updatedAt).toBeUndefined();
    });

    it('should match exact schema field types', () => {
      const food = new Food({
        name: 'Test Food',
        category: 'Lunch',
        price: 25.99,
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
        preparationTimeMinutes: 30,
        ingredients: ['Ingredient 1', 'Ingredient 2'],
        allergens: ['Allergen 1'],
        dietaryTags: ['Tag 1'],
        seasonal: false,
        isAvailable: true,
        sentimentBreakdown: { positive: 1, neutral: 2, negative: 3 }
      });

      // Type checks (timestamps are undefined until saved)
      expect(typeof food.name).toBe('string');
      expect(typeof food.category).toBe('string');
      expect(typeof food.price).toBe('number');
      expect(typeof food.description).toBe('string');
      expect(typeof food.imageUrl).toBe('string');
      expect(typeof food.preparationTimeMinutes).toBe('number');
      expect(Array.isArray(food.ingredients)).toBe(true);
      expect(Array.isArray(food.allergens)).toBe(true);
      expect(Array.isArray(food.dietaryTags)).toBe(true);
      expect(typeof food.seasonal).toBe('boolean');
      expect(typeof food.isAvailable).toBe('boolean');
      expect(typeof food.sentimentBreakdown).toBe('object');
      expect(food.createdAt).toBeUndefined();
      expect(food.updatedAt).toBeUndefined();
    });
  });

  describe('Category Enum Validation', () => {
    const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'];

    validCategories.forEach(category => {
      it(`should accept "${category}" as a valid category`, () => {
        const food = new Food({
          name: 'Test Food',
          category: category,
          price: 25
        });

        const validationError = food.validateSync();
        expect(validationError).toBeUndefined();
      });
    });

    it('should reject invalid categories', () => {
      const invalidCategories = ['Appetizer', 'Main Course', 'Drinks', 'Invalid'];

      invalidCategories.forEach(category => {
        const food = new Food({
          name: 'Test Food',
          category: category,
          price: 25
        });

        const validationError = food.validateSync();
        expect(validationError.errors.category).toBeDefined();
      });
    });
  });

  describe('Price Validation', () => {
    it('should accept valid prices', () => {
      const validPrices = [0, 1, 10.99, 100, 999.99];

      validPrices.forEach(price => {
        const food = new Food({
          name: 'Test Food',
          category: 'Lunch',
          price: price
        });

        const validationError = food.validateSync();
        expect(validationError).toBeUndefined();
      });
    });

    it('should reject negative prices', () => {
      const negativePrices = [-1, -10.99, -100];

      negativePrices.forEach(price => {
        const food = new Food({
          name: 'Test Food',
          category: 'Lunch',
          price: price
        });

        const validationError = food.validateSync();
        expect(validationError.errors.price).toBeDefined();
      });
    });
  });
});
