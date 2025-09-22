// 📁 backend/services/aiImageAnalysisService.js
import geminiService from './external/geminiService.js';
import logger from '../utils/logger.js';

class AIImageAnalysisService {
  constructor() {
    this.geminiService = geminiService;
  }

  /**
   * Analyze food image using AI
   * @param {Buffer|string} imageBuffer - Image buffer or file path
   * @param {string} mimeType - MIME type of the image
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeFoodImage(imageBuffer, mimeType, originalName) {
    try {
      console.log('🤖 Starting AI image analysis...');
      console.log('🤖 Image type:', mimeType);
      console.log('🤖 Original name:', originalName);

      if (!this.geminiService.isConfigured()) {
        throw new Error('Gemini AI service is not configured');
      }

      // Create temporary file path for analysis
      const tempFilePath = `/tmp/${Date.now()}_${originalName}`;

      // Write buffer to temporary file
      const fs = await import('fs');
      fs.writeFileSync(tempFilePath, imageBuffer);

      try {
        // Generate detailed description using Gemini
        const description = await this.geminiService.generateImageDescription(tempFilePath, 'file');

        console.log('🤖 AI description generated successfully');

        // Generate menu items from description
        const menuItems = await this.geminiService.generateMenuItemsFromDescription(description, {
          cuisineType: 'Sri Lankan',
          dietaryRestrictions: []
        });

        console.log('🤖 Generated menu items:', menuItems.length);

        // Clean up temporary file
        fs.unlinkSync(tempFilePath);

        return {
          description,
          menuItems,
          confidence: 85, // Default confidence score
          analysisMethod: 'gemini-ai',
          timestamp: new Date().toISOString()
        };

      } catch (analysisError) {
        // Clean up temporary file on error
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file:', cleanupError.message);
        }
        throw analysisError;
      }

    } catch (error) {
      console.error('❌ AI image analysis failed:', error.message);
      logger.error('AI image analysis error', {
        error: error.message,
        stack: error.stack,
        mimeType,
        originalName
      });

      // Return fallback analysis
      return {
        description: `Image analysis failed: ${error.message}. This appears to be a ${mimeType} file named ${originalName}.`,
        menuItems: [],
        confidence: 0,
        analysisMethod: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Convert AI analysis result to menu format
   * @param {Object} analysisResult - Result from analyzeFoodImage
   * @returns {Object} Menu data structure
   */
  convertToMenuFormat(analysisResult) {
    try {
      console.log('🔄 Converting AI analysis to menu format...');

      const { description, menuItems, confidence } = analysisResult;

      // Create categories from menu items
      const categoriesMap = new Map();

      menuItems.forEach(item => {
        const categoryName = item.category || 'Main Course';
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            name: categoryName,
            items: []
          });
        }
        categoriesMap.get(categoryName).items.push({
          name: item.name,
          price: item.price,
          description: item.description,
          ingredients: item.ingredients || [],
          isVeg: item.isVeg || false,
          isSpicy: item.isSpicy || false,
          cookingTime: item.cookingTime || 15,
          nutritionalInfo: item.nutritionalInfo || {
            calories: 300,
            protein: 15,
            carbs: 25,
            fat: 12
          }
        });
      });

      const categories = Array.from(categoriesMap.values());

      // If no items were generated, create a fallback category
      if (categories.length === 0) {
        categories.push({
          name: 'Featured Dishes',
          items: [{
            name: 'AI-Detected Dish',
            price: 15.99,
            description: description || 'A dish detected by AI analysis',
            ingredients: ['Fresh ingredients'],
            isVeg: true,
            isSpicy: false,
            cookingTime: 20,
            nutritionalInfo: {
              calories: 350,
              protein: 18,
              carbs: 30,
              fat: 15
            }
          }]
        });
      }

      const menuData = {
        title: 'AI-Generated Menu',
        categories,
        totalCategories: categories.length,
        totalItems: categories.reduce((sum, cat) => sum + cat.items.length, 0),
        confidence: confidence || 0,
        extractionMethod: 'ai-gemini',
        aiAnalysis: {
          description,
          generatedAt: new Date().toISOString(),
          model: 'gemini-1.5-flash'
        }
      };

      console.log('✅ Menu format conversion completed');
      console.log('📊 Generated:', menuData.totalCategories, 'categories,', menuData.totalItems, 'items');

      return menuData;

    } catch (error) {
      console.error('❌ Menu format conversion failed:', error.message);
      logger.error('Menu format conversion error', {
        error: error.message,
        stack: error.stack
      });

      // Return fallback menu data
      return {
        title: 'AI Analysis Failed',
        categories: [{
          name: 'Error',
          items: [{
            name: 'Analysis Error',
            price: 0,
            description: `Failed to convert AI analysis: ${error.message}`,
            ingredients: [],
            isVeg: false,
            isSpicy: false,
            cookingTime: 0,
            nutritionalInfo: {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0
            }
          }]
        }],
        totalCategories: 1,
        totalItems: 1,
        confidence: 0,
        extractionMethod: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check if AI service is available
   * @returns {boolean} True if AI service is configured
   */
  isAvailable() {
    return this.geminiService.isConfigured();
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      service: 'Gemini AI',
      model: 'gemini-1.5-flash',
      capabilities: ['image-analysis', 'menu-generation', 'text-description']
    };
  }
}

export default new AIImageAnalysisService();