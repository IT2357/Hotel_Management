#!/usr/bin/env node

/**
 * AI Menu Extractor Test Script
 * Tests the complete menu extraction workflow
 */

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token'; // Replace with actual token

// Test configuration
const config = {
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
};

console.log('🧪 AI Menu Extractor Test Suite');
console.log('================================');

async function testHealthCheck() {
  console.log('\n📡 1. Testing API Health...');
  try {
    const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ API Health:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ API Health Check Failed:', error.message);
    return false;
  }
}

async function testURLExtraction() {
  console.log('\n🌐 2. Testing URL Extraction...');
  try {
    const response = await axios.post(`${API_BASE}/menu/extract`, {
      url: 'https://example.com/menu'
    }, config);
    
    console.log('✅ URL Extraction Response:');
    console.log('   Success:', response.data.success);
    console.log('   Categories:', response.data.menu?.categories?.length || 0);
    console.log('   Items:', response.data.menu?.totalItems || 0);
    console.log('   Method:', response.data.menu?.extractionMethod);
    
    return response.data;
  } catch (error) {
    console.log('❌ URL Extraction Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testPathExtraction() {
  console.log('\n📁 3. Testing File Path Extraction...');
  try {
    const response = await axios.post(`${API_BASE}/menu/extract`, {
      path: '/path/to/test/menu.jpg'
    }, config);
    
    console.log('✅ Path Extraction Response:');
    console.log('   Success:', response.data.success);
    console.log('   Categories:', response.data.menu?.categories?.length || 0);
    console.log('   Items:', response.data.menu?.totalItems || 0);
    
    return response.data;
  } catch (error) {
    console.log('❌ Path Extraction Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testImageUpload() {
  console.log('\n📸 4. Testing Image Upload...');
  
  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8D, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  try {
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test-menu.png',
      contentType: 'image/png'
    });
    
    const response = await axios.post(`${API_BASE}/menu/extract`, formData, {
      ...config,
      headers: {
        ...config.headers,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Image Upload Response:');
    console.log('   Success:', response.data.success);
    console.log('   Categories:', response.data.menu?.categories?.length || 0);
    console.log('   Method:', response.data.menu?.extractionMethod);
    
    return response.data;
  } catch (error) {
    console.log('❌ Image Upload Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testMenuSave(menuData) {
  console.log('\n💾 5. Testing Menu Save...');
  
  if (!menuData || !menuData.menu) {
    console.log('⚠️ No menu data to save');
    return null;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/menu/save`, menuData.menu, config);
    
    console.log('✅ Menu Save Response:');
    console.log('   Success:', response.data.success);
    console.log('   Inserted ID:', response.data.insertedId);
    
    return response.data;
  } catch (error) {
    console.log('❌ Menu Save Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testMenuList() {
  console.log('\n📋 6. Testing Menu List...');
  try {
    const response = await axios.get(`${API_BASE}/menu`, config);
    
    console.log('✅ Menu List Response:');
    console.log('   Success:', response.data.success);
    console.log('   Total Menus:', response.data.menus?.length || 0);
    console.log('   Pagination:', response.data.pagination);
    
    return response.data;
  } catch (error) {
    console.log('❌ Menu List Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testStatistics() {
  console.log('\n📊 7. Testing Statistics...');
  try {
    const response = await axios.get(`${API_BASE}/menu/stats`, config);
    
    console.log('✅ Statistics Response:');
    console.log('   Success:', response.data.success);
    console.log('   Total Menus:', response.data.stats?.totalMenus || 0);
    console.log('   Total Items:', response.data.stats?.totalItems || 0);
    console.log('   Avg Confidence:', response.data.stats?.avgConfidence || 0);
    
    return response.data;
  } catch (error) {
    console.log('❌ Statistics Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runTests() {
  console.log('Starting comprehensive test suite...\n');
  
  const results = {
    health: false,
    urlExtraction: false,
    pathExtraction: false,
    imageUpload: false,
    menuSave: false,
    menuList: false,
    statistics: false
  };
  
  // Test 1: Health Check
  results.health = await testHealthCheck();
  
  if (!results.health) {
    console.log('\n❌ Cannot proceed - API is not running');
    console.log('Please start your backend server first: npm start');
    return;
  }
  
  // Test 2: URL Extraction
  const urlResult = await testURLExtraction();
  results.urlExtraction = !!urlResult;
  
  // Test 3: Path Extraction
  const pathResult = await testPathExtraction();
  results.pathExtraction = !!pathResult;
  
  // Test 4: Image Upload
  const imageResult = await testImageUpload();
  results.imageUpload = !!imageResult;
  
  // Test 5: Menu Save (use any successful extraction)
  const menuToSave = urlResult || pathResult || imageResult;
  if (menuToSave) {
    const saveResult = await testMenuSave(menuToSave);
    results.menuSave = !!saveResult;
  }
  
  // Test 6: Menu List
  const listResult = await testMenuList();
  results.menuList = !!listResult;
  
  // Test 7: Statistics
  const statsResult = await testStatistics();
  results.statistics = !!statsResult;
  
  // Summary
  console.log('\n🎯 Test Results Summary');
  console.log('=======================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n📊 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your AI Menu Extractor is working perfectly.');
  } else {
    console.log('⚠️ Some tests failed. Check the error messages above for details.');
  }
  
  console.log('\n🚀 Ready to use: http://localhost:5173/admin/menu-extractor');
}

// Handle command line execution
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runTests().catch(console.error);
}

export { runTests };
