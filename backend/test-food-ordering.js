#!/usr/bin/env node

/**
 * Test script for food ordering workflow
 * Tests the complete food ordering process from menu items to order creation
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test user credentials (replace with actual test user)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';
let testUserId = '';

async function testFoodOrderingWorkflow() {
  console.log('🧪 Testing Food Ordering Workflow...\n');

  try {
    // 1. Test authentication
    console.log('1. Testing Authentication...');
    const authResponse = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = authResponse.data.token;
    testUserId = authResponse.data.user.id;
    console.log('✅ Authentication successful\n');

    // 2. Test menu items retrieval
    console.log('2. Testing Menu Items Retrieval...');
    const menuResponse = await axios.get(`${API_BASE}/menu/items`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${menuResponse.data.data.length} menu items\n`);

    // 3. Test order creation with cash payment
    console.log('3. Testing Order Creation (Cash Payment)...');
    const orderData = {
      items: [
        {
          foodId: menuResponse.data.data[0]._id,
          quantity: 2
        }
      ],
      totalPrice: menuResponse.data.data[0].price * 2,
      isTakeaway: true,
      customerDetails: {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        deliveryAddress: '123 Test Street'
      },
      paymentMethod: 'cash',
      specialInstructions: 'No onions please'
    };

    const orderResponse = await axios.post(`${API_BASE}/food/orders/create`, orderData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${orderResponse.data.data._id}`);
    console.log(`   Total: $${orderResponse.data.data.totalPrice}`);
    console.log(`   Payment Method: ${orderResponse.data.data.paymentMethod}`);
    console.log(`   Status: ${orderResponse.data.data.status}\n`);

    // 4. Test order retrieval
    console.log('4. Testing Order Retrieval...');
    const userOrdersResponse = await axios.get(`${API_BASE}/food/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${userOrdersResponse.data.data.length} user orders\n`);

    // 5. Test order statistics (admin view)
    console.log('5. Testing Order Statistics...');
    const statsResponse = await axios.get(`${API_BASE}/food/orders/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Order statistics retrieved');
    console.log(`   Total Orders: ${statsResponse.data.data.totalOrders}`);
    console.log(`   Today Orders: ${statsResponse.data.data.todayOrders}`);
    console.log(`   Pending Orders: ${statsResponse.data.data.pendingOrders}\n`);

    console.log('🎉 All tests passed! Food ordering workflow is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);

    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }

    if (error.response?.status) {
      console.error('Status code:', error.response.status);
    }

    process.exit(1);
  }
}

// Run the test
testFoodOrderingWorkflow();