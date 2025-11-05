import mongoose from 'mongoose';
import Food from '../models/Food.js';
import Category from '../models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed script for Jaffna cuisine menu items
 * Populates the database with authentic Jaffna dishes
 */

const jaffnaDishes = [
  // Rice Dishes
  {
    name: 'நண்டு கறி',
    englishName: 'Jaffna Crab Curry',
    category: 'Rice',
    description: 'Traditional Jaffna crab curry cooked with aromatic spices, coconut milk, and curry leaves. A signature dish of Jaffna cuisine.',
    price: 1200,
    image: '/images/jaffna-crab-curry.jpg',
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ['Fresh crab', 'Coconut milk', 'Curry leaves', 'Cumin', 'Coriander', 'Turmeric', 'Chili powder'],
    dietaryTags: ['Halal', 'Spicy', 'Seafood'],
    cookingTime: 25,
    isAvailable: true
  },
  {
    name: 'ஆட்டுக்கறி',
    englishName: 'Jaffna Mutton Curry',
    category: 'Rice',
    description: 'Tender mutton cooked in rich Jaffna-style curry with roasted spices and coconut milk.',
    price: 800,
    image: '/images/jaffna-mutton-curry.jpg',
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ['Mutton', 'Coconut milk', 'Onion', 'Tomato', 'Ginger', 'Garlic', 'Curry leaves'],
    dietaryTags: ['Halal', 'Spicy'],
    cookingTime: 30,
    isAvailable: true
  },
  {
    name: 'மீன் கறி',
    englishName: 'Jaffna Fish Curry',
    category: 'Rice',
    description: 'Fresh fish cooked in tangy Jaffna-style curry with tamarind and coconut milk.',
    price: 600,
    image: '/images/jaffna-fish-curry.jpg',
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ['Fresh fish', 'Coconut milk', 'Tamarind', 'Curry leaves', 'Fenugreek', 'Mustard seeds'],
    dietaryTags: ['Halal', 'Spicy', 'Seafood'],
    cookingTime: 20,
    isAvailable: true
  },
  {
    name: 'கத்தரிக்கை கறி',
    englishName: 'Brinjal Curry',
    category: 'Rice',
    description: 'Tender brinjal cooked in coconut milk curry with aromatic spices.',
    price: 300,
    image: '/images/brinjal-curry.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Brinjal', 'Coconut milk', 'Onion', 'Tomato', 'Curry leaves', 'Turmeric'],
    dietaryTags: ['Vegetarian', 'Vegan'],
    cookingTime: 15,
    isAvailable: true
  },

  // Bread Items
  {
    name: 'அப்பம்',
    englishName: 'Hoppers',
    category: 'Bread',
    description: 'Traditional Sri Lankan hoppers - crispy-edged pancakes made with fermented rice flour and coconut milk.',
    price: 80,
    image: '/images/hoppers.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Rice flour', 'Coconut milk', 'Yeast', 'Salt', 'Sugar'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    cookingTime: 10,
    isAvailable: true
  },
  {
    name: 'இடியாப்பம்',
    englishName: 'String Hoppers',
    category: 'Bread',
    description: 'Delicate string hoppers made from rice flour, perfect with curry.',
    price: 120,
    image: '/images/string-hoppers.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Rice flour', 'Water', 'Salt', 'Coconut oil'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    cookingTime: 15,
    isAvailable: true
  },
  {
    name: 'புட்டு',
    englishName: 'Puttu',
    category: 'Bread',
    description: 'Steamed rice flour and coconut cylinders, a traditional breakfast item.',
    price: 100,
    image: '/images/puttu.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Rice flour', 'Grated coconut', 'Salt', 'Water'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    cookingTime: 12,
    isAvailable: true
  },

  // Breakfast Items
  {
    name: 'இட்லி',
    englishName: 'Idli',
    category: 'Breakfast',
    description: 'Soft and fluffy steamed rice cakes, perfect for breakfast.',
    price: 60,
    image: '/images/idli.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Rice', 'Urad dal', 'Salt', 'Water'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cookingTime: 8,
    isAvailable: true
  },
  {
    name: 'தோசை',
    englishName: 'Dosa',
    category: 'Breakfast',
    description: 'Crispy crepes made from fermented rice and lentil batter.',
    price: 80,
    image: '/images/dosa.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Rice', 'Urad dal', 'Salt', 'Water', 'Oil'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cookingTime: 10,
    isAvailable: true
  },
  {
    name: 'வடை',
    englishName: 'Vadai',
    category: 'Breakfast',
    description: 'Crispy fried lentil fritters, perfect as a snack or with meals.',
    price: 40,
    image: '/images/vadai.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Urad dal', 'Onion', 'Green chili', 'Curry leaves', 'Salt', 'Oil'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cookingTime: 5,
    isAvailable: true
  },

  // Rice Dishes
  {
    name: 'பொங்கல்',
    englishName: 'Pongal',
    category: 'Rice',
    description: 'Creamy rice and lentil porridge, a traditional comfort food.',
    price: 150,
    image: '/images/pongal.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Rice', 'Moong dal', 'Ghee', 'Cumin', 'Pepper', 'Cashews'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    cookingTime: 20,
    isAvailable: true
  },

  // Soups
  {
    name: 'ரசம்',
    englishName: 'Rasam',
    category: 'Soup',
    description: 'Tangy and spicy tomato soup with tamarind and aromatic spices.',
    price: 120,
    image: '/images/rasam.jpg',
    isVeg: true,
    isSpicy: true,
    isPopular: false,
    ingredients: ['Tomato', 'Tamarind', 'Cumin', 'Pepper', 'Garlic', 'Curry leaves'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cookingTime: 15,
    isAvailable: true
  },
  {
    name: 'சாம்பார்',
    englishName: 'Sambar',
    category: 'Soup',
    description: 'Lentil and vegetable stew with tamarind and aromatic spices.',
    price: 100,
    image: '/images/sambar.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Toor dal', 'Mixed vegetables', 'Tamarind', 'Sambar powder', 'Curry leaves'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cookingTime: 18,
    isAvailable: true
  },

  // Dairy
  {
    name: 'தயிர்',
    englishName: 'Curd',
    category: 'Dairy',
    description: 'Fresh homemade curd, perfect to cool down spicy meals.',
    price: 80,
    image: '/images/curd.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Milk', 'Curd starter'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    cookingTime: 0,
    isAvailable: true
  },

  // Desserts
  {
    name: 'பாயசம்',
    englishName: 'Payasam',
    category: 'Dessert',
    description: 'Sweet rice pudding with milk, sugar, and cardamom.',
    price: 150,
    image: '/images/payasam.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Rice', 'Milk', 'Sugar', 'Cardamom', 'Cashews', 'Raisins'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    cookingTime: 25,
    isAvailable: true
  },

  // Beverages
  {
    name: 'தேங்காய் தண்ணீர்',
    englishName: 'Coconut Water',
    category: 'Beverage',
    description: 'Fresh coconut water, naturally refreshing and hydrating.',
    price: 60,
    image: '/images/coconut-water.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ['Fresh coconut water'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Natural'],
    cookingTime: 0,
    isAvailable: true
  },
  {
    name: 'இலுப்பை சாறு',
    englishName: 'Wood Apple Juice',
    category: 'Beverage',
    description: 'Refreshing wood apple juice, a unique Sri Lankan drink.',
    price: 80,
    image: '/images/wood-apple-juice.jpg',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ['Wood apple pulp', 'Sugar', 'Water', 'Salt'],
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Natural'],
    cookingTime: 5,
    isAvailable: true
  }
];

const categories = [
  { name: 'Rice', description: 'Traditional rice dishes and curries' },
  { name: 'Bread', description: 'Hoppers, string hoppers, and bread items' },
  { name: 'Breakfast', description: 'Traditional breakfast items' },
  { name: 'Soup', description: 'Rasam, sambar, and other soups' },
  { name: 'Dairy', description: 'Fresh dairy products' },
  { name: 'Dessert', description: 'Sweet treats and desserts' },
  { name: 'Beverage', description: 'Fresh juices and drinks' }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Food.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Cleared existing food and category data');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create category map for easy lookup
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Process dishes and assign categories
    const processedDishes = jaffnaDishes.map(dish => ({
      ...dish,
      category: categoryMap[dish.category],
      // Apply -5% LKR adjustment
      price: Math.round(dish.price * 0.95),
      originalPrice: dish.price,
      // Add Tamil support
      tamilName: dish.name,
      // Set availability
      isAvailable: true,
      // Add creation timestamp
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert dishes
    const createdDishes = await Food.insertMany(processedDishes);
    console.log(`✅ Created ${createdDishes.length} Jaffna dishes`);

    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`📁 Categories: ${createdCategories.length}`);
    console.log(`🍽️ Dishes: ${createdDishes.length}`);
    
    // Category breakdown
    const categoryBreakdown = {};
    createdDishes.forEach(dish => {
      const categoryName = categories.find(cat => cat._id.toString() === dish.category.toString())?.name;
      categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + 1;
    });
    
    console.log('\n📈 Dishes by Category:');
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} dishes`);
    });

    // Price range
    const prices = createdDishes.map(dish => dish.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    console.log('\n💰 Price Range:');
    console.log(`  Min: LKR ${minPrice}`);
    console.log(`  Max: LKR ${maxPrice}`);
    console.log(`  Average: LKR ${avgPrice.toFixed(2)}`);

    // Popular dishes
    const popularDishes = createdDishes.filter(dish => dish.isPopular);
    console.log(`\n⭐ Popular Dishes: ${popularDishes.length}`);
    popularDishes.forEach(dish => {
      console.log(`  - ${dish.englishName} (${dish.tamilName}) - LKR ${dish.price}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the seeding function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
