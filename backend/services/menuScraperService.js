/**
 * Menu Scraper Service for extracting menu data from URLs
 * Optimized for Sri Lankan/Jaffna restaurant websites
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape menu items from a website URL
 * @param {string} url - The website URL to scrape
 * @returns {Promise<Array>} Array of extracted menu items
 */
export const scrapeMenuFromUrl = async (url) => {
  try {
    console.log('🌐 Scraping menu from URL:', url);

    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    console.log('✅ HTML loaded, parsing menu items...');

    const menuItems = [];

    // Strategy 1: Look for common menu item patterns
    // This works for sites like Valampuri, Zomato, etc.
    
    // Try to find menu containers
    const menuContainers = [
      '.menu-item',
      '.food-item',
      '.dish',
      '.product',
      '[class*="menu"]',
      '[class*="food"]',
      '[class*="dish"]'
    ];

    let foundItems = false;

    for (const selector of menuContainers) {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`Found ${items.length} items with selector: ${selector}`);
        
        items.each((index, element) => {
          const $item = $(element);
          
          // Extract item details
          const name = extractText($item, [
            '.name',
            '.title',
            'h3',
            'h4',
            '.item-name',
            '[class*="name"]',
            '[class*="title"]'
          ]);

          const description = extractText($item, [
            '.description',
            '.desc',
            'p',
            '.item-desc',
            '[class*="description"]'
          ]);

          const price = extractPrice($item, [
            '.price',
            '.amount',
            '[class*="price"]',
            '[class*="cost"]',
            '[class*="amount"]'
          ]);

          const image = extractImage($item, $);

          // Extract category from nearby headings or data attributes
          const category = $item.closest('[data-category]').attr('data-category') ||
                          $item.prevAll('h2, h3').first().text().trim() ||
                          '';

          // Only add if we have at least a name
          if (name) {
            menuItems.push({
              name_english: name,
              name_tamil: extractTamilText(name),
              description_english: description,
              price: price,
              currency: 'LKR',
              imageUrl: image,
              category: category || 'Main Dishes',
              culturalContext: 'jaffna',
              ingredients: extractIngredients(description),
              dietaryTags: extractDietaryTags(name + ' ' + description),
              isVeg: isVegetarian(name + ' ' + description),
              isSpicy: isSpicy(name + ' ' + description),
              aiConfidence: 75
            });
          }
        });

        if (menuItems.length > 0) {
          foundItems = true;
          break;
        }
      }
    }

    // Strategy 2: If no structured menu found, look for all text content
    if (!foundItems) {
      console.log('No structured menu found, trying text extraction...');
      
      // Look for price patterns in the entire page
      const bodyText = $('body').text();
      const pricePattern = /([^.\n]+?)\s*(?:LKR|Rs\.?|රු)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi;
      
      let match;
      while ((match = pricePattern.exec(bodyText)) !== null) {
        const itemName = match[1].trim().replace(/[\r\n\t]+/g, ' ');
        const itemPrice = parseFloat(match[2].replace(/,/g, ''));

        if (itemName.length > 3 && itemName.length < 100 && itemPrice > 0) {
          menuItems.push({
            name_english: itemName,
            name_tamil: '',
            description_english: '',
            price: itemPrice,
            currency: 'LKR',
            culturalContext: 'jaffna',
            ingredients: [],
            dietaryTags: extractDietaryTags(itemName),
            isVeg: isVegetarian(itemName),
            isSpicy: isSpicy(itemName),
            aiConfidence: 60
          });
        }
      }
    }

    // Strategy 3: Extract from structured data (JSON-LD, microdata)
    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data['@type'] === 'MenuItem' || data.hasMenuSection) {
          // Extract from structured data
          // Implementation depends on schema
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    console.log(`✅ Extracted ${menuItems.length} menu items from URL`);

    return {
      success: true,
      items: menuItems,
      source: url,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error scraping menu:', error.message);
    throw new Error(`Failed to scrape menu from URL: ${error.message}`);
  }
};

/**
 * Helper function to extract text from multiple selectors
 */
function extractText($element, selectors) {
  for (const selector of selectors) {
    const text = $element.find(selector).first().text().trim();
    if (text) return text;
  }
  return '';
}

/**
 * Helper function to extract price from element
 */
function extractPrice($element, selectors) {
  for (const selector of selectors) {
    const priceText = $element.find(selector).first().text().trim();
    if (priceText) {
      // Extract numeric value from price string
      const match = priceText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
  }
  return 0;
}

/**
 * Helper function to extract image URL
 */
function extractImage($element, $) {
  const imgSelectors = ['img', '.image img', '[class*="image"] img'];
  
  for (const selector of imgSelectors) {
    const $img = $element.find(selector).first();
    if ($img.length) {
      let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy');
      
      // Handle relative URLs
      if (src && !src.startsWith('http')) {
        const baseUrl = new URL($element.baseURI || 'https://example.com');
        src = new URL(src, baseUrl).href;
      }
      
      return src || '';
    }
  }
  
  return '';
}

/**
 * Extract Tamil text from mixed content
 */
function extractTamilText(text) {
  // Tamil Unicode range: \u0B80-\u0BFF
  const tamilMatches = text.match(/[\u0B80-\u0BFF\s]+/g);
  return tamilMatches ? tamilMatches.join(' ').trim() : '';
}

/**
 * Extract ingredients from description
 */
function extractIngredients(description) {
  const ingredientKeywords = [
    'chicken', 'mutton', 'fish', 'prawn', 'crab', 'beef',
    'rice', 'noodles', 'kottu', 'roti', 'naan', 'dosa',
    'curry', 'coconut', 'spices', 'vegetables', 'onion', 'tomato',
    'கோழி', 'மட்டன்', 'மீன்', 'இறால்', 'நண்டு'
  ];

  const ingredients = [];
  const lowerDesc = description.toLowerCase();

  ingredientKeywords.forEach(keyword => {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      ingredients.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });

  return [...new Set(ingredients)]; // Remove duplicates
}

/**
 * Extract dietary tags
 */
function extractDietaryTags(text) {
  const tags = [];
  const lowerText = text.toLowerCase();

  if (lowerText.match(/\b(halal|ஹலால்)\b/i)) tags.push('Halal');
  if (lowerText.match(/\b(spicy|காரம்|கார|hot)\b/i)) tags.push('Spicy');
  if (lowerText.match(/\b(veg|vegetarian|சைவ)\b/i)) tags.push('Vegetarian');
  if (lowerText.match(/\b(gluten.free)\b/i)) tags.push('Gluten-Free');

  return tags;
}

/**
 * Check if item is vegetarian
 */
function isVegetarian(text) {
  const lowerText = text.toLowerCase();
  const vegKeywords = ['veg', 'vegetarian', 'சைவ', 'paneer', 'dhal', 'vegetable'];
  const nonVegKeywords = ['chicken', 'mutton', 'fish', 'prawn', 'beef', 'crab', 'meat', 'கோழி', 'இறைச்சி'];

  // If contains non-veg keywords, definitely not vegetarian
  if (nonVegKeywords.some(kw => lowerText.includes(kw))) {
    return false;
  }

  // If contains veg keywords, probably vegetarian
  return vegKeywords.some(kw => lowerText.includes(kw));
}

/**
 * Check if item is spicy
 */
function isSpicy(text) {
  const lowerText = text.toLowerCase();
  const spicyKeywords = ['spicy', 'hot', 'curry', 'காரம்', 'கார', 'chili', 'pepper'];
  
  return spicyKeywords.some(kw => lowerText.includes(kw));
}

export default {
  scrapeMenuFromUrl
};

