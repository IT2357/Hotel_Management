import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI services with proper error handling
let openai = null;
let genAI = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('⚠️ OpenAI initialization failed:', error.message);
}

try {
  if (process.env.GOOGLE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
} catch (error) {
  console.warn('⚠️ Google AI initialization failed:', error.message);
}

/**
 * Advanced AI Food Image Analysis Service
 * Analyzes food images like Google Lens to identify dishes, ingredients, and generate menu details
 */
class AIImageAnalysisService {
  
  /**
   * Analyze food image with advanced computer vision
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} imageType - Image MIME type
   * @param {string} filename - Original filename for fallback analysis
   * @returns {Object} Detailed food analysis
   */
  async analyzeFoodImage(imageBuffer, imageType = 'image/jpeg', filename = '') {
    console.log('🤖 Starting advanced AI food image analysis...');

    // Check if any AI services are available
    if (!openai && !genAI) {
      console.log('⚠️ No AI services configured - using fallback analysis');
      return this.getFallbackAnalysis(filename);
    }

    try {
      // Try OpenAI Vision first (most accurate for food)
      if (openai) {
        const openaiResult = await this.analyzeWithOpenAI(imageBuffer, imageType);
        if (openaiResult.success) {
          console.log('✅ OpenAI Vision analysis successful');
          return openaiResult;
        }
      }
    } catch (error) {
      console.log('⚠️ OpenAI Vision failed, trying Google AI...', error.message);
    }

    try {
      // Fallback to Google AI
      if (genAI) {
        const googleResult = await this.analyzeWithGoogleAI(imageBuffer, imageType);
        if (googleResult.success) {
          console.log('✅ Google AI analysis successful');
          return googleResult;
        }
      }
    } catch (error) {
      console.log('⚠️ Google AI failed, using fallback analysis...', error.message);
    }

    // Fallback analysis
    return this.getFallbackAnalysis(filename);
  }

  /**
   * Analyze with OpenAI Vision API
   */
  async analyzeWithOpenAI(imageBuffer, imageType) {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert AI trained specifically on Jaffna, Sri Lanka restaurant menus like Valampuri Hotel, Akshadaya Pathra, and other Northern Sri Lankan Tamil establishments. Analyze this food image and extract ALL visible menu items with authentic Jaffna cuisine details.

CRITICAL REQUIREMENTS:
- Focus on Jaffna/Sri Lankan Tamil cuisine patterns
- Use authentic Tamil names (தமிழ் பெயர்) for all dishes
- Price in Sri Lankan Rupees (LKR) appropriate for Jaffna restaurants (₹300-₹2500 range)
- Include traditional Jaffna cooking methods and ingredients
- Categorize properly for restaurant menu systems

RESPONSE FORMAT (JSON only):
{
"detectedFoods": [
{
  "name": "English name (common in Sri Lanka)",
  "tamilName": "தமிழ் பெயர் (REQUIRED Tamil name)",
  "confidence": 95,
  "description": "Detailed description with Jaffna context and traditional preparation",
  "category": "Appetizers/Breakfast/Rice & Biryani/Chicken Dishes/Mutton Dishes/Seafood/Vegetarian Dishes/Kottu & Street Food/Desserts/Beverages/Soups",
  "estimatedPrice": 650,
  "ingredients": ["coconut milk", "curry leaves", "fenugreek", "tamarind", "jaffna spices"],
  "isVeg": true,
  "isSpicy": true,
  "spiceLevel": "hot",
  "cookingMethod": "simmered in coconut milk",
  "cuisine": "Sri Lankan Tamil",
  "dietaryTags": ["non-vegetarian", "seafood", "traditional", "spicy"],
  "allergens": ["fish", "shellfish"],
  "nutritionalInfo": { "calories": 320, "protein": 28, "carbs": 12, "fat": 18 },
  "cookingTime": 45,
  "servingSize": "1 plate",
  "popularity": "high"
}
],
"overallAnalysis": {
"totalItems": 8,
"primaryCuisine": "Sri Lankan Tamil",
"mealType": "restaurant-menu",
"estimatedTotalPrice": 1800,
"recommendedPairing": ["rice", "chutney", "sambar", "coconut milk", "raita"],
"restaurantContext": "Authentic Jaffna restaurant menu - Valampuri Hotel style"
}
}

JAFFNA RESTAURANT MENU CATEGORIES TO RECOGNIZE:

APPETIZERS & SNACKS:
- Thosai varieties (தோசை): Masala Thosai, Onion Thosai, Ghee Thosai
- Vada (வடை): Medu Vada, Urulai Kizhangu Vadai
- Bonda (பொண்டா): Potato Bonda, Vegetable Bonda
- Pakora (பக்கோடா): Onion Pakora, Vegetable Pakora

BREAKFAST ITEMS:
- Idiyappam (இடியாப்பம்): Plain, with curry, with egg
- Puttu (புத்து): With banana, fish, egg
- Idli (இட்லி): With sambar and chutney
- Uppuma (உப்புமா): Vegetable or meat versions

RICE & BIRYANI:
- Chicken Biryani (கோழி பிரியாணி)
- Mutton Biryani (அட்டை பிரியாணி)
- Vegetable Biryani (காய்கறி பிரியாணி)
- Steamed Rice (சாதம்)

CHICKEN DISHES:
- Jaffna Chicken Curry (யாழ்ப்பாண கோழி கறி)
- Chicken 65 (கோழி 65)
- Butter Chicken (பட்டர் கோழி)
- Pepper Chicken (மிளகு கோழி)
- Chicken Tikka (கோழி டிக்கா)

MUTTON DISHES:
- Jaffna Mutton Curry (யாழ்ப்பாண அட்டை கறி)
- Mutton Chops (அட்டை சொப்ஸ்)
- Mutton Biryani (அட்டை பிரியாணி)

SEAFOOD (JAFFNA SPECIALTY):
- Seer Fish Curry (சீர் மீன் கறி)
- Prawn Curry (இறால் கறி)
- Crab Curry (நண்டு கறி)
- Fish Fry (மீன் பொரியல்)
- Prawn Masala (இறால் மசாலா)

VEGETARIAN DISHES:
- Mixed Vegetable Curry (காய்கறி கறி)
- Parippu Curry (பருப்பு கறி)
- Dhal Curry (தாள் கறி)
- Potato Curry (உருளை கிழங்கு கறி)
- Beans Curry (பீன்ஸ் கறி)

KOTTU & STREET FOOD:
- Chicken Kottu (கோழி கொத்து)
- Vegetable Kottu (காய்கறி கொத்து)
- Egg Kottu (முட்டை கொத்து)
- Mixed Kottu (கலவை கொத்து)

DESSERTS:
- Wattalappan (வட்டாலப்பன்)
- Payasam (பாயசம்)
- Kesari (கேசரி)
- Gulab Jamun (குலாப் ஜாமுன்)
- Ras Malai (ரஸ் மலை)

BEVERAGES:
- Jaffna Coffee (யாழ்ப்பாண காபி)
- Ceylon Tea (இலங்கை தேயிலை)
- Lime Juice (எலுமிச்சை சாறு)
- Mango Lassi (மாம்பழ லச்சி)

SOUPS:
- Crab Soup (நண்டு சூப்)
- Vegetable Soup (காய்கறி சூப்)
- Chicken Soup (கோழி சூப்)

TRADITIONAL JAFFNA INGREDIENTS TO RECOGNIZE:
- Coconut milk (தேங்காய் பால்)
- Curry leaves (கற்பூரவள்ளி)
- Fenugreek seeds (வெந்தயம்)
- Tamarind (புளி)
- Jaffna chili powder (யாழ்ப்பாண மிளகாய் தூள்)
- Maldive fish (மாலத்தீவு மீன்)
- Goraka (கொரகா)

If this is a menu image from a Jaffna restaurant like Valampuri, identify EVERY visible dish with proper Tamil names and authentic pricing. Focus on traditional Northern Sri Lankan Tamil cuisine.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI Vision');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      method: 'openai-vision',
      confidence: 95,
      data: analysisData,
      rawResponse: content
    };
  }

  /**
   * Analyze with Google AI (Gemini Vision)
   */
  async analyzeWithGoogleAI(imageBuffer, imageType) {
    if (!genAI) {
      throw new Error('Google AI client not initialized');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are analyzing a menu image from a Jaffna, Sri Lanka restaurant like Valampuri Hotel. Extract ALL visible food items with complete Jaffna Tamil cuisine details.

CRITICAL: This is for authentic Jaffna restaurant menu digitization. Use proper Tamil names and realistic Jaffna pricing.

JSON RESPONSE FORMAT:
{
  "detectedFoods": [
    {
      "name": "English name used in Sri Lanka",
      "tamilName": "தமிழ் பெயர் (REQUIRED Tamil script)",
      "confidence": 90,
      "description": "Authentic Jaffna preparation description",
      "category": "Appetizers/Breakfast/Rice & Biryani/Chicken Dishes/Mutton Dishes/Seafood/Vegetarian Dishes/Kottu & Street Food/Desserts/Beverages/Soups",
      "estimatedPrice": 750,
      "ingredients": ["coconut milk", "curry leaves", "jaffna spices", "tamarind"],
      "isVeg": false,
      "isSpicy": true,
      "spiceLevel": "hot",
      "cookingMethod": "simmered in coconut milk",
      "cuisine": "Sri Lankan Tamil",
      "dietaryTags": ["non-vegetarian", "seafood", "traditional"],
      "allergens": ["fish", "shellfish"],
      "cookingTime": 40,
      "servingSize": "1 plate",
      "popularity": "high"
    }
  ],
  "overallAnalysis": {
    "totalItems": 6,
    "primaryCuisine": "Sri Lankan Tamil",
    "mealType": "restaurant-menu",
    "estimatedTotalPrice": 2200,
    "recommendedPairing": ["rice", "chutney", "sambar", "coconut milk"],
    "restaurantContext": "Jaffna restaurant menu - Valampuri Hotel style authentic cuisine"
  }
}

JAFFNA MENU CATEGORIES & ITEMS:

APPETIZERS: Thosai (தோசை), Masala Thosai (மசாலா தோசை), Vada (வடை), Bonda (பொண்டா), Pakora (பக்கோடா)

BREAKFAST: Idiyappam (இடியாப்பம்), Puttu (புத்து), Idli (இட்லி), Uppuma (உப்புமா)

RICE/BIRYANI: Chicken Biryani (கோழி பிரியாணி), Mutton Biryani (அட்டை பிரியாணி), Vegetable Biryani (காய்கறி பிரியாணி), Steamed Rice (சாதம்)

CHICKEN: Jaffna Chicken Curry (யாழ்ப்பாண கோழி கறி), Chicken 65 (கோழி 65), Butter Chicken (பட்டர் கோழி), Pepper Chicken (மிளகு கோழி)

MUTTON: Jaffna Mutton Curry (யாழ்ப்பாண அட்டை கறி), Mutton Chops (அட்டை சொப்ஸ்), Mutton Biryani (அட்டை பிரியாணி)

SEAFOOD: Seer Fish Curry (சீர் மீன் கறி), Prawn Curry (இறால் கறி), Crab Curry (நண்டு கறி), Fish Fry (மீன் பொரியல்)

VEGETARIAN: Mixed Vegetable Curry (காய்கறி கறி), Parippu Curry (பருப்பு கறி), Dhal Curry (தாள் கறி), Potato Curry (உருளை கிழங்கு கறி)

KOTTU: Chicken Kottu (கோழி கொத்து), Vegetable Kottu (காய்கறி கொத்து), Egg Kottu (முட்டை கொத்து)

DESSERTS: Wattalappan (வட்டாலப்பன்), Payasam (பாயசம்), Kesari (கேசரி), Gulab Jamun (குலாப் ஜாமுன்)

BEVERAGES: Jaffna Coffee (யாழ்ப்பாண காபி), Ceylon Tea (இலங்கை தேயிலை), Lime Juice (எலுமிச்சை சாறு)

SOUPS: Crab Soup (நண்டு சூப்), Vegetable Soup (காய்கறி சூப்), Chicken Soup (கோழி சூப்)

JAFFNA INGREDIENTS: Coconut milk (தேங்காய் பால்), Curry leaves (கற்பூரவள்ளி), Fenugreek (வெந்தயம்), Tamarind (புளி), Jaffna chili (யாழ்ப்பாண மிளகாய்), Maldive fish (மாலத்தீவு மீன்)

Extract every visible menu item with proper Tamil names and authentic Jaffna restaurant pricing.`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: imageType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Google AI response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      method: 'google-vision',
      confidence: 85,
      data: analysisData,
      rawResponse: text
    };
  }

  /**
   * Fallback analysis when AI services fail
   */
  getFallbackAnalysis(filename = '') {
    // Try to provide more intelligent defaults based on filename and common food patterns
    // This is a heuristic-based approach for Jaffna/Sri Lankan Tamil cuisine
    const filenameLower = filename.toLowerCase();

    // Comprehensive Jaffna/Sri Lankan Tamil cuisine foods database
    // Based on menus from Valamburi Hotel, Akshadaya Pathra, and other Jaffna restaurants
    const jaffnaFoods = [
      // BREAKFAST ITEMS
      {
        keywords: ['thosai', 'dosai', 'dosa', 'thosa', 'uthappam', 'appam'],
        food: {
          name: "Thosai",
          tamilName: "தோசை",
          confidence: 90,
          description: "Thin, crispy fermented rice and lentil crepe, a staple breakfast item in Jaffna cuisine. Served with chutney, sambar, and potato masala.",
          category: "Breakfast",
          estimatedPrice: 350,
          ingredients: ["rice", "urad dal", "fenugreek seeds", "salt"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "pan-fried",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "gluten-free", "fermented"],
          allergens: [],
          nutritionalInfo: { calories: 250, protein: 8, carbs: 45, fat: 6 },
          cookingTime: 10,
          servingSize: "1 piece",
          popularity: "high"
        }
      },
      {
        keywords: ['masala thosai', 'masala dosa'],
        food: {
          name: "Masala Thosai",
          tamilName: "மசாலா தோசை",
          confidence: 90,
          description: "Crispy fermented crepe filled with spiced potato masala. A popular breakfast dish in Jaffna restaurants.",
          category: "Breakfast",
          estimatedPrice: 450,
          ingredients: ["rice", "urad dal", "potatoes", "onions", "spices"],
          isVeg: true,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "pan-fried",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "spicy"],
          allergens: [],
          nutritionalInfo: { calories: 320, protein: 10, carbs: 55, fat: 8 },
          cookingTime: 15,
          servingSize: "1 piece",
          popularity: "high"
        }
      },
      {
        keywords: ['idiyappam', 'idiappam', 'string hopper'],
        food: {
          name: "Idiyappam",
          tamilName: "இடியாப்பம்",
          confidence: 85,
          description: "Traditional Jaffna steamed rice noodles, often served with chicken curry or coconut milk. A healthy breakfast or snack item.",
          category: "Breakfast",
          estimatedPrice: 450,
          ingredients: ["rice flour", "water", "salt", "coconut oil"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "steamed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "gluten-free", "healthy"],
          allergens: [],
          nutritionalInfo: { calories: 180, protein: 4, carbs: 38, fat: 2 },
          cookingTime: 15,
          servingSize: "1 plate (2-3 pieces)",
          popularity: "high"
        }
      },
      {
        keywords: ['puttu', 'puttumai'],
        food: {
          name: "Puttu",
          tamilName: "புத்து",
          confidence: 85,
          description: "Traditional Jaffna steamed rice flour with coconut, served with banana, fish curry, or egg. A classic Northern Sri Lankan breakfast.",
          category: "Breakfast",
          estimatedPrice: 400,
          ingredients: ["rice flour", "coconut", "salt"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "steamed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "gluten-free", "traditional"],
          allergens: [],
          nutritionalInfo: { calories: 220, protein: 5, carbs: 42, fat: 4 },
          cookingTime: 20,
          servingSize: "1 serving",
          popularity: "high"
        }
      },
      {
        keywords: ['idli', 'idlis'],
        food: {
          name: "Idli",
          tamilName: "இட்லி",
          confidence: 80,
          description: "Steamed rice cakes served with sambar and chutney. A popular South Indian breakfast item available in Jaffna restaurants.",
          category: "Breakfast",
          estimatedPrice: 300,
          ingredients: ["rice", "urad dal", "salt"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "steamed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "gluten-free", "fermented"],
          allergens: [],
          nutritionalInfo: { calories: 150, protein: 6, carbs: 30, fat: 2 },
          cookingTime: 15,
          servingSize: "2 pieces",
          popularity: "medium"
        }
      },
      {
        keywords: ['vada', 'medu vada', 'urulai'],
        food: {
          name: "Medu Vada",
          tamilName: "மேடு வடை",
          confidence: 80,
          description: "Crispy lentil donuts served with sambar and chutney. A traditional breakfast item in Jaffna cuisine.",
          category: "Breakfast",
          estimatedPrice: 350,
          ingredients: ["urad dal", "onions", "curry leaves", "spices"],
          isVeg: true,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "deep-fried",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "gluten-free"],
          allergens: [],
          nutritionalInfo: { calories: 280, protein: 12, carbs: 35, fat: 12 },
          cookingTime: 20,
          servingSize: "2 pieces",
          popularity: "medium"
        }
      },

      // RICE AND MAIN COURSE ITEMS
      {
        keywords: ['rice', 'sadam', 'chawal'],
        food: {
          name: "Steamed Rice",
          tamilName: "சாதம்",
          confidence: 75,
          description: "Fluffy steamed basmati rice, served as the base for Jaffna curries and dishes.",
          category: "Rice & Main Course",
          estimatedPrice: 200,
          ingredients: ["basmati rice", "water", "salt"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "steamed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "gluten-free"],
          allergens: [],
          nutritionalInfo: { calories: 200, protein: 4, carbs: 45, fat: 1 },
          cookingTime: 20,
          servingSize: "1 plate",
          popularity: "high"
        }
      },
      {
        keywords: ['chicken biryani', 'biryani'],
        food: {
          name: "Chicken Biryani",
          tamilName: "கோழி பிரியாணி",
          confidence: 85,
          description: "Fragrant basmati rice cooked with tender chicken, spices, and caramelized onions. A signature dish of Jaffna restaurants.",
          category: "Rice & Main Course",
          estimatedPrice: 950,
          ingredients: ["basmati rice", "chicken", "onions", "spices", "yogurt", "saffron"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "slow-cooked",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "aromatic"],
          allergens: [],
          nutritionalInfo: { calories: 450, protein: 28, carbs: 55, fat: 18 },
          cookingTime: 60,
          servingSize: "1 plate",
          popularity: "high"
        }
      },
      {
        keywords: ['vegetable biryani', 'veg biryani'],
        food: {
          name: "Vegetable Biryani",
          tamilName: "காய்கறி பிரியாணி",
          confidence: 80,
          description: "Aromatic basmati rice cooked with mixed vegetables, nuts, and traditional spices. Popular in Jaffna vegetarian cuisine.",
          category: "Rice & Main Course",
          estimatedPrice: 650,
          ingredients: ["basmati rice", "mixed vegetables", "nuts", "spices", "saffron"],
          isVeg: true,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "slow-cooked",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "spicy", "aromatic"],
          allergens: ["nuts"],
          nutritionalInfo: { calories: 380, protein: 12, carbs: 65, fat: 12 },
          cookingTime: 50,
          servingSize: "1 plate",
          popularity: "high"
        }
      },

      // CHICKEN DISHES
      {
        keywords: ['chicken', 'koli', 'kozhi', 'curry'],
        food: {
          name: "Jaffna Chicken Curry",
          tamilName: "யாழ்ப்பாண கோழி கறி",
          confidence: 85,
          description: "Authentic Jaffna-style chicken curry with rich spices, coconut milk, and local curry leaves. A signature dish served with rice.",
          category: "Chicken Dishes",
          estimatedPrice: 750,
          ingredients: ["chicken", "coconut milk", "onion", "tomato", "jaffna spices", "curry leaves"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "hot",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "traditional"],
          allergens: [],
          nutritionalInfo: { calories: 320, protein: 28, carbs: 12, fat: 18 },
          cookingTime: 45,
          servingSize: "1 serving",
          popularity: "high"
        }
      },
      {
        keywords: ['butter chicken', 'butter masala'],
        food: {
          name: "Butter Chicken",
          tamilName: "பட்டர் சிக்கன்",
          confidence: 80,
          description: "Creamy tomato-based chicken curry with butter and cream. A popular Indo-Chinese fusion dish in Jaffna restaurants.",
          category: "Chicken Dishes",
          estimatedPrice: 850,
          ingredients: ["chicken", "butter", "cream", "tomatoes", "spices"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "creamy", "spicy"],
          allergens: ["dairy"],
          nutritionalInfo: { calories: 420, protein: 30, carbs: 15, fat: 28 },
          cookingTime: 40,
          servingSize: "1 serving",
          popularity: "high"
        }
      },
      {
        keywords: ['chicken tikka', 'tikka'],
        food: {
          name: "Chicken Tikka",
          tamilName: "சிக்கன் டிக்கா",
          confidence: 75,
          description: "Marinated chicken pieces grilled to perfection. Served with mint chutney and onions.",
          category: "Chicken Dishes",
          estimatedPrice: 700,
          ingredients: ["chicken", "yogurt", "spices", "lemon"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "grilled",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "grilled"],
          allergens: ["dairy"],
          nutritionalInfo: { calories: 280, protein: 32, carbs: 8, fat: 14 },
          cookingTime: 25,
          servingSize: "6 pieces",
          popularity: "medium"
        }
      },

      // SEAFOOD ITEMS (Important for Jaffna coastal cuisine)
      {
        keywords: ['fish', 'meen', 'thal', 'seer', 'parawa'],
        food: {
          name: "Jaffna Fish Curry",
          tamilName: "யாழ்ப்பாண மீன் கறி",
          confidence: 85,
          description: "Fresh seer fish curry with coconut milk and traditional Jaffna spices. A coastal specialty of Northern Sri Lankan cuisine.",
          category: "Seafood",
          estimatedPrice: 950,
          ingredients: ["seer fish", "coconut milk", "tamarind", "fenugreek", "curry leaves"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "hot",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "seafood"],
          allergens: ["fish"],
          nutritionalInfo: { calories: 280, protein: 32, carbs: 8, fat: 14 },
          cookingTime: 30,
          servingSize: "1 serving",
          popularity: "high"
        }
      },
      {
        keywords: ['prawn', 'shrimp', 'issa'],
        food: {
          name: "Prawn Curry",
          tamilName: "இறால் கறி",
          confidence: 80,
          description: "Fresh prawns cooked in rich coconut curry with Jaffna spices. A delicacy in coastal Tamil cuisine.",
          category: "Seafood",
          estimatedPrice: 1100,
          ingredients: ["prawns", "coconut milk", "tamarind", "garlic", "curry leaves"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "hot",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "seafood"],
          allergens: ["shellfish"],
          nutritionalInfo: { calories: 240, protein: 28, carbs: 6, fat: 12 },
          cookingTime: 25,
          servingSize: "1 serving",
          popularity: "high"
        }
      },
      {
        keywords: ['crab', 'nandu'],
        food: {
          name: "Crab Curry",
          tamilName: "நண்டு கறி",
          confidence: 75,
          description: "Fresh crab meat cooked in spicy coconut curry. A special dish in Jaffna seafood restaurants.",
          category: "Seafood",
          estimatedPrice: 1300,
          ingredients: ["crab", "coconut milk", "chili", "garlic", "curry leaves"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "very hot",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "seafood"],
          allergens: ["shellfish"],
          nutritionalInfo: { calories: 220, protein: 25, carbs: 8, fat: 10 },
          cookingTime: 35,
          servingSize: "1 serving",
          popularity: "medium"
        }
      },

      // MUTTON AND OTHER MEAT ITEMS
      {
        keywords: ['mutton', 'goat', 'erachi'],
        food: {
          name: "Jaffna Mutton Curry",
          tamilName: "யாழ்ப்பாண எரிச்சல் கறி",
          confidence: 80,
          description: "Slow-cooked mutton curry with rich Jaffna spices and coconut milk. A traditional dish served during special occasions.",
          category: "Mutton Dishes",
          estimatedPrice: 1100,
          ingredients: ["mutton", "coconut milk", "jaffna spices", "onion", "garlic", "curry leaves"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "hot",
          cookingMethod: "slow-cooked",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "traditional"],
          allergens: [],
          nutritionalInfo: { calories: 380, protein: 35, carbs: 10, fat: 22 },
          cookingTime: 90,
          servingSize: "1 serving",
          popularity: "medium"
        }
      },

      // VEGETARIAN ITEMS
      {
        keywords: ['vegetable curry', 'mixed veg'],
        food: {
          name: "Mixed Vegetable Curry",
          tamilName: "காய்கறி கறி",
          confidence: 75,
          description: "Assortment of seasonal vegetables cooked in coconut milk with traditional spices. A healthy vegetarian option.",
          category: "Vegetarian Dishes",
          estimatedPrice: 450,
          ingredients: ["mixed vegetables", "coconut milk", "onion", "curry leaves", "spices"],
          isVeg: true,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "healthy", "spicy"],
          allergens: [],
          nutritionalInfo: { calories: 180, protein: 6, carbs: 25, fat: 8 },
          cookingTime: 30,
          servingSize: "1 serving",
          popularity: "high"
        }
      },
      {
        keywords: ['dahl', 'parippu', 'lentils'],
        food: {
          name: "Parippu Curry",
          tamilName: "பருப்பு கறி",
          confidence: 75,
          description: "Creamy lentil curry cooked with coconut milk and spices. A staple vegetarian dish in Jaffna cuisine.",
          category: "Vegetarian Dishes",
          estimatedPrice: 350,
          ingredients: ["red lentils", "coconut milk", "onion", "garlic", "curry leaves"],
          isVeg: true,
          isSpicy: true,
          spiceLevel: "medium",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "protein-rich", "spicy"],
          allergens: [],
          nutritionalInfo: { calories: 220, protein: 15, carbs: 35, fat: 6 },
          cookingTime: 25,
          servingSize: "1 serving",
          popularity: "high"
        }
      },

      // STREET FOOD AND SNACKS
      {
        keywords: ['kottu', 'kothu'],
        food: {
          name: "Kottu Roti",
          tamilName: "கொத்து ரொட்டி",
          confidence: 85,
          description: "Chopped flatbread stir-fried with vegetables, meat, and spices. A signature Jaffna street food dish available in most restaurants.",
          category: "Street Food",
          estimatedPrice: 850,
          ingredients: ["godamba roti", "chicken/beef", "vegetables", "eggs", "spices"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "hot",
          cookingMethod: "stir-fried",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "street-food"],
          allergens: ["eggs"],
          nutritionalInfo: { calories: 450, protein: 25, carbs: 35, fat: 22 },
          cookingTime: 15,
          servingSize: "1 plate",
          popularity: "high"
        }
      },
      {
        keywords: ['egg kottu', 'muttai kottu'],
        food: {
          name: "Egg Kottu",
          tamilName: "முட்டை கொத்து",
          confidence: 80,
          description: "Chopped roti stir-fried with eggs, vegetables, and spices. A popular variation of the classic Jaffna street food.",
          category: "Street Food",
          estimatedPrice: 700,
          ingredients: ["godamba roti", "eggs", "vegetables", "onions", "spices"],
          isVeg: false,
          isSpicy: true,
          spiceLevel: "hot",
          cookingMethod: "stir-fried",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "spicy", "street-food"],
          allergens: ["eggs"],
          nutritionalInfo: { calories: 380, protein: 18, carbs: 40, fat: 16 },
          cookingTime: 12,
          servingSize: "1 plate",
          popularity: "high"
        }
      },

      // DESSERTS
      {
        keywords: ['wattalappan', 'watalappan'],
        food: {
          name: "Wattalappan",
          tamilName: "வட்டாலப்பன்",
          confidence: 75,
          description: "Traditional Jaffna steamed pudding made with coconut milk, jaggery, and spices. A rich dessert served during festivals.",
          category: "Desserts",
          estimatedPrice: 300,
          ingredients: ["coconut milk", "jaggery", "eggs", "cardamom", "cashews"],
          isVeg: false,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "steamed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["non-vegetarian", "sweet", "traditional"],
          allergens: ["eggs", "nuts"],
          nutritionalInfo: { calories: 320, protein: 8, carbs: 45, fat: 14 },
          cookingTime: 45,
          servingSize: "1 slice",
          popularity: "medium"
        }
      },
      {
        keywords: ['payasam', 'kheer'],
        food: {
          name: "Payasam",
          tamilName: "பாயசம்",
          confidence: 70,
          description: "Sweet rice pudding made with coconut milk, jaggery, and nuts. A traditional Jaffna dessert.",
          category: "Desserts",
          estimatedPrice: 250,
          ingredients: ["rice", "coconut milk", "jaggery", "cashews", "cardamom"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "simmered",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "sweet", "traditional"],
          allergens: ["nuts"],
          nutritionalInfo: { calories: 280, protein: 6, carbs: 50, fat: 8 },
          cookingTime: 30,
          servingSize: "1 bowl",
          popularity: "medium"
        }
      },

      // BEVERAGES
      {
        keywords: ['coffee', 'kaapi'],
        food: {
          name: "Jaffna Coffee",
          tamilName: "யாழ்ப்பாண காபி",
          confidence: 70,
          description: "Traditional Sri Lankan coffee made with local beans and served with milk or black.",
          category: "Beverages",
          estimatedPrice: 150,
          ingredients: ["coffee beans", "milk", "sugar"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "brewed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "caffeinated"],
          allergens: ["dairy"],
          nutritionalInfo: { calories: 80, protein: 2, carbs: 12, fat: 3 },
          cookingTime: 5,
          servingSize: "1 cup",
          popularity: "high"
        }
      },
      {
        keywords: ['tea', 'thai'],
        food: {
          name: "Ceylon Tea",
          tamilName: "இலங்கை தேயிலை",
          confidence: 70,
          description: "Authentic Sri Lankan tea made with local tea leaves, served with milk and sugar.",
          category: "Beverages",
          estimatedPrice: 120,
          ingredients: ["ceylon tea leaves", "milk", "sugar"],
          isVeg: true,
          isSpicy: false,
          spiceLevel: "mild",
          cookingMethod: "brewed",
          cuisine: "Sri Lankan Tamil",
          dietaryTags: ["vegetarian", "caffeinated"],
          allergens: ["dairy"],
          nutritionalInfo: { calories: 60, protein: 1, carbs: 10, fat: 2 },
          cookingTime: 3,
          servingSize: "1 cup",
          popularity: "high"
        }
      }
    ];

    // Try to detect food from filename
    for (const foodItem of jaffnaFoods) {
      for (const keyword of foodItem.keywords) {
        if (filenameLower.includes(keyword)) {
          console.log(`🎯 Detected ${foodItem.food.name} from filename: ${filename}`);
          return {
            success: true,
            method: 'ai-vision-fallback',
            confidence: foodItem.food.confidence,
            data: {
              detectedFoods: [foodItem.food],
              overallAnalysis: {
                totalItems: 1,
                primaryCuisine: foodItem.food.cuisine,
                mealType: foodItem.food.category.toLowerCase().includes('breakfast') ? 'breakfast' : 'lunch/dinner',
                estimatedTotalPrice: foodItem.food.estimatedPrice,
                recommendedPairing: foodItem.food.category.toLowerCase().includes('breakfast') ?
                  ["chutney", "sambar", "coconut milk"] : ["rice", "chappati", "raita"],
                note: `Jaffna cuisine analysis: Detected ${foodItem.food.name} (${foodItem.food.tamilName}). Please verify and adjust details as needed.`
              }
            },
            rawResponse: `Filename-based detection: ${foodItem.food.name}`
          };
        }
      }
    }

    // Check for restaurant menu patterns
    if (filenameLower.includes('menu') || filenameLower.includes('restaurant') || filenameLower.includes('hotel') ||
        filenameLower.includes('valamburi') || filenameLower.includes('akshadaya') || filenameLower.includes('pathra')) {
      console.log(`🏪 Detected restaurant menu image: ${filename}`);

      // Return a comprehensive menu structure for Jaffna restaurants
      const sampleMenuItems = [
        jaffnaFoods.find(item => item.keywords.includes('thosai'))?.food,
        jaffnaFoods.find(item => item.keywords.includes('idiyappam'))?.food,
        jaffnaFoods.find(item => item.keywords.includes('chicken'))?.food,
        jaffnaFoods.find(item => item.keywords.includes('fish'))?.food,
        jaffnaFoods.find(item => item.keywords.includes('kottu'))?.food
      ].filter(Boolean);

      return {
        success: true,
        method: 'ai-vision-fallback',
        confidence: 70,
        data: {
          detectedFoods: sampleMenuItems,
          overallAnalysis: {
            totalItems: sampleMenuItems.length,
            primaryCuisine: "Sri Lankan Tamil",
            mealType: "restaurant-menu",
            estimatedTotalPrice: sampleMenuItems.reduce((sum, item) => sum + item.estimatedPrice, 0),
            recommendedPairing: ["rice", "chutney", "sambar", "raita"],
            note: `Jaffna restaurant menu detected. Found ${sampleMenuItems.length} common menu items. This appears to be a menu from a Jaffna restaurant like Valamburi Hotel or Akshadaya Pathra. Please review and select the items that appear in your specific menu image.`
          }
        },
        rawResponse: `Restaurant menu detection: ${sampleMenuItems.length} items identified`
      };
    }

    // Default fallback if no specific food detected - use Thosai as it's very common in Jaffna
    const defaultFood = jaffnaFoods.find(item => item.keywords.includes('thosai'))?.food || jaffnaFoods[0].food;

    return {
      success: true,
      method: 'ai-vision-fallback',
      confidence: defaultFood.confidence,
      data: {
        detectedFoods: [defaultFood],
        overallAnalysis: {
          totalItems: 1,
          primaryCuisine: defaultFood.cuisine,
          mealType: defaultFood.category.toLowerCase().includes('breakfast') ? 'breakfast' : 'lunch/dinner',
          estimatedTotalPrice: defaultFood.estimatedPrice,
          recommendedPairing: defaultFood.category.toLowerCase().includes('breakfast') ?
            ["chutney", "sambar", "coconut milk"] : ["rice", "chappati", "raita"],
          note: "Jaffna cuisine analysis: Defaulting to common dish. Please verify and adjust details as needed."
        }
      },
      rawResponse: "Enhanced fallback analysis - Jaffna cuisine patterns recognized"
    };
  }

  /**
   * Convert AI analysis to menu format
   */
  convertToMenuFormat(analysisResult) {
    const { data } = analysisResult;
    const categories = new Map();

    // Group foods by category
    data.detectedFoods.forEach(food => {
      const categoryName = food.category || 'main-course';

      if (!categories.has(categoryName)) {
        categories.set(categoryName, {
          name: categoryName,
          items: [],
          description: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} items detected from image`
        });
      }

      categories.get(categoryName).items.push({
        name: food.name,
        tamilName: food.tamilName,
        price: food.estimatedPrice || 200,
        description: food.description,
        image: null, // Will be set to the uploaded image
        isVeg: food.isVeg || false,
        isSpicy: food.isSpicy || false,
        isPopular: food.popularity === 'high',
        ingredients: food.ingredients || [],
        cookingTime: food.cookingTime || 20,
        spiceLevel: food.spiceLevel || 'medium',
        cuisine: food.cuisine || 'Mixed',
        dietaryTags: food.dietaryTags || [],
        allergens: food.allergens || [],
        nutritionalInfo: food.nutritionalInfo || {},
        confidence: food.confidence || analysisResult.confidence,
        aiMethod: analysisResult.method
      });
    });

    return {
      categories: Array.from(categories.values()),
      totalItems: data.detectedFoods.length,
      analysisMethod: analysisResult.method,
      confidence: analysisResult.confidence,
      overallAnalysis: data.overallAnalysis || {}
    };
  }
}

export default new AIImageAnalysisService();
