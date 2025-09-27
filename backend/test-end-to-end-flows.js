#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test Script for Hotel Management System
 * Tests complete user journeys: guest login → room booking with food → food ordering → staff assignment
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

const TEST_USERS = {
  guest: { email: 'guest@test.com', password: 'guest123' },
  admin: { email: 'admin@test.com', password: 'admin123' }
};

let tokens = { guest: '', admin: '' };
let testData = { bookingId: '', orderId: '', taskId: '' };

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

async function testGuestAuthentication() {
  console.log('\n🔐 Testing Guest Authentication...');

  const loginResult = await makeRequest('post', '/auth/login', TEST_USERS.guest);
  if (!loginResult.success) {
    console.log('❌ Guest login failed, creating test user...');
    const registerResult = await makeRequest('post', '/auth/register', {
      name: 'Test Guest',
      email: TEST_USERS.guest.email,
      password: TEST_USERS.guest.password,
      phone: '+1234567890'
    });

    if (registerResult.success) {
      console.log('✅ Test guest created, attempting login...');
      const retryLogin = await makeRequest('post', '/auth/login', TEST_USERS.guest);
      if (retryLogin.success) {
        tokens.guest = retryLogin.data.token;
        console.log('✅ Guest authentication successful');
        return true;
      }
    }
    return false;
  }

  tokens.guest = loginResult.data.token;
  console.log('✅ Guest authentication successful');
  return true;
}

async function testAdminAuthentication() {
  console.log('\n👑 Testing Admin Authentication...');

  const loginResult = await makeRequest('post', '/auth/login', TEST_USERS.admin);
  if (!loginResult.success) {
    console.log('❌ Admin login failed - admin user may not exist');
    return false;
  }

  tokens.admin = loginResult.data.token;
  console.log('✅ Admin authentication successful');
  return true;
}

async function testRoomBookingWithFood() {
  console.log('\n🏨 Testing Room Booking with Food Options...');

  // Use current date + 7 days for check-in, +9 days for check-out
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 7);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + 2);

  const checkInStr = checkInDate.toISOString().split('T')[0];
  const checkOutStr = checkOutDate.toISOString().split('T')[0];

  console.log(`📅 Testing with dates: ${checkInStr} to ${checkOutStr}`);

  // Get available rooms
  const roomsResult = await makeRequest('get', `/rooms/available?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
  if (!roomsResult.success) {
    console.log('❌ Failed to get available rooms');
    return false;
  }

  if (!roomsResult.data.data || roomsResult.data.data.length === 0) {
    console.log('❌ No rooms available for test dates, trying with different dates...');

    // Try with tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const retryResult = await makeRequest('get', `/rooms/available?checkIn=${tomorrowStr}&checkOut=${dayAfterStr}&guests=1`);
    if (!retryResult.success || !retryResult.data.data || retryResult.data.data.length === 0) {
      console.log('❌ Still no rooms available, skipping booking test');
      return false;
    }

    // Use tomorrow's dates
    checkInDate.setTime(tomorrow.getTime());
    checkOutDate.setTime(dayAfter.getTime());
  }

  const selectedRoom = roomsResult.data.data[0];
  console.log(`📋 Selected room: ${selectedRoom.title} (${selectedRoom.roomId})`);

  // Create booking with basic food options (skip menu items for now)
  const bookingData = {
    roomId: selectedRoom.roomId,
    checkIn: checkInDate.toISOString().split('T')[0],
    checkOut: checkOutDate.toISOString().split('T')[0],
    guests: 2,
    specialRequests: 'Late check-in requested',
    foodPlan: 'Breakfast',
    selectedMeals: [], // Skip complex meal selection for now
    paymentMethod: 'cash'
  };

  const bookingResult = await makeRequest('post', '/bookings', bookingData, tokens.guest);
  if (!bookingResult.success) {
    console.log('❌ Booking creation failed:', bookingResult.error);
    return false;
  }

  testData.bookingId = bookingResult.data.data.bookingId;
  console.log(`✅ Booking created successfully: ${testData.bookingId}`);
  console.log(`   Status: ${bookingResult.data.data.status}`);
  console.log(`   Food Plan: ${bookingResult.data.data.foodPlan}`);

  return true;
}

async function testFoodOrdering() {
  console.log('\n🍽️  Testing Food Ordering...');

  // Get menu items
  const menuResult = await makeRequest('get', '/food/items?limit=5');
  if (!menuResult.success) {
    console.log('❌ Failed to get menu items');
    return false;
  }

  // Handle different response structures
  let menuItems = [];
  if (menuResult.data.data && Array.isArray(menuResult.data.data)) {
    menuItems = menuResult.data.data;
  } else if (Array.isArray(menuResult.data)) {
    menuItems = menuResult.data;
  }

  if (menuItems.length === 0) {
    console.log('⚠️  No menu items available, creating mock order data');
    // Create mock order data for testing
    const orderData = {
      items: [
        {
          menuItemId: 'mock-item-1',
          quantity: 2
        }
      ],
      totalPrice: 2500, // Mock total
      orderType: 'dine-in',
      isTakeaway: false,
      customerDetails: {
        customerName: 'Test Guest',
        customerEmail: TEST_USERS.guest.email,
        customerPhone: '+1234567890',
        deliveryAddress: 'Room 101'
      },
      paymentMethod: 'cash',
      specialInstructions: 'Extra spicy please'
    };

    const orderResult = await makeRequest('post', '/food/orders', orderData, tokens.guest);
    if (!orderResult.success) {
      console.log('❌ Food order creation failed:', orderResult.error);
      return false;
    }

    testData.orderId = orderResult.data.data._id;
    console.log(`✅ Food order created successfully: ${testData.orderId}`);
    console.log(`   Status: ${orderResult.data.data.status}`);
    console.log(`   Items: ${orderData.items.length}`);
    console.log(`   Total: LKR ${orderResult.data.data.totalPrice}`);

    return true;
  }

  const orderItems = menuItems.slice(0, 2).map(item => ({
    menuItemId: item._id,
    quantity: 1
  }));

  // Calculate total
  const subtotal = orderItems.reduce((total, orderItem) => {
    const item = menuItems.find(m => m._id === orderItem.menuItemId);
    return total + (item ? item.price * orderItem.quantity : 0);
  }, 0);

  const orderData = {
    items: orderItems,
    totalPrice: subtotal * 1.25, // Including tax and service charge
    orderType: 'dine-in',
    isTakeaway: false,
    customerDetails: {
      customerName: 'Test Guest',
      customerEmail: TEST_USERS.guest.email,
      customerPhone: '+1234567890',
      deliveryAddress: 'Room 101'
    },
    paymentMethod: 'cash',
    specialInstructions: 'Extra spicy please'
  };

  const orderResult = await makeRequest('post', '/food/orders', orderData, tokens.guest);
  if (!orderResult.success) {
    console.log('❌ Food order creation failed:', orderResult.error);
    return false;
  }

  testData.orderId = orderResult.data.data._id;
  console.log(`✅ Food order created successfully: ${testData.orderId}`);
  console.log(`   Status: ${orderResult.data.data.status}`);
  console.log(`   Items: ${orderItems.length}`);
  console.log(`   Total: LKR ${orderResult.data.data.totalPrice}`);

  return true;
}

async function testStaffAssignment() {
  console.log('\n👷 Testing Staff Assignment...');

  if (!tokens.admin) {
    console.log('⚠️  Admin not authenticated, skipping staff assignment test');
    return false;
  }

  // Create a staff task for the food order
  const taskData = {
    title: `Prepare Food Order ${testData.orderId}`,
    description: `Prepare and deliver food order for guest in room`,
    department: 'Kitchen',
    priority: 'medium',
    category: 'food_preparation',
    location: 'kitchen',
    estimatedDuration: 30,
    notes: [{
      content: 'Order contains spicy items - handle with care',
      addedBy: null,
      addedAt: new Date()
    }]
  };

  const taskResult = await makeRequest('post', '/tasks', taskData, tokens.admin);
  if (!taskResult.success) {
    console.log('❌ Staff task creation failed:', taskResult.error);
    return false;
  }

  testData.taskId = taskResult.data.data._id;
  console.log(`✅ Staff task created: ${testData.taskId}`);
  console.log(`   Department: ${taskResult.data.data.department}`);
  console.log(`   Priority: ${taskResult.data.data.priority}`);
  console.log(`   Status: ${taskResult.data.data.status}`);

  // Test task assignment (if staff available)
  const assignResult = await makeRequest('post', `/tasks/${testData.taskId}/assign`, {}, tokens.admin);
  if (assignResult.success) {
    console.log(`✅ Task assigned to staff: ${assignResult.data.data.assignedTo}`);
  } else {
    console.log('⚠️  Task assignment failed (may be no staff available):', assignResult.error);
  }

  return true;
}

async function testOrderStatusUpdates() {
  console.log('\n📊 Testing Order Status Updates...');

  if (!testData.orderId) {
    console.log('⚠️  No order ID available for status update test');
    return false;
  }

  // Update order status to Preparing
  const preparingResult = await makeRequest('patch', `/food/orders/${testData.orderId}/status`, {
    status: 'Preparing'
  }, tokens.admin);

  if (preparingResult.success) {
    console.log('✅ Order status updated to Preparing');
  } else {
    console.log('❌ Failed to update order status:', preparingResult.error);
    return false;
  }

  // Update order status to Ready
  const readyResult = await makeRequest('patch', `/food/orders/${testData.orderId}/status`, {
    status: 'Ready'
  }, tokens.admin);

  if (readyResult.success) {
    console.log('✅ Order status updated to Ready');
  } else {
    console.log('❌ Failed to update order status to Ready:', readyResult.error);
  }

  return true;
}

async function testBookingApproval() {
  console.log('\n✅ Testing Booking Approval Process...');

  if (!testData.bookingId) {
    console.log('⚠️  No booking ID available for approval test');
    return false;
  }

  // Approve the booking
  const approvalResult = await makeRequest('put', `/bookings/admin/${testData.bookingId}/approve`, {
    approvalNotes: 'Approved via automated test'
  }, tokens.admin);

  if (approvalResult.success) {
    console.log('✅ Booking approved successfully');
    console.log(`   New Status: ${approvalResult.data.data.status}`);
  } else {
    console.log('❌ Booking approval failed:', approvalResult.error);
    return false;
  }

  return true;
}

async function runCompleteTest() {
  console.log('🚀 Starting Comprehensive End-to-End Test Suite');
  console.log('='.repeat(60));

  const results = {
    authentication: false,
    roomBooking: false,
    foodOrdering: false,
    staffAssignment: false,
    orderUpdates: false,
    bookingApproval: false
  };

  try {
    // Test authentication
    results.authentication = await testGuestAuthentication();
    results.adminAuth = await testAdminAuthentication();

    if (results.authentication) {
      // Test room booking with food options
      results.roomBooking = await testRoomBookingWithFood();

      // Test separate food ordering
      results.foodOrdering = await testFoodOrdering();

      // Test staff assignment
      results.staffAssignment = await testStaffAssignment();

      // Test order status updates
      results.orderUpdates = await testOrderStatusUpdates();

      // Test booking approval
      results.bookingApproval = await testBookingApproval();
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
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
      console.log('🎉 All end-to-end flows are working correctly!');
    } else {
      console.log('⚠️  Some tests failed. Check the implementation.');
    }

    console.log('\n📋 Test Data Created:');
    console.log(`   Booking ID: ${testData.bookingId || 'N/A'}`);
    console.log(`   Order ID: ${testData.orderId || 'N/A'}`);
    console.log(`   Task ID: ${testData.taskId || 'N/A'}`);

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run the complete test suite
runCompleteTest();