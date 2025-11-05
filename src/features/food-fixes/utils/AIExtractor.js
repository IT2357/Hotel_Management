import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIExtractor {
  constructor() {
    // Initialize with Tamil language model if available
    this.tamilModelPath = path.join(__dirname, '../models/tam_trained.traineddata');
  }

  /**
   * Process an image and extract menu item information
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} Extracted menu item data
   */
  async extractMenuData(imagePath) {
    try {
      // Check if Tamil model exists
      let lang = 'eng'; // Default to English
      if (fs.existsSync(this.tamilModelPath)) {
        lang = 'tam+eng'; // Use both Tamil and English
      }

      // Perform OCR
      const result = await Tesseract.recognize(
        imagePath,
        lang,
        {
          logger: info => console.log(info)
        }
      );

      // Parse the extracted text
      const extractedData = this.parseOCRText(result.data.text);
      return extractedData;
    } catch (error) {
      console.error('Error in OCR processing:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  /**
   * Parse OCR text to extract menu item information
   * @param {string} text - Raw OCR text
   * @returns {Object} Parsed menu item data
   */
  parseOCRText(text) {
    // Split text into lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Initialize result object
    const result = {
      name: {
        en: '',
        ta: ''
      },
      price: 0,
      originalPrice: 0,
      description: {
        en: '',
        ta: ''
      },
      ingredients: [],
      tags: [],
      category: ''
    };

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Try to extract name (look for Tamil or English dish names)
      if (!result.name.en && !result.name.ta) {
        // Check for common Jaffna dishes
        const jaffnaDishes = [
          { en: 'Crab Curry', ta: 'நண்டு கறி' },
          { en: 'Hoppers', ta: 'அப்பம்' },
          { en: 'Brinjal Curry', ta: 'கத்தரிக்கை கறி' },
          { en: 'Mutton Curry', ta: 'ஆட்டுக்கறி' },
          { en: 'Fish Curry', ta: 'மீன் கறி' },
          { en: 'String Hoppers', ta: 'இடியாப்பம்' },
          { en: 'Odiyal Kool', ta: 'ஒடியால் கூல்' }
        ];
        
        for (const dish of jaffnaDishes) {
          if (line.includes(dish.en) || line.includes(dish.ta)) {
            result.name.en = dish.en;
            result.name.ta = dish.ta;
            break;
          }
        }
        
        // If no specific dish found, use the first line as name
        if (!result.name.en && !result.name.ta && line.length > 3) {
          // Simple heuristic: if line contains Tamil characters, assume it's Tamil name
          if (/[அ-ஹ]/.test(line)) {
            result.name.ta = line;
          } else {
            result.name.en = line;
          }
        }
      }
      
      // Try to extract price (look for LKR or numbers)
      if (!result.price) {
        const priceMatch = line.match(/(?:LKR|Rs\.?)\s*(\d+(?:\.\d+)?)/i);
        if (priceMatch) {
          result.originalPrice = parseFloat(priceMatch[1]);
          result.price = result.originalPrice * 0.95; // Apply -5% adjustment
        } else {
          // Look for any number that might be a price
          const numberMatch = line.match(/(\d{2,4})(?:\.\d{2})?/);
          if (numberMatch && !result.originalPrice) {
            result.originalPrice = parseFloat(numberMatch[1]);
            result.price = result.originalPrice * 0.95;
          }
        }
      }
      
      // Try to extract ingredients (look for lists)
      if (result.ingredients.length === 0) {
        // Simple heuristic: look for comma-separated items that might be ingredients
        if (line.includes(',')) {
          const items = line.split(',').map(item => item.trim());
          if (items.length >= 3) { // Assume it's an ingredients list
            result.ingredients = items;
          }
        }
      }
    }
    
    // Set category based on dish name
    if (result.name.en || result.name.ta) {
      const dishName = (result.name.en || result.name.ta).toLowerCase();
      if (dishName.includes('curry') || dishName.includes('கறி')) {
        result.category = 'Curry';
      } else if (dishName.includes('hopper') || dishName.includes('அப்பம') || dishName.includes('இடியாப்பம்')) {
        result.category = 'Hoppers';
      } else if (dishName.includes('kool') || dishName.includes('கூல்')) {
        result.category = 'Kool';
      } else {
        result.category = 'Main Dish';
      }
    }
    
    // Add Jaffna-specific tags
    result.tags = ['Jaffna', 'Traditional', 'Sri Lankan'];
    if (result.name.en && result.name.en.includes('Crab')) {
      result.tags.push('Seafood');
    }
    
    return result;
  }

  /**
   * Train the OCR model with custom Jaffna data
   * @param {string} trainingDataPath - Path to training data directory
   * @returns {Promise<void>}
   */
  async trainModel(trainingDataPath) {
    // In a real implementation, this would use tesstrain or similar
    // For now, we'll just log the process
    console.log('Training model with data from:', trainingDataPath);
    console.log('This would typically involve:');
    console.log('1. Preparing training data (images + ground truth text files)');
    console.log('2. Running tesstrain scripts');
    console.log('3. Generating traineddata file');
    
    // Placeholder for actual training implementation
    // In practice, you would use something like:
    // const { exec } = require('child_process');
    // exec(`make training MODEL_NAME=tam TRAINING_DATA=${trainingDataPath}`, callback);
  }
}

export default new AIExtractor();