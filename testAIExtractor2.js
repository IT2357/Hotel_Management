// Test AI Menu Extractor with actual image
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:5000/api';

async function testAIExtractor() {
  try {
    // Login first to get a valid token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');
    
    // Create form data with the image file
    const formData = new FormData();
    formData.append('image', fs.createReadStream('./sample_menu.jpg'));
    
    console.log('Processing image with AI extractor...');
    const extractResponse = await axios.post(
      `${API_BASE}/food-fixes/menu/process-image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('Extraction successful!');
    console.log('Extracted data:', JSON.stringify(extractResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testAIExtractor();