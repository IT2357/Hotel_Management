import { createWorker } from 'tesseract.js';
import AIJaffnaTrainer from './aiJaffnaTrainer.js';

/**
 * OCR Service for Menu Text Extraction
 * Specialized for Tamil/Jaffna cuisine with enhanced accuracy
 */
class OCRService {
  constructor() {
    this.worker = null;
    this.jaffnaTrainer = new AIJaffnaTrainer();
    this.isInitialized = false;
  }

  /**
   * Initialize OCR worker with Tamil language support
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🤖 Initializing OCR service with Tamil support...');
      this.worker = await createWorker('tam+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      this.isInitialized = true;
      console.log('✅ OCR service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize OCR service:', error);
      return false;
    }
  }

  /**
   * Extract text from image using OCR
   * @param {string} imagePath - Path to image file
   * @param {Object} options - OCR options
   */
  async extractText(imagePath, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`📸 Extracting text from: ${imagePath}`);
      
      const { data: { text, confidence } } = await this.worker.recognize(imagePath, {
        ...options,
        // Optimize for menu text
        tessedit_pageseg_mode: '6', // Single uniform block
        tessedit_ocr_engine_mode: '1' // LSTM only
      });

      console.log(`📊 OCR confidence: ${Math.round(confidence * 100)}%`);
      
      return {
        text,
        confidence,
        method: 'tesseract-tamil',
        success: true
      };
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      return {
        text: '',
        confidence: 0,
        method: 'failed',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse menu text into structured data
   * @param {string} text - Raw OCR text
   */
  parseMenuText(text) {
    console.log('🔍 Parsing menu text...');
    
    const lines = text.split('\n').filter(line => line.trim());
    const items = [];
    let currentCategory = 'Main Course';
    let confidence = 0.8; // Base confidence

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;

      // Check for category headers
      if (this.isCategoryHeader(trimmedLine)) {
        currentCategory = this.extractCategory(trimmedLine);
        continue;
      }

      // Extract dish information
      const dishInfo = this.extractDishInfo(trimmedLine, currentCategory);
      if (dishInfo) {
        items.push(dishInfo);
        confidence = Math.min(confidence, dishInfo.confidence);
      }
    }

    const categories = this.groupItemsByCategory(items);
    
    console.log(`🍽️ Parsed ${items.length} items across ${categories.length} categories`);
    
    return {
      categories,
      totalItems: items.length,
      confidence: Math.max(confidence, 0.3), // Minimum confidence
      rawText: text
    };
  }

  /**
   * Check if line is a category header
   * @param {string} line - Text line
   */
  isCategoryHeader(line) {
    const categoryKeywords = [
      // English
      'curry', 'curries', 'rice', 'bread', 'breakfast', 'lunch', 'dinner',
      'dessert', 'beverage', 'snack', 'appetizer', 'main course', 'soup',
      // Tamil
      'கறி', 'கறிகள்', 'ரைஸ்', 'அரிசி', 'ரொட்டி', 'அப்பம்',
      'காலை', 'முறை', 'மதிய', 'மதியம்', 'இரவு', 'இரவு உணவு',
      'இனிப்பு', 'இனிப்புகள்', 'பானம்', 'பானங்கள்',
      'சிற்றுண்டி', 'சிற்றுண்டிகள்', 'முன்னுணவு'
    ];

    const lowerLine = line.toLowerCase();
    return categoryKeywords.some(keyword => lowerLine.includes(keyword));
  }

  /**
   * Extract category from header line
   * @param {string} line - Category header line
   */
  extractCategory(line) {
    const categoryMap = {
      // English categories
      'curry': 'Curries',
      'curries': 'Curries',
      'rice': 'Rice',
      'bread': 'Bread',
      'breakfast': 'Breakfast',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'dessert': 'Desserts',
      'beverage': 'Beverages',
      'snack': 'Snacks',
      'appetizer': 'Appetizers',
      'main course': 'Main Course',
      'soup': 'Soups',
      
      // Tamil categories
      'கறி': 'Curries',
      'கறிகள்': 'Curries',
      'ரைஸ்': 'Rice',
      'அரிசி': 'Rice',
      'ரொட்டி': 'Bread',
      'அப்பம்': 'Bread',
      'காலை': 'Breakfast',
      'முறை': 'Breakfast',
      'மதிய': 'Lunch',
      'மதியம்': 'Lunch',
      'இரவு': 'Dinner',
      'இரவு உணவு': 'Dinner',
      'இனிப்பு': 'Desserts',
      'இனிப்புகள்': 'Desserts',
      'பானம்': 'Beverages',
      'பானங்கள்': 'Beverages',
      'சிற்றுண்டி': 'Snacks',
      'சிற்றுண்டிகள்': 'Snacks',
      'முன்னுணவு': 'Appetizers'
    };

    const lowerLine = line.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (lowerLine.includes(keyword)) {
        return category;
      }
    }

    return 'Main Course';
  }

  /**
   * Extract dish information from a line
   * @param {string} line - Text line
   * @param {string} category - Current category
   */
  extractDishInfo(line, category) {
    // Enhanced price pattern for LKR
    const pricePatterns = [
      /(\d+(?:\.\d{2})?)\s*(?:LKR|lkr|රු|Rs|rs)/i,
      /(\d+(?:\.\d{2})?)\s*(?:රුපියල්|rupiah)/i,
      /(\d+(?:\.\d{2})?)\s*$/ // Price at end of line
    ];

    let priceMatch = null;
    let price = 0;
    
    for (const pattern of pricePatterns) {
      priceMatch = line.match(pattern);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        break;
      }
    }

    if (!priceMatch || price <= 0) return null;

    // Extract dish name (remove price and extra characters)
    let dishName = line.replace(pricePatterns[0], '').trim();
    dishName = dishName.replace(/\s*[-–—]\s*$/, '').trim(); // Remove trailing dashes
    
    if (!dishName || dishName.length < 2) return null;

    // Apply -5% LKR adjustment
    const adjustedPrice = Math.round(price * 0.95);

    // Detect Tamil script
    const isTamil = /[\u0B80-\u0BFF]/.test(dishName);
    
    // Find matching Jaffna dish for better accuracy
    const jaffnaDish = this.findJaffnaDish(dishName);
    
    return {
      name: dishName,
      englishName: jaffnaDish?.english || (isTamil ? null : dishName),
      tamilName: jaffnaDish?.tamil || (isTamil ? dishName : null),
      price: adjustedPrice,
      originalPrice: price,
      category: category,
      isTamil: isTamil,
      isSpicy: this.detectSpiceLevel(dishName),
      isVegetarian: this.detectVegetarian(dishName),
      isPopular: this.detectPopular(dishName),
      ingredients: this.extractIngredients(dishName),
      confidence: this.calculateDishConfidence(dishName, jaffnaDish),
      dietaryTags: this.extractDietaryTags(dishName)
    };
  }

  /**
   * Find matching Jaffna dish
   * @param {string} dishName - Dish name to match
   */
  findJaffnaDish(dishName) {
    const jaffnaDishes = [
      { tamil: 'நண்டு கறி', english: 'Jaffna Crab Curry', category: 'curry' },
      { tamil: 'அப்பம்', english: 'Hoppers', category: 'bread' },
      { tamil: 'கத்தரிக்கை கறி', english: 'Brinjal Curry', category: 'curry' },
      { tamil: 'ஆட்டுக்கறி', english: 'Mutton Curry', category: 'curry' },
      { tamil: 'மீன் கறி', english: 'Fish Curry', category: 'curry' },
      { tamil: 'இடியாப்பம்', english: 'String Hoppers', category: 'bread' },
      { tamil: 'புட்டு', english: 'Puttu', category: 'rice' },
      { tamil: 'இட்லி', english: 'Idli', category: 'breakfast' },
      { tamil: 'தோசை', english: 'Dosa', category: 'breakfast' },
      { tamil: 'வடை', english: 'Vadai', category: 'snack' },
      { tamil: 'பொங்கல்', english: 'Pongal', category: 'rice' },
      { tamil: 'ரசம்', english: 'Rasam', category: 'soup' },
      { tamil: 'சாம்பார்', english: 'Sambar', category: 'soup' },
      { tamil: 'தயிர்', english: 'Curd', category: 'dairy' },
      { tamil: 'பாயசம்', english: 'Payasam', category: 'dessert' }
    ];

    const lowerName = dishName.toLowerCase();
    
    return jaffnaDishes.find(dish => 
      dish.tamil === dishName ||
      dish.english.toLowerCase() === lowerName ||
      lowerName.includes(dish.english.toLowerCase()) ||
      dishName.includes(dish.tamil) ||
      this.fuzzyMatch(dishName, dish.english) ||
      this.fuzzyMatch(dishName, dish.tamil)
    );
  }

  /**
   * Simple fuzzy matching for dish names
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   */
  fuzzyMatch(str1, str2) {
    if (!str1 || !str2) return false;
    
    const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) return true;
    
    // Check word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    const overlap = words1.filter(word => 
      words2.some(w2 => word.includes(w2) || w2.includes(word))
    ).length;
    
    return overlap >= Math.min(words1.length, words2.length) * 0.5;
  }

  /**
   * Detect spice level from dish name
   * @param {string} dishName - Name of the dish
   */
  detectSpiceLevel(dishName) {
    const spicyKeywords = [
      'spicy', 'hot', 'chili', 'chilli', 'pepper',
      'காரம்', 'கார', 'மிளகு', 'மிளகாய்', 'கொத்தமல்லி', 'வரகு'
    ];
    const lowerName = dishName.toLowerCase();
    return spicyKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Detect if dish is vegetarian
   * @param {string} dishName - Name of the dish
   */
  detectVegetarian(dishName) {
    const nonVegKeywords = [
      'chicken', 'mutton', 'fish', 'crab', 'prawn', 'beef', 'pork', 'meat',
      'கோழி', 'ஆடு', 'மீன்', 'நண்டு', 'இறால்', 'மாட்டு', 'பன்றி', 'இறைச்சி'
    ];
    const vegKeywords = [
      'vegetable', 'veggie', 'vegan', 'plant',
      'பச்சை', 'காய்கறி', 'தாவர', 'சைவ'
    ];
    
    const lowerName = dishName.toLowerCase();
    const hasNonVeg = nonVegKeywords.some(keyword => lowerName.includes(keyword));
    const hasVeg = vegKeywords.some(keyword => lowerName.includes(keyword));
    
    return !hasNonVeg || hasVeg;
  }

  /**
   * Detect if dish is popular/featured
   * @param {string} dishName - Name of the dish
   */
  detectPopular(dishName) {
    const popularKeywords = [
      'special', 'signature', 'chef', 'recommended', 'popular', 'best',
      'சிறப்பு', 'முக்கிய', 'பரிந்துரை', 'பிரபல', 'சிறந்த'
    ];
    const lowerName = dishName.toLowerCase();
    return popularKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Extract ingredients from dish name
   * @param {string} dishName - Name of the dish
   */
  extractIngredients(dishName) {
    const commonIngredients = [
      'onion', 'tomato', 'garlic', 'ginger', 'coconut', 'curry leaves', 'coriander',
      'cumin', 'turmeric', 'chili', 'potato', 'carrot', 'beans', 'lentils',
      'வெங்காயம்', 'தக்காளி', 'பூண்டு', 'இஞ்சி', 'தேங்காய்', 'கருவேப்பிலை',
      'கொத்தமல்லி', 'சீரகம்', 'மஞ்சள்', 'மிளகாய்', 'உருளைக்கிழங்கு', 'கேரட்'
    ];
    
    const lowerName = dishName.toLowerCase();
    return commonIngredients.filter(ingredient => 
      lowerName.includes(ingredient.toLowerCase())
    );
  }

  /**
   * Extract dietary tags
   * @param {string} dishName - Name of the dish
   */
  extractDietaryTags(dishName) {
    const tags = [];
    const lowerName = dishName.toLowerCase();
    
    if (this.detectVegetarian(dishName)) {
      tags.push('Vegetarian');
    }
    
    if (this.detectSpiceLevel(dishName)) {
      tags.push('Spicy');
    }
    
    if (lowerName.includes('halal') || lowerName.includes('ஹலால்')) {
      tags.push('Halal');
    }
    
    if (lowerName.includes('gluten') || lowerName.includes('gluten-free')) {
      tags.push('Gluten-Free');
    }
    
    if (lowerName.includes('vegan') || lowerName.includes('சைவ')) {
      tags.push('Vegan');
    }
    
    return tags;
  }

  /**
   * Calculate confidence score for dish extraction
   * @param {string} dishName - Extracted dish name
   * @param {Object} jaffnaDish - Matching Jaffna dish data
   */
  calculateDishConfidence(dishName, jaffnaDish) {
    if (!jaffnaDish) return 0.4; // Medium confidence for unknown dishes
    
    let confidence = 0.6; // Base confidence
    
    // Exact match bonus
    if (jaffnaDish.tamil === dishName || 
        jaffnaDish.english.toLowerCase() === dishName.toLowerCase()) {
      confidence += 0.4;
    }
    
    // Partial match bonus
    if (dishName.toLowerCase().includes(jaffnaDish.english.toLowerCase()) || 
        dishName.includes(jaffnaDish.tamil)) {
      confidence += 0.2;
    }
    
    // Fuzzy match bonus
    if (this.fuzzyMatch(dishName, jaffnaDish.english) || 
        this.fuzzyMatch(dishName, jaffnaDish.tamil)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Group items by category
   * @param {Array} items - Array of dish items
   */
  groupItemsByCategory(items) {
    const categories = {};
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = {
          name: item.category,
          items: []
        };
      }
      categories[item.category].items.push(item);
    });
    
    return Object.values(categories);
  }

  /**
   * Validate menu structure
   * @param {Array} categories - Menu categories
   */
  validateMenuStructure(categories) {
    if (!Array.isArray(categories)) return [];
    
    return categories.map(category => ({
      ...category,
      items: (category.items || []).map(item => ({
        ...item,
        // Ensure required fields
        name: item.name || 'Unnamed Item',
        price: Math.max(item.price || 0, 0),
        category: item.category || 'Main Course',
        isAvailable: item.isAvailable !== false,
        confidence: Math.max(item.confidence || 0.3, 0.1)
      }))
    }));
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🧹 OCR service cleaned up');
    }
  }
}

export default new OCRService();