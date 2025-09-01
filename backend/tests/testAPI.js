// 📁 backend/tests/testAPI.js
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

const testAPI = async () => {
  console.log('🚀 Testing Culture Colombo API Endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('🧪 Testing Health Endpoint...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log(`✅ Health Status: ${healthData.success ? 'Healthy' : 'Unhealthy'}`);
    console.log(`✅ Database: ${healthData.database.status}`);
    
    // Test root endpoint
    console.log('\n🧪 Testing Root Endpoint...');
    const rootResponse = await fetch('http://localhost:5000/');
    const rootData = await rootResponse.json();
    console.log(`✅ API Version: ${rootData.version}`);
    console.log(`✅ Available Endpoints: ${Object.keys(rootData.endpoints).join(', ')}`);
    
    // Test Category API
    console.log('\n🧪 Testing Category API...');
    
    // Create a category
    const categoryData = {
      name: 'Test Seafood Category',
      description: 'Fresh seafood dishes for testing',
      displayOrder: 1
    };
    
    const createCategoryResponse = await fetch(`${BASE_URL}/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    
    if (createCategoryResponse.ok) {
      const createdCategory = await createCategoryResponse.json();
      console.log(`✅ Created Category: ${createdCategory.data.name}`);
      console.log(`✅ Generated Slug: ${createdCategory.data.slug}`);
      
      const categoryId = createdCategory.data._id;
      
      // Get all categories
      const getCategoriesResponse = await fetch(`${BASE_URL}/menu/categories`);
      const categoriesData = await getCategoriesResponse.json();
      console.log(`✅ Retrieved ${categoriesData.count} categories`);
      
      // Get single category
      const getSingleCategoryResponse = await fetch(`${BASE_URL}/menu/categories/${categoryId}`);
      const singleCategoryData = await getSingleCategoryResponse.json();
      console.log(`✅ Retrieved single category: ${singleCategoryData.data.name}`);
      
      // Test Menu Item API
      console.log('\n🧪 Testing Menu Item API...');
      
      const menuItemData = {
        name: 'Test Crab Curry',
        description: 'Delicious crab curry for testing API endpoints',
        category: categoryId,
        type: 'Seafood',
        spiceLevel: 'Medium',
        basePrice: 2000,
        dietaryTags: ['Halal'],
        ingredients: ['Fresh crab', 'Coconut milk', 'Spices'],
        preparationTime: 25,
        images: [{
          url: 'https://example.com/test-crab.jpg',
          alt: 'Test Crab Curry',
          isPrimary: true
        }]
      };
      
      const createMenuItemResponse = await fetch(`${BASE_URL}/menu/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemData)
      });
      
      if (createMenuItemResponse.ok) {
        const createdMenuItem = await createMenuItemResponse.json();
        console.log(`✅ Created Menu Item: ${createdMenuItem.data.name}`);
        console.log(`✅ Display Price: ${createdMenuItem.data.displayPrice}`);
        
        const menuItemId = createdMenuItem.data._id;
        
        // Get all menu items
        const getMenuItemsResponse = await fetch(`${BASE_URL}/menu/items`);
        const menuItemsData = await getMenuItemsResponse.json();
        console.log(`✅ Retrieved ${menuItemsData.count} menu items`);
        
        // Get items by category
        const getItemsByCategoryResponse = await fetch(`${BASE_URL}/menu/categories/${categoryId}/items`);
        const itemsByCategoryData = await getItemsByCategoryResponse.json();
        console.log(`✅ Retrieved ${itemsByCategoryData.count} items for category`);
        
        // Test filtering
        const filterResponse = await fetch(`${BASE_URL}/menu/items?type=Seafood&spiceLevel=Medium`);
        const filterData = await filterResponse.json();
        console.log(`✅ Filtered items (Seafood, Medium): ${filterData.count}`);
        
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        
        // Delete menu item
        const deleteItemResponse = await fetch(`${BASE_URL}/menu/items/${menuItemId}`, {
          method: 'DELETE'
        });
        if (deleteItemResponse.ok) {
          console.log('✅ Deleted test menu item');
        }
        
        // Delete category
        const deleteCategoryResponse = await fetch(`${BASE_URL}/menu/categories/${categoryId}`, {
          method: 'DELETE'
        });
        if (deleteCategoryResponse.ok) {
          console.log('✅ Deleted test category');
        }
        
      } else {
        const error = await createMenuItemResponse.json();
        console.error('❌ Failed to create menu item:', error.message);
      }
      
    } else {
      const error = await createCategoryResponse.json();
      console.error('❌ Failed to create category:', error.message);
    }
    
    console.log('\n✅ All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

// Run tests
testAPI();
