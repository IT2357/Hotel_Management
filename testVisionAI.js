#!/usr/bin/env node
/**
 * Vision AI Test Script
 * Tests the enhanced AI menu extraction with detailed output
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

async function checkEnvironment() {
  console.log('🔍 Checking environment configuration...\n');
  
  // Check if backend is running
  try {
    await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ Backend server is running');
  } catch {
    console.error('❌ Backend server is NOT running');
    console.error('💡 Start backend: cd backend && npm run dev\n');
    process.exit(1);
  }
  
  // Check .env file
  const envPath = path.join(process.cwd(), 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const hasGemini = envContent.includes('GEMINI_API_KEY') && !envContent.match(/GEMINI_API_KEY=\s*$/m);
    const hasOpenAI = envContent.includes('OPENAI_API_KEY') && !envContent.match(/OPENAI_API_KEY=\s*$/m);
    const provider = envContent.match(/AI_PROVIDER=(\w+)/)?.[1] || 'off';
    
    console.log('✅ .env file found');
    console.log(`   AI Provider: ${provider}`);
    
    if (provider === 'gemini' && !hasGemini) {
      console.warn('⚠️  AI_PROVIDER is "gemini" but GEMINI_API_KEY not set');
      console.warn('   Add: GEMINI_API_KEY=your_key_here');
    } else if (provider === 'openai' && !hasOpenAI) {
      console.warn('⚠️  AI_PROVIDER is "openai" but OPENAI_API_KEY not set');
      console.warn('   Add: OPENAI_API_KEY=sk-your_key_here');
    } else if (provider === 'gemini' || provider === 'openai') {
      console.log('✅ Vision AI is enabled');
    } else {
      console.log('ℹ️  Vision AI is disabled (OCR-only mode)');
      console.log('   To enable, add to .env:');
      console.log('   AI_PROVIDER=gemini');
      console.log('   GEMINI_API_KEY=your_key_here');
    }
  } else {
    console.warn('⚠️  .env file not found in backend/');
  }
  
  console.log('');
}

async function testVisionAI(imagePath) {
  try {
    console.log('━'.repeat(70));
    console.log('🤖 VISION AI MENU EXTRACTION TEST');
    console.log('━'.repeat(70));
    console.log('');
    
    // Login
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');
    
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Image not found: ${imagePath}`);
      console.log('');
      console.log('📥 Available options:');
      console.log('1. Place your menu image as "sample_menu.jpg" in project root');
      console.log('2. Download a Jaffna menu image from Google Images');
      console.log('3. Take a photo of a menu and save as sample_menu.jpg');
      console.log('');
      return;
    }
    
    // Get image stats
    const stats = fs.statSync(imagePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('📸 Image Information:');
    console.log(`   Path: ${imagePath}`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log('');
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    
    console.log('🔄 Processing image with AI extraction...');
    console.log('⏱️  This may take 5-15 seconds depending on provider...');
    console.log('');
    
    const startTime = Date.now();
    
    // Call extraction endpoint
    const extractResponse = await axios.post(
      `${API_BASE}/food-complete/ai/extract`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // 60 second timeout
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Extraction completed in ${duration}s\n`);
    console.log('━'.repeat(70));
    console.log('📊 EXTRACTION RESULTS');
    console.log('━'.repeat(70));
    console.log('');
    
    const { menuItems, rawText, ocrConfidence } = extractResponse.data.data;
    
    // Summary stats
    console.log('📈 Summary Statistics:');
    console.log(`   Items Found: ${menuItems.length}`);
    console.log(`   OCR Confidence: ${ocrConfidence.toFixed(2)}%`);
    console.log(`   Average Item Confidence: ${(menuItems.reduce((sum, item) => sum + item.confidence, 0) / menuItems.length).toFixed(2)}%`);
    console.log(`   Processing Time: ${duration}s`);
    console.log('');
    
    // Detailed items
    if (menuItems.length > 0) {
      console.log('━'.repeat(70));
      console.log('📋 EXTRACTED MENU ITEMS (Detailed)');
      console.log('━'.repeat(70));
      console.log('');
      
      menuItems.forEach((item, index) => {
        const num = String(index + 1).padStart(2, '0');
        console.log(`${num}. ${item.name_english || item.name_tamil || 'Unnamed Item'}`);
        console.log('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`    Tamil Name:     ${item.name_tamil || 'N/A'}`);
        console.log(`    English Name:   ${item.name_english || 'N/A'}`);
        console.log(`    Price:          LKR ${item.price.toFixed(2)}`);
        console.log(`    Description:    ${item.description_english || 'N/A'}`);
        console.log(`    Ingredients:    ${item.ingredients.length > 0 ? item.ingredients.join(', ') : 'N/A'}`);
        console.log(`    Dietary:        ${item.dietaryTags.join(', ') || 'N/A'}`);
        console.log(`    Vegetarian:     ${item.isVeg ? 'Yes ✅' : 'No ❌'}`);
        console.log(`    Spicy:          ${item.isSpicy ? 'Yes 🌶️' : 'No'}`);
        console.log(`    Confidence:     ${item.confidence}% ${item.confidence >= 90 ? '🎯' : item.confidence >= 80 ? '✅' : '⚠️'}`);
        console.log('');
      });
      
      // Quality assessment
      console.log('━'.repeat(70));
      console.log('🎯 QUALITY ASSESSMENT');
      console.log('━'.repeat(70));
      console.log('');
      
      const highConfidence = menuItems.filter(i => i.confidence >= 90).length;
      const mediumConfidence = menuItems.filter(i => i.confidence >= 75 && i.confidence < 90).length;
      const lowConfidence = menuItems.filter(i => i.confidence < 75).length;
      
      const withDescriptions = menuItems.filter(i => i.description_english && i.description_english.length > 30).length;
      const withIngredients = menuItems.filter(i => i.ingredients.length >= 5).length;
      const bilingual = menuItems.filter(i => i.name_tamil && i.name_english).length;
      
      console.log('Confidence Distribution:');
      console.log(`  High (90-100%):   ${highConfidence}/${menuItems.length} items 🎯`);
      console.log(`  Medium (75-89%):  ${mediumConfidence}/${menuItems.length} items ✅`);
      console.log(`  Low (<75%):       ${lowConfidence}/${menuItems.length} items ⚠️`);
      console.log('');
      
      console.log('Data Completeness:');
      console.log(`  Detailed Descriptions:  ${withDescriptions}/${menuItems.length} items (${(withDescriptions/menuItems.length*100).toFixed(0)}%)`);
      console.log(`  Rich Ingredients:       ${withIngredients}/${menuItems.length} items (${(withIngredients/menuItems.length*100).toFixed(0)}%)`);
      console.log(`  Bilingual Names:        ${bilingual}/${menuItems.length} items (${(bilingual/menuItems.length*100).toFixed(0)}%)`);
      console.log('');
      
      const overallScore = (
        (highConfidence * 100 + mediumConfidence * 80 + lowConfidence * 60) / menuItems.length +
        (withDescriptions / menuItems.length * 100) +
        (withIngredients / menuItems.length * 100) +
        (bilingual / menuItems.length * 100)
      ) / 4;
      
      console.log(`Overall Quality Score: ${overallScore.toFixed(1)}% ${overallScore >= 90 ? '🌟 Excellent!' : overallScore >= 80 ? '✅ Good' : overallScore >= 70 ? '⚠️ Fair' : '❌ Needs Improvement'}`);
      console.log('');
      
      // Recommendations
      if (overallScore < 85) {
        console.log('💡 Recommendations to improve accuracy:');
        if (lowConfidence > 0) {
          console.log('   • Improve image quality (better lighting, higher resolution)');
        }
        if (withDescriptions < menuItems.length * 0.8) {
          console.log('   • Use clearer menu layouts with item descriptions');
        }
        if (withIngredients < menuItems.length * 0.7) {
          console.log('   • Include menus that list ingredients');
        }
        if (bilingual < menuItems.length * 0.6) {
          console.log('   • Use bilingual menus (Tamil + English)');
        }
        console.log('');
      }
      
    } else {
      console.log('⚠️  No menu items extracted');
      console.log('');
      console.log('Possible reasons:');
      console.log('  • Image quality too low');
      console.log('  • No clear menu structure visible');
      console.log('  • Text too small or blurry');
      console.log('  • Not a menu image');
      console.log('');
      console.log('OCR Raw Text (first 500 chars):');
      console.log(rawText.substring(0, 500));
      console.log('');
    }
    
    console.log('━'.repeat(70));
    console.log('✨ Test completed successfully!');
    console.log('━'.repeat(70));
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('━'.repeat(70));
    console.error('❌ ERROR OCCURRED');
    console.error('━'.repeat(70));
    console.error('');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running.');
      console.error('Start it with: cd backend && npm run dev');
    } else if (error.response?.status === 401) {
      console.error('Authentication failed.');
      console.error('Check admin credentials (default: admin@test.com / admin123)');
    } else if (error.response?.status === 400) {
      console.error('Bad request:', error.response?.data?.message || 'Unknown error');
    } else {
      console.error('Error:', error.response?.data || error.message);
    }
    
    if (error.response?.data?.stack && process.env.NODE_ENV === 'development') {
      console.error('');
      console.error('Stack trace:');
      console.error(error.response.data.stack);
    }
    
    console.error('');
  }
}

// Main execution
(async () => {
  console.log('');
  await checkEnvironment();
  
  // Check for image file
  const imagePath = process.argv[2] || './sample_menu.jpg';
  
  await testVisionAI(imagePath);
})();
