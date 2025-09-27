const axios = require('axios');

async function testOrderAPI() {
  try {
    console.log('Testing order retrieval API...');
    
    // Test the API endpoint directly
    const response = await axios.get('http://localhost:5000/api/orders/customer/john@example.com');
    
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.data.length} orders`);
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOrderAPI();
