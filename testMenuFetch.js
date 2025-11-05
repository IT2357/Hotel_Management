// Test script to login and fetch menu items
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testMenuFetch() {
  try {
    // Login first to get a valid token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');
    
    // Fetch menu items
    console.log('Fetching menu items...');
    const menuResponse = await axios.get(`${API_BASE}/food-fixes/admin/menu?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Menu fetch response:', {
      success: menuResponse.data.success,
      itemCount: menuResponse.data.data.length,
      pagination: menuResponse.data.pagination
    });
    
    if (menuResponse.data.data.length > 0) {
      console.log('First item:', menuResponse.data.data[0]);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMenuFetch();