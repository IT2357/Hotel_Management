// 📁 backend/tests/testDatabase.js
import mongoose from "mongoose";
import "dotenv/config";
import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import CustomerFeedback from "../models/CustomerFeedback.js";

// Test data for Culture Colombo
const testCategories = [
  {
    name: "Bamboo Biriyani",
    description: "Authentic Sri Lankan biriyani cooked in bamboo",
    displayOrder: 1
  },
  {
    name: "Dry Curry Bowls",
    description: "Traditional Sri Lankan dry curries served with rice",
    displayOrder: 2
  },
  {
    name: "Kottu",
    description: "Popular Sri Lankan street food with chopped roti",
    displayOrder: 3
  },
  {
    name: "Seafood",
    description: "Fresh seafood dishes with authentic spices",
    displayOrder: 4
  },
  {
    name: "Fresh Juices & Beverages",
    description: "Refreshing drinks and traditional beverages",
    displayOrder: 5
  }
];

const connectTestDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to test database");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

const cleanupTestData = async () => {
  try {
    await CustomerFeedback.deleteMany({});
    await Order.deleteMany({});
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    console.log("🧹 Cleaned up test data");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
};

const testCategoryOperations = async () => {
  console.log("\n🧪 Testing Category Operations...");
  
  try {
    // Create categories individually to ensure slug generation
    const categories = [];
    for (const categoryData of testCategories) {
      const category = await Category.create(categoryData);
      categories.push(category);
    }
    console.log(`✅ Created ${categories.length} categories`);
    
    // Read categories
    const allCategories = await Category.find().sort({ displayOrder: 1 });
    console.log(`✅ Retrieved ${allCategories.length} categories`);
    
    // Update a category
    const updatedCategory = await Category.findByIdAndUpdate(
      categories[0]._id,
      { description: "Updated description for bamboo biriyani" },
      { new: true }
    );
    console.log(`✅ Updated category: ${updatedCategory.name}`);
    
    // Test slug generation
    console.log(`✅ Slug generated: ${updatedCategory.slug}`);
    
    return categories;
  } catch (error) {
    console.error("❌ Category operations failed:", error);
    throw error;
  }
};

const testMenuItemOperations = async (categories) => {
  console.log("\n🧪 Testing Menu Item Operations...");
  
  try {
    const testMenuItems = [
      {
        name: "Negombo Crab Curry",
        description: "Fresh crab cooked in authentic Sri Lankan spices with coconut milk",
        category: categories.find(c => c.name === "Seafood")._id,
        type: "Seafood",
        spiceLevel: "Medium",
        basePrice: 2500,
        dietaryTags: ["Halal"],
        ingredients: ["Fresh crab", "Coconut milk", "Curry leaves", "Spices"],
        preparationTime: 25,
        images: [{
          url: "https://example.com/crab-curry.jpg",
          alt: "Negombo Crab Curry",
          isPrimary: true
        }]
      },
      {
        name: "Mixed Seafood Dry Curry Bowl",
        description: "Assorted seafood with traditional dry curry spices served with rice",
        category: categories.find(c => c.name === "Dry Curry Bowls")._id,
        type: "Seafood",
        spiceLevel: "Hot",
        dietaryTags: ["Halal"],
        portions: [
          { name: "Half", price: 1200, isDefault: false },
          { name: "Full", price: 2000, isDefault: true }
        ],
        ingredients: ["Fish", "Prawns", "Squid", "Spices", "Rice"],
        preparationTime: 20,
        images: [{
          url: "https://example.com/seafood-bowl.jpg",
          alt: "Mixed Seafood Dry Curry Bowl",
          isPrimary: true
        }]
      },
      {
        name: "Chicken Kottu",
        description: "Chopped roti stir-fried with chicken, vegetables and spices",
        category: categories.find(c => c.name === "Kottu")._id,
        type: "Non-Veg",
        spiceLevel: "Medium",
        basePrice: 800,
        dietaryTags: ["Halal"],
        ingredients: ["Roti", "Chicken", "Vegetables", "Egg", "Spices"],
        preparationTime: 15,
        images: [{
          url: "https://example.com/chicken-kottu.jpg",
          alt: "Chicken Kottu",
          isPrimary: true
        }]
      }
    ];
    
    const menuItems = await MenuItem.insertMany(testMenuItems);
    console.log(`✅ Created ${menuItems.length} menu items`);
    
    // Test querying with population
    const itemsWithCategory = await MenuItem.find()
      .populate('category', 'name slug')
      .sort({ name: 1 });
    console.log(`✅ Retrieved ${itemsWithCategory.length} items with category info`);
    
    // Test filtering
    const seafoodItems = await MenuItem.find({ type: "Seafood" });
    console.log(`✅ Found ${seafoodItems.length} seafood items`);
    
    // Test virtual fields
    const itemWithVirtuals = await MenuItem.findById(menuItems[0]._id);
    console.log(`✅ Primary image: ${itemWithVirtuals.primaryImage?.url}`);
    console.log(`✅ Display price: ${itemWithVirtuals.displayPrice}`);
    
    return menuItems;
  } catch (error) {
    console.error("❌ Menu item operations failed:", error);
    throw error;
  }
};

const testOrderOperations = async (menuItems) => {
  console.log("\n🧪 Testing Order Operations...");
  
  try {
    const testOrder = {
      orderType: "Dine-in",
      tableNumber: "T-05",
      customerInfo: {
        name: "John Doe",
        phone: "+94771234567",
        email: "john@example.com"
      },
      items: [
        {
          menuItem: menuItems[0]._id,
          name: menuItems[0].name,
          quantity: 1,
          portion: {
            name: "Regular",
            price: menuItems[0].basePrice || menuItems[0].displayPrice
          },
          specialInstructions: "Less spicy please",
          itemTotal: menuItems[0].basePrice || menuItems[0].displayPrice
        },
        {
          menuItem: menuItems[1]._id,
          name: menuItems[1].name,
          quantity: 2,
          portion: {
            name: "Full",
            price: 2000
          },
          itemTotal: 4000
        }
      ],
      subtotal: 6500,
      tax: 650,
      serviceCharge: 325,
      total: 7475,
      estimatedPrepTime: 30
    };
    
    const order = await Order.create(testOrder);
    console.log(`✅ Created order: ${order.orderNumber}`);
    
    // Test order number generation
    console.log(`✅ Order number format: ${order.orderNumber}`);
    
    // Update order status
    order.status = "Confirmed";
    order.confirmedAt = new Date();
    await order.save();
    console.log(`✅ Updated order status to: ${order.status}`);
    
    return order;
  } catch (error) {
    console.error("❌ Order operations failed:", error);
    throw error;
  }
};

const testFeedbackOperations = async (order, menuItems) => {
  console.log("\n🧪 Testing Customer Feedback Operations...");
  
  try {
    const testFeedback = {
      order: order._id,
      orderNumber: order.orderNumber,
      customerInfo: {
        name: "John Doe",
        email: "john@example.com"
      },
      overallRating: 5,
      dishRatings: [
        {
          menuItem: menuItems[0]._id,
          dishName: menuItems[0].name,
          rating: 5,
          review: "Absolutely delicious! Authentic Sri Lankan flavors."
        },
        {
          menuItem: menuItems[1]._id,
          dishName: menuItems[1].name,
          rating: 4,
          review: "Great taste, perfect portion size."
        }
      ],
      serviceRating: 5,
      ambianceRating: 4,
      valueForMoneyRating: 5,
      generalComments: "Excellent experience overall. Will definitely come back!",
      wouldRecommend: true,
      visitType: "First Time"
    };
    
    const feedback = await CustomerFeedback.create(testFeedback);
    console.log(`✅ Created feedback for order: ${feedback.orderNumber}`);
    
    // Test virtual fields
    console.log(`✅ Average dish rating: ${feedback.averageDishRating}`);
    console.log(`✅ Feedback age: ${feedback.feedbackAge} days`);
    
    return feedback;
  } catch (error) {
    console.error("❌ Feedback operations failed:", error);
    throw error;
  }
};

const runAllTests = async () => {
  console.log("🚀 Starting Culture Colombo Database Tests...\n");
  
  try {
    await connectTestDB();
    await cleanupTestData();
    
    const categories = await testCategoryOperations();
    const menuItems = await testMenuItemOperations(categories);
    const order = await testOrderOperations(menuItems);
    const feedback = await testFeedbackOperations(order, menuItems);
    
    console.log("\n✅ All database tests passed successfully!");
    console.log("\n📊 Test Summary:");
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Menu Items: ${menuItems.length}`);
    console.log(`   Orders: 1`);
    console.log(`   Feedback: 1`);
    
  } catch (error) {
    console.error("\n❌ Tests failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
