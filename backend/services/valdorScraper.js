// 📁 backend/services/valdorScraper.js
import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

class ValdorScraper {
  constructor() {
    this.baseUrl = 'https://valdor.foodorders.lk';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  /**
   * Scrape the main menu page to get all categories and items
   */
  async scrapeFullMenu() {
    try {
      console.log('🕷️ Starting Valdor menu scraping...');
      
      const response = await axios.get(this.baseUrl, {
        headers: this.headers,
        timeout: 30000,
      });

      const $ = load(response.data);
      const menuData = {
        categories: [],
        items: [],
        metadata: {
          scrapedAt: new Date(),
          source: this.baseUrl,
          totalItems: 0,
        }
      };

      // Extract categories from navigation or menu sections
      const categories = await this.extractCategories($);
      menuData.categories = categories;

      // Extract all menu items
      const items = await this.extractMenuItems($);
      menuData.items = items;
      menuData.metadata.totalItems = items.length;

      console.log(`✅ Scraped ${items.length} items across ${categories.length} categories`);
      return menuData;

    } catch (error) {
      console.error('❌ Error scraping Valdor menu:', error.message);
      throw new Error(`Failed to scrape menu: ${error.message}`);
    }
  }

  /**
   * Extract categories from the website
   */
  async extractCategories($) {
    const categories = new Set();
    
    // Look for category navigation
    $('.nav-item, .category-item, .menu-category, [class*="category"]').each((i, elem) => {
      const categoryText = $(elem).text().trim();
      if (categoryText && categoryText.length > 0) {
        categories.add(this.normalizeCategoryName(categoryText));
      }
    });

    // Look for section headers
    $('h1, h2, h3, h4, .section-title, .menu-section').each((i, elem) => {
      const headerText = $(elem).text().trim();
      if (this.isCategoryHeader(headerText)) {
        categories.add(this.normalizeCategoryName(headerText));
      }
    });

    // Default categories if none found
    if (categories.size === 0) {
      return ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'];
    }

    return Array.from(categories);
  }

  /**
   * Extract menu items from the website
   */
  async extractMenuItems($) {
    const items = [];
    
    // Look for menu item containers
    const itemSelectors = [
      '.menu-item',
      '.food-item',
      '.product-item',
      '[class*="item"]',
      '.card',
      '.product'
    ];

    for (const selector of itemSelectors) {
      $(selector).each((i, elem) => {
        const item = this.extractSingleItem($, elem);
        if (item && item.name && item.price) {
          items.push(item);
        }
      });
      
      if (items.length > 0) break; // Stop if we found items with current selector
    }

    // If no structured items found, try to extract from text content
    if (items.length === 0) {
      console.log('🔍 No structured items found, trying text extraction...');
      items.push(...this.extractItemsFromText($));
    }

    return items.map(item => this.enrichItemData(item));
  }

  /**
   * Extract a single menu item from an element
   */
  extractSingleItem($, elem) {
    const $elem = $(elem);
    
    // Extract name
    const name = this.extractItemName($elem);
    if (!name) return null;

    // Extract price
    const price = this.extractItemPrice($elem);
    if (!price) return null;

    // Extract description
    const description = this.extractItemDescription($elem);

    // Extract image URL
    const imageUrl = this.extractItemImage($elem);

    // Extract availability time from description
    const availabilityTime = this.extractAvailabilityTime(description);

    return {
      name: name.trim(),
      price: parseFloat(price),
      description: description || `Delicious ${name} from Valdor restaurant`,
      imageUrl: imageUrl || null,
      availabilityTime,
      category: this.categorizeItem(name, description),
      rawData: {
        html: $elem.html(),
        text: $elem.text()
      }
    };
  }

  /**
   * Extract item name from element
   */
  extractItemName($elem) {
    const nameSelectors = [
      '.item-name',
      '.food-name',
      '.product-name',
      '.title',
      'h1, h2, h3, h4, h5, h6',
      '.name',
      '[class*="name"]'
    ];

    for (const selector of nameSelectors) {
      const name = $elem.find(selector).first().text().trim();
      if (name && name.length > 2) {
        return name;
      }
    }

    // Fallback: get first meaningful text
    const text = $elem.text().trim();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    return lines[0] || null;
  }

  /**
   * Extract item price from element
   */
  extractItemPrice($elem) {
    const priceSelectors = [
      '.price',
      '.cost',
      '.amount',
      '[class*="price"]',
      '[class*="cost"]'
    ];

    for (const selector of priceSelectors) {
      const priceText = $elem.find(selector).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price > 0) return price;
    }

    // Fallback: search in all text for price patterns
    const text = $elem.text();
    const priceMatch = text.match(/(?:Rs\.?\s*|LKR\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    return null;
  }

  /**
   * Extract item description from element
   */
  extractItemDescription($elem) {
    const descSelectors = [
      '.description',
      '.desc',
      '.details',
      '.info',
      'p',
      '[class*="desc"]'
    ];

    for (const selector of descSelectors) {
      const desc = $elem.find(selector).first().text().trim();
      if (desc && desc.length > 10) {
        return desc;
      }
    }

    return null;
  }

  /**
   * Extract item image URL from element
   */
  extractItemImage($elem) {
    const imgSelectors = [
      'img',
      '.image img',
      '.photo img',
      '[style*="background-image"]'
    ];

    for (const selector of imgSelectors) {
      const $img = $elem.find(selector).first();
      
      if ($img.is('img')) {
        const src = $img.attr('src') || $img.attr('data-src');
        if (src) {
          return this.normalizeImageUrl(src);
        }
      } else {
        // Extract from background-image style
        const style = $img.attr('style');
        if (style) {
          const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
          if (bgMatch) {
            return this.normalizeImageUrl(bgMatch[1]);
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract items from plain text when structured data is not available
   */
  extractItemsFromText($) {
    const items = [];
    const text = $('body').text();
    
    // Look for patterns like "Item Name - Rs. 950"
    const itemPattern = /([A-Za-z\s]+)\s*-?\s*(?:Rs\.?\s*|LKR\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
    let match;
    
    while ((match = itemPattern.exec(text)) !== null) {
      const name = match[1].trim();
      const price = parseFloat(match[2].replace(/,/g, ''));
      
      if (name.length > 2 && price > 0) {
        items.push({
          name,
          price,
          description: `Delicious ${name} from Valdor restaurant`,
          category: this.categorizeItem(name),
          imageUrl: null
        });
      }
    }

    return items;
  }

  /**
   * Enrich item data with additional information
   */
  enrichItemData(item) {
    return {
      ...item,
      ingredients: this.generateIngredients(item.name, item.description),
      allergens: this.generateAllergens(item.name, item.description),
      dietaryTags: this.generateDietaryTags(item.name, item.description),
      preparationTimeMinutes: this.estimatePreparationTime(item.name, item.category),
      seasonal: false,
      isAvailable: true,
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    };
  }

  /**
   * Normalize category names to match Food schema enum
   */
  normalizeCategoryName(categoryText) {
    const normalized = categoryText.toLowerCase().trim();
    
    if (normalized.includes('breakfast') || normalized.includes('morning')) return 'Breakfast';
    if (normalized.includes('lunch') || normalized.includes('rice') || normalized.includes('curry')) return 'Lunch';
    if (normalized.includes('dinner') || normalized.includes('evening')) return 'Dinner';
    if (normalized.includes('snack') || normalized.includes('appetizer') || normalized.includes('starter')) return 'Snacks';
    if (normalized.includes('drink') || normalized.includes('beverage') || normalized.includes('juice') || normalized.includes('tea') || normalized.includes('coffee')) return 'Beverage';
    if (normalized.includes('dessert') || normalized.includes('sweet') || normalized.includes('ice cream')) return 'Dessert';
    
    return 'Snacks'; // Default category
  }

  /**
   * Categorize item based on name and description
   */
  categorizeItem(name, description = '') {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('lamprais') || text.includes('rice') || text.includes('curry') || text.includes('biryani')) return 'Lunch';
    if (text.includes('parotta') || text.includes('kottu') || text.includes('noodles')) return 'Dinner';
    if (text.includes('shawarma') || text.includes('sandwich') || text.includes('roll') || text.includes('wrap')) return 'Snacks';
    if (text.includes('juice') || text.includes('tea') || text.includes('coffee') || text.includes('drink')) return 'Beverage';
    if (text.includes('ice cream') || text.includes('dessert') || text.includes('sweet')) return 'Dessert';
    if (text.includes('breakfast') || text.includes('egg') || text.includes('toast')) return 'Breakfast';
    
    return 'Snacks'; // Default
  }

  /**
   * Generate likely ingredients based on item name
   */
  generateIngredients(name, description = '') {
    const text = `${name} ${description}`.toLowerCase();
    const ingredients = [];

    // Common ingredients mapping
    const ingredientMap = {
      'chicken': ['Chicken', 'Spices', 'Onions'],
      'beef': ['Beef', 'Spices', 'Onions'],
      'fish': ['Fish', 'Spices', 'Curry Leaves'],
      'rice': ['Rice', 'Spices'],
      'parotta': ['Flour', 'Oil', 'Salt'],
      'noodles': ['Noodles', 'Vegetables', 'Soy Sauce'],
      'shawarma': ['Flatbread', 'Meat', 'Garlic Sauce', 'Vegetables'],
      'lamprais': ['Rice', 'Meat', 'Egg', 'Sambol', 'Spices'],
      'kottu': ['Roti', 'Vegetables', 'Egg', 'Spices'],
      'curry': ['Coconut Milk', 'Spices', 'Curry Leaves'],
      'biryani': ['Basmati Rice', 'Meat', 'Spices', 'Fried Onions']
    };

    for (const [key, items] of Object.entries(ingredientMap)) {
      if (text.includes(key)) {
        ingredients.push(...items);
      }
    }

    return ingredients.length > 0 ? [...new Set(ingredients)] : ['Mixed Spices', 'Fresh Ingredients'];
  }

  /**
   * Generate likely allergens based on item name
   */
  generateAllergens(name, description = '') {
    const text = `${name} ${description}`.toLowerCase();
    const allergens = [];

    if (text.includes('egg')) allergens.push('Egg');
    if (text.includes('milk') || text.includes('cheese') || text.includes('butter')) allergens.push('Dairy');
    if (text.includes('wheat') || text.includes('flour') || text.includes('bread') || text.includes('parotta')) allergens.push('Gluten');
    if (text.includes('fish')) allergens.push('Fish');
    if (text.includes('prawn') || text.includes('crab') || text.includes('seafood')) allergens.push('Shellfish');
    if (text.includes('peanut') || text.includes('cashew') || text.includes('almond')) allergens.push('Nuts');

    return allergens;
  }

  /**
   * Generate dietary tags based on item name
   */
  generateDietaryTags(name, description = '') {
    const text = `${name} ${description}`.toLowerCase();
    const tags = [];

    if (text.includes('chicken') || text.includes('beef') || text.includes('fish') || text.includes('meat')) {
      tags.push('Non-Vegetarian');
    } else {
      tags.push('Vegetarian');
    }

    if (text.includes('spicy') || text.includes('hot') || text.includes('chili')) tags.push('Spicy');
    if (text.includes('halal')) tags.push('Halal');
    if (!text.includes('gluten') && !text.includes('wheat') && !text.includes('flour')) tags.push('Gluten-Free');

    return tags;
  }

  /**
   * Estimate preparation time based on item type
   */
  estimatePreparationTime(name, category) {
    const text = name.toLowerCase();
    
    if (text.includes('lamprais') || text.includes('biryani')) return 45;
    if (text.includes('curry') || text.includes('kottu')) return 35;
    if (text.includes('parotta') || text.includes('noodles')) return 25;
    if (text.includes('shawarma') || text.includes('sandwich')) return 15;
    if (category === 'Beverage') return 5;
    if (category === 'Dessert') return 10;
    
    return 20; // Default
  }

  /**
   * Extract availability time from description
   */
  extractAvailabilityTime(description) {
    if (!description) return null;
    
    const timeMatch = description.match(/Available Time:\s*(\d{1,2}:\d{2}\s*[ap]m)\s*-\s*(\d{1,2}:\d{2}\s*[ap]m)/i);
    if (timeMatch) {
      return {
        start: timeMatch[1],
        end: timeMatch[2]
      };
    }
    
    return null;
  }

  /**
   * Check if text is likely a category header
   */
  isCategoryHeader(text) {
    const categoryKeywords = [
      'breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts',
      'appetizers', 'main course', 'drinks', 'sweets', 'starters'
    ];
    
    return categoryKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Parse price from text
   */
  parsePrice(priceText) {
    if (!priceText) return 0;
    
    const cleaned = priceText.replace(/[^\d.,]/g, '');
    const number = parseFloat(cleaned.replace(/,/g, ''));
    
    return isNaN(number) ? 0 : number;
  }

  /**
   * Normalize image URL to absolute URL
   */
  normalizeImageUrl(url) {
    if (!url) return null;
    
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    
    return `${this.baseUrl}/${url}`;
  }

  /**
   * Save scraped data to file for debugging
   */
  async saveToFile(data, filename = 'valdor-scraped-data.json') {
    const filePath = path.join(process.cwd(), 'data', filename);
    
    // Ensure data directory exists
    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Scraped data saved to ${filePath}`);
  }
}

export default ValdorScraper;
