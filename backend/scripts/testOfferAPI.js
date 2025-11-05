// Test script for offers API
const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:5000/api';

// Sample admin token (in a real scenario, you'd login to get this)
const ADMIN_TOKEN = 'your-admin-jwt-token-here';

// Sample user token
const USER_TOKEN = 'your-user-jwt-token-here';

async function testOffersAPI() {
  try {
    console.log('Testing Offers API...\n');
    
    // Test 1: Admin creates an offer
    console.log('1. Creating a new offer...');
    const newOffer = {
      title: "Test Offer",
      description: "20% off for testing purposes",
      type: "percentage",
      discountValue: 20,
      target: {
        minOrders: 3,
        itemType: "seafood"
      },
      jaffnaItems: ["seafood"],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      isActive: true
    };
    
    const createResponse = await axios.post(`${BASE_URL}/offers`, newOffer, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Offer created:', createResponse.data.data.title);
    
    // Test 2: Admin gets all offers
    console.log('\n2. Fetching all offers...');
    const getAllResponse = await axios.get(`${BASE_URL}/offers`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    console.log('   Total offers:', getAllResponse.data.data.length);
    
    // Test 3: User gets personalized offers
    console.log('\n3. Fetching personalized offers for user...');
    const personalResponse = await axios.get(`${BASE_URL}/offers/personalized`, {
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`
      }
    });
    
    console.log('   Personalized offers found:', personalResponse.data.data.length);
    
    console.log('\nAPI tests completed successfully!');
    
  } catch (error) {
    console.error('API test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOffersAPI();