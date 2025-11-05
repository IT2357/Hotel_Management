// Test user stats endpoint
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testUserStats() {
  try {
    // Login first to get a valid token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');
    
    // Fetch user stats
    console.log('Fetching user stats...');
    const statsResponse = await axios.get(`${API_BASE}/admin/users/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('User stats response:', statsResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testUserStats();