// backend/services/ai/visionMenuService.js
// Pluggable Vision AI service to enrich OCR with LLM vision output
// Providers: 'mock' (local stub), 'gemini', 'openai' (vision)
// Input: { imageBuffer, mimeType, ocrText }
// Output: [{ name_tamil, name_english, price, currency, description_english, ingredients[], isVeg, isSpicy, dietaryTags[], confidence }]

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import config from '../../config/environment.js';

function normalizeItem(raw) {
  const currency = 'LKR';
  const price = typeof raw.price === 'string' ? parseFloat(raw.price.replace(/[^0-9.]/g, '')) : Number(raw.price || 0);
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
    : String(raw.ingredients || '')
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);

  const dietaryTags = Array.isArray(raw.dietaryTags) ? raw.dietaryTags : [];
  const isVeg = 'isVeg' in raw ? Boolean(raw.isVeg) : /veg(?!e?t?a?b?l?e?)/i.test(raw.description || '') && !/(chicken|mutton|fish|crab|prawn|beef|pork|meat)/i.test(raw.description || '');
  const isSpicy = 'isSpicy' in raw ? Boolean(raw.isSpicy) : /(spicy|hot|\u0b95\u0bbe\u0bb0)/i.test(raw.description || '');

  return {
    name_tamil: (raw.name_tamil || '').toString().trim(),
    name_english: (raw.name_english || raw.name || '').toString().trim(),
    price: isFinite(price) ? price : 0,
    currency,
    description_english: (raw.description_english || raw.description || '').toString().trim().slice(0, 300),
    ingredients,
    isVeg,
    isSpicy,
    dietaryTags,
    confidence: Math.max(0, Math.min(100, Number(raw.confidence || 70))),
  };
}

// Mock provider: returns a couple of enriched guesses using OCR text context
async function mockProvider({ ocrText }) {
  const lines = (ocrText || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const sample = lines.slice(0, 10).join(' ');
  const items = [];
  if (sample) {
    items.push({
      name_english: 'Jaffna Crab Curry',
      name_tamil: 'யாழ் நண்டு குழம்பு',
      price: 1200,
      description: 'Traditional Jaffna style crab curry with roasted spices and coconut milk',
      ingredients: ['crab', 'coconut milk', 'curry leaves', 'chili'],
      isSpicy: true,
      dietaryTags: ['non-veg', 'spicy'],
      confidence: 72,
    });
  }
  return items.map(normalizeItem);
}

// Provider: Gemini (Google), requires GEMINI_API_KEY
async function geminiProvider({ imageBuffer, mimeType, ocrText }) {
  const apiKey = config.AI?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini provider: no API key configured');
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash (stable multimodal model with vision support)
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert buffer to base64 inline data for Gemini
    const base64Image = imageBuffer.toString('base64');
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const prompt = `
You are an EXPERT food analyst specializing in South Asian cuisine (especially Sri Lankan/Indian dishes). 
Your task: Identify food from images and create menu data with high accuracy.

OCR TEXT (if any - may contain errors):
---
${ocrText || '(No text detected - analyze image visually)'}
---

🎯 YOUR TASK:

**IF THE IMAGE SHOWS A MENU CARD/LIST:**
- Extract all items with their prices from the text

**IF THE IMAGE SHOWS ACTUAL FOOD:**
- Identify the dish(es) by visual appearance
- Recognize common dishes like: dosa, biriyani, curry, rice, roti, naan, samosa, idli, vada, etc.
- Estimate reasonable prices based on dish type

📋 EXTRACTION RULES:

1. DISH IDENTIFICATION:
   - Look at the food and identify what dish it is
   - Common dishes: dosa, masala dosa, rava dosa, idli, vada, biriyani, curry, rice, roti, naan, samosa, pakora, etc.
   - If unsure, describe what you see (e.g., "crispy crepe with potato filling" = masala dosa)
   - Extract ALL items you can see/read

2. NAMES (Both languages preferred but not required):
   - name_tamil: Tamil name if you know it (தமிழ்) - CAN BE EMPTY if unknown
   - name_english: English name (REQUIRED - identify the dish!)
   - Examples: "Masala Dosa", "Chicken Biriyani", "Vegetable Curry"
   
3. PRICING:
   - If on menu: Extract exact price (remove Rs, LKR, /-  symbols)
   - If estimating from photo, use reasonable prices:
     * Dosa/Idli/Vada: 200-400 LKR
     * Biriyani: 600-1200 LKR  
     * Curry/Rice: 400-1000 LKR
   - Currency: Always "LKR"

4. DESCRIPTIONS:
   - 50-200 characters, appetizing
   - Example: "Crispy rice crepe with spiced potato filling, served with chutneys"

5. INGREDIENTS:
   - List 5-12 main ingredients
   - Common: rice, lentils, potato, onion, chili, coconut, curry leaves, spices

6. DIETARY INFO:
   - isVeg: true if NO meat/fish/eggs
   - isSpicy: true if hot/spicy
   - dietaryTags: ["veg", "non-veg", "spicy", "mild"]

7. CONFIDENCE:
   - 85-100: Clear identification
   - 70-84: Reasonable guess
   - Below 70: Uncertain (but still try!)

📊 OUTPUT FORMAT (JSON array):

[
  {
    "name_tamil": "",
    "name_english": "Masala Dosa",
    "price": 350,
    "description_english": "Crispy South Indian rice crepe filled with spiced potato masala, served with coconut chutney and sambar",
    "ingredients": ["rice", "lentils", "potato", "onion", "green chili", "mustard seeds", "curry leaves", "turmeric"],
    "isVeg": true,
    "isSpicy": true,
    "dietaryTags": ["veg", "spicy"],
    "confidence": 90
  }
]

⚠️ IMPORTANT:
- Return ONLY JSON array (no markdown, no code fences)
- name_tamil can be EMPTY if you don't know it
- name_english is REQUIRED - identify the dish!
- Estimate prices if not visible
- List ALL dishes you can see/identify
- Even if you're not 100% certain, MAKE YOUR BEST GUESS!

🎯 GOAL: Identify ALL food items in the image, even from photos without text!
`;

    let result;
    try {
      result = await model.generateContent([prompt, imagePart]);
    } catch (err) {
      // If the chosen model is not available, log error and throw
      console.error('Gemini model failed:', err?.message || err);
      throw err;
    }
    const text = result.response.text().trim();
    console.log('🔍 Gemini raw response length:', text.length);
    console.log('🔍 Gemini raw response (first 500 chars):', text.substring(0, 500));

    // Strip markdown code fences if present
    let jsonText = text;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('🔍 Gemini JSON text (first 500 chars):', jsonText.substring(0, 500));
    const parsed = JSON.parse(jsonText);
    console.log('🔍 Gemini parsed result:', Array.isArray(parsed) ? `Array with ${parsed.length} items` : typeof parsed);
    const items = Array.isArray(parsed) ? parsed : [];
    return items.map(normalizeItem);
  } catch (e) {
    const msg = e?.message || String(e);
    const status = e?.status || e?.statusCode || 'unknown';
    console.error(`Gemini provider error [status=${status}]:`, msg);
    return [];
  }
}

// Provider: OpenAI Vision, requires OPENAI_API_KEY
async function openaiProvider({ imageBuffer, mimeType, ocrText }) {
  const apiKey = config.AI?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI provider: no API key configured');
    return [];
  }

  try {
    const openai = new OpenAI({ apiKey });

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;

    const prompt = `
You are an EXPERT food menu analyst specializing in Sri Lankan (Jaffna) cuisine. Your task is to extract COMPLETE and ACCURATE menu data with 95%+ precision.

OCR CONTEXT (may contain errors, use image as primary source):
---
${ocrText || '(no OCR text - rely entirely on image)'}
---

📋 STRICT EXTRACTION RULES:

1. ITEM DETECTION (Must achieve 95%+ accuracy):
   - Identify EVERY menu item visible in the image
   - Include items even if partially visible or in headers/footers
   - Do NOT skip items due to unclear text - make best effort
   - If price is missing but item is clear, estimate based on similar items (mark confidence lower)

2. NAMES (Both languages required):
   - name_tamil: Tamil script name (தமிழ் வடிவம்)
   - name_english: English transliteration or translation
   - If ONLY Tamil visible: Transliterate to English phonetically
   - If ONLY English visible: Search for Tamil equivalent or leave empty
   - Common dishes: Use standard Jaffna cuisine names
   
3. PRICING (99% accuracy required):
   - Extract exact price as NUMBER (remove Rs, LKR, /-, symbols)
   - If price range (e.g., "800-1200"): use middle value (1000)
   - If "Market Price" or similar: use 0 and note in description
   - Currency: Always "LKR" (Sri Lankan Rupees)
   - Typical Jaffna price ranges:
     * Breakfast: 50-400 LKR
     * Seafood: 800-2500 LKR
     * Meat: 600-2000 LKR
     * Veg: 200-800 LKR

4. DESCRIPTIONS (Complete & Detailed):
   - 50-200 characters, descriptive and appetizing
   - Include: cooking style, key flavors, regional style
   - Examples:
     * "Traditional Jaffna crab curry with roasted spices, coconut milk, and curry leaves"
     * "Crispy rice hoppers served with spicy coconut sambol and dhal curry"
     * "Tender mutton slow-cooked with aromatic Jaffna spices and tamarind"
   - Mention "Jaffna style" for traditional dishes

5. INGREDIENTS (Comprehensive list):
   - List 5-12 main ingredients per item
   - Order: protein/main → spices → base (rice/bread)
   - Be specific: "crab" not "seafood", "coconut milk" not "coconut"
   - Common Jaffna ingredients:
     * Proteins: crab, prawn, fish, mutton, chicken
     * Spices: curry leaves, mustard seeds, fenugreek, chili, turmeric, cinnamon
     * Bases: rice, coconut milk, tamarind, onion, garlic

6. DIETARY CLASSIFICATION (Accurate tagging):
   - isVeg: true ONLY if NO meat/fish/eggs (dairy OK)
   - isSpicy: true if contains chili/pepper/hot spices
   - dietaryTags: Array of relevant tags:
     * "veg" - vegetarian
     * "non-veg" - contains meat/fish
     * "spicy" - hot spices
     * "mild" - not spicy
     * "halal" - if explicitly stated
     * "seafood" - fish/crab/prawn
     * "gluten-free" - no wheat/bread
   
7. CONFIDENCE SCORING (Self-assessment):
   - 95-100: All fields extracted perfectly, clear image
   - 85-94: Minor uncertainty (e.g., one ingredient unclear)
   - 75-84: Moderate uncertainty (e.g., price estimated, Tamil missing)
   - 60-74: Low quality image or heavily obscured text
   - Below 60: Severe issues, very uncertain

📊 OUTPUT FORMAT (Valid JSON only):

[
  {
    "name_tamil": "நண்டு குழம்பு",
    "name_english": "Jaffna Crab Curry",
    "price": 1200,
    "description_english": "Traditional Jaffna crab curry with roasted spices, coconut milk, curry leaves, and tamarind",
    "ingredients": ["crab", "coconut milk", "curry leaves", "mustard seeds", "fenugreek", "chili", "tamarind", "onion", "garlic", "turmeric"],
    "isVeg": false,
    "isSpicy": true,
    "dietaryTags": ["non-veg", "spicy", "seafood"],
    "confidence": 95
  },
  {
    "name_tamil": "அப்பம்",
    "name_english": "Hoppers (Appam)",
    "price": 250,
    "description_english": "Crispy bowl-shaped rice pancakes with soft center, served with coconut sambol",
    "ingredients": ["rice flour", "coconut milk", "yeast", "sugar", "salt"],
    "isVeg": true,
    "isSpicy": false,
    "dietaryTags": ["veg", "gluten-free"],
    "confidence": 92
  }
]

⚠️ CRITICAL REQUIREMENTS:
- Return ONLY valid JSON array (no markdown, no explanation, no \`\`\`json)
- Include EVERY menu item you can identify
- Fill ALL fields for each item (no null/undefined)
- Descriptions must be detailed and appetizing
- Ingredients list should be comprehensive (5-12 items)
- Confidence should reflect actual certainty (be honest)
- If completely unable to read an item, skip it rather than guess randomly

🎯 GOAL: Achieve Google Lens-level accuracy (95%+) with complete, detailed, structured output.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content?.trim() || '[]';

    // Strip markdown code fences if present
    let jsonText = text;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    const items = Array.isArray(parsed) ? parsed : [];
    return items.map(normalizeItem);
  } catch (e) {
    console.error('OpenAI provider error:', e?.message || e);
    return [];
  }
}

export default {
  async analyze({ imageBuffer, mimeType = 'image/jpeg', ocrText }) {
    const provider = (config.AI?.PROVIDER || 'off').toLowerCase();
    try {
      if (provider === 'gemini') {
        return await geminiProvider({ imageBuffer, mimeType, ocrText });
      }
      if (provider === 'openai') {
        return await openaiProvider({ imageBuffer, mimeType, ocrText });
      }
      if (provider === 'mock') {
        return await mockProvider({ ocrText });
      }
      // default: off
      return [];
    } catch (e) {
      console.warn('Vision provider failed, falling back to empty:', e?.message || e);
      return [];
    }
  },
};
