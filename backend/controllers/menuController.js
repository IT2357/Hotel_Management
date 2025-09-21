import MenuItem from '../models/MenuItem.js';
import { Storage } from '@google-cloud/storage';
import vision from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import geminiService from '../services/external/geminiService.js';
import ImageUtils from '../utils/imageUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Google Cloud clients
let storage, visionClient, bucket;

try {
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (credentials && projectId) {
    // Parse credentials if it's a JSON string
    let credentialsObj;
    try {
      credentialsObj = JSON.parse(credentials);
    } catch (parseError) {
      console.warn('GOOGLE_APPLICATION_CREDENTIALS is not valid JSON, treating as file path');
      credentialsObj = credentials;
    }

    storage = new Storage({
      credentials: credentialsObj,
      projectId: projectId
    });

    visionClient = new vision.ImageAnnotatorClient({
      credentials: credentialsObj,
      projectId: projectId
    });

    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    if (bucketName) {
      bucket = storage.bucket(bucketName);
    }

    console.log('✅ Google Cloud services initialized successfully');
  } else {
    console.warn('⚠️ Google Cloud credentials not found. Image processing will not work.');
    console.warn('Required environment variables: GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT_ID');
  }
} catch (error) {
  console.error('❌ Error initializing Google Cloud services:', error.message);
}

// Process menu image and extract items
const processMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    if (!visionClient || !bucket) {
      return res.status(501).json({ 
        success: false, 
        message: 'Image processing is not available. Google Cloud services are not properly configured.' 
      });
    }

    const imagePath = req.file.path;
    
    // Upload image to Google Cloud Storage
    const fileName = `menu-uploads/${uuidv4()}${path.extname(req.file.originalname)}`;
    const file = bucket.file(fileName);

    await bucket.upload(imagePath, {
      destination: file,
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      }
    });

    // Make the file public
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Process image with Google Cloud Vision for OCR
    const [result] = await visionClient.textDetection(imageUrl);
    const ocrText = result.fullTextAnnotation?.text || '';

    // Use Gemini AI for enhanced image analysis
    let geminiDescription = '';
    let enhancedItems = [];

    if (geminiService.isConfigured()) {
      try {
        // Generate detailed description using Gemini AI
        geminiDescription = await geminiService.generateImageDescription(imageUrl, 'url');

        // Generate enhanced menu items using Gemini AI
        enhancedItems = await geminiService.generateMenuItemsFromDescription(
          geminiDescription,
          {
            cuisineType: 'General', // Could be made configurable
            dietaryRestrictions: []
          }
        );
      } catch (geminiError) {
        console.warn('Gemini AI processing failed, falling back to OCR only:', geminiError.message);
      }
    }

    // Parse menu items from OCR text as fallback
    const ocrItems = parseMenuItemsFromText(ocrText);

    // Combine results - prefer Gemini AI results if available
    const items = enhancedItems.length > 0 ? enhancedItems : ocrItems;

    // Clean up the uploaded file
    fs.unlinkSync(imagePath);

    res.status(200).json({
      success: true,
      items,
      ocrText,
      geminiDescription: geminiDescription || null,
      imageUrl,
      processingMethod: enhancedItems.length > 0 ? 'gemini_ai' : 'ocr_only'
    });

  } catch (error) {
    console.error('Error processing menu image:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing menu image',
      error: error.message
    });
  }
};

// Parse menu items from extracted text
function parseMenuItemsFromText(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const items = [];

  // Enhanced regex patterns
  const priceRegex = /\$?\d+(?:\.\d{1,2})?/;
  const categoryRegex = /^(?:Appetizers|Starters|Mains|Main Course|Entrees|Desserts|Beverages|Drinks|Soups|Salads|Sandwiches|Pasta|Pizzas?|Burgers?|Grilled|Fried|Vegetarian|Vegan|Non-Veg|Meat|Chicken|Beef|Pork|Fish|Seafood)/i;
  const vegKeywords = /\b(veg|vegetarian|plant-based|vegan|meat-free)\b/i;
  const spicyKeywords = /\b(spicy|hot|chili|jalapeno|pepper|curry)\b/i;

  let currentCategory = 'Uncategorized';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line is a category header
    const categoryMatch = line.match(categoryRegex);
    if (categoryMatch && !line.match(priceRegex)) {
      currentCategory = categoryMatch[0];
      continue;
    }

    // Look for price in the line
    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0].replace(/[^0-9.]/g, ''));
      const namePart = line.substring(0, priceMatch.index).trim();
      const descriptionPart = line.substring(priceMatch.index + priceMatch[0].length).trim();

      if (namePart) {
        // Extract additional information
        const isVeg = vegKeywords.test(namePart) || vegKeywords.test(descriptionPart);
        const isSpicy = spicyKeywords.test(namePart) || spicyKeywords.test(descriptionPart);

        // Try to extract ingredients from description
        const ingredients = [];
        const ingredientMatch = descriptionPart.match(/(?:with|contains|made with|including) ([^.,]+)/i);
        if (ingredientMatch) {
          ingredients.push(...ingredientMatch[1].split(',').map(i => i.trim()));
        }

        // Try to extract cooking time
        const timeMatch = descriptionPart.match(/(\d+)\s*(?:min|minute|hour)/i);
        const cookingTime = timeMatch ? parseInt(timeMatch[1]) : 15;

        items.push({
          name: namePart,
          price,
          description: descriptionPart || '',
          category: currentCategory,
          image: '', // Will be set from uploaded image or default
          isAvailable: true,
          isVeg,
          isSpicy,
          isPopular: false,
          ingredients,
          cookingTime,
          nutritionalInfo: {
            calories: '',
            protein: '',
            carbs: '',
            fat: ''
          }
        });
      }
    }
  }

  return items.length > 0 ? items : [{
    name: 'Sample Item',
    price: 9.99,
    description: 'This is a sample menu item. The OCR extraction needs to be fine-tuned for your menu format.',
    category: 'Sample Category',
    image: '',
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Sample ingredients'],
    cookingTime: 15,
    nutritionalInfo: {
      calories: 250,
      protein: 15,
      carbs: 30,
      fat: 10
    }
  }];
}

// Create multiple menu items at once
const createBatchMenuItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    // Validate and process each item
    const validItems = items.filter(item =>
      item.name &&
      (item.price !== undefined && item.price !== null)
    );

    if (validItems.length === 0) {
      return res.status(400).json({
        message: 'No valid items provided. Each item must have at least a name and price.'
      });
    }

    // Generate slugs for items that don't have them
    const itemsWithSlugs = validItems.map(item => {
      if (!item.slug) {
        // Generate slug from name
        let slug = item.name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .trim()
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

        // If slug is empty after cleaning, generate a fallback
        if (!slug) {
          slug = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        item.slug = slug;
      }
      return item;
    });

    // Save items to database
    const savedItems = await MenuItem.insertMany(itemsWithSlugs);

    res.status(201).json({
      success: true,
      count: savedItems.length,
      items: savedItems
    });

  } catch (error) {
    console.error('Error creating batch menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu items',
      error: error.message
    });
  }
};

const generateMenuItems = async (req, res) => {
  try {
    const { cuisineType, dietaryRestrictions, numberOfItems } = req.body;

    console.log('🔄 Menu generation request:', { cuisineType, dietaryRestrictions, numberOfItems });

    if (!cuisineType) {
      return res.status(400).json({
        success: false,
        message: 'Cuisine type is required'
      });
    }

    const numItems = Math.min(parseInt(numberOfItems) || 5, 20);

    // Check if Gemini AI is configured
    if (!geminiService.isConfigured()) {
      // Provide fallback items when AI is not available
      const fallbackTemplates = {
        'Indian': [
          { name: 'Butter Chicken', description: 'Tender chicken pieces cooked in rich, creamy tomato-based curry', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: true, ingredients: ['chicken', 'tomatoes', 'cream', 'butter', 'spices'] },
          { name: 'Vegetable Samosa', description: 'Crispy pastry filled with spiced potatoes and peas', category: 'Appetizers', price: 5.99, isVeg: true, isSpicy: false, ingredients: ['potatoes', 'peas', 'pastry', 'spices'] },
          { name: 'Naan Bread', description: 'Soft, fluffy flatbread baked in tandoor oven', category: 'Sides', price: 3.99, isVeg: true, isSpicy: false, ingredients: ['flour', 'yogurt', 'yeast', 'butter'] }
        ],
        'Italian': [
          { name: 'Margherita Pizza', description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil', category: 'Main Course', price: 12.99, isVeg: true, isSpicy: false, ingredients: ['dough', 'tomato sauce', 'mozzarella', 'basil'] },
          { name: 'Spaghetti Carbonara', description: 'Pasta with eggs, cheese, pancetta, and black pepper', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: false, ingredients: ['spaghetti', 'eggs', 'pancetta', 'parmesan', 'black pepper'] },
          { name: 'Tiramisu', description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', category: 'Desserts', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['ladyfingers', 'mascarpone', 'coffee', 'cocoa', 'eggs'] }
        ],
        'Chinese': [
          { name: 'Sweet and Sour Chicken', description: 'Crispy chicken pieces in a tangy sweet and sour sauce', category: 'Main Course', price: 13.99, isVeg: false, isSpicy: false, ingredients: ['chicken', 'bell peppers', 'pineapple', 'vinegar', 'sugar'] },
          { name: 'Vegetable Spring Rolls', description: 'Crispy rolls filled with mixed vegetables and served with dipping sauce', category: 'Appetizers', price: 5.99, isVeg: true, isSpicy: false, ingredients: ['cabbage', 'carrots', 'mushrooms', 'spring roll wrappers'] },
          { name: 'Fried Rice', description: 'Wok-fried rice with eggs, vegetables, and your choice of protein', category: 'Main Course', price: 9.99, isVeg: false, isSpicy: false, ingredients: ['rice', 'eggs', 'mixed vegetables', 'soy sauce'] }
        ],
        'General': [
          { name: 'Signature Dish', description: 'A delicious dish prepared with fresh ingredients', category: 'Main Course', price: 15.99, isVeg: false, isSpicy: false, ingredients: ['fresh ingredients', 'seasonal vegetables', 'premium spices'] },
          { name: 'Chef\'s Special', description: 'Our chef\'s special creation with unique flavors', category: 'Main Course', price: 18.99, isVeg: false, isSpicy: false, ingredients: ['premium ingredients', 'chef\'s special sauce', 'fresh herbs'] },
          { name: 'House Salad', description: 'Fresh mixed greens with seasonal vegetables and house dressing', category: 'Appetizers', price: 8.99, isVeg: true, isSpicy: false, ingredients: ['mixed greens', 'tomatoes', 'cucumbers', 'house dressing'] }
        ]
      };

      const availableItems = fallbackTemplates[cuisineType] || fallbackTemplates['General'];

      // Filter by dietary restrictions if specified
      let filteredItems = availableItems;
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        filteredItems = availableItems.filter(item => {
          if (dietaryRestrictions.includes('vegetarian') && !item.isVeg) return false;
          if (dietaryRestrictions.includes('vegan') && !item.isVeg) return false; // Simplified - in real implementation, you'd check for animal products
          if (dietaryRestrictions.includes('gluten-free') && item.ingredients.some(ing => ing.toLowerCase().includes('flour') || ing.toLowerCase().includes('bread'))) return false;
          return true;
        });
      }

      // Randomly select items
      const selectedItems = [];
      const shuffled = [...filteredItems].sort(() => 0.5 - Math.random());

      for (let i = 0; i < Math.min(numItems, shuffled.length); i++) {
        const item = { ...shuffled[i] };
        item.cookingTime = Math.floor(Math.random() * 20) + 10; // Random cooking time between 10-30 minutes
        item.nutritionalInfo = {
          calories: Math.floor(Math.random() * 400) + 200,
          protein: Math.floor(Math.random() * 30) + 5,
          carbs: Math.floor(Math.random() * 50) + 10,
          fat: Math.floor(Math.random() * 25) + 5
        };
        selectedItems.push(item);
      }

      return res.status(200).json({
        success: true,
        items: selectedItems,
        message: `Generated ${selectedItems.length} menu items for ${cuisineType} cuisine (using fallback)`,
        fallback: true
      });
    }

    // Sample menu items based on cuisine type
    const menuTemplates = {
      'Indian': [
        { name: 'Butter Chicken', description: 'Tender chicken pieces cooked in rich, creamy tomato-based curry', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: true, ingredients: ['chicken', 'tomatoes', 'cream', 'butter', 'spices'] },
        { name: 'Paneer Tikka Masala', description: 'Grilled paneer cubes in a spicy, creamy tomato sauce', category: 'Main Course', price: 12.99, isVeg: true, isSpicy: true, ingredients: ['paneer', 'tomatoes', 'cream', 'onions', 'spices'] },
        { name: 'Chicken Biryani', description: 'Aromatic basmati rice cooked with tender chicken and traditional spices', category: 'Main Course', price: 13.99, isVeg: false, isSpicy: true, ingredients: ['chicken', 'basmati rice', 'onions', 'spices', 'yogurt'] },
        { name: 'Vegetable Samosa', description: 'Crispy pastry filled with spiced potatoes and peas', category: 'Appetizers', price: 5.99, isVeg: true, isSpicy: false, ingredients: ['potatoes', 'peas', 'pastry', 'spices'] },
        { name: 'Dal Makhani', description: 'Slow-cooked black lentils in a creamy, buttery sauce', category: 'Main Course', price: 10.99, isVeg: true, isSpicy: false, ingredients: ['black lentils', 'cream', 'butter', 'tomatoes', 'garlic'] },
        { name: 'Naan Bread', description: 'Soft, fluffy flatbread baked in tandoor oven', category: 'Sides', price: 3.99, isVeg: true, isSpicy: false, ingredients: ['flour', 'yogurt', 'yeast', 'butter'] },
        { name: 'Gulab Jamun', description: 'Deep-fried milk dumplings soaked in rose-flavored sugar syrup', category: 'Desserts', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['milk powder', 'flour', 'sugar', 'rose water'] },
        { name: 'Masala Chai', description: 'Traditional Indian spiced tea with milk', category: 'Beverages', price: 3.99, isVeg: true, isSpicy: false, ingredients: ['tea', 'milk', 'cardamom', 'ginger', 'cinnamon'] }
      ],
      'Italian': [
        { name: 'Margherita Pizza', description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil', category: 'Main Course', price: 12.99, isVeg: true, isSpicy: false, ingredients: ['dough', 'tomato sauce', 'mozzarella', 'basil'] },
        { name: 'Spaghetti Carbonara', description: 'Pasta with eggs, cheese, pancetta, and black pepper', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: false, ingredients: ['spaghetti', 'eggs', 'pancetta', 'parmesan', 'black pepper'] },
        { name: 'Chicken Parmesan', description: 'Breaded chicken breast topped with marinara sauce and cheese', category: 'Main Course', price: 16.99, isVeg: false, isSpicy: false, ingredients: ['chicken breast', 'breadcrumbs', 'marinara', 'mozzarella', 'parmesan'] },
        { name: 'Minestrone Soup', description: 'Hearty vegetable soup with beans and pasta', category: 'Appetizers', price: 8.99, isVeg: true, isSpicy: false, ingredients: ['vegetables', 'beans', 'pasta', 'tomatoes', 'herbs'] },
        { name: 'Tiramisu', description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', category: 'Desserts', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['ladyfingers', 'mascarpone', 'coffee', 'cocoa', 'eggs'] },
        { name: 'Bruschetta', description: 'Grilled bread topped with fresh tomatoes, basil, and garlic', category: 'Appetizers', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['bread', 'tomatoes', 'basil', 'garlic', 'olive oil'] },
        { name: 'Penne Arrabbiata', description: 'Pasta in a spicy tomato sauce with garlic and red chili peppers', category: 'Main Course', price: 11.99, isVeg: true, isSpicy: true, ingredients: ['penne', 'tomatoes', 'garlic', 'chili peppers', 'olive oil'] },
        { name: 'Espresso', description: 'Strong Italian coffee served in a small cup', category: 'Beverages', price: 2.99, isVeg: true, isSpicy: false, ingredients: ['coffee beans'] }
      ],
      'Chinese': [
        { name: 'Sweet and Sour Chicken', description: 'Crispy chicken pieces in a tangy sweet and sour sauce', category: 'Main Course', price: 13.99, isVeg: false, isSpicy: false, ingredients: ['chicken', 'bell peppers', 'pineapple', 'vinegar', 'sugar'] },
        { name: 'Vegetable Spring Rolls', description: 'Crispy rolls filled with mixed vegetables and served with dipping sauce', category: 'Appetizers', price: 5.99, isVeg: true, isSpicy: false, ingredients: ['cabbage', 'carrots', 'mushrooms', 'spring roll wrappers'] },
        { name: 'Kung Pao Chicken', description: 'Spicy stir-fried chicken with peanuts and vegetables', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: true, ingredients: ['chicken', 'peanuts', 'bell peppers', 'soy sauce', 'chili peppers'] },
        { name: 'Mapo Tofu', description: 'Silken tofu in a spicy, savory sauce with fermented black beans', category: 'Main Course', price: 10.99, isVeg: true, isSpicy: true, ingredients: ['tofu', 'fermented black beans', 'garlic', 'ginger', 'chili oil'] },
        { name: 'Fried Rice', description: 'Wok-fried rice with eggs, vegetables, and your choice of protein', category: 'Main Course', price: 9.99, isVeg: false, isSpicy: false, ingredients: ['rice', 'eggs', 'mixed vegetables', 'soy sauce'] },
        { name: 'Hot and Sour Soup', description: 'Traditional soup with tofu, mushrooms, and a perfect balance of spicy and sour', category: 'Appetizers', price: 6.99, isVeg: true, isSpicy: true, ingredients: ['tofu', 'mushrooms', 'vinegar', 'chili peppers', 'eggs'] },
        { name: 'Beef with Broccoli', description: 'Tender beef stir-fried with fresh broccoli in a savory sauce', category: 'Main Course', price: 15.99, isVeg: false, isSpicy: false, ingredients: ['beef', 'broccoli', 'garlic', 'soy sauce', 'ginger'] },
        { name: 'Fortune Cookies', description: 'Crispy cookies with inspirational messages inside', category: 'Desserts', price: 2.99, isVeg: true, isSpicy: false, ingredients: ['flour', 'sugar', 'vanilla', 'eggs'] }
      ],
      'Mexican': [
        { name: 'Chicken Fajitas', description: 'Sizzling chicken strips with bell peppers and onions, served with tortillas', category: 'Main Course', price: 13.99, isVeg: false, isSpicy: true, ingredients: ['chicken', 'bell peppers', 'onions', 'lime', 'spices'] },
        { name: 'Vegetarian Burrito Bowl', description: 'Rice bowl with beans, cheese, salsa, guacamole, and fresh vegetables', category: 'Main Course', price: 11.99, isVeg: true, isSpicy: false, ingredients: ['rice', 'black beans', 'cheese', 'salsa', 'guacamole'] },
        { name: 'Beef Tacos', description: 'Three soft corn tortillas filled with seasoned ground beef and toppings', category: 'Main Course', price: 10.99, isVeg: false, isSpicy: false, ingredients: ['ground beef', 'corn tortillas', 'lettuce', 'cheese', 'tomatoes'] },
        { name: 'Guacamole and Chips', description: 'Fresh avocado dip served with crispy tortilla chips', category: 'Appetizers', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['avocados', 'tomatoes', 'onions', 'lime', 'cilantro'] },
        { name: 'Quesadilla', description: 'Grilled flour tortilla filled with cheese and your choice of fillings', category: 'Main Course', price: 9.99, isVeg: true, isSpicy: false, ingredients: ['flour tortilla', 'cheese', 'bell peppers', 'onions'] },
        { name: 'Churros', description: 'Crispy fried dough coated in cinnamon sugar, served with chocolate sauce', category: 'Desserts', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['flour', 'sugar', 'cinnamon', 'eggs', 'oil'] },
        { name: 'Margarita', description: 'Classic cocktail with tequila, lime juice, and triple sec', category: 'Beverages', price: 8.99, isVeg: true, isSpicy: false, ingredients: ['tequila', 'lime juice', 'triple sec', 'salt'] },
        { name: 'Enchiladas', description: 'Corn tortillas filled with cheese and sauce, baked until bubbly', category: 'Main Course', price: 12.99, isVeg: true, isSpicy: false, ingredients: ['corn tortillas', 'cheese', 'enchilada sauce', 'onions'] }
      ],
      'Japanese': [
        { name: 'Chicken Teriyaki', description: 'Grilled chicken glazed with sweet and savory teriyaki sauce', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: false, ingredients: ['chicken', 'soy sauce', 'mirin', 'sugar', 'ginger'] },
        { name: 'Vegetable Tempura', description: 'Lightly battered and fried seasonal vegetables', category: 'Appetizers', price: 8.99, isVeg: true, isSpicy: false, ingredients: ['mixed vegetables', 'tempura batter', 'oil'] },
        { name: 'Salmon Sashimi', description: 'Fresh raw salmon sliced and served with wasabi and soy sauce', category: 'Main Course', price: 18.99, isVeg: false, isSpicy: false, ingredients: ['salmon', 'wasabi', 'soy sauce', 'pickled ginger'] },
        { name: 'Miso Soup', description: 'Traditional soup with tofu, seaweed, and green onions in miso broth', category: 'Appetizers', price: 4.99, isVeg: true, isSpicy: false, ingredients: ['miso paste', 'tofu', 'seaweed', 'green onions'] },
        { name: 'California Roll', description: 'Sushi roll with crab, avocado, and cucumber, wrapped in seaweed and rice', category: 'Main Course', price: 9.99, isVeg: false, isSpicy: false, ingredients: ['crab', 'avocado', 'cucumber', 'sushi rice', 'seaweed'] },
        { name: 'Edamame', description: 'Steamed soybeans lightly salted, served in the pod', category: 'Appetizers', price: 5.99, isVeg: true, isSpicy: false, ingredients: ['soybeans', 'salt'] },
        { name: 'Matcha Ice Cream', description: 'Green tea flavored ice cream made with premium matcha powder', category: 'Desserts', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['matcha powder', 'cream', 'sugar', 'milk'] },
        { name: 'Green Tea', description: 'Premium Japanese green tea served hot', category: 'Beverages', price: 3.99, isVeg: true, isSpicy: false, ingredients: ['green tea leaves'] }
      ],
      'Thai': [
        { name: 'Pad Thai', description: 'Stir-fried rice noodles with eggs, tofu, bean sprouts, and peanuts', category: 'Main Course', price: 12.99, isVeg: true, isSpicy: false, ingredients: ['rice noodles', 'eggs', 'tofu', 'bean sprouts', 'peanuts'] },
        { name: 'Tom Yum Soup', description: 'Spicy and sour soup with shrimp, mushrooms, and aromatic herbs', category: 'Appetizers', price: 7.99, isVeg: false, isSpicy: true, ingredients: ['shrimp', 'mushrooms', 'lemongrass', 'lime leaves', 'chili'] },
        { name: 'Green Curry', description: 'Coconut-based curry with eggplant, bell peppers, and fresh herbs', category: 'Main Course', price: 13.99, isVeg: true, isSpicy: true, ingredients: ['coconut milk', 'green curry paste', 'eggplant', 'bell peppers', 'basil'] },
        { name: 'Spring Rolls', description: 'Fresh vegetables wrapped in rice paper, served with peanut sauce', category: 'Appetizers', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['rice paper', 'lettuce', 'carrots', 'cucumber', 'peanut sauce'] },
        { name: 'Mango Sticky Rice', description: 'Sweet sticky rice topped with fresh mango and coconut cream', category: 'Desserts', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['sticky rice', 'mango', 'coconut cream', 'sugar'] },
        { name: 'Thai Iced Tea', description: 'Sweet and creamy iced tea with condensed milk', category: 'Beverages', price: 4.99, isVeg: true, isSpicy: false, ingredients: ['black tea', 'condensed milk', 'sugar', 'evaporated milk'] },
        { name: 'Massaman Curry', description: 'Mild curry with potatoes, peanuts, and tender meat in coconut cream', category: 'Main Course', price: 14.99, isVeg: false, isSpicy: false, ingredients: ['beef', 'potatoes', 'peanuts', 'coconut cream', 'massaman paste'] },
        { name: 'Papaya Salad', description: 'Fresh green papaya salad with tomatoes, peanuts, and lime dressing', category: 'Appetizers', price: 8.99, isVeg: true, isSpicy: true, ingredients: ['green papaya', 'tomatoes', 'peanuts', 'lime', 'chili'] }
      ],
      'Mediterranean': [
        { name: 'Hummus with Pita', description: 'Creamy chickpea dip served with warm pita bread', category: 'Appetizers', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['chickpeas', 'tahini', 'lemon', 'garlic', 'olive oil'] },
        { name: 'Falafel Platter', description: 'Crispy chickpea patties served with tahini sauce and salad', category: 'Main Course', price: 11.99, isVeg: true, isSpicy: false, ingredients: ['chickpeas', 'herbs', 'spices', 'tahini', 'lettuce'] },
        { name: 'Greek Salad', description: 'Fresh tomatoes, cucumbers, olives, and feta cheese with olive oil dressing', category: 'Appetizers', price: 9.99, isVeg: true, isSpicy: false, ingredients: ['tomatoes', 'cucumbers', 'olives', 'feta cheese', 'olive oil'] },
        { name: 'Chicken Shawarma', description: 'Marinated chicken slowly roasted on a vertical spit, served with garlic sauce', category: 'Main Course', price: 13.99, isVeg: false, isSpicy: false, ingredients: ['chicken', 'yogurt', 'garlic', 'spices', 'pita bread'] },
        { name: 'Baba Ganoush', description: 'Smoky eggplant dip with tahini, garlic, and lemon juice', category: 'Appetizers', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['eggplant', 'tahini', 'lemon', 'garlic', 'olive oil'] },
        { name: 'Lamb Kebab', description: 'Grilled marinated lamb skewers served with rice and vegetables', category: 'Main Course', price: 16.99, isVeg: false, isSpicy: false, ingredients: ['lamb', 'yogurt', 'spices', 'onions', 'bell peppers'] },
        { name: 'Baklava', description: 'Sweet pastry made with layers of filo dough, nuts, and honey syrup', category: 'Desserts', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['filo dough', 'walnuts', 'honey', 'butter', 'cinnamon'] },
        { name: 'Turkish Coffee', description: 'Strong, unfiltered coffee traditionally served in small cups', category: 'Beverages', price: 3.99, isVeg: true, isSpicy: false, ingredients: ['coffee grounds', 'sugar', 'cardamom'] }
      ],
      'American': [
        { name: 'Classic Cheeseburger', description: 'Juicy beef patty with cheese, lettuce, tomato, and pickles on a sesame bun', category: 'Main Course', price: 11.99, isVeg: false, isSpicy: false, ingredients: ['ground beef', 'cheese', 'lettuce', 'tomato', 'pickles'] },
        { name: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing', category: 'Appetizers', price: 8.99, isVeg: true, isSpicy: false, ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'] },
        { name: 'Buffalo Wings', description: 'Crispy chicken wings tossed in spicy buffalo sauce, served with celery and ranch', category: 'Appetizers', price: 10.99, isVeg: false, isSpicy: true, ingredients: ['chicken wings', 'buffalo sauce', 'celery', 'ranch dressing'] },
        { name: 'Mac and Cheese', description: 'Creamy macaroni pasta baked with three types of cheese', category: 'Sides', price: 7.99, isVeg: true, isSpicy: false, ingredients: ['macaroni', 'cheddar cheese', 'mozzarella', 'parmesan', 'milk'] },
        { name: 'BBQ Ribs', description: 'Slow-cooked pork ribs glazed with tangy barbecue sauce', category: 'Main Course', price: 18.99, isVeg: false, isSpicy: false, ingredients: ['pork ribs', 'bbq sauce', 'brown sugar', 'garlic', 'onions'] },
        { name: 'Apple Pie', description: 'Traditional American pie with tart apples and cinnamon, served with vanilla ice cream', category: 'Desserts', price: 6.99, isVeg: true, isSpicy: false, ingredients: ['apples', 'pie crust', 'cinnamon', 'sugar', 'butter'] },
        { name: 'Chocolate Chip Cookies', description: 'Soft and chewy cookies loaded with chocolate chips', category: 'Desserts', price: 4.99, isVeg: true, isSpicy: false, ingredients: ['flour', 'butter', 'brown sugar', 'chocolate chips', 'eggs'] },
        { name: 'Iced Coffee', description: 'Cold brewed coffee served over ice with milk and sweetener', category: 'Beverages', price: 3.99, isVeg: true, isSpicy: false, ingredients: ['coffee', 'milk', 'ice', 'sugar'] }
      ]
    };

    // Get available items for the selected cuisine
    const availableItems = menuTemplates[cuisineType] || menuTemplates['American'];

    // Filter by dietary restrictions if specified
    let filteredItems = availableItems;
    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      filteredItems = availableItems.filter(item => {
        if (dietaryRestrictions.includes('vegetarian') && !item.isVeg) return false;
        if (dietaryRestrictions.includes('vegan') && !item.isVeg) return false; // Simplified - in real implementation, you'd check for animal products
        if (dietaryRestrictions.includes('gluten-free') && item.ingredients.some(ing => ing.toLowerCase().includes('flour') || ing.toLowerCase().includes('bread'))) return false;
        return true;
      });
    }

    // Randomly select items
    const selectedItems = [];
    const shuffled = [...filteredItems].sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(numItems, shuffled.length); i++) {
      const item = { ...shuffled[i] };
      item.cookingTime = Math.floor(Math.random() * 20) + 10; // Random cooking time between 10-30 minutes
      item.nutritionalInfo = {
        calories: Math.floor(Math.random() * 400) + 200,
        protein: Math.floor(Math.random() * 30) + 5,
        carbs: Math.floor(Math.random() * 50) + 10,
        fat: Math.floor(Math.random() * 25) + 5
      };
      selectedItems.push(item);
    }

    res.status(200).json({
      success: true,
      items: selectedItems,
      message: `Generated ${selectedItems.length} menu items for ${cuisineType} cuisine`
    });

  } catch (error) {
    console.error('❌ Error generating menu items:', {
      message: error.message,
      stack: error.stack,
      cuisineType: req.body.cuisineType,
      dietaryRestrictions: req.body.dietaryRestrictions
    });

    res.status(500).json({
      success: false,
      message: 'Error generating menu items',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      fallback: true
    });
  }
};


// Get image buffer for processing
const getImageBuffer = async (imageUrl, imagePath, file) => {
  if (imageUrl) {
    // For URLs, fetch the image
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MenuGenerator/1.0)'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      // Check content length to avoid downloading huge files
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file too large (max 10MB)');
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate that this is actually an image by checking magic numbers
      const isValidImage = await validateImageBuffer(buffer);
      if (!isValidImage) {
        throw new Error('URL does not point to a valid image');
      }

      // Determine MIME type from buffer if content-type header is missing or invalid
      let mimeType = contentType;
      if (!mimeType || !mimeType.startsWith('image/')) {
        mimeType = getMimeTypeFromBuffer(buffer);
      }

      return {
        buffer,
        mimeType,
        originalName: imageUrl.split('/').pop() || 'image'
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Unable to fetch image from URL');
      }
      if (error.message.includes('fetch')) {
        throw new Error(`Failed to fetch image from URL: ${error.message}`);
      }
      throw error;
    }
  } else if (imagePath) {
    // For file paths, read the file
    try {
      // Normalize the path to handle relative paths
      const normalizedPath = path.resolve(imagePath);

      // Security check: ensure the path is within allowed directories
      const projectRoot = path.resolve(__dirname, '../');
      const allowedDirs = [
        projectRoot,
        path.resolve(projectRoot, 'uploads'),
        path.resolve(projectRoot, 'public'),
        path.resolve(projectRoot, 'assets'),
        path.resolve(projectRoot, 'images'),
        '/tmp', // Allow temporary directories
        '/var/tmp' // Allow system temp directories
      ];

      const isAllowed = allowedDirs.some(allowedDir => {
        const resolvedAllowed = path.resolve(allowedDir);
        return normalizedPath.startsWith(resolvedAllowed);
      });

      if (!isAllowed) {
        throw new Error('Access denied: File path outside of allowed directories');
      }

      if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Check if it's a directory
      const stats = fs.statSync(normalizedPath);
      if (stats.isDirectory()) {
        throw new Error('Path points to a directory, not a file');
      }

      // Validate file size (max 10MB)
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('Image file too large (max 10MB)');
      }

      const buffer = fs.readFileSync(normalizedPath);

      // Validate that this is actually an image by checking magic numbers
      const isValidImage = await validateImageBuffer(buffer);
      if (!isValidImage) {
        throw new Error('File does not appear to be a valid image');
      }

      const mimeType = getMimeTypeFromBuffer(buffer) || getMimeType(normalizedPath);
      return {
        buffer,
        mimeType,
        originalName: path.basename(normalizedPath)
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
        throw new Error(`Access denied to file: ${imagePath}`);
      }
      throw error;
    }
  } else if (file) {
    // For uploaded files
    return {
      buffer: fs.readFileSync(file.path),
      mimeType: file.mimetype,
      originalName: file.originalname
    };
  }
  throw new Error('No valid image input provided');
};

// Get MIME type from file extension
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

// Validate image buffer by checking magic numbers
const validateImageBuffer = async (buffer) => {
  if (buffer.length < 4) return false;

  const header = buffer.subarray(0, 4);

  // Check for common image format magic numbers
  const magicNumbers = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46] // RIFF
  };

  for (const [format, magic] of Object.entries(magicNumbers)) {
    if (magic.every((byte, index) => header[index] === byte)) {
      // Additional check for WebP
      if (format === 'webp' && buffer.length >= 12) {
        const webpHeader = buffer.subarray(8, 12);
        if (webpHeader.equals(Buffer.from('WEBP', 'ascii'))) {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  return false;
};

// Get MIME type from buffer
const getMimeTypeFromBuffer = (buffer) => {
  if (buffer.length < 4) return 'application/octet-stream';

  const header = buffer.subarray(0, 4);

  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return 'image/gif';
  }
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
    // Check for WebP
    if (buffer.length >= 12) {
      const webpHeader = buffer.subarray(8, 12);
      if (webpHeader.equals(Buffer.from('WEBP', 'ascii'))) {
        return 'image/webp';
      }
    }
  }

  return 'application/octet-stream';
};

// Generate menu items from image using Gemini AI with fallback
const generateMenuFromImage = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Parse FormData fields
    const imageUrl = req.body.imageUrl;
    const imagePath = req.body.imagePath;
    const cuisineType = req.body.cuisineType || 'General';

    // Handle dietaryRestrictions array from FormData
    let dietaryRestrictions = [];
    if (req.body.dietaryRestrictions) {
      // If it's already an array
      if (Array.isArray(req.body.dietaryRestrictions)) {
        dietaryRestrictions = req.body.dietaryRestrictions;
      } else if (typeof req.body.dietaryRestrictions === 'string') {
        // If it's a single string, convert to array
        dietaryRestrictions = [req.body.dietaryRestrictions];
      }
    } else if (req.body['dietaryRestrictions[]']) {
      // Handle array format from FormData
      if (Array.isArray(req.body['dietaryRestrictions[]'])) {
        dietaryRestrictions = req.body['dietaryRestrictions[]'];
      } else {
        dietaryRestrictions = [req.body['dietaryRestrictions[]']];
      }
    }

    // Validate input - only one input method should be provided
    const inputs = [imageUrl, imagePath, req.file].filter(Boolean);
    if (inputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image URL, file path, or upload an image file'
      });
    }
    if (inputs.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide only one image input method'
      });
    }

    // Check if Gemini AI is configured
    if (!geminiService.isConfigured()) {
      // Provide fallback menu items when AI is not available
      const fallbackItems = [
        {
          name: 'Signature Dish',
          description: 'A delicious dish prepared with fresh ingredients',
          price: 15.99,
          category: 'Main Course',
          ingredients: ['Fresh ingredients', 'Seasonal vegetables', 'Premium spices'],
          isVeg: false,
          isSpicy: false,
          cookingTime: 20,
          nutritionalInfo: {
            calories: 350,
            protein: 18,
            carbs: 30,
            fat: 15
          }
        },
        {
          name: 'Chef\'s Special',
          description: 'Our chef\'s special creation with unique flavors',
          price: 18.99,
          category: 'Main Course',
          ingredients: ['Premium ingredients', 'Chef\'s special sauce', 'Fresh herbs'],
          isVeg: false,
          isSpicy: false,
          cookingTime: 25,
          nutritionalInfo: {
            calories: 400,
            protein: 22,
            carbs: 35,
            fat: 18
          }
        }
      ];

      return res.status(200).json({
        success: true,
        message: 'AI service not available - using fallback menu items',
        data: {
          imageDescription: 'Menu image analysis not available - using default items',
          items: fallbackItems,
          imageUrl: imageUrl || null,
          processedAt: new Date().toISOString(),
          fallback: true
        }
      });
    }

    // Get image buffer
    const { buffer, mimeType, originalName } = await getImageBuffer(imageUrl, imagePath, req.file);

    // Validate image size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('Image size must be less than 10MB');
    }

    // Validate image format
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only JPEG, PNG, and WEBP images are supported');
    }

    // Save buffer to temporary file for processing
    const tempFileName = `temp-${uuidv4()}-${originalName}`;
    const tempFilePath = path.join(__dirname, '../uploads', tempFileName);
    uploadedFilePath = tempFilePath;

    // Ensure uploads directory exists
    const uploadsDir = path.dirname(tempFilePath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(tempFilePath, buffer);

    // Generate image description using Gemini AI
    const imageDescription = await geminiService.generateImageDescription(tempFilePath, 'file');

    // Generate menu items from the description
    const menuItems = await geminiService.generateMenuItemsFromDescription(
      imageDescription,
      {
        cuisineType,
        dietaryRestrictions
      }
    );

    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(200).json({
      success: true,
      message: 'Menu items generated successfully from image',
      data: {
        imageDescription,
        items: menuItems,
        imageUrl: imageUrl || null,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating menu from image:', error);

    // Clean up temporary file if it exists
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('size') || error.message.includes('format') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: 'Error generating menu from image',
      error: error.message,
      fallback: statusCode === 500
    });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const menuItemData = { ...req.body };

    // Handle image upload if present
    if (req.file) {
      // Validate image
      const validation = await ImageUtils.validateImage(req.file.buffer, req.file.originalname);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Optimize image for storage
      const optimizedBuffer = await ImageUtils.optimizeImage(req.file.buffer, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 85
      });

      // Get content type
      const contentType = await ImageUtils.getContentType(optimizedBuffer);

      menuItemData.image = {
        data: optimizedBuffer,
        contentType: contentType,
        filename: req.file.originalname,
        size: optimizedBuffer.length,
        uploadDate: new Date()
      };
    } else if (menuItemData.imageUrl) {
      // Handle URL-based images
      menuItemData.imageUrl = menuItemData.imageUrl;
    }

    const menuItem = await MenuItem.create(menuItemData);

    // Convert to response format
    const responseItem = menuItem.toObject();
    if (responseItem.image && responseItem.image.data) {
      responseItem.imageUrl = `data:${responseItem.image.contentType};base64,${responseItem.image.data.toString('base64')}`;
    }

    res.status(201).json({
      success: true,
      data: responseItem,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item',
      error: error.message
    });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle image upload if present
    if (req.file) {
      // Validate image
      const validation = await ImageUtils.validateImage(req.file.buffer, req.file.originalname);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Optimize image for storage
      const optimizedBuffer = await ImageUtils.optimizeImage(req.file.buffer, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 85
      });

      // Get content type
      const contentType = await ImageUtils.getContentType(optimizedBuffer);

      updateData.image = {
        data: optimizedBuffer,
        contentType: contentType,
        filename: req.file.originalname,
        size: optimizedBuffer.length,
        uploadDate: new Date()
      };
    } else if (updateData.imageUrl) {
      // Handle URL-based images
      updateData.imageUrl = updateData.imageUrl;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Convert to response format
    const responseItem = menuItem.toObject();
    if (responseItem.image && responseItem.image.data) {
      responseItem.imageUrl = `data:${responseItem.image.contentType};base64,${responseItem.image.data.toString('base64')}`;
    }

    res.status(200).json({
      success: true,
      data: responseItem,
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message
    });
  }
};

const getMenuItemImage = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItem.findById(id);

    if (!menuItem || !menuItem.image || !menuItem.image.data) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.set('Content-Type', menuItem.image.contentType);
    res.set('Content-Disposition', `inline; filename="${menuItem.image.filename}"`);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(menuItem.image.data);
  } catch (error) {
    console.error('Error retrieving menu item image:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: error.message
    });
  }
};

export {
  processMenuImage,
  createBatchMenuItems,
  generateMenuItems,
  generateMenuFromImage,
  createMenuItem,
  updateMenuItem,
  getMenuItemImage
};
