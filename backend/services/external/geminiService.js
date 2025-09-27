import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;

    // Initialize Gemini AI client
    this.initializeGemini();
  }

  initializeGemini() {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

      console.log('🔍 DEBUG: Initializing Gemini AI service...');
      console.log('🔍 DEBUG: Environment variables check:');
      console.log('🔍 DEBUG: - GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Not set');
      console.log('🔍 DEBUG: - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
      console.log('🔍 DEBUG: - Selected API key:', apiKey ? 'Available' : 'Not available');

      if (!apiKey) {
        console.warn('⚠️ Gemini AI API key not found. Image description generation will not work.');
        console.warn('Required environment variables: GOOGLE_AI_API_KEY or GEMINI_API_KEY');
        console.warn('Please set these in backend/.env file');
        return;
      }

      // Check if API key looks like a placeholder
      if (apiKey === 'your-google-ai-api-key' || apiKey === 'your-gemini-api-key') {
        console.warn('⚠️ Gemini AI API key appears to be a placeholder value.');
        console.warn('Please replace with actual API key from Google AI Studio.');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Gemini AI:', error.message);
      console.error('❌ DEBUG: This could be due to:');
      console.error('❌ DEBUG: 1. Invalid API key format');
      console.error('❌ DEBUG: 2. Network connectivity issues');
      console.error('❌ DEBUG: 3. Missing dependencies (@google/generative-ai)');
    }
  }

  /**
   * Generate detailed description of an image
   * @param {string} imagePath - Path to the image file or URL
   * @param {string} type - Type of image ('url' or 'file')
   * @returns {Promise<string>} Detailed description of the image
   */
  async generateImageDescription(imagePath, type = 'file') {
    console.log('🔍 DEBUG: Starting Gemini image description generation');
    console.log('🔍 DEBUG: Image path:', imagePath);
    console.log('🔍 DEBUG: Type:', type);
    console.log('🔍 DEBUG: Model configured:', this.model ? 'Yes' : 'No');

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 DEBUG: Attempt ${attempt}/${maxRetries} to generate image description`);
        if (!this.model) {
          throw new Error('Gemini AI is not properly configured');
        }

        let imageData;

        if (type === 'url') {
          // For URLs, fetch the image and convert to the required format
          const response = await this.fetchWithTimeout(imagePath, 10000); // 10 second timeout
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('URL does not point to a valid image');
          }

          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            throw new Error('Image data is empty');
          }

          // Check image size (max 20MB for Gemini)
          if (arrayBuffer.byteLength > 20 * 1024 * 1024) {
            throw new Error('Image size too large (max 20MB)');
          }

          imageData = {
            inlineData: {
              data: Buffer.from(arrayBuffer).toString('base64'),
              mimeType: contentType
            }
          };
        } else {
          // For file paths, read the file
          if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
          }

          const stats = fs.statSync(imagePath);
          if (stats.size === 0) {
            throw new Error('Image file is empty');
          }

          if (stats.size > 20 * 1024 * 1024) {
            throw new Error('Image file too large (max 20MB)');
          }

          const imageBuffer = fs.readFileSync(imagePath);
          const mimeType = this.getMimeType(imagePath);

          imageData = {
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: mimeType
            }
          };
        }

        const prompt = `Analyze this image and provide a detailed description. If this appears to be a food item, menu, or dish, describe it in detail including:
        - What type of food/dish it appears to be
        - Visual appearance (colors, textures, presentation)
        - Key ingredients you can identify
        - Any distinctive features or garnishes
        - Overall presentation and style
        - Any text or labels visible in the image

        If it's not food-related, provide a general detailed description of what's in the image.

        Please be specific and detailed in your description.`;

        console.log('🔍 DEBUG: Sending request to Gemini AI...');
        const result = await this.model.generateContent([prompt, imageData]);
        console.log('🔍 DEBUG: Received response from Gemini AI');

        const response = await result.response;
        console.log('🔍 DEBUG: Response object:', response ? 'Present' : 'Null');

        if (!response.text()) {
          console.log('🔍 DEBUG: Response text is empty');
          throw new Error('Empty response from Gemini AI');
        }

        const description = response.text();
        console.log('🔍 DEBUG: Generated description length:', description.length);
        console.log('🔍 DEBUG: Description preview:', description.substring(0, 100) + '...');
        return description;

      } catch (error) {
        lastError = error;
        console.error(`Gemini AI attempt ${attempt} failed:`, error.message);

        // Don't retry on certain errors
        if (error.message.includes('not found') ||
            error.message.includes('not properly configured') ||
            error.message.includes('too large') ||
            error.message.includes('empty')) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // If all retries failed, throw the last error
    throw new Error(`Failed to generate image description after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Fetch with timeout
   * @param {string} url - URL to fetch
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Hotel-Management-System/1.0'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Generate menu items from image description
   * @param {string} imageDescription - Description from Gemini AI
   * @param {Object} options - Additional options for menu generation
   * @returns {Promise<Array>} Array of menu items
   */
  async generateMenuItemsFromDescription(imageDescription, options = {}) {
    try {
      if (!this.model) {
        throw new Error('Gemini AI is not properly configured');
      }

      const {
        cuisineType = 'General',
        dietaryRestrictions = [],
        culturalContext = '',
        regionSpecific = '',
        detailLevel = 'standard',
        includeContext = ''
      } = options;

      const isWikipediaLevel = detailLevel === 'wikipedia';

      const prompt = `Based on this image description, generate 3-5 detailed menu items that could be created based on what's shown:

      "${imageDescription}"

      Please generate menu items with the following structure for each item:
      - name: A creative, appealing name for the dish
      - description: ${isWikipediaLevel ?
        'A comprehensive Wikipedia-like description including: cultural significance, traditional preparation methods, historical context, regional variations, typical accompaniments, and serving traditions' :
        'A detailed description based on the image analysis'}
      - price: A reasonable price between Rs.150-800 (Sri Lankan Rupees, appropriate for Jaffna market)
      - category: Appropriate category from the specified cuisine categories
      - ingredients: Array of key ingredients identified or inferred, including traditional Jaffna ingredients
      - isVeg: Boolean indicating if it's vegetarian
      - isSpicy: Boolean indicating if it appears spicy (consider Jaffna spice levels)
      - cookingTime: Estimated cooking time in minutes
      - nutritionalInfo: Object with detailed calories, protein, carbs, fat estimates
      ${isWikipediaLevel ? `- culturalSignificance: Historical and cultural importance in Jaffna Tamil cuisine
      - traditionalRecipe: Traditional preparation methods
      - regionalVariations: How this dish varies across Jaffna regions
      - servingTraditions: Traditional ways of serving and eating this dish` : ''}

      Cuisine type: ${cuisineType}
      ${culturalContext ? `Cultural context: ${culturalContext}` : ''}
      ${regionSpecific ? `Regional specialties: ${regionSpecific}` : ''}
      ${includeContext ? `Additional context: ${includeContext}` : ''}
      Dietary restrictions to consider: ${dietaryRestrictions.join(', ') || 'None'}

      ${isWikipediaLevel ?
        'Provide encyclopedic-level detail for each dish, similar to a Wikipedia entry. Include historical context, cultural significance, traditional recipes, and regional importance in Jaffna Tamil cuisine.' :
        'Make the items sound appealing and professional for a restaurant menu. Focus on authentic regional cuisine and traditional cooking methods.'}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      // Parse the generated text to extract menu items
      return this.parseGeneratedMenuItems(generatedText);
    } catch (error) {
      console.error('Error generating menu items from description:', error);
      throw new Error(`Failed to generate menu items: ${error.message}`);
    }
  }

  /**
   * Parse the generated text from Gemini to extract menu items
   * @param {string} generatedText - Raw text from Gemini
   * @returns {Array} Array of menu items
   */
  parseGeneratedMenuItems(generatedText) {
    const items = [];

    try {
      // Try to extract JSON-like structures from the text
      const jsonMatches = generatedText.match(/\{[^}]*\{[^}]*\}[^}]*\}/g);

      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const item = JSON.parse(match);
            if (item.name && item.price) {
              items.push({
                name: item.name,
                description: item.description || '',
                price: parseFloat(item.price) || 12.99,
                category: item.category || 'Main Course',
                ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
                isVeg: Boolean(item.isVeg),
                isSpicy: Boolean(item.isSpicy),
                isPopular: false,
                cookingTime: parseInt(item.cookingTime) || 15,
                nutritionalInfo: {
                  calories: parseInt(item.nutritionalInfo?.calories) || 300,
                  protein: parseInt(item.nutritionalInfo?.protein) || 15,
                  carbs: parseInt(item.nutritionalInfo?.carbs) || 25,
                  fat: parseInt(item.nutritionalInfo?.fat) || 12
                },
                // Wikipedia-level additional fields
                culturalSignificance: item.culturalSignificance || '',
                traditionalRecipe: item.traditionalRecipe || '',
                regionalVariations: item.regionalVariations || '',
                servingTraditions: item.servingTraditions || ''
              });
            }
          } catch (parseError) {
            // Skip invalid JSON
            continue;
          }
        }
      }

      // If no valid items found, create fallback items
      if (items.length === 0) {
        items.push({
          name: 'Featured Dish',
          description: 'A delicious dish based on the analyzed image',
          price: 14.99,
          category: 'Main Course',
          ingredients: ['Fresh ingredients'],
          isVeg: true,
          isSpicy: false,
          isPopular: true,
          cookingTime: 20,
          nutritionalInfo: {
            calories: 350,
            protein: 18,
            carbs: 30,
            fat: 15
          }
        });
      }

    } catch (error) {
      console.error('Error parsing generated menu items:', error);
    }

    return items;
  }

  /**
   * Get MIME type from file extension
   * @param {string} filePath - Path to the file
   * @returns {string} MIME type
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Check if Gemini AI is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return this.model !== null;
  }
}

export default new GeminiService();