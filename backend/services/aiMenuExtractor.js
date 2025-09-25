// 📁 backend/services/aiMenuExtractor.js
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import ValdorScraper from './valdorScraper.js';

class AIMenuExtractor {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    
    this.gemini = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
    
    this.scraper = new ValdorScraper();
  }

  /**
   * Main extraction method - handles URL, image, or file path
   */
  async extractMenu(input) {
    try {
      console.log('🤖 Starting AI menu extraction...');
      
      let extractionResult;
      
      if (this.isUrl(input)) {
        if (input.includes('valdor.foodorders.lk')) {
          // Use specialized Valdor scraper
          extractionResult = await this.extractFromValdorUrl(input);
        } else {
          // Use general web scraping
          extractionResult = await this.extractFromUrl(input);
        }
      } else if (this.isImageUrl(input) || this.isImageFile(input)) {
        // Use OCR + Computer Vision
        extractionResult = await this.extractFromImage(input);
      } else {
        throw new Error('Invalid input: Must be URL, image URL, or image file path');
      }

      // Enrich with Wikipedia data
      const enrichedResult = await this.enrichWithWikipedia(extractionResult);
      
      // Validate against Food schema
      const validatedItems = this.validateFoodSchema(enrichedResult.items);
      
      return {
        ...enrichedResult,
        items: validatedItems,
        extractionMethod: extractionResult.method,
        confidence: extractionResult.confidence || 85,
        processedAt: new Date()
      };

    } catch (error) {
      console.error('❌ AI Menu extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract menu from Valdor website
   */
  async extractFromValdorUrl(url) {
    console.log('🕷️ Using Valdor specialized scraper...');
    
    const scrapedData = await this.scraper.scrapeFullMenu();
    
    return {
      items: scrapedData.items,
      categories: scrapedData.categories,
      source: url,
      method: 'valdor_scraper',
      confidence: 95,
      metadata: scrapedData.metadata
    };
  }

  /**
   * Extract menu from general URL
   */
  async extractFromUrl(url) {
    console.log('🌐 Extracting from general URL...');
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      const htmlContent = response.data;
      
      // Use AI to extract menu from HTML
      const aiResult = await this.extractMenuFromHtml(htmlContent, url);
      
      return {
        items: aiResult.items,
        categories: aiResult.categories,
        source: url,
        method: 'html_ai_extraction',
        confidence: aiResult.confidence || 75,
        rawHtml: htmlContent.substring(0, 5000) // Store first 5KB for debugging
      };

    } catch (error) {
      throw new Error(`Failed to extract from URL: ${error.message}`);
    }
  }

  /**
   * Extract menu from image using OCR + Computer Vision
   */
  async extractFromImage(imagePath) {
    console.log('📷 Extracting from image using OCR + Computer Vision...');
    
    try {
      // Step 1: OCR extraction
      const ocrResult = await this.performOCR(imagePath);
      
      // Step 2: Computer Vision analysis (if available)
      let visionResult = null;
      if (this.openai || this.gemini) {
        visionResult = await this.performVisionAnalysis(imagePath);
      }
      
      // Step 3: Combine and process results
      const combinedText = this.combineExtractionResults(ocrResult, visionResult);
      
      // Step 4: Use AI to structure the menu data
      const structuredResult = await this.structureMenuData(combinedText, imagePath);
      
      return {
        items: structuredResult.items,
        categories: structuredResult.categories,
        source: imagePath,
        method: 'ocr_vision_ai',
        confidence: structuredResult.confidence || 80,
        rawOcr: ocrResult.text,
        rawVision: visionResult?.description
      };

    } catch (error) {
      throw new Error(`Failed to extract from image: ${error.message}`);
    }
  }

  /**
   * Perform OCR on image
   */
  async performOCR(imagePath) {
    console.log('🔍 Performing OCR...');
    
    try {
      const result = await Tesseract.recognize(imagePath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words
      };

    } catch (error) {
      console.error('OCR failed:', error);
      return { text: '', confidence: 0, words: [] };
    }
  }

  /**
   * Perform computer vision analysis
   */
  async performVisionAnalysis(imagePath) {
    console.log('👁️ Performing computer vision analysis...');
    
    try {
      if (this.openai) {
        return await this.analyzeWithOpenAI(imagePath);
      } else if (this.gemini) {
        return await this.analyzeWithGemini(imagePath);
      }
      
      return null;
    } catch (error) {
      console.error('Vision analysis failed:', error);
      return null;
    }
  }

  /**
   * Analyze image with OpenAI Vision
   */
  async analyzeWithOpenAI(imagePath) {
    const imageBuffer = await this.getImageBuffer(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this menu image and extract all food items with their names, prices, descriptions, and categories. Focus on accuracy and completeness."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    return {
      description: response.choices[0].message.content,
      confidence: 90
    };
  }

  /**
   * Analyze image with Google Gemini Vision
   */
  async analyzeWithGemini(imagePath) {
    const model = this.gemini.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const imageBuffer = await this.getImageBuffer(imagePath);
    
    const result = await model.generateContent([
      "Analyze this menu image and extract all food items with their names, prices, descriptions, and categories. Provide detailed information about each item.",
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: "image/jpeg"
        }
      }
    ]);

    return {
      description: result.response.text(),
      confidence: 85
    };
  }

  /**
   * Extract menu from HTML using AI
   */
  async extractMenuFromHtml(htmlContent, sourceUrl) {
    const prompt = `
    Extract menu items from this HTML content. Return a JSON object with:
    - items: array of food items with name, price, description, category
    - categories: array of category names
    
    HTML Content:
    ${htmlContent.substring(0, 8000)}
    
    Focus on finding actual menu items with prices. Categorize items as: Breakfast, Lunch, Dinner, Snacks, Beverage, or Dessert.
    `;

    try {
      let result;
      
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000
        });
        result = response.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
        const response = await model.generateContent(prompt);
        result = response.response.text();
      } else {
        throw new Error('No AI service available');
      }

      // Parse JSON response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          items: parsed.items || [],
          categories: parsed.categories || [],
          confidence: 75
        };
      }

      throw new Error('Could not parse AI response');

    } catch (error) {
      console.error('AI HTML extraction failed:', error);
      return { items: [], categories: [], confidence: 0 };
    }
  }

  /**
   * Structure menu data from extracted text
   */
  async structureMenuData(extractedText, source) {
    const prompt = `
    Structure this extracted menu text into a JSON object with:
    - items: array of food items with name, price, description, category
    - categories: array of category names
    
    Extracted Text:
    ${extractedText}
    
    Rules:
    - Categorize items as: Breakfast, Lunch, Dinner, Snacks, Beverage, or Dessert
    - Extract prices in LKR (remove currency symbols, keep numbers only)
    - Generate descriptions if missing
    - Ensure all items have valid names and prices
    `;

    try {
      let result;
      
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000
        });
        result = response.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
        const response = await model.generateContent(prompt);
        result = response.response.text();
      } else {
        // Fallback: basic text parsing
        return this.basicTextParsing(extractedText);
      }

      // Parse JSON response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          items: parsed.items || [],
          categories: parsed.categories || [],
          confidence: 80
        };
      }

      throw new Error('Could not parse AI response');

    } catch (error) {
      console.error('AI structuring failed:', error);
      return this.basicTextParsing(extractedText);
    }
  }

  /**
   * Basic text parsing fallback
   */
  basicTextParsing(text) {
    const items = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      // Look for patterns like "Item Name - Rs. 950" or "Item Name Rs 950"
      const match = line.match(/^(.+?)\s*[-–]\s*(?:Rs\.?\s*|LKR\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (match) {
        const name = match[1].trim();
        const price = parseFloat(match[2].replace(/,/g, ''));
        
        if (name.length > 2 && price > 0) {
          items.push({
            name,
            price,
            description: `Delicious ${name}`,
            category: this.categorizeBasic(name)
          });
        }
      }
    }

    return {
      items,
      categories: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'],
      confidence: 60
    };
  }

  /**
   * Enrich menu items with Wikipedia data
   */
  async enrichWithWikipedia(extractionResult) {
    console.log('📚 Enriching with Wikipedia data...');
    
    const enrichedItems = [];
    
    for (const item of extractionResult.items) {
      try {
        const wikipediaData = await this.getWikipediaData(item.name);
        const enrichedItem = {
          ...item,
          ingredients: item.ingredients || this.extractIngredients(wikipediaData),
          allergens: item.allergens || this.extractAllergens(wikipediaData),
          dietaryTags: item.dietaryTags || this.extractDietaryTags(wikipediaData),
          preparationTimeMinutes: item.preparationTimeMinutes || this.estimatePreparationTime(item.name, item.category),
          seasonal: item.seasonal || false,
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
          sentimentBreakdown: item.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 }
        };
        
        enrichedItems.push(enrichedItem);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to enrich ${item.name}:`, error.message);
        // Add item without Wikipedia enrichment
        enrichedItems.push({
          ...item,
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          dietaryTags: item.dietaryTags || [],
          preparationTimeMinutes: item.preparationTimeMinutes || 20,
          seasonal: false,
          isAvailable: true,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
        });
      }
    }

    return {
      ...extractionResult,
      items: enrichedItems
    };
  }

  /**
   * Get Wikipedia data for a food item
   */
  async getWikipediaData(itemName) {
    try {
      // Search for the item
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(itemName)}`;
      const response = await axios.get(searchUrl, { timeout: 5000 });
      
      return {
        title: response.data.title,
        extract: response.data.extract,
        description: response.data.description
      };
      
    } catch (error) {
      // Try alternative search
      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(itemName)}&prop=extracts&exintro=true&explaintext=true&origin=*`;
        const response = await axios.get(searchUrl, { timeout: 5000 });
        
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId !== '-1' && pages[pageId].extract) {
          return {
            title: pages[pageId].title,
            extract: pages[pageId].extract,
            description: pages[pageId].extract.substring(0, 200)
          };
        }
      } catch (altError) {
        console.error(`Wikipedia alternative search failed for ${itemName}`);
      }
      
      return null;
    }
  }

  /**
   * Extract ingredients from Wikipedia data
   */
  extractIngredients(wikipediaData) {
    if (!wikipediaData || !wikipediaData.extract) return [];
    
    const text = wikipediaData.extract.toLowerCase();
    const commonIngredients = [
      'rice', 'chicken', 'beef', 'fish', 'egg', 'onion', 'garlic', 'ginger',
      'coconut', 'curry', 'spices', 'chili', 'tomato', 'potato', 'carrot',
      'flour', 'oil', 'salt', 'pepper', 'lemon', 'lime', 'herbs'
    ];
    
    const foundIngredients = commonIngredients.filter(ingredient => 
      text.includes(ingredient)
    );
    
    return foundIngredients.map(ingredient => 
      ingredient.charAt(0).toUpperCase() + ingredient.slice(1)
    );
  }

  /**
   * Extract allergens from Wikipedia data
   */
  extractAllergens(wikipediaData) {
    if (!wikipediaData || !wikipediaData.extract) return [];
    
    const text = wikipediaData.extract.toLowerCase();
    const allergens = [];
    
    if (text.includes('egg')) allergens.push('Egg');
    if (text.includes('milk') || text.includes('dairy') || text.includes('cheese')) allergens.push('Dairy');
    if (text.includes('wheat') || text.includes('gluten') || text.includes('flour')) allergens.push('Gluten');
    if (text.includes('fish')) allergens.push('Fish');
    if (text.includes('shellfish') || text.includes('prawn') || text.includes('crab')) allergens.push('Shellfish');
    if (text.includes('nut') || text.includes('peanut') || text.includes('almond')) allergens.push('Nuts');
    
    return allergens;
  }

  /**
   * Extract dietary tags from Wikipedia data
   */
  extractDietaryTags(wikipediaData) {
    if (!wikipediaData || !wikipediaData.extract) return [];
    
    const text = wikipediaData.extract.toLowerCase();
    const tags = [];
    
    if (text.includes('vegetarian') || (!text.includes('meat') && !text.includes('chicken') && !text.includes('beef') && !text.includes('fish'))) {
      tags.push('Vegetarian');
    } else {
      tags.push('Non-Vegetarian');
    }
    
    if (text.includes('spicy') || text.includes('hot') || text.includes('chili')) tags.push('Spicy');
    if (text.includes('vegan')) tags.push('Vegan');
    if (text.includes('halal')) tags.push('Halal');
    if (text.includes('gluten-free') || (!text.includes('wheat') && !text.includes('flour'))) tags.push('Gluten-Free');
    
    return tags;
  }

  /**
   * Validate items against Food schema
   */
  validateFoodSchema(items) {
    const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'];
    
    return items.filter(item => {
      // Must have name and price
      if (!item.name || !item.price || item.price <= 0) return false;
      
      // Normalize category
      if (!item.category || !validCategories.includes(item.category)) {
        item.category = this.categorizeBasic(item.name);
      }
      
      // Ensure required fields
      item.description = item.description || `Delicious ${item.name}`;
      item.imageUrl = item.imageUrl || null;
      item.preparationTimeMinutes = item.preparationTimeMinutes || 20;
      item.ingredients = item.ingredients || [];
      item.allergens = item.allergens || [];
      item.dietaryTags = item.dietaryTags || [];
      item.seasonal = item.seasonal || false;
      item.isAvailable = item.isAvailable !== undefined ? item.isAvailable : true;
      item.sentimentBreakdown = item.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 };
      
      return true;
    });
  }

  // Utility methods
  isUrl(input) {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }

  isImageUrl(input) {
    return this.isUrl(input) && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(input);
  }

  isImageFile(input) {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(input);
  }

  async getImageBuffer(imagePath) {
    if (this.isUrl(imagePath)) {
      const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } else {
      const fs = await import('fs');
      return fs.readFileSync(imagePath);
    }
  }

  combineExtractionResults(ocrResult, visionResult) {
    let combinedText = ocrResult.text || '';
    
    if (visionResult && visionResult.description) {
      combinedText += '\n\nVision Analysis:\n' + visionResult.description;
    }
    
    return combinedText;
  }

  categorizeBasic(name) {
    const text = name.toLowerCase();
    
    if (text.includes('breakfast') || text.includes('egg') || text.includes('toast')) return 'Breakfast';
    if (text.includes('rice') || text.includes('curry') || text.includes('lunch')) return 'Lunch';
    if (text.includes('dinner') || text.includes('noodles') || text.includes('pasta')) return 'Dinner';
    if (text.includes('drink') || text.includes('juice') || text.includes('tea') || text.includes('coffee')) return 'Beverage';
    if (text.includes('dessert') || text.includes('ice cream') || text.includes('cake')) return 'Dessert';
    
    return 'Snacks';
  }

  estimatePreparationTime(name, category) {
    const text = name.toLowerCase();
    
    if (text.includes('rice') || text.includes('biryani') || text.includes('curry')) return 45;
    if (text.includes('noodles') || text.includes('pasta') || text.includes('kottu')) return 30;
    if (text.includes('sandwich') || text.includes('toast') || text.includes('wrap')) return 15;
    if (category === 'Beverage') return 5;
    if (category === 'Dessert') return 10;
    
    return 25;
  }
}

export default AIMenuExtractor;
