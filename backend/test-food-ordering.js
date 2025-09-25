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
  email: 'guest@test.com',
  password: 'guest123'
};

let authToken = '';
let testUserId = '';

async function testFoodOrderingWorkflow() {
  console.log('🧪 Testing Food Ordering Workflow...\n');

  try {
    // 1. Test authentication
    console.log('1. Testing Authentication...');
    const authResponse = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = authResponse.data.data.token;
    testUserId = authResponse.data.data.user._id;
    console.log('✅ Authentication successful\n');

    // 2. Test menu items retrieval
    console.log('2. Testing Menu Items Retrieval...');
    const menuResponse = await axios.get(`${API_BASE}/menu/items?limit=100`);
    console.log(`✅ Retrieved ${menuResponse.data.data.items.length} menu items\n`);

    // 3. Test order creation with cash payment
    console.log('3. Testing Order Creation (Cash Payment)...');
    const itemPrice = menuResponse.data.data.items[0].price;
    const quantity = 2;
    const subtotal = itemPrice * quantity;
    const tax = subtotal * 0.10; // 10% tax
    const deliveryFee = 0; // No delivery for takeaway
    const totalPrice = subtotal + tax + deliveryFee;

    const orderData = {
      items: [
        {
          foodId: menuResponse.data.data.items[0]._id,
          quantity: quantity
        }
      ],
      subtotal: subtotal,
      tax: tax,
      deliveryFee: deliveryFee,
      totalPrice: totalPrice,
      currency: 'LKR',
      orderType: 'takeaway',
      isTakeaway: true,
      customerDetails: {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+94771234567',
        deliveryAddress: '123 Test Street'
      },
      paymentMethod: 'cash',
      specialInstructions: 'No onions please'
    };

    console.log('Auth token:', authToken);
    const orderResponse = await axios.post(`${API_BASE}/food/orders/create`, orderData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${orderResponse.data.data._id}`);
    console.log(`   Total: LKR ${orderResponse.data.data.totalPrice}`);
    console.log(`   Payment Method: ${orderResponse.data.data.paymentMethod}`);
    console.log(`   Status: ${orderResponse.data.data.status}\n`);

    // 4. Test order retrieval
    console.log('4. Testing Order Retrieval...');
    const userOrdersResponse = await axios.get(`${API_BASE}/food/orders/my-orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${userOrdersResponse.data.data.length} user orders\n`);

    // 5. Test order statistics (skipped for guest user)
    console.log('5. Testing Order Statistics... (Skipped - requires admin privileges)\n');

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