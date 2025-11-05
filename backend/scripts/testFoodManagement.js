import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

// Test credentials - update with your admin user
const ADMIN_CREDENTIALS = {
  email: 'admin@hotel.com',
  password: 'Admin@123'
};

let authToken = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`)
};

// Step 1: Login as admin
async function loginAsAdmin() {
  log.section('Step 1: Admin Login');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.data.token;
    log.success(`Logged in as admin: ${response.data.data.user.email}`);
    log.info(`Role: ${response.data.data.user.role}`);
    return true;
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Step 2: Create a food category
async function createFoodCategory() {
  log.section('Step 2: Create Food Category');
  try {
    const category = {
      name: 'Appetizers',
      description: 'Delicious starters to begin your meal',
      displayOrder: 1,
      isActive: true
    };

    const response = await axios.post(`${API_URL}/menu/categories`, category, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success(`Category created: ${response.data.data.name}`);
    log.info(`Category ID: ${response.data.data._id}`);
    return response.data.data._id;
  } catch (error) {
    log.error(`Failed to create category: ${error.response?.data?.message || error.message}`);
    
    // If category already exists, try to get it
    try {
      const categories = await axios.get(`${API_URL}/menu/categories`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const appetizer = categories.data.data.find(cat => cat.name === 'Appetizers');
      if (appetizer) {
        log.info(`Using existing category: ${appetizer._id}`);
        return appetizer._id;
      }
    } catch (err) {
      log.error(`Failed to fetch categories: ${err.message}`);
    }
    return null;
  }
}

// Step 3: Add a food item manually
async function addFoodItem(categoryId) {
  log.section('Step 3: Add Food Item Manually');
  try {
    const foodItem = {
      name: 'Spring Rolls',
      description: 'Crispy vegetable spring rolls served with sweet chili sauce',
      category: categoryId,
      price: 8.99,
      preparationTime: 15,
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 'mild',
      ingredients: ['Rice paper', 'Vegetables', 'Soy sauce', 'Sweet chili sauce'],
      allergens: ['soy', 'gluten'],
      nutritionalInfo: {
        calories: 250,
        protein: 5,
        carbs: 35,
        fat: 8
      },
      tags: ['popular', 'crispy', 'vegetarian']
    };

    const response = await axios.post(`${API_URL}/menu/items`, foodItem, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success(`Food item created: ${response.data.data.name}`);
    log.info(`Item ID: ${response.data.data._id}`);
    log.info(`Price: $${response.data.data.price}`);
    log.info(`Category: ${response.data.data.category}`);
    return response.data.data._id;
  } catch (error) {
    log.error(`Failed to create food item: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.errors) {
      console.log('Validation errors:', error.response.data.errors);
    }
    return null;
  }
}

// Step 4: Get all menu items
async function getAllMenuItems() {
  log.section('Step 4: Get All Menu Items');
  try {
    const response = await axios.get(`${API_URL}/menu/items`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success(`Retrieved ${response.data.data.length} menu items`);
    response.data.data.forEach((item, index) => {
      log.info(`${index + 1}. ${item.name} - $${item.price} (${item.isAvailable ? 'Available' : 'Unavailable'})`);
    });
    return response.data.data;
  } catch (error) {
    log.error(`Failed to fetch menu items: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

// Step 5: Update a food item
async function updateFoodItem(itemId) {
  log.section('Step 5: Update Food Item');
  try {
    const updates = {
      price: 9.99,
      description: 'Crispy vegetable spring rolls served with sweet chili sauce and peanut dipping sauce',
      tags: ['popular', 'crispy', 'vegetarian', 'bestseller']
    };

    const response = await axios.put(`${API_URL}/menu/items/${itemId}`, updates, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success(`Food item updated: ${response.data.data.name}`);
    log.info(`New price: $${response.data.data.price}`);
    log.info(`Tags: ${response.data.data.tags.join(', ')}`);
    return true;
  } catch (error) {
    log.error(`Failed to update food item: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Step 6: Create a test food order
async function createFoodOrder(itemId) {
  log.section('Step 6: Create Food Order');
  try {
    const order = {
      items: [
        {
          menuItem: itemId,
          quantity: 2,
          specialInstructions: 'Extra spicy, please!'
        }
      ],
      orderType: 'dine-in',
      notes: 'Test order for admin verification'
    };

    const response = await axios.post(`${API_URL}/food/orders`, order, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success(`Order created: ${response.data.data._id}`);
    log.info(`Status: ${response.data.data.status}`);
    log.info(`Total: $${response.data.data.totalPrice}`);
    return response.data.data._id;
  } catch (error) {
    log.error(`Failed to create order: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Step 7: Get order statistics
async function getOrderStats() {
  log.section('Step 7: Get Order Statistics');
  try {
    const response = await axios.get(`${API_URL}/food/orders/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success('Order statistics retrieved:');
    log.info(`Total Orders: ${response.data.data.totalOrders}`);
    log.info(`Pending Orders: ${response.data.data.pendingOrders}`);
    log.info(`Total Revenue: $${response.data.data.totalRevenue || 0}`);
    return true;
  } catch (error) {
    log.error(`Failed to fetch order stats: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Step 8: Test AI Menu Extraction (optional)
async function testAIMenuExtraction() {
  log.section('Step 8: Test AI Menu Extraction (Optional)');
  log.warning('This test requires an image file. Skipping for now.');
  log.info('To test AI menu extraction, upload an image through the admin UI at /admin/food/ai-menu');
  return true;
}

// Main test execution
async function runTests() {
  console.log('\n' + colors.cyan + '╔════════════════════════════════════════════════════════════╗');
  console.log('║        Hotel Food Management System - Admin Test          ║');
  console.log('╚════════════════════════════════════════════════════════════╝' + colors.reset + '\n');

  log.info(`Testing API at: ${API_URL}`);
  log.warning('Make sure the backend server is running on port 5000\n');

  try {
    // Run all tests sequentially
    const loggedIn = await loginAsAdmin();
    if (!loggedIn) {
      log.error('Cannot proceed without admin login');
      return;
    }

    const categoryId = await createFoodCategory();
    if (!categoryId) {
      log.error('Cannot proceed without a category');
      return;
    }

    const itemId = await addFoodItem(categoryId);
    if (!itemId) {
      log.error('Cannot proceed without a food item');
      return;
    }

    await getAllMenuItems();
    await updateFoodItem(itemId);
    await getAllMenuItems(); // Show updated items

    const orderId = await createFoodOrder(itemId);
    if (orderId) {
      await getOrderStats();
    }

    await testAIMenuExtraction();

    // Final summary
    log.section('Test Summary');
    log.success('All admin food management tests completed!');
    log.info('\nYou can now:');
    log.info('1. Visit http://localhost:5174/admin/food to see the food management dashboard');
    log.info('2. Visit http://localhost:5174/admin/food/menu to manage menu items');
    log.info('3. Visit http://localhost:5174/admin/food/orders to manage orders');
    log.info('4. Visit http://localhost:5174/admin/food/ai-menu to test AI menu extraction');
    console.log('\n');

  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests();
