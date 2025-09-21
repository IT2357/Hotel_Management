import vision from '@google-cloud/vision';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

class OCRService {
  constructor() {
    this.visionClient = null;
    this.initializeGoogleVision();
  }

  async initializeGoogleVision() {
    try {
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

      console.log('🔍 DEBUG: Initializing Google Vision API...');
      console.log('🔍 DEBUG: Environment variables check:');
      console.log('🔍 DEBUG: - GOOGLE_APPLICATION_CREDENTIALS:', credentials ? 'Set' : 'Not set');
      console.log('🔍 DEBUG: - GOOGLE_CLOUD_PROJECT_ID:', projectId ? 'Set' : 'Not set');

      if (credentials) {
        // Check if credentials is a placeholder
        if (credentials === './config/google-credentials.json' && !fs.existsSync(credentials)) {
          console.warn('⚠️ Google Vision credentials file not found at:', credentials);
          console.warn('Please ensure the Google Cloud credentials JSON file exists.');
          return;
        }

        this.visionClient = new vision.ImageAnnotatorClient();
        console.log('✅ Google Vision API initialized successfully');
      } else {
        console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS not set. OCR will fallback to Tesseract.');
      }
    } catch (error) {
      console.warn('⚠️ Google Vision API not available:', error.message);
      console.warn('⚠️ This could be due to:');
      console.warn('⚠️ 1. Invalid credentials file');
      console.warn('⚠️ 2. Missing @google-cloud/vision dependency');
      console.warn('⚠️ 3. Network connectivity issues');
    }
  }

  /**
   * Extract text from image using Google Vision API (preferred) or Tesseract (fallback)
   * @param {Buffer|string} imageInput - Image buffer or file path
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} - { text: string, confidence: number, method: string }
   */
  async extractText(imageInput, options = {}) {
    try {
      // Try Google Vision first if available
      if (this.visionClient && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return await this.extractWithGoogleVision(imageInput);
      }
      
      // Fallback to Tesseract
      return await this.extractWithTesseract(imageInput, options);
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text using Google Vision API
   * @param {Buffer|string} imageInput 
   * @returns {Promise<Object>}
   */
  async extractWithGoogleVision(imageInput) {
    try {
      let imageBuffer;
      
      if (Buffer.isBuffer(imageInput)) {
        imageBuffer = imageInput;
      } else if (typeof imageInput === 'string') {
        imageBuffer = fs.readFileSync(imageInput);
      } else {
        throw new Error('Invalid image input type');
      }

      const [result] = await this.visionClient.textDetection({
        image: { content: imageBuffer }
      });

      const detections = result.textAnnotations;
      const text = detections.length > 0 ? detections[0].description : '';
      
      // Calculate confidence from detection scores
      let confidence = 0;
      if (detections.length > 1) {
        const scores = detections.slice(1).map(d => d.score || 0.8);
        confidence = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
      }

      return {
        text: text || '',
        confidence: confidence || 85,
        method: 'google-vision',
        rawData: detections
      };
    } catch (error) {
      console.error('Google Vision OCR error:', error);
      throw error;
    }
  }

  /**
   * Extract text using Tesseract.js (fallback)
   * @param {Buffer|string} imageInput 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async extractWithTesseract(imageInput, options = {}) {
    try {
      const tesseractOptions = {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        ...options
      };

      const { data } = await Tesseract.recognize(imageInput, 'eng', tesseractOptions);
      
      return {
        text: data.text || '',
        confidence: Math.round(data.confidence || 70),
        method: 'tesseract',
        rawData: data
      };
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw error;
    }
  }

  /**
   * Parse extracted text into menu structure
   * @param {string} text - Raw OCR text
   * @returns {Object} - Structured menu data
   */
  parseMenuText(text) {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const categories = [];
      let currentCategory = null;
      
      // Common category keywords
      const categoryKeywords = [
        'appetizer', 'starter', 'soup', 'salad', 'main', 'entree', 'pasta', 'pizza',
        'dessert', 'beverage', 'drink', 'coffee', 'tea', 'wine', 'beer', 'cocktail',
        'breakfast', 'lunch', 'dinner', 'special', 'combo', 'platter', 'biriyani',
        'biryani', 'koththu', 'kottu', 'rice', 'noodles', 'curry', 'grill', 'fried'
      ];

      // Price regex patterns (supports multiple currencies)
      const pricePatterns = [
        /\$?(\d+\.?\d*)/,     // $15.99 or 15.99
        /(\d+)\s*rs/i,        // 250 Rs
        /rs\s*(\d+)/i,        // Rs 250
        /₹\s*(\d+)/,          // ₹250
        /(\d+)\s*\/-/,        // 250/-
        /lkr\s*(\d+)/i,       // LKR 250
        /(\d+)\s*lkr/i        // 250 LKR
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;

        // Check if line might be a category
        const isCategory = categoryKeywords.some(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        ) && !pricePatterns.some(pattern => pattern.test(line));

        if (isCategory) {
          currentCategory = {
            name: this.cleanCategoryName(line),
            items: []
          };
          categories.push(currentCategory);
          continue;
        }

        // Try to extract menu item with price
        let price = 0;
        let name = line;
        let description = '';

        // Extract price
        for (const pattern of pricePatterns) {
          const match = line.match(pattern);
          if (match) {
            price = parseFloat(match[1]);
            name = line.replace(pattern, '').trim();
            break;
          }
        }

        // If we found a price, this is likely a menu item
        if (price > 0) {
          // Clean up the name
          name = this.cleanItemName(name);
          
          // Check if next line might be description
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (!pricePatterns.some(pattern => pattern.test(nextLine)) && 
                nextLine.length > 10 && nextLine.length < 100 &&
                !categoryKeywords.some(keyword => nextLine.toLowerCase().includes(keyword))) {
              description = nextLine;
              i++; // Skip the description line in next iteration
            }
          }

          const item = {
            name: name || 'Unknown Item',
            price: price,
            description: description,
            image: '' // Will be populated later if image processing is available
          };

          if (currentCategory) {
            currentCategory.items.push(item);
          } else {
            // Create default category if none exists
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

      // Filter out empty categories
      return categories.filter(cat => cat.items.length > 0);
    } catch (error) {
      console.error('Error parsing menu text:', error);
      return [];
    }
  }

  /**
   * Clean category name
   * @param {string} name 
   * @returns {string}
   */
  cleanCategoryName(name) {
    return name
      .replace(/[^\w\s&-]/g, '') // Remove special chars except &, -, space
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clean item name
   * @param {string} name 
   * @returns {string}
   */
  cleanItemName(name) {
    return name
      .replace(/[.]{2,}/g, '')   // Remove multiple dots
      .replace(/[-]{2,}/g, '-')  // Normalize dashes
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim();
  }

  /**
   * Validate and enhance menu structure
   * @param {Array} categories 
   * @returns {Array}
   */
  validateMenuStructure(categories) {
    return categories.map(category => ({
      name: category.name || 'Unnamed Category',
      items: category.items.filter(item => 
        item.name && 
        item.name.length > 0 && 
        typeof item.price === 'number' && 
        item.price > 0
      ).map(item => ({
        name: item.name,
        price: Math.round(item.price * 100) / 100, // Round to 2 decimal places
        description: item.description || '',
        image: item.image || ''
      }))
    })).filter(category => category.items.length > 0);
  }
}

export default new OCRService();
