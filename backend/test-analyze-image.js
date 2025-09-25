import AIImageAnalysisService from './services/aiImageAnalysisService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeImage() {
  try {
    console.log('🔍 Starting image analysis for test-menu.jpg...');

    // Read the image file
    const imagePath = path.join(__dirname, 'test-menu.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageType = 'image/jpeg';
    const filename = 'test-menu.jpg';

    console.log('📁 Image loaded, size:', imageBuffer.length, 'bytes');

    // Analyze the image
    const result = await AIImageAnalysisService.analyzeFoodImage(imageBuffer, imageType, filename);

    console.log('\n🎯 ANALYSIS RESULTS:');
    console.log('==================');
    console.log('Success:', result.success);
    console.log('Method:', result.method);
    console.log('Confidence:', result.confidence);

    if (result.success && result.data) {
      console.log('\n📋 DETECTED FOODS:');
      console.log('==================');

      result.data.detectedFoods.forEach((food, index) => {
        console.log(`\n${index + 1}. ${food.name} (${food.tamilName})`);
        console.log(`   Category: ${food.category}`);
        console.log(`   Price: LKR ${food.estimatedPrice}`);
        console.log(`   Description: ${food.description}`);
        console.log(`   Ingredients: ${food.ingredients.join(', ')}`);
        console.log(`   Vegetarian: ${food.isVeg ? 'Yes' : 'No'}`);
        console.log(`   Spicy: ${food.isSpicy ? 'Yes' : 'No'} (${food.spiceLevel})`);
        console.log(`   Cooking Method: ${food.cookingMethod}`);
        console.log(`   Cuisine: ${food.cuisine}`);
        console.log(`   Dietary Tags: ${food.dietaryTags.join(', ')}`);
        console.log(`   Allergens: ${food.allergens.join(', ')}`);
        console.log(`   Cooking Time: ${food.cookingTime} minutes`);
        console.log(`   Serving Size: ${food.servingSize}`);
        console.log(`   Popularity: ${food.popularity}`);
        console.log(`   Confidence: ${food.confidence}%`);

        if (food.nutritionalInfo) {
          console.log(`   Nutrition: ${food.nutritionalInfo.calories} cal, ${food.nutritionalInfo.protein}g protein, ${food.nutritionalInfo.carbs}g carbs, ${food.nutritionalInfo.fat}g fat`);
        }
      });

      console.log('\n📊 OVERALL ANALYSIS:');
      console.log('===================');
      if (result.data.overallAnalysis) {
        const overall = result.data.overallAnalysis;
        console.log(`Total Items: ${overall.totalItems}`);
        console.log(`Primary Cuisine: ${overall.primaryCuisine}`);
        console.log(`Meal Type: ${overall.mealType}`);
        console.log(`Estimated Total Price: LKR ${overall.estimatedTotalPrice}`);
        console.log(`Recommended Pairing: ${overall.recommendedPairing.join(', ')}`);
        if (overall.restaurantContext) {
          console.log(`Restaurant Context: ${overall.restaurantContext}`);
        }
        if (overall.note) {
          console.log(`Note: ${overall.note}`);
        }
      }
    }

    console.log('\n🔧 RAW RESPONSE:');
    console.log('================');
    console.log(result.rawResponse);

  } catch (error) {
    console.error('❌ Error analyzing image:', error.message);
    console.error(error.stack);
  }
}

// Run the analysis
analyzeImage();