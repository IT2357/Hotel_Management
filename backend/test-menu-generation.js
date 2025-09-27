import { generateMenuItems } from './controllers/menuController.js';

// Test the menu generation logic directly
async function testMenuGeneration() {
  try {
    console.log('🧪 Testing menu generation...');

    // Mock request and response objects
    const mockReq = {
      body: {
        cuisineType: 'Indian',
        dietaryRestrictions: [],
        numberOfItems: 3
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📊 Response (${code}):`, JSON.stringify(data, null, 2));
          return data;
        }
      })
    };

    // Call the function directly
    await generateMenuItems(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMenuGeneration();