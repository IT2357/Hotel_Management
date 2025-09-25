import axios from 'axios';
import * as cheerio from 'cheerio';

class HTMLParser {
  constructor() {
    this.timeout = 10000; // 10 seconds
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Extract menu data from a restaurant website URL
   * @param {string} url - Restaurant website URL
   * @returns {Promise<Object>} - Extracted menu data
   */
  async extractMenuFromURL(url) {
    try {
      console.log(`🌐 Extracting menu from URL: ${url}`);
      
      // Validate URL
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
      }

      // Fetch the webpage
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = response.data;
      const $ = cheerio.load(html);

      // Try different extraction strategies
      const strategies = [
        this.extractFromStructuredData.bind(this),
        this.extractFromCommonSelectors.bind(this),
        this.extractFromTableStructure.bind(this),
        this.extractFromTextContent.bind(this)
      ];

      let bestResult = { categories: [], confidence: 0 };

      for (const strategy of strategies) {
        try {
          const result = await strategy($, url);
          if (result.categories.length > 0 && result.confidence > bestResult.confidence) {
            bestResult = result;
          }
        } catch (error) {
          console.warn(`Strategy failed: ${error.message}`);
        }
      }

      return {
        categories: bestResult.categories,
        rawText: this.extractAllText($),
        confidence: bestResult.confidence,
        method: 'html-parsing',
        source: { type: 'url', value: url }
      };

    } catch (error) {
      console.error('HTML parsing error:', error);
      throw new Error(`Failed to extract menu from URL: ${error.message}`);
    }
  }

  /**
   * Extract menu from structured data (JSON-LD, microdata)
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {Object}
   */
  extractFromStructuredData($, url) {
    const categories = [];
    let confidence = 0;

    // Look for JSON-LD structured data
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        
        if (data['@type'] === 'Restaurant' || data['@type'] === 'FoodEstablishment') {
          if (data.hasMenu || data.menu) {
            const menuData = data.hasMenu || data.menu;
            if (Array.isArray(menuData)) {
              menuData.forEach(menu => {
                if (menu.hasMenuSection) {
                  menu.hasMenuSection.forEach(section => {
                    const category = {
                      name: section.name || 'Menu Section',
                      items: []
                    };
                    
                    if (section.hasMenuItem) {
                      section.hasMenuItem.forEach(item => {
                        category.items.push({
                          name: item.name || '',
                          price: this.extractPrice(item.offers?.price || item.price || 0),
                          description: item.description || '',
                          image: item.image || ''
                        });
                      });
                    }
                    
                    if (category.items.length > 0) {
                      categories.push(category);
                    }
                  });
                }
              });
              confidence = 95;
            }
          }
        }
      } catch (error) {
        // Ignore JSON parsing errors
      }
    });

    return { categories, confidence };
  }

  /**
   * Extract menu using common CSS selectors
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {Object}
   */
  extractFromCommonSelectors($, url) {
    const categories = [];
    let confidence = 0;

    // Common menu selectors (expanded for better coverage, especially Jaffna/Sri Lankan restaurants)
    const menuSelectors = [
      // Standard selectors
      '.menu-item', '.food-item', '.dish', '.product', '.menu-product',
      '[class*="menu"]', '[class*="food"]', '[class*="dish"]', '[class*="item"]',
      '.menu-category', '.food-category', '.menu-section',
      '.restaurant-menu-item', '.menu-entry', '.menu-list-item',
      '.food-menu-item', '.menu-dish', '.menu-food', '.menu-product-item',
      '.card-menu', '.menu-card', '.food-card', '.dish-card',
      '.menu-block', '.food-block', '.menu-container', '.food-container',
      'article[class*="menu"]', 'div[class*="menu"]', 'section[class*="menu"]',

      // Sri Lankan/Jaffna specific selectors
      '.foodorders-item', '.valdor-item', '.akshadaya-item', '.restaurant-item',
      '.sri-lankan-menu', '.jaffna-menu', '.tamil-menu', '.cuisine-item',
      '.foodorders-menu-item', '.menu-food-item', '.restaurant-food-item',
      '.foodorders-dish', '.menu-dish-item', '.dish-menu-item',

      // Common restaurant website patterns
      '.menu-listing', '.food-listing', '.item-listing', '.product-listing',
      '.menu-grid', '.food-grid', '.item-grid', '.product-grid',
      '.menu-wrapper', '.food-wrapper', '.item-wrapper', '.product-wrapper',

      // Bootstrap/card based menus
      '.card', '.card-body', '.menu-card', '.food-card', '.dish-card',
      '.col-md-4', '.col-lg-3', '.menu-col', '.food-col',

      // List based menus
      '.menu-list', '.food-list', '.item-list', '.product-list',
      'ul[class*="menu"]', 'ol[class*="menu"]', 'li[class*="menu"]',

      // Specific to foodorders.lk and similar platforms
      '.food-item-card', '.menu-item-card', '.restaurant-card',
      '.foodorders-card', '.valdor-card', '.menu-section-card',

      // Valdor specific selectors (from analysis)
      '.category', '.menu-group', '.food-group', '.dish-group',
      '.menu-container', '.food-container', '.item-container'
    ];

    const priceSelectors = [
      '.price', '.cost', '.amount', '.value', '.money',
      '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
      '.menu-price', '.food-price', '.dish-price', '.item-price',
      '.product-price', '.menu-cost', '.food-cost', '.dish-cost',
      '.price-tag', '.price-label', '.cost-label', '.amount-label',
      'span[class*="price"]', 'div[class*="price"]', 'p[class*="price"]'
    ];

    // Try to find menu structure
    for (const selector of menuSelectors) {
      const items = $(selector);
      if (items.length > 2) { // Need at least 3 items to consider it a menu
        const category = {
          name: this.inferCategoryName($, selector) || 'Menu Items',
          items: []
        };

        items.each((index, element) => {
          const $item = $(element);
          
          // Extract item name
          const name = this.extractItemName($item);
          
          // Extract price
          const price = this.extractItemPrice($item, priceSelectors);
          
          // Extract description
          const description = this.extractItemDescription($item);
          
          // Extract image
          const image = this.extractItemImage($item, url);

          if (name && price > 0) {
            category.items.push({
              name: name,
              price: price,
              description: description,
              image: image
            });
          }
        });

        if (category.items.length > 0) {
          categories.push(category);
          confidence = Math.min(80, category.items.length * 10);
          break; // Found valid menu structure
        }
      }
    }

    return { categories, confidence };
  }

  /**
   * Extract menu from table structure
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {Object}
   */
  extractFromTableStructure($, url) {
    const categories = [];
    let confidence = 0;

    $('table').each((i, table) => {
      const $table = $(table);
      const rows = $table.find('tr');
      
      if (rows.length > 3) { // Need multiple rows for a menu
        const category = {
          name: this.extractTableTitle($table) || `Menu Table ${i + 1}`,
          items: []
        };

        rows.each((index, row) => {
          const $row = $(row);
          const cells = $row.find('td, th');
          
          if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            const priceText = $(cells[cells.length - 1]).text().trim();
            const price = this.extractPrice(priceText);
            
            let description = '';
            if (cells.length > 2) {
              description = $(cells[1]).text().trim();
            }

            if (name && price > 0 && !this.isHeaderRow(name)) {
              category.items.push({
                name: name,
                price: price,
                description: description,
                image: ''
              });
            }
          }
        });

        if (category.items.length > 0) {
          categories.push(category);
          confidence = Math.min(70, category.items.length * 8);
        }
      }
    });

    return { categories, confidence };
  }

  /**
   * Extract menu from general text content
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {Object}
   */
  extractFromTextContent($, url) {
    const categories = [];
    const text = this.extractAllText($);
    
    // Use simple text parsing similar to OCR parsing
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentCategory = null;
    
    const categoryKeywords = [
      // English categories
      'appetizer', 'starter', 'soup', 'salad', 'main', 'entree', 'pasta', 'pizza',
      'dessert', 'beverage', 'drink', 'coffee', 'tea', 'wine', 'beer', 'cocktail',
      'breakfast', 'lunch', 'dinner', 'special', 'combo', 'platter', 'menu',

      // Valdor specific categories (from analysis)
      'biriyanies', 'naans and chapathis', 'kottu', 'noodles & mee goreng',
      'bites and curries', 'appetizers & salads', 'soups', 'sandwiches',
      'dosa and others', 'desserts', 'soft drinks', 'fried rice', 'cakes',
      'rice & curry', 'nasi goreng', 'pulao rice', 'indian mutton curry',
      'indian vegetarian', 'indian beef curry', 'indian prawns curry',
      'paneer', 'tea&coffee', 'indian paratha', 'indian sea food', 'snacks',
      'jaffna style curries',

      // Jaffna/Sri Lankan Tamil categories
      'thosai', 'dosa', 'idiyappam', 'puttu', 'idli', 'vada', 'bonda', 'pakora',
      'chicken', 'mutton', 'fish', 'seafood', 'vegetarian', 'veg', 'kottu',
      'rice', 'biryani', 'curry', 'gravy', 'soup', 'wattalappan', 'payasam',
      'coffee', 'tea', 'juice', 'lassi', 'drinks', 'beverages',

      // Tamil script categories
      'தோசை', 'இடியாப்பம்', 'புத்து', 'இட்லி', 'வடை', 'கொத்து', 'பிரியாணி',
      'கறி', 'காபி', 'தேயிலை', 'இறால்', 'மீன்', 'கோழி', 'அட்டை'
    ];

    const pricePatterns = [
      // Sri Lankan Rupee patterns (most important for Jaffna)
      /LKR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /Rs\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /Rs\.\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*LKR/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*Rs/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*Rs\./i,

      // Indian Rupee (sometimes used in Sri Lanka)
      /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*₹/,

      // USD (for international menus)
      /\$(\d+\.?\d*)/,
      /(\d+\.?\d*)\s*\$/,

      // Generic patterns
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*\/-/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*only/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*per/i,

      // Fallback numeric patterns
      /(\d+(?:,\d{3})*(?:\.\d{2})?)/
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a category
      const isCategory = categoryKeywords.some(keyword => 
        trimmedLine.toLowerCase().includes(keyword)
      ) && !pricePatterns.some(pattern => pattern.test(trimmedLine));

      if (isCategory && trimmedLine.length < 50) {
        currentCategory = {
          name: trimmedLine,
          items: []
        };
        categories.push(currentCategory);
        continue;
      }

      // Check if it's a menu item with price
      let price = 0;
      for (const pattern of pricePatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          price = parseFloat(match[1]);
          break;
        }
      }

      if (price > 0) {
        const name = trimmedLine.replace(/\$?\d+\.?\d*|\d+\s*rs|rs\s*\d+|₹\s*\d+|\d+\s*\/-/gi, '').trim();
        
        if (name.length > 0) {
          const item = {
            name: name,
            price: price,
            description: '',
            image: ''
          };

          if (currentCategory) {
            currentCategory.items.push(item);
          } else {
            if (categories.length === 0) {
              categories.push({
                name: 'Menu Items',
                items: []
              });
            }
            categories[0].items.push(item);
          }
        }
      }
    }

    const confidence = categories.length > 0 ? Math.min(50, categories.reduce((sum, cat) => sum + cat.items.length, 0) * 5) : 0;
    
    return { categories: categories.filter(cat => cat.items.length > 0), confidence };
  }

  // Helper methods
  extractItemName($item) {
    const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', '.name', '.title', '.dish-name', '.item-name'];
    
    for (const selector of selectors) {
      const name = $item.find(selector).first().text().trim();
      if (name) return name;
    }
    
    return $item.text().split('\n')[0].trim();
  }

  extractItemPrice($item, priceSelectors) {
    for (const selector of priceSelectors) {
      const priceText = $item.find(selector).text().trim();
      if (priceText) {
        const price = this.extractPrice(priceText);
        if (price > 0) return price;
      }
    }
    
    // Fallback: look for price in the item text
    const itemText = $item.text();
    return this.extractPrice(itemText);
  }

  extractItemDescription($item) {
    const selectors = ['p', '.description', '.desc', '.details', '.info'];
    
    for (const selector of selectors) {
      const desc = $item.find(selector).first().text().trim();
      if (desc && desc.length > 10) return desc.substring(0, 200);
    }
    
    return '';
  }

  extractItemImage($item, baseUrl) {
    const img = $item.find('img').first();
    if (img.length) {
      const src = img.attr('src') || img.attr('data-src');
      if (src) {
        return this.resolveImageUrl(src, baseUrl);
      }
    }
    return '';
  }

  extractPrice(text) {
    const pricePatterns = [
      // Sri Lankan Rupee patterns (most important for Jaffna)
      /LKR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /Rs\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /Rs\.\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*LKR/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*Rs/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*Rs\./i,

      // Indian Rupee (sometimes used in Sri Lanka)
      /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*₹/,

      // USD (for international menus)
      /\$(\d+\.?\d*)/,
      /(\d+\.?\d*)\s*\$/,

      // Generic patterns
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*\/-/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*only/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*per/i,

      // Fallback numeric patterns
      /(\d+(?:,\d{3})*(?:\.\d{2})?)/
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0 && price < 10000) { // Reasonable price range
          return price;
        }
      }
    }
    
    return 0;
  }

  extractAllText($) {
    // Remove script and style elements
    $('script, style, nav, header, footer').remove();
    
    return $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
  }

  inferCategoryName($, selector) {
    const $parent = $(selector).first().closest('section, div[class*="section"], div[class*="category"]');
    if ($parent.length) {
      const heading = $parent.find('h1, h2, h3, h4, h5').first().text().trim();
      if (heading) return heading;
    }
    return null;
  }

  extractTableTitle($table) {
    const $caption = $table.find('caption');
    if ($caption.length) return $caption.text().trim();
    
    const $prevHeading = $table.prev('h1, h2, h3, h4, h5');
    if ($prevHeading.length) return $prevHeading.text().trim();
    
    return null;
  }

  isHeaderRow(text) {
    const headerKeywords = ['name', 'item', 'dish', 'price', 'cost', 'description'];
    return headerKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  resolveImageUrl(src, baseUrl) {
    try {
      if (src.startsWith('http')) return src;
      if (src.startsWith('//')) return 'https:' + src;
      if (src.startsWith('/')) return new URL(baseUrl).origin + src;
      return new URL(src, baseUrl).href;
    } catch {
      return src;
    }
  }
}

export default new HTMLParser();
