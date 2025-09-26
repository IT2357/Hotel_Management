import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Test configuration
const BASE_URL = 'http://localhost:5000/api/menu';
const TEST_IMAGE_PATH = './test-menu.jpg';

// Test the image-based menu generation
async function testImageMenuGeneration() {
  try {
    console.log('🧪 Testing AI-powered menu generation...');

    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('⚠️  Test image not found, creating a simple test...');
      return testTextBasedGeneration();
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('cuisineType', 'General');
    // Send dietaryRestrictions as array (matching frontend format)
    formData.append('dietaryRestrictions[]', 'vegetarian');

    console.log('📤 Sending image to menu generation API...');

    const response = await axios.post(`${BASE_URL}/generate-from-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Menu generation successful!');
    console.log('📋 Generated items:', response.data.data.items.length);
    console.log('🤖 Processing method:', response.data.data.processingMethod);
    console.log('📝 Image description length:', response.data.data.imageDescription?.length || 0);

    // Display first item as example
    if (response.data.data.items.length > 0) {
      const firstItem = response.data.data.items[0];
      console.log('🍽️  Sample generated item:', {
        name: firstItem.name,
        price: firstItem.price,
        category: firstItem.category,
        description: firstItem.description?.substring(0, 100) + '...'
      });
    }

  } catch (error) {
    console.error('❌ Menu generation failed:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('🔐 Authentication required. Please provide a valid token.');
    } else if (error.response?.status === 501) {
      console.log('🤖 Gemini AI not configured. Testing text-based generation instead...');
      return testTextBasedGeneration();
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Backend server not running. Please start the server first.');
    }
  }
}

// Test text-based menu generation
async function testTextBasedGeneration() {
  try {
    console.log('🧪 Testing text-based menu generation...');

    const response = await axios.post(`${BASE_URL}/generate`, {
      cuisineType: 'Italian',
      dietaryRestrictions: ['vegetarian'],
      numberOfItems: 3
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Text-based menu generation successful!');
    console.log('📋 Generated items:', response.data.items.length);

    if (response.data.items.length > 0) {
      const firstItem = response.data.items[0];
      console.log('🍽️  Sample generated item:', {
        name: firstItem.name,
        price: firstItem.price,
        category: firstItem.category,
        description: firstItem.description?.substring(0, 100) + '...'
      });
    }

  } catch (error) {
    console.error('❌ Text-based generation failed:', error.response?.data || error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Backend server not running. Please start the server first.');
    } else if (error.response?.status === 401) {
      console.log('🔐 Authentication required. Please provide a valid token.');
    }
  }
}

// Test OCR image processing
async function testOCRProcessing() {
  try {
    console.log('🧪 Testing OCR image processing...');

    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('⚠️  Test image not found, skipping OCR test.');
      return;
    }

    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));

    const response = await axios.post(`${BASE_URL}/process-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      }
    });

    console.log('✅ OCR processing successful!');
    console.log('📝 Extracted text length:', response.data.ocrText?.length || 0);
    console.log('🤖 Gemini description available:', !!response.data.geminiDescription);
    console.log('📋 Items found:', response.data.items.length);

  } catch (error) {
    console.error('❌ OCR processing failed:', error.response?.data || error.message);

    if (error.response?.status === 501) {
      console.log('🤖 Google Cloud Vision not configured.');
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting AI Menu Generator Tests...\n');

  await testImageMenuGeneration();
  console.log('\n' + '='.repeat(50) + '\n');

  await testTextBasedGeneration();
  console.log('\n' + '='.repeat(50) + '\n');

  await testOCRProcessing();
  console.log('\n' + '='.repeat(50) + '\n');

  console.log('🏁 All tests completed!');
}

// Export for use in other files
export { testImageMenuGeneration, testTextBasedGeneration, testOCRProcessing };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
