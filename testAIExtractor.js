// Test AI Menu Extractor
import axios from 'axios';
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
    
    // Download a sample menu image for testing
    console.log('Downloading sample image...');
    const imageUrl = 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80';
    
    // For testing purposes, we'll create a simple text file as our "menu image"
    const sampleMenuText = `
    Crab Curry (நண்டு கறி)
    Fresh crab cooked in traditional Jaffna spices
    LKR 850
    
    Hoppers (அப்பம்  
    Soft rice hoppers with egg
    LKR 350
    
    Brinjal Curry (கத்தரிக்கை கறி)
    Eggplant cooked with coconut and spices
    LKR 450
    `;
    
    // Write sample text to a file
    fs.writeFileSync('/tmp/sample_menu.txt', sampleMenuText);
    console.log('Sample menu created at /tmp/sample_menu.txt');
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream('/tmp/sample_menu.txt'));
    
    // Process the image with AI extractor
    console.log('Processing image with AI extractor...');
    const extractResponse = await axios.post(
      `${API_BASE}/food-fixes/menu/process-image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('Extraction response:', extractResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAIExtractor();