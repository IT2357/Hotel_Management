// Test script to login and search menu items
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testMenuSearch() {
  try {
    // Login first to get a valid token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');
    
    // Search for menu items
    console.log('Searching for "salmon"...');
    const menuResponse = await axios.get(`${API_BASE}/food-fixes/admin/menu?search=salmon`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Search response:', {
      success: menuResponse.data.success,
      itemCount: menuResponse.data.data.length,
      pagination: menuResponse.data.pagination
    });
    
    if (menuResponse.data.data.length > 0) {
      console.log('First matching item:', menuResponse.data.data[0].name);
    } else {
      console.log('No items found matching "salmon"');
    }
    
    // Search for something that doesn't exist
    console.log('\nSearching for "xyz123"...');
    const menuResponse2 = await axios.get(`${API_BASE}/food-fixes/admin/menu?search=xyz123`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Search response for "xyz123":', {
      success: menuResponse2.data.success,
      itemCount: menuResponse2.data.data.length
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMenuSearch();