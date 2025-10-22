#!/usr/bin/env node
/**
 * 🧪 Ultra-Enhanced Vision AI Test Script
 * Tests the new visionMenuService_v2.js with Google Lens-level accuracy
 * 
 * Usage: node testUltraVision.js <image_path>
 * Example: node testUltraVision.js sample_menu.jpg
 */

import visionMenuService from './backend/services/ai/visionMenuService_v2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = process.argv[2] || 'sample_menu.jpg';

console.log('━'.repeat(80));
console.log('🚀 ULTRA-ENHANCED VISION AI TEST');
console.log('━'.repeat(80));

(async () => {
  try {
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Error: Image file not found:', imagePath);
      console.log('\n📋 Usage: node testUltraVision.js <image_path>');
      console.log('📋 Example: node testUltraVision.js sample_menu.jpg');
      process.exit(1);
    }

    console.log('📸 Image:', imagePath);
    console.log('📏 Size:', (fs.statSync(imagePath).size / 1024).toFixed(2), 'KB');
    console.log('');
    console.log('⏳ Analyzing menu with ultra-enhanced AI prompts...');
    console.log('   (This may take 10-15 seconds for complex menus)');
    console.log('');

    const startTime = Date.now();
    
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 
                     ext === '.webp' ? 'image/webp' : 
                     ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/jpeg';
    
    const result = await visionMenuService.analyze({
      imageBuffer,
      mimeType,
      ocrText: '' // Let Vision AI do all the work
    });
    
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('━'.repeat(80));
    console.log('✅ EXTRACTION COMPLETE!');
    console.log('━'.repeat(80));
    console.log('');
    
    if (result.length === 0) {
      console.log('❌ No items extracted!');
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check if image contains clear menu text');
      console.log('   2. Verify GEMINI_API_KEY or OPENAI_API_KEY is set in .env');
      console.log('   3. Ensure AI_PROVIDER=gemini or openai in .env');
      console.log('   4. Check backend/.env file exists');
      console.log('   5. Try with a different, higher-quality menu image');
      process.exit(1);
    }
    
    // Calculate statistics
    const avgConfidence = result.reduce((sum, r) => sum + r.confidence, 0) / result.length;
    const bilingualCount = result.filter(r => r.name_tamil && r.name_english).length;
    const bilingualCoverage = (bilingualCount / result.length) * 100;
    const avgDescLength = result.reduce((sum, r) => sum + r.description_english.length, 0) / result.length;
    const avgIngredients = result.reduce((sum, r) => sum + r.ingredients.length, 0) / result.length;
    const avgTags = result.reduce((sum, r) => sum + r.dietaryTags.length, 0) / result.length;
    const totalPrice = result.reduce((sum, r) => sum + r.price, 0);
    
    // Time slot analysis
    const breakfastItems = result.filter(r => r.isBreakfast).length;
    const lunchItems = result.filter(r => r.isLunch).length;
    const dinnerItems = result.filter(r => r.isDinner).length;
    const snackItems = result.filter(r => r.isSnacks).length;
    
    // Diet analysis
    const vegItems = result.filter(r => r.isVeg).length;
    const nonVegItems = result.filter(r => !r.isVeg).length;
    const spicyItems = result.filter(r => r.isSpicy).length;
    
    console.log('📊 EXTRACTION STATISTICS:');
    console.log('━'.repeat(80));
    console.log(`   Items found:           ${result.length}`);
    console.log(`   Processing time:       ${processingTime} seconds`);
    console.log(`   Avg confidence:        ${avgConfidence.toFixed(1)}%`);
    console.log(`   Bilingual coverage:    ${bilingualCount}/${result.length} (${bilingualCoverage.toFixed(0)}%)`);
    console.log(`   Avg description:       ${avgDescLength.toFixed(0)} characters`);
    console.log(`   Avg ingredients:       ${avgIngredients.toFixed(1)} items`);
    console.log(`   Avg dietary tags:      ${avgTags.toFixed(1)} tags`);
    console.log(`   Total menu value:      LKR ${totalPrice.toFixed(0)}`);
    console.log('');
    
    console.log('⏰ TIME SLOT BREAKDOWN:');
    console.log('━'.repeat(80));
    console.log(`   Breakfast items:       ${breakfastItems} (${((breakfastItems/result.length)*100).toFixed(0)}%)`);
    console.log(`   Lunch items:           ${lunchItems} (${((lunchItems/result.length)*100).toFixed(0)}%)`);
    console.log(`   Dinner items:          ${dinnerItems} (${((dinnerItems/result.length)*100).toFixed(0)}%)`);
    console.log(`   Snack items:           ${snackItems} (${((snackItems/result.length)*100).toFixed(0)}%)`);
    console.log('');
    
    console.log('🍽️  DIETARY BREAKDOWN:');
    console.log('━'.repeat(80));
    console.log(`   Vegetarian items:      ${vegItems} (${((vegItems/result.length)*100).toFixed(0)}%)`);
    console.log(`   Non-vegetarian items:  ${nonVegItems} (${((nonVegItems/result.length)*100).toFixed(0)}%)`);
    console.log(`   Spicy items:           ${spicyItems} (${((spicyItems/result.length)*100).toFixed(0)}%)`);
    console.log('');
    
    console.log('📋 DETAILED ITEMS:');
    console.log('━'.repeat(80));
    console.log('');
    
    result.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.name_english}`);
      if (item.name_tamil) {
        console.log(`   தமிழ்: ${item.name_tamil}`);
      }
      console.log(`   💰 Price: LKR ${item.price}`);
      console.log(`   📝 Description: ${item.description_english}`);
      console.log(`   🥘 Ingredients (${item.ingredients.length}): ${item.ingredients.join(', ')}`);
      console.log(`   🏷️  Tags (${item.dietaryTags.length}): ${item.dietaryTags.join(', ')}`);
      
      const timeSlots = [];
      if (item.isBreakfast) timeSlots.push('Breakfast');
      if (item.isLunch) timeSlots.push('Lunch');
      if (item.isDinner) timeSlots.push('Dinner');
      if (item.isSnacks) timeSlots.push('Snacks');
      console.log(`   ⏰ Available: ${timeSlots.join(', ') || 'All day'}`);
      
      const dietInfo = [];
      if (item.isVeg) dietInfo.push('Vegetarian');
      if (!item.isVeg) dietInfo.push('Non-Veg');
      if (item.isSpicy) dietInfo.push('Spicy');
      console.log(`   🍴 Diet: ${dietInfo.join(', ')}`);
      
      const confidenceIcon = item.confidence >= 95 ? '🌟' : 
                            item.confidence >= 90 ? '✅' : 
                            item.confidence >= 80 ? '👍' : '⚠️';
      console.log(`   ${confidenceIcon} Confidence: ${item.confidence}%`);
      console.log('');
    });
    
    // Calculate quality score
    const qualityScore = calculateQualityScore({
      avgConfidence,
      bilingualCoverage,
      avgDescLength,
      avgIngredients,
      avgTags
    });
    
    console.log('━'.repeat(80));
    console.log('🎯 OVERALL QUALITY SCORE:');
    console.log('━'.repeat(80));
    console.log(`   ${qualityScore.icon} ${qualityScore.score.toFixed(1)}% - ${qualityScore.rating}`);
    console.log('');
    console.log('   Breakdown:');
    console.log(`   • Confidence (35%):      ${avgConfidence.toFixed(1)}% → ${(avgConfidence * 0.35).toFixed(1)} points`);
    console.log(`   • Bilingual (20%):       ${bilingualCoverage.toFixed(1)}% → ${(bilingualCoverage * 0.20).toFixed(1)} points`);
    console.log(`   • Description (20%):     ${Math.min(avgDescLength / 150 * 100, 100).toFixed(1)}% → ${(Math.min(avgDescLength / 150 * 100, 100) * 0.20).toFixed(1)} points`);
    console.log(`   • Ingredients (15%):     ${Math.min(avgIngredients / 10 * 100, 100).toFixed(1)}% → ${(Math.min(avgIngredients / 10 * 100, 100) * 0.15).toFixed(1)} points`);
    console.log(`   • Tags (10%):            ${Math.min(avgTags / 7 * 100, 100).toFixed(1)}% → ${(Math.min(avgTags / 7 * 100, 100) * 0.10).toFixed(1)} points`);
    console.log('');
    
    if (qualityScore.score >= 95) {
      console.log('🎉 EXCELLENT! This extraction is production-ready!');
      console.log('   ✅ Deploy to production');
      console.log('   ✅ Start extracting real menus');
      console.log('   ✅ Train admin team on workflow');
    } else if (qualityScore.score >= 90) {
      console.log('👍 GREAT! Very good quality, minor tweaks may help:');
      console.log('   • Check if all items have Tamil names');
      console.log('   • Verify description lengths are 100+ characters');
      console.log('   • Ensure ingredient lists are comprehensive');
    } else if (qualityScore.score >= 80) {
      console.log('⚠️  GOOD! Consider these improvements:');
      console.log('   • Use higher resolution image (1920px+ width)');
      console.log('   • Ensure better lighting and straight angle');
      console.log('   • Switch to OpenAI provider for higher accuracy');
      console.log('   • Check if menu has clear, readable text');
    } else {
      console.log('❌ NEEDS IMPROVEMENT. Try:');
      console.log('   1. Use higher quality menu image');
      console.log('   2. Better lighting (no shadows/glare)');
      console.log('   3. Straight-on angle (not tilted)');
      console.log('   4. Clear, readable text (not handwritten)');
      console.log('   5. Switch AI provider (gemini ↔ openai)');
    }
    
    console.log('');
    console.log('━'.repeat(80));
    console.log('📝 Test complete! Review results above.');
    console.log('━'.repeat(80));
    
  } catch (error) {
    console.log('');
    console.error('━'.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('━'.repeat(80));
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('API key')) {
      console.error('🔑 API Key Issue:');
      console.error('   1. Create backend/.env file');
      console.error('   2. Add: AI_PROVIDER=gemini');
      console.error('   3. Add: GEMINI_API_KEY=your_actual_key');
      console.error('   4. OR use OpenAI:');
      console.error('      AI_PROVIDER=openai');
      console.error('      OPENAI_API_KEY=sk-your_key');
    } else if (error.message.includes('ENOENT')) {
      console.error('📁 File Not Found:');
      console.error(`   Image file does not exist: ${imagePath}`);
      console.error('   Make sure the path is correct and file exists');
    } else {
      console.error('🐛 Debug Info:');
      console.error('   Stack:', error.stack);
    }
    
    console.error('');
    console.error('━'.repeat(80));
    process.exit(1);
  }
})();

function calculateQualityScore({ avgConfidence, bilingualCoverage, avgDescLength, avgIngredients, avgTags }) {
  // Scoring formula (out of 100)
  const score = (
    (avgConfidence * 0.35) +                                    // 35% weight on confidence
    (bilingualCoverage * 0.20) +                               // 20% weight on bilingual
    (Math.min(avgDescLength / 150 * 100, 100) * 0.20) +       // 20% weight on description
    (Math.min(avgIngredients / 10 * 100, 100) * 0.15) +       // 15% weight on ingredients
    (Math.min(avgTags / 7 * 100, 100) * 0.10)                 // 10% weight on tags
  );
  
  let rating, icon;
  
  if (score >= 95) {
    rating = 'EXCELLENT! Production ready';
    icon = '🌟';
  } else if (score >= 90) {
    rating = 'GREAT! Very good quality';
    icon = '✅';
  } else if (score >= 80) {
    rating = 'GOOD! Minor improvements needed';
    icon = '👍';
  } else if (score >= 70) {
    rating = 'FAIR - Needs improvement';
    icon = '⚠️';
  } else {
    rating = 'POOR - Check image quality';
    icon = '❌';
  }
  
  return { score, rating, icon };
}
