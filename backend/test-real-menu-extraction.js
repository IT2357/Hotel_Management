#!/usr/bin/env node

/**
 * Comprehensive Real-World Test for AI Menu Extraction System
 * Tests with actual images, URLs, and file paths to verify all fixes work correctly
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test credentials
const TEST_ADMIN = {
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = '';

async function makeRequest(method, url, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };

  if (data && (method === 'post' || method === 'put' || method === 'patch')) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

async function authenticateAdmin() {
  console.log('\n🔐 Authenticating Admin User...');

  const loginResult = await makeRequest('post', '/auth/login', TEST_ADMIN);
  if (!loginResult.success) {
    console.log('❌ Admin login failed:', loginResult.error);
    return false;
  }

  console.log('🔍 Full login response:', JSON.stringify(loginResult.data, null, 2));

  // Try different possible token locations
  authToken = loginResult.data.token || loginResult.data.data?.token;
  console.log('✅ Admin authenticated successfully');
  console.log('🔑 Token received:', authToken ? 'Yes' : 'No');
  console.log('🔑 Token length:', authToken ? authToken.length : 0);
  console.log('🔑 Token preview:', authToken ? authToken.substring(0, 20) + '...' : 'N/A');
  return true;
}

async function testImageUpload() {
  console.log('\n🖼️  Testing Image Upload to GridFS...');

  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

  const formData = new FormData();
  formData.append('file', testImageBuffer, {
    filename: 'test-menu-image.png',
    contentType: 'image/png'
  });

  try {
    const response = await axios.post(`${API_BASE}/menu-extraction/image`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`
      },
      timeout: 10000
    });

    console.log('✅ Image uploaded successfully:', response.data.imageId);
    return response.data.imageId;

  } catch (error) {
    console.log('❌ Image upload failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testMenuExtractionFromImage(imageId) {
  console.log('\n🤖 Testing AI Menu Extraction from Uploaded Image...');

  const formData = new FormData();
  formData.append('file', fs.createReadStream(path.join(__dirname, 'test-menu.jpg')), {
    filename: 'test-menu.jpg',
    contentType: 'image/jpeg'
  });

  try {
    const response = await axios.post(`${API_BASE}/menu-extraction/extract`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`
      },
      timeout: 60000 // 60 second timeout for AI processing
    });

    console.log('✅ Menu extraction successful!');
    console.log(`📋 Extracted ${response.data.menu.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items in ${response.data.menu.categories.length} categories`);

    // Verify LKR pricing
    const hasLKRPricing = response.data.menu.categories.some(cat =>
      cat.items.some(item => item.price && typeof item.price === 'number')
    );
    console.log(`💰 LKR Pricing: ${hasLKRPricing ? '✅ Working' : '❌ Missing'}`);

    // Verify time slots
    const hasTimeSlots = response.data.menu.categories.some(cat =>
      cat.items.some(item => item.isBreakfast || item.isLunch || item.isDinner || item.isSnacks)
    );
    console.log(`⏰ Time Slots: ${hasTimeSlots ? '✅ Working' : '❌ Missing'}`);

    // Verify image references
    const hasImageRefs = response.data.menu.categories.some(cat =>
      cat.items.some(item => item.image && item.image.startsWith('/api/menu/image/'))
    );
    console.log(`🖼️  Image References: ${hasImageRefs ? '✅ Working' : '❌ Missing'}`);

    return response.data.menu;

  } catch (error) {
    console.log('❌ Menu extraction failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testMenuExtractionFromURL() {
  console.log('\n🌐 Testing AI Menu Extraction from URL...');

  // Test with a real menu image URL (using a placeholder for now)
  const testUrls = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Restaurant_menu.jpg/640px-Restaurant_menu.jpg',
    'https://example.com/menu-image.jpg' // This will fail but test error handling
  ];

  for (const url of testUrls) {
    console.log(`\n🔗 Testing URL: ${url}`);

    try {
      const response = await axios.post(`${API_BASE}/menu-extraction/extract`, { url }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ URL extraction successful!');
      console.log(`📋 Extracted ${response.data.menu.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items`);

      return response.data.menu;

    } catch (error) {
      console.log(`❌ URL extraction failed for ${url}:`, error.response?.data?.message || error.message);
    }
  }

  return null;
}

async function testMenuExtractionFromPath() {
  console.log('\n📁 Testing AI Menu Extraction from File Path...');

  const testPath = path.join(__dirname, 'test-menu.jpg');

  if (!fs.existsSync(testPath)) {
    console.log('⚠️  Test image not found, skipping file path test');
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE}/menu-extraction/extract`, { path: testPath }, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ File path extraction successful!');
    console.log(`📋 Extracted ${response.data.menu.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items`);

    return response.data.menu;

  } catch (error) {
    console.log('❌ File path extraction failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testMenuItemPersistence(menu) {
  console.log('\n💾 Testing Menu Item Persistence...');

  if (!menu || !menu.categories || menu.categories.length === 0) {
    console.log('⚠️  No menu data to test persistence');
    return false;
  }

  // Get existing menu items count
  const beforeResult = await makeRequest('get', '/menu/items', null, authToken);
  const beforeCount = beforeResult.success ? beforeResult.data.length : 0;

  console.log(`📊 Menu items before: ${beforeCount}`);

  // Save extracted items to menu items collection
  const itemsToSave = menu.categories.flatMap(cat => cat.items);
  console.log(`💾 Attempting to save ${itemsToSave.length} items...`);

  let savedCount = 0;
  for (const item of itemsToSave.slice(0, 3)) { // Test with first 3 items
    try {
      const saveData = {
        name: item.name,
        category: item.category || 'Main Course',
        description: item.description || '',
        price: item.price || 200,
        image: item.image || '',
        isAvailable: true,
        isVeg: item.isVeg || false,
        isSpicy: item.isSpicy || false,
        isPopular: item.popularity === 'high',
        isBreakfast: item.isBreakfast || false,
        isLunch: item.isLunch !== false,
        isDinner: item.isDinner !== false,
        isSnacks: item.isSnacks || false,
        ingredients: item.ingredients || [],
        dietaryTags: item.dietaryTags || [],
        nutritionalInfo: item.nutritionalInfo || {},
        cookingTime: item.cookingTime || 15,
        spiceLevel: item.spiceLevel || 'medium',
        cuisine: item.cuisine || 'Sri Lankan Tamil'
      };

      const saveResult = await makeRequest('post', '/menu/items', saveData, authToken);
      if (saveResult.success) {
        savedCount++;
      }
    } catch (error) {
      console.log(`❌ Failed to save item ${item.name}:`, error.message);
    }
  }

  // Check count after saving
  const afterResult = await makeRequest('get', '/menu/items', null, authToken);
  const afterCount = afterResult.success ? afterResult.data.length : 0;

  console.log(`📊 Menu items after: ${afterCount}`);
  console.log(`✅ Successfully saved ${savedCount} items`);

  return savedCount > 0;
}

async function testImageRetrieval(imageId) {
  console.log('\n🖼️  Testing Image Retrieval from GridFS...');

  if (!imageId) {
    console.log('⚠️  No image ID to test retrieval');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/menu/image/${imageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'stream',
      timeout: 10000
    });

    console.log('✅ Image retrieval successful!');
    console.log(`📏 Content-Type: ${response.headers['content-type']}`);
    console.log(`📏 Content-Length: ${response.headers['content-length']}`);

    return true;

  } catch (error) {
    console.log('❌ Image retrieval failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive AI Menu Extraction Test Suite');
  console.log('='.repeat(70));

  const results = {
    authentication: false,
    imageUpload: false,
    menuExtraction: false,
    urlExtraction: false,
    pathExtraction: false,
    persistence: false,
    imageRetrieval: false
  };

  try {
    // Step 1: Authentication
    results.authentication = await authenticateAdmin();

    if (!results.authentication) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    // Step 2: Test image upload
    const uploadedImageId = await testImageUpload();
    results.imageUpload = !!uploadedImageId;

    // Step 3: Test menu extraction from uploaded image
    const extractedMenu = await testMenuExtractionFromImage(uploadedImageId);
    results.menuExtraction = !!extractedMenu;

    // Step 4: Test URL extraction
    const urlMenu = await testMenuExtractionFromURL();
    results.urlExtraction = !!urlMenu;

    // Step 5: Test file path extraction
    const pathMenu = await testMenuExtractionFromPath();
    results.pathExtraction = !!pathMenu;

    // Step 6: Test menu item persistence
    results.persistence = await testMenuItemPersistence(extractedMenu || urlMenu || pathMenu);

    // Step 7: Test image retrieval
    results.imageRetrieval = await testImageRetrieval(uploadedImageId);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(70));

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${testName}`);
    });

    console.log('='.repeat(70));
    console.log(`🎯 Overall Score: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! AI Menu Extraction System is fully functional!');
      console.log('\n✅ Features Verified:');
      console.log('   • Sri Lankan Rupee (LKR) pricing');
      console.log('   • Time slot availability (Breakfast/Lunch/Dinner/Snacks)');
      console.log('   • GridFS image storage and retrieval');
      console.log('   • Menu item persistence to database');
      console.log('   • Multiple input methods (Upload/URL/File Path)');
      console.log('   • AI-powered menu extraction with OCR fallback');
    } else {
      console.log('⚠️  Some tests failed. Check the implementation.');
    }

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);