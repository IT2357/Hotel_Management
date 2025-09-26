#!/usr/bin/env node

/**
 * Test script for AI Menu Extraction functionality
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

const TEST_ADMIN = { email: 'admin@test.com', password: 'admin123' };
let adminToken = '';

async function makeRequest(method, url, data = null, token = null, isFormData = false) {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };

  if (isFormData) {
    config.headers = { ...config.headers, ...data.getHeaders() };
    config.data = data;
  } else if (data && (method === 'post' || method === 'put' || method === 'patch')) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
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
  console.log('\n👑 Authenticating admin...');

  const loginResult = await makeRequest('post', '/auth/login', TEST_ADMIN);
  if (!loginResult.success) {
    console.log('❌ Admin login failed:', loginResult.error);
    return false;
  }

  console.log('🔍 Full login response:', JSON.stringify(loginResult.data, null, 2));
  adminToken = loginResult.data.data.token;
  console.log('✅ Admin authenticated successfully');
  console.log('🔑 Token received:', adminToken ? 'Yes' : 'No');
  console.log('🔑 Token length:', adminToken ? adminToken.length : 0);
  return true;
}

async function testMenuExtractionFromURL() {
  console.log('\n🌐 Testing menu extraction from URL...');

  // Test with a sample image URL (this might not work, but tests the endpoint)
  const testData = {
    url: 'https://via.placeholder.com/800x600.jpg?text=Menu+Image'
  };

  const result = await makeRequest('post', '/menu-extraction/extract-url', testData, adminToken);
  if (!result.success) {
    console.log('❌ URL extraction failed:', result.error);
    return false;
  }

  console.log('✅ URL extraction successful');
  console.log(`📋 Extracted ${result.data.menu.totalItems} items in ${result.data.menu.totalCategories} categories`);
  return true;
}

async function testMenuExtractionFromFile() {
  console.log('\n📸 Testing menu extraction from file upload...');

  if (!fs.existsSync('./test-menu.jpg')) {
    console.log('⚠️  Test image not found, creating a placeholder...');
    // Create a simple test image (just for testing the endpoint)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('./test-menu.jpg', testImageBuffer);
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream('./test-menu.jpg'));

  const result = await makeRequest('post', '/menu-extraction/extract', formData, adminToken, true);
  if (!result.success) {
    console.log('❌ File extraction failed:', result.error);
    return false;
  }

  console.log('✅ File extraction successful');
  console.log(`📋 Extracted ${result.data.menu.totalItems} items in ${result.data.menu.totalCategories} categories`);
  return true;
}

async function testMenuImageRetrieval() {
  console.log('\n🖼️  Testing menu image retrieval...');

  // First create a menu to get an image ID
  const formData = new FormData();
  formData.append('file', fs.createReadStream('./test-menu.jpg'));

  const createResult = await makeRequest('post', '/menu-extraction/extract', formData, adminToken, true);
  if (!createResult.success) {
    console.log('❌ Could not create menu for image test:', createResult.error);
    return false;
  }

  const menu = createResult.data.menu;
  if (!menu.imageId) {
    console.log('⚠️  Menu has no image ID, skipping image retrieval test');
    return true; // Not a failure, just no image
  }

  // Test image retrieval
  const imageResult = await makeRequest('get', `/menu/image/${menu.imageId}`);
  if (!imageResult.success) {
    console.log('❌ Image retrieval failed:', imageResult.error);
    return false;
  }

  console.log('✅ Image retrieval successful');
  return true;
}

async function testMenuListAndStats() {
  console.log('\n📊 Testing menu list and statistics...');

  // Test menu list
  const listResult = await makeRequest('get', '/menu-extraction?limit=5', null, adminToken);
  if (!listResult.success) {
    console.log('❌ Menu list failed:', listResult.error);
    return false;
  }

  console.log(`✅ Menu list successful: ${listResult.data.menus.length} menus found`);

  // Test statistics
  const statsResult = await makeRequest('get', '/menu-extraction/stats', null, adminToken);
  if (!statsResult.success) {
    console.log('❌ Menu stats failed:', statsResult.error);
    return false;
  }

  console.log('✅ Menu stats successful');
  console.log(`   Total menus: ${statsResult.data.stats.totalMenus}`);
  console.log(`   Total items: ${statsResult.data.stats.totalItems}`);
  console.log(`   Average confidence: ${statsResult.data.stats.avgConfidence}%`);

  return true;
}

async function runMenuExtractionTests() {
  console.log('🚀 Starting AI Menu Extraction Test Suite');
  console.log('='.repeat(60));

  const results = {
    authentication: false,
    urlExtraction: false,
    fileExtraction: false,
    imageRetrieval: false,
    listAndStats: false
  };

  try {
    // Authenticate admin
    results.authentication = await authenticateAdmin();

    if (results.authentication) {
      // Test menu extraction from URL
      results.urlExtraction = await testMenuExtractionFromURL();

      // Test menu extraction from file
      results.fileExtraction = await testMenuExtractionFromFile();

      // Test image retrieval
      results.imageRetrieval = await testMenuImageRetrieval();

      // Test menu list and stats
      results.listAndStats = await testMenuListAndStats();
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MENU EXTRACTION TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });

    console.log('='.repeat(60));
    console.log(`🎯 Overall: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All menu extraction tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the implementation.');
    }

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runMenuExtractionTests();