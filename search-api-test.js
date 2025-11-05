// 🧪 Search API Test Script
// Paste this into browser console to test search APIs directly

console.log('🚀 Starting Search API Tests...\n');

const token = localStorage.getItem('token');
if (!token) {
  console.error('❌ No token found! Please log in first.');
} else {
  console.log('✅ Found auth token');
}

// Test function
async function testSearchAPI(endpoint, searchTerm) {
  console.log(`\n📡 Testing: ${endpoint}`);
  console.log(`🔍 Search term: "${searchTerm}"`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ Response error: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('📊 Response:', data);

    // Check what data structure was returned
    if (data.data?.users) {
      console.log(`✅ Found ${data.data.users.length} users`);
    } else if (data.data?.bookings) {
      console.log(`✅ Found ${data.data.bookings.length} bookings`);
    } else if (Array.isArray(data.data)) {
      console.log(`✅ Found ${data.data.length} rooms`);
    } else {
      console.log('⚠️ Unexpected data format');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
console.log('\n' + '='.repeat(60));
console.log('TEST 1: Search Users');
console.log('='.repeat(60));
testSearchAPI('/api/admin/users?search=admin&limit=5', 'admin');

setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Search Bookings');
  console.log('='.repeat(60));
  testSearchAPI('/api/bookings/admin/all?search=B&limit=5', 'B');
}, 2000);

setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Search Rooms');
  console.log('='.repeat(60));
  testSearchAPI('/api/rooms?search=room&limit=5', 'room');
}, 4000);

console.log('\n💡 Check results above. Tests will complete in ~6 seconds.');
