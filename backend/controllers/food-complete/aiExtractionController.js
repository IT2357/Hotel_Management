/**
 * 🤖 AI Menu Extraction Controller (2025 Production)
 * OCR with Tesseract.js + LLM parsing for Tamil/Jaffna cuisine
 * Handles: Image → Text → Structured JSON (name_tamil, name_eng, price_lkr, ingredients)
 */

import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import Category from '../../models/Category.js';
import config from '../../config/environment.js';
import visionMenuService from '../../services/ai/visionMenuService.js';

/**
 * Preprocess image for better OCR accuracy
 * - Resize to optimal dimensions
 * - Enhance contrast
 * - Convert to grayscale
 */
async function preprocessImage(imageBuffer) {
  try {
    // First pass: upscale slightly to help OCR, convert to grayscale, normalize, and sharpen
    let img = sharp(imageBuffer)
      .resize(2200, null, { // Slightly larger for small fonts
        fit: 'inside',
        withoutEnlargement: true
      })
      .grayscale()
      .normalize()
      .sharpen();

    // Apply adaptive threshold to increase contrast between text and background
    // Using linear + threshold as a proxy for binarization
    const preprocessed = await img
      .linear(1.1, -10) // increase contrast slightly
      .toColourspace('b-w')
      .threshold(180) // binarize; tweak if images are too light/dark
      .toBuffer();

    return preprocessed;
  } catch (error) {
    console.error('❌ Image preprocessing failed:', error);
    return imageBuffer; // Return original if preprocessing fails
  }
}

/**
 * Parse extracted text to structured menu data
 * Uses regex patterns + heuristics for Jaffna Tamil/English menus
 * 
 * Example text formats:
 * "நண்டு கறி Crab Curry LKR 1200 Ingredients: crab, coconut, curry leaves"
 * "அப்பம் Appam Rs. 250 Hoppers with coconut milk"
 */
function parseMenuText(text) {
  const menuItems = [];
  
  // Split into lines and clean
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 3); // Ignore very short lines

  // Patterns for Jaffna menus
  const patterns = {
    // Price patterns: "LKR 500", "Rs. 250", "500/-"
  // NOTE: fixed bug: used \\d instead of d in decimal capture
  price: /(?:LKR|Rs\.?|රු)\s*(\d+(?:[,.]\d{2})?)\s*(?:\/-)?/i,
    
    // Tamil Unicode range
    tamil: /[\u0B80-\u0BFF]+/g,
    
    // English word (2+ chars, alphabetic)
    english: /\b[A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})*\b/g,
    
    // Ingredients marker
    ingredients: /(?:ingredients?|contains?|made with)[:：\s]+(.*?)(?:\.|$)/i,
    
    // Dietary tags
    veg: /\b(veg|vegetarian|純素|சைவ)\b/i,
    nonVeg: /\b(non-veg|non-vegetarian|chicken|mutton|fish|crab|prawn|beef|pork|meat|இறைச்சி)\b/i,
    spicy: /\b(spicy|hot|காரம்|கார)\b/i,
    halal: /\b(halal|ஹலால்)\b/i
  };

  // Common Jaffna dish keywords for category detection
  const categoryKeywords = {
    breakfast: ['appam', 'அப்பம்', 'idiyappam', 'இடியாப்பம்', 'pittu', 'புட்டு', 'dosai', 'தோசை', 'hoppers'],
    seafood: ['crab', 'நண்டு', 'prawn', 'இறால்', 'fish', 'மீன்', 'seafood'],
    meat: ['mutton', 'ஆட்டு', 'chicken', 'கோழி', 'lamb', 'meat', 'இறைச்சி'],
    vegetarian: ['brinjal', 'கத்தரிக்காய்', 'dhal', 'பருப்பு', 'veg', 'vegetable'],
    rice: ['rice', 'சோறு', 'biryani', 'பிரியாணி', 'kottu', 'கொத்து'],
    beverages: ['tea', 'தேநீர்', 'coffee', 'காபி', 'juice'],
    desserts: ['sweet', 'இனிப்பு', 'watalappan', 'vadai', 'வடை']
  };

  // Process each line as potential menu item
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract price
    const priceMatch = line.match(patterns.price);
    if (!priceMatch) continue; // Skip lines without price

    const price = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (price < 50 || price > 5000) continue; // Skip invalid prices

    // Extract Tamil name (first Tamil text found)
    const tamilMatches = line.match(patterns.tamil);
    const name_tamil = tamilMatches ? tamilMatches.join(' ').trim() : '';

    // Extract English name (capitalized words before/after Tamil)
    const englishMatches = line.match(patterns.english);
    let name_english = '';
    if (englishMatches) {
      // Filter out common non-name words
      const filtered = englishMatches.filter(word => 
        !['LKR', 'Rs', 'Ingredients', 'Contains', 'Made'].includes(word)
      );
      name_english = filtered.slice(0, 3).join(' '); // Max 3 words for name
    }

    // Skip if no name found
    if (!name_tamil && !name_english) continue;

    // Extract description/ingredients from next line or same line
    let description = '';
    let ingredients = [];
    
    const ingredientsMatch = line.match(patterns.ingredients);
    if (ingredientsMatch) {
      const ingredientsText = ingredientsMatch[1];
      ingredients = ingredientsText
        .split(/[,;،]/)
        .map(ing => ing.trim())
        .filter(ing => ing.length > 2 && ing.length < 30)
        .slice(0, 10); // Max 10 ingredients
    }

    // Check next line for description if current line doesn't have ingredients
    if (ingredients.length === 0 && i < lines.length - 1) {
      const nextLine = lines[i + 1];
      if (!nextLine.match(patterns.price)) { // Next line is not a new item
        description = nextLine.substring(0, 200); // Max 200 chars
      }
    }

    // Detect category based on keywords
    let categoryGuess = 'other';
    const lineLower = line.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lineLower.includes(keyword.toLowerCase()))) {
        categoryGuess = category;
        break;
      }
    }

    // Detect dietary tags
    const dietaryTags = [];
    if (patterns.veg.test(line) && !patterns.nonVeg.test(line)) {
      dietaryTags.push('veg');
    }
    if (patterns.nonVeg.test(line)) {
      dietaryTags.push('non-veg');
    }
    if (patterns.spicy.test(line)) {
      dietaryTags.push('spicy');
    }
    if (patterns.halal.test(line)) {
      dietaryTags.push('halal');
    }

    // Construct menu item
    menuItems.push({
      name_tamil: name_tamil || name_english, // Fallback to English if Tamil missing
      name_english: name_english || name_tamil, // Fallback to Tamil if English missing
      price,
      currency: 'LKR',
      description_english: description,
      ingredients,
      dietaryTags,
      isVeg: dietaryTags.includes('veg'),
      isSpicy: dietaryTags.includes('spicy'),
      categoryGuess, // For UI display, actual category selected by admin
      culturalContext: 'jaffna',
      aiConfidence: calculateConfidence(name_tamil, name_english, price, ingredients),
      // For audit trail
      originalText: line
    });
  }

  return menuItems;
}

/**
 * Calculate AI extraction confidence (0-100)
 * Based on: presence of Tamil/English names, valid price, ingredients
 */
function calculateConfidence(name_tamil, name_english, price, ingredients) {
  let score = 0;
  
  if (name_tamil && name_tamil.length > 2) score += 30;
  if (name_english && name_english.length > 2) score += 30;
  if (price >= 50 && price <= 5000) score += 20;
  if (ingredients && ingredients.length > 0) score += 10;
  if (name_tamil && name_english) score += 10; // Bonus for bilingual

  return Math.min(score, 100);
}

/**
 * @route   POST /api/food-complete/ai/extract
 * @desc    Extract menu items from uploaded image
 * @access  Private/Admin
 */
export const extractMenuFromImage = async (req, res) => {
  let worker = null;
  
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Log extraction start
    console.log('🤖 Starting menu extraction from image:', req.file.originalname);
    console.log('📦 File size:', (req.file.size / 1024).toFixed(2), 'KB');

    // Preprocess image
    const processedImage = await preprocessImage(req.file.buffer);
    console.log('✅ Image preprocessed for OCR');

    // Initialize Tesseract worker
    // Try Tamil first, fallback to English if Tamil not available
    worker = await createWorker('tam+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📝 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    console.log('✅ Tesseract worker initialized with Tamil+English');

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(processedImage, undefined, {
      // Improve layout analysis for menu columns
      tessedit_pageseg_mode: 6, // Assume a single uniform block of text
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
      // Encourage space separation to help regex parsing
      textord_space_size_is_variable: '1'
    });
    
    console.log('✅ OCR completed');
    console.log('📊 Raw confidence:', confidence.toFixed(2));
    console.log('📄 Extracted text length:', text.length, 'chars');
    console.log('📄 Sample text:', text.substring(0, 200));

    // Parse text to structured data
    let menuItems = parseMenuText(text);

    // Fallback: if we parsed too few items, try a different preprocessing + PSM
    if (menuItems.length < 2) {
      console.log('⚠️ Low parsed items, attempting fallback OCR pass...');
      try {
        const altImg = await sharp(processedImage)
          .median(1)
          .gamma(1.2)
          .toBuffer();
        const { data: { text: text2 } } = await worker.recognize(altImg, undefined, {
          tessedit_pageseg_mode: 4, // Single column of text of variable sizes
          preserve_interword_spaces: '1',
          user_defined_dpi: '300'
        });
        const parsed2 = parseMenuText(text2);
        if (parsed2.length > menuItems.length) {
          console.log(`✅ Fallback improved items: ${menuItems.length} -> ${parsed2.length}`);
          menuItems = parsed2;
        }
      } catch (e) {
        console.warn('Fallback OCR pass failed:', e?.message || e);
      }
    }
    
    console.log('✅ Parsed', menuItems.length, 'menu items');

    // Optionally enrich with Vision AI provider for Google Lens-like results
    let enrichedItems = [];
    const aiProvider = (config.AI?.PROVIDER || 'off').toLowerCase();
    const aiEnabled = aiProvider === 'gemini' || aiProvider === 'openai' || (aiProvider === 'mock' && config.NODE_ENV !== 'production');
    if (aiEnabled) {
      try {
        enrichedItems = await visionMenuService.analyze({
          imageBuffer: processedImage,
          mimeType: req.file.mimetype || 'image/jpeg',
          ocrText: text,
        });
        console.log(`✨ Vision AI (${aiProvider}) returned ${enrichedItems.length} items`);
      } catch (e) {
        console.warn('Vision AI enrichment failed:', e?.message || e);
      }
    }

    // Merge OCR-parsed items with enriched items (prefer higher confidence and more complete fields)
    if (enrichedItems.length) {
      const byKey = new Map();
      const normalizeKey = (it) => (it.name_english || it.name_tamil || '').toLowerCase().replace(/\s+/g, ' ').trim();

      // seed with OCR items
      for (const it of menuItems) {
        const key = normalizeKey(it) || `${it.price}-${it.originalText?.slice(0, 20)}`;
        byKey.set(key, { ...it, confidence: Number(it.aiConfidence || it.confidence || 60) });
      }
      // merge in enriched
      for (const rich of enrichedItems) {
        const key = normalizeKey(rich) || `${rich.price}-${rich.name_english || rich.name_tamil}`;
        const prev = byKey.get(key);
        if (!prev) {
          byKey.set(key, {
            name_tamil: rich.name_tamil || '',
            name_english: rich.name_english || '',
            price: rich.price || 0,
            currency: rich.currency || 'LKR',
            description_english: rich.description_english || '',
            ingredients: rich.ingredients || [],
            dietaryTags: rich.dietaryTags || [],
            isVeg: !!rich.isVeg,
            isSpicy: !!rich.isSpicy,
            culturalContext: 'jaffna',
            aiConfidence: Number(rich.confidence || 75),
          });
        } else {
          // prefer richer description/ingredients and higher confidence
          prev.name_tamil = prev.name_tamil || rich.name_tamil || '';
          prev.name_english = prev.name_english || rich.name_english || '';
          prev.price = prev.price || rich.price || 0;
          prev.currency = prev.currency || rich.currency || 'LKR';
          if ((rich.description_english || '').length > (prev.description_english || '').length) {
            prev.description_english = rich.description_english;
          }
          if ((rich.ingredients || []).length > (prev.ingredients || []).length) {
            prev.ingredients = rich.ingredients;
          }
          prev.isVeg = prev.isVeg || !!rich.isVeg;
          prev.isSpicy = prev.isSpicy || !!rich.isSpicy;
          const confRich = Number(rich.confidence || 0);
          const confPrev = Number(prev.aiConfidence || 0);
          if (confRich > confPrev) prev.aiConfidence = confRich;
          byKey.set(key, prev);
        }
      }
      menuItems = Array.from(byKey.values());
      console.log('🔗 Merged items after enrichment:', menuItems.length);
    }

    // Fetch categories for mapping
    const categories = await Category.find({ isActive: true }).lean();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat._id.toString();
    });

    // Map category guesses to actual category IDs
    menuItems.forEach(item => {
      const guessLower = item.categoryGuess.toLowerCase();
      // Try exact match first
      if (categoryMap[guessLower]) {
        item.category = categoryMap[guessLower];
      } else {
        // Try partial match (e.g., "breakfast" matches "Breakfast")
        const matchingCat = Object.keys(categoryMap).find(key => 
          key.includes(guessLower) || guessLower.includes(key)
        );
        if (matchingCat) {
          item.category = categoryMap[matchingCat];
        }
      }
      delete item.categoryGuess; // Remove guess, not needed in response
    });

    // Terminate worker
    await worker.terminate();
    worker = null;

    // Return results
    res.status(200).json({
      success: true,
      message: `Extracted ${menuItems.length} menu items from image`,
      data: {
        // Align property name for frontend table that expects item.confidence
        menuItems: menuItems.map(it => ({ ...it, confidence: it.aiConfidence })),
        rawText: text,
        ocrConfidence: confidence,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Menu extraction error:', error);
    
    // Cleanup worker on error
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('❌ Worker termination error:', terminateError);
      }
    }

    // Send detailed error for debugging
    res.status(500).json({
      success: false,
      message: 'Failed to extract menu from image',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   GET /api/food-complete/ai/supported-languages
 * @desc    Get list of supported OCR languages
 * @access  Public
 */
export const getSupportedLanguages = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        languages: [
          { code: 'tam', name: 'Tamil', nativeName: 'தமிழ்' },
          { code: 'eng', name: 'English', nativeName: 'English' },
          { code: 'sin', name: 'Sinhala', nativeName: 'සිංහල' }
        ],
        defaultLanguage: 'tam+eng',
        recommendation: 'Use Tamil+English for best accuracy with Jaffna menus'
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  extractMenuFromImage,
  getSupportedLanguages
};
