/**
 * Quick Test Script for Manager Profile Backend Connection
 * 
 * Run this from the backend directory to test the manager profile endpoint
 * Usage: node testManagerProfile.js YOUR_JWT_TOKEN
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const token = process.argv[2];

if (!token) {
  console.error('❌ Please provide a JWT token as argument');
  console.log('Usage: node testManagerProfile.js YOUR_JWT_TOKEN');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Type in console: localStorage.getItem("token")');
  console.log('3. Copy the token and run: node testManagerProfile.js <token>');
  process.exit(1);
}

console.log('🧪 Testing Manager Profile Backend Connection\n');
console.log('=' .repeat(60));

// Test 1: Health Check
async function testHealth() {
  console.log('\n📋 Test 1: Health Check');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend is running');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed');
    console.error('Error:', error.message);
    return false;
  }
}

// Test 2: Manager Profile Endpoint
async function testManagerProfile() {
  console.log('\n📋 Test 2: Manager Profile Endpoint');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/manager/profile/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.status === 200) {
      console.log('✅ Successfully fetched manager profile');
      console.log('\n📊 Profile Data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data?.stats) {
        console.log('\n📈 Stats:');
        console.log('  - Tasks Completed:', data.data.stats.tasksCompleted);
        console.log('  - On-Time Rate:', data.data.stats.onTimeRate);
        console.log('  - Satisfaction:', data.data.stats.satisfaction);
      }
      return true;
    } else if (response.status === 401) {
      console.error('❌ Authentication failed');
      console.error('Reason:', data.message);
      console.error('\n🔧 Fixes:');
      console.error('  1. Token may be expired - login again');
      console.error('  2. Token may be invalid - check if you copied it correctly');
      return false;
    } else if (response.status === 403) {
      console.error('❌ Authorization failed');
      console.error('Reason:', data.message);
      console.error('\n🔧 Fixes:');
      console.error('  1. User may not have "manager" role');
      console.error('  2. User account may not be approved (isApproved: false)');
      console.error('\nCheck user in MongoDB:');
      console.error('  db.users.findOne({ email: "your-email@example.com" })');
      console.error('\nUpdate user role:');
      console.error('  db.users.updateOne(');
      console.error('    { email: "your-email@example.com" },');
      console.error('    { $set: { role: "manager", isApproved: true } }');
      console.error('  )');
      return false;
    } else if (response.status === 404) {
      console.error('❌ Endpoint not found');
      console.error('Reason: Manager routes may not be registered');
      console.error('\n🔧 Check backend/server.js has this line:');
      console.error('  app.use("/api/manager", managerRoutes);');
      return false;
    } else {
      console.error('❌ Unexpected error');
      console.error('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed');
    console.error('Error:', error.message);
    console.error('\n🔧 Possible causes:');
    console.error('  1. Backend server is not running');
    console.error('  2. Backend is running on a different port');
    console.error('  3. Network connectivity issue');
    return false;
  }
}

// Test 3: Decode JWT Token
function decodeToken() {
  console.log('\n📋 Test 3: Token Information');
  console.log('-'.repeat(60));
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    console.log('✅ Token decoded successfully');
    console.log('\nToken payload:');
    console.log('  - User ID:', decoded._id || decoded.id || decoded.userId);
    console.log('  - Role:', decoded.role);
    console.log('  - Email:', decoded.email);
    console.log('  - Issued At:', new Date(decoded.iat * 1000).toLocaleString());
    console.log('  - Expires At:', new Date(decoded.exp * 1000).toLocaleString());
    
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      console.error('\n⚠️  WARNING: Token is expired!');
      console.error('   You need to login again to get a new token.');
      return false;
    } else {
      const timeLeft = Math.floor((decoded.exp - now) / 60);
      console.log(`\n✅ Token is valid (expires in ${timeLeft} minutes)`);
    }
    
    if (decoded.role !== 'manager') {
      console.error('\n⚠️  WARNING: User role is not "manager"!');
      console.error(`   Current role: ${decoded.role}`);
      console.error('   This endpoint requires manager role.');
      return false;
    } else {
      console.log('\n✅ User has manager role');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to decode token');
    console.error('Error:', error.message);
    console.error('The token may be malformed.');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting tests...\n');
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.error('\n\n❌ Backend is not running or not accessible!');
    console.error('Please start the backend server first:');
    console.error('  cd backend');
    console.error('  npm start');
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }
  
  const tokenOk = decodeToken();
  if (!tokenOk) {
    console.log('\n' + '='.repeat(60));
    console.error('\n⚠️  Token issues detected. Fix the token first before testing the endpoint.');
    process.exit(1);
  }
  
  const profileOk = await testManagerProfile();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🏁 Test Results:');
  console.log('  Backend Health:', healthOk ? '✅ PASS' : '❌ FAIL');
  console.log('  Token Valid:', tokenOk ? '✅ PASS' : '❌ FAIL');
  console.log('  Manager Profile:', profileOk ? '✅ PASS' : '❌ FAIL');
  
  if (healthOk && tokenOk && profileOk) {
    console.log('\n🎉 All tests passed! Your backend connection is working correctly.');
    console.log('If frontend still shows default values, check:');
    console.log('  1. Frontend .env file has: VITE_API_BASE_URL=http://localhost:5000');
    console.log('  2. Browser console for CORS or network errors');
    console.log('  3. Vite dev server is running (npm run dev)');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Execute tests
runTests().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
