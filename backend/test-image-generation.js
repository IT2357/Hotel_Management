import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testImageGeneration = async () => {
  try {
    console.log('🧪 Testing image-based menu generation...');

    // Test 1: Upload file
    console.log('📁 Testing file upload...');
    const testImagePath = path.join(__dirname, 'test-menu.jpg');

    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️ Test image not found, skipping file upload test');
    } else {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      formData.append('cuisineType', 'General');
      formData.append('dietaryRestrictions[]', 'vegetarian');

      try {
        const response = await axios.post('http://localhost:5000/api/menu/generate-from-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('✅ File upload successful!');
        console.log(`📊 Generated ${response.data.data.items.length} items`);
        console.log('Sample items:', response.data.data.items.slice(0, 2).map(item => ({
          name: item.name,
          price: item.price,
          category: item.category
        })));
      } catch (error) {
        console.error('❌ File upload failed:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: URL input
    console.log('🌐 Testing URL input...');
    const testUrl = 'https://via.placeholder.com/600x400.jpg';

    try {
      const formData = new FormData();
      formData.append('imageUrl', testUrl);
      formData.append('cuisineType', 'General');

      const response = await axios.post('http://localhost:5000/api/menu/generate-from-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ URL input successful!');
      console.log(`📊 Generated ${response.data.data.items.length} items`);
      console.log('Sample items:', response.data.data.items.slice(0, 2).map(item => ({
        name: item.name,
        price: item.price,
        category: item.category
      })));
    } catch (error) {
      console.error('❌ URL input failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Invalid URL
    console.log('❌ Testing invalid URL...');
    const invalidUrl = 'https://invalid-url-that-does-not-exist.com/image.jpg';

    try {
      const formData = new FormData();
      formData.append('imageUrl', invalidUrl);
      formData.append('cuisineType', 'General');

      const response = await axios.post('http://localhost:5000/api/menu/generate-from-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('⚠️ Invalid URL test passed (unexpected)');
    } catch (error) {
      console.log('✅ Invalid URL properly rejected:', error.response?.data?.message || error.message);
    }

    console.log('✅ Image generation tests completed!');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testImageGeneration();