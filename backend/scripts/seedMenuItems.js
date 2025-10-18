import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';

// Jaffna-inspired categories with cultural authenticity
const categories = [
  {
    name: 'Breakfast',
    description: 'Traditional Jaffna morning delicacies to start your day',
    icon: '🌅',
    color: '#FF9933',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Seafood',
    description: 'Fresh catches from Jaffna\'s coastal waters',
    icon: '🦀',
    color: '#0077BE',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Meat Dishes',
    description: 'Aromatic Jaffna-style meat preparations',
    icon: '🍖',
    color: '#C41E3A',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Vegetarian',
    description: 'Flavorful vegetable curries and sides',
    icon: '🥬',
    color: '#4CAF50',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Rice & Breads',
    description: 'Staples of Jaffna cuisine',
    icon: '🍚',
    color: '#F5DEB3',
    isActive: true,
    sortOrder: 5
  },
  {
    name: 'Beverages',
    description: 'Traditional Jaffna drinks and refreshments',
    icon: '☕',
    color: '#6F4E37',
    isActive: true,
    sortOrder: 6
  },
  {
    name: 'Desserts',
    description: 'Sweet endings with Jaffna heritage',
    icon: '🍮',
    color: '#FFD700',
    isActive: true,
    sortOrder: 7
  }
];

// Authentic Jaffna menu items with Tamil names and cultural context
const menuItems = [
  // Breakfast Items
  {
    name: 'Appam with Coconut Milk (அப்பம்)',
    description: 'Soft, fluffy rice pancakes with crispy edges, served with rich coconut milk and jaggery',
    price: 250,
    ingredients: ['Rice flour', 'Coconut', 'Yeast', 'Sugar', 'Salt'],
    isVeg: true,
    isBreakfast: true,
    isLunch: false,
    isDinner: false,
    isPopular: true,
    cookingTime: 20,
    culturalOrigin: 'Traditional Jaffna breakfast staple',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Idiyappam with Coconut Sambol (இடியாப்பம்)',
    description: 'String hoppers served with spicy coconut sambol and dhal curry',
    price: 280,
    ingredients: ['Rice flour', 'Coconut', 'Red onions', 'Chili', 'Lentils'],
    isVeg: true,
    isBreakfast: true,
    isPopular: true,
    cookingTime: 25,
    culturalOrigin: 'Jaffna breakfast specialty',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Pittu with Kiri Hodi (பிட்டு)',
    description: 'Steamed cylinders of rice flour and coconut, served with coconut gravy',
    price: 300,
    ingredients: ['Rice flour', 'Coconut', 'Curry leaves', 'Turmeric', 'Onions'],
    isVeg: true,
    isBreakfast: true,
    cookingTime: 30,
    culturalOrigin: 'Traditional Jaffna breakfast',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },

  // Seafood Dishes
  {
    name: 'Jaffna Crab Curry (நண்டு கறி)',
    description: 'Fresh crab cooked in aromatic Jaffna spices with roasted curry powder and coconut',
    price: 1200,
    ingredients: ['Fresh crab', 'Jaffna curry powder', 'Coconut', 'Curry leaves', 'Tamarind'],
    isVeg: false,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 45,
    culturalOrigin: 'Signature Jaffna seafood dish',
    dietaryTags: ['Halal', 'Spicy'],
    allergens: ['Shellfish'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Prawn Curry (இறால் கறி)',
    description: 'Succulent prawns in rich coconut gravy with Jaffna spices',
    price: 950,
    ingredients: ['Prawns', 'Coconut milk', 'Curry leaves', 'Fenugreek', 'Tamarind'],
    isVeg: false,
    isLunch: true,
    isDinner: true,
    isSpicy: true,
    cookingTime: 35,
    culturalOrigin: 'Coastal Jaffna specialty',
    dietaryTags: ['Halal', 'Spicy'],
    allergens: ['Shellfish'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Fish Curry (மீன் கறி)',
    description: 'Fresh fish in tangy tamarind gravy with Jaffna roasted curry powder',
    price: 650,
    ingredients: ['Fresh fish', 'Tamarind', 'Curry powder', 'Coconut', 'Curry leaves'],
    isVeg: false,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 40,
    culturalOrigin: 'Traditional Jaffna fish preparation',
    dietaryTags: ['Halal', 'Spicy'],
    allergens: ['Fish'],
    culturalContext: 'jaffna'
  },

  // Meat Dishes
  {
    name: 'Mutton Curry (ஆட்டுக்கறி)',
    description: 'Tender mutton slow-cooked with Jaffna spices and coconut milk',
    price: 850,
    ingredients: ['Mutton', 'Jaffna curry powder', 'Coconut milk', 'Cinnamon', 'Cardamom'],
    isVeg: false,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 90,
    culturalOrigin: 'Classic Jaffna meat curry',
    dietaryTags: ['Halal', 'Spicy'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Chicken Curry (கோழி கறி)',
    description: 'Spicy Jaffna-style chicken curry with roasted spices',
    price: 550,
    ingredients: ['Chicken', 'Curry powder', 'Coconut', 'Tomatoes', 'Curry leaves'],
    isVeg: false,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 50,
    culturalOrigin: 'Everyday Jaffna favorite',
    dietaryTags: ['Halal', 'Spicy'],
    culturalContext: 'jaffna'
  },

  // Vegetarian Dishes
  {
    name: 'Brinjal Curry (கத்தரிக்கை கறி)',
    description: 'Eggplant cooked in Jaffna-style with coconut and tamarind',
    price: 380,
    ingredients: ['Brinjal', 'Coconut', 'Tamarind', 'Curry leaves', 'Mustard seeds'],
    isVeg: true,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 30,
    culturalOrigin: 'Popular Jaffna vegetable dish',
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Drumstick Curry (முருங்கைக்காய் கறி)',
    description: 'Drumstick in spicy Jaffna curry with coconut milk',
    price: 350,
    ingredients: ['Drumstick', 'Coconut milk', 'Curry powder', 'Chili', 'Turmeric'],
    isVeg: true,
    isLunch: true,
    isDinner: true,
    isSpicy: true,
    cookingTime: 35,
    culturalOrigin: 'Traditional Jaffna vegetable curry',
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Dhal Curry (பருப்பு கறி)',
    description: 'Creamy red lentil curry with tempered spices',
    price: 280,
    ingredients: ['Red lentils', 'Coconut milk', 'Turmeric', 'Curry leaves', 'Garlic'],
    isVeg: true,
    isBreakfast: true,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    cookingTime: 30,
    culturalOrigin: 'Essential Jaffna side dish',
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Coconut Sambol (தேங்காய் சம்பல்)',
    description: 'Fresh coconut ground with chili, lime and Maldive fish',
    price: 150,
    ingredients: ['Fresh coconut', 'Red chili', 'Lime', 'Red onions', 'Maldive fish'],
    isVeg: false,
    isBreakfast: true,
    isLunch: true,
    isDinner: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 10,
    culturalOrigin: 'Essential Jaffna condiment',
    dietaryTags: ['Gluten-Free', 'Spicy'],
    culturalContext: 'jaffna'
  },

  // Rice & Breads
  {
    name: 'Dosai (தோசை)',
    description: 'Crispy rice and lentil crepes served with sambar and chutneys',
    price: 220,
    ingredients: ['Rice', 'Urad dal', 'Fenugreek', 'Salt'],
    isVeg: true,
    isBreakfast: true,
    isPopular: true,
    cookingTime: 20,
    culturalOrigin: 'Popular Jaffna breakfast',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Kottu Roti (கொத்து ரொட்டி)',
    description: 'Chopped roti stir-fried with vegetables, egg, and spices',
    price: 450,
    ingredients: ['Roti', 'Vegetables', 'Egg', 'Curry powder', 'Onions'],
    isVeg: false,
    isLunch: true,
    isDinner: true,
    isSnacks: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 25,
    culturalOrigin: 'Iconic Jaffna street food',
    dietaryTags: ['Spicy'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Veg Kottu (காய்கறி கொத்து)',
    description: 'Vegetarian kottu with mixed vegetables and aromatic spices',
    price: 400,
    ingredients: ['Roti', 'Mixed vegetables', 'Curry powder', 'Onions', 'Curry leaves'],
    isVeg: true,
    isLunch: true,
    isDinner: true,
    isSnacks: true,
    isSpicy: true,
    cookingTime: 25,
    culturalOrigin: 'Vegetarian Jaffna street food',
    dietaryTags: ['Vegetarian', 'Spicy'],
    culturalContext: 'jaffna'
  },

  // Beverages
  {
    name: 'Jaffna Coffee (யாழ்ப்பாண காபி)',
    description: 'Strong filter coffee with creamy milk, Jaffna style',
    price: 180,
    ingredients: ['Coffee powder', 'Milk', 'Sugar'],
    isVeg: true,
    isBreakfast: true,
    isSnacks: true,
    isPopular: true,
    cookingTime: 10,
    culturalOrigin: 'Traditional Jaffna beverage',
    dietaryTags: ['Vegetarian'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Fresh Lime Juice (எலுமிச்சை சாறு)',
    description: 'Refreshing lime juice with mint and sugar',
    price: 120,
    ingredients: ['Fresh lime', 'Mint', 'Sugar', 'Ice'],
    isVeg: true,
    isBreakfast: true,
    isLunch: true,
    isDinner: true,
    isSnacks: true,
    cookingTime: 5,
    culturalOrigin: 'Popular Jaffna refreshment',
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Palmyra Toddy (பனம் கள்)',
    description: 'Traditional fermented palm wine (non-alcoholic version)',
    price: 200,
    ingredients: ['Palmyra sap', 'Spices'],
    isVeg: true,
    isLunch: true,
    isDinner: true,
    cookingTime: 5,
    culturalOrigin: 'Traditional Jaffna drink',
    dietaryTags: ['Vegetarian', 'Vegan'],
    culturalContext: 'jaffna'
  },

  // Desserts
  {
    name: 'Jaffna Vadai (வடை)',
    description: 'Crispy lentil fritters, Jaffna style',
    price: 180,
    ingredients: ['Urad dal', 'Green chili', 'Curry leaves', 'Onions', 'Fennel'],
    isVeg: true,
    isSnacks: true,
    isPopular: true,
    isSpicy: true,
    cookingTime: 20,
    culturalOrigin: 'Classic Jaffna snack',
    dietaryTags: ['Vegetarian', 'Gluten-Free', 'Spicy'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Kavum (கவும்)',
    description: 'Traditional Jaffna sweet made with rice flour and treacle',
    price: 200,
    ingredients: ['Rice flour', 'Treacle', 'Cardamom', 'Coconut oil'],
    isVeg: true,
    isSnacks: true,
    cookingTime: 40,
    culturalOrigin: 'Festive Jaffna sweet',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Watalappan (வத்தலப்பம்)',
    description: 'Coconut custard pudding with jaggery and cashews',
    price: 250,
    ingredients: ['Coconut milk', 'Jaggery', 'Eggs', 'Cashews', 'Cardamom'],
    isVeg: true,
    isSnacks: true,
    isPopular: true,
    cookingTime: 45,
    culturalOrigin: 'Traditional Jaffna dessert',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  },
  {
    name: 'Curd with Honey (தயிர்)',
    description: 'Fresh buffalo curd served with palm treacle',
    price: 180,
    ingredients: ['Buffalo curd', 'Palm treacle'],
    isVeg: true,
    isSnacks: true,
    isPopular: true,
    cookingTime: 5,
    culturalOrigin: 'Simple Jaffna dessert',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    culturalContext: 'jaffna'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing menu items and categories...');
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Existing data cleared');

    // Insert categories
    console.log('📂 Inserting categories...');
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Create category name to ID mapping
    const categoryMap = {};
    insertedCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Assign categories to menu items and add images
    const menuItemsWithCategories = menuItems.map(item => {
      // Determine category based on item characteristics
      let categoryName = 'Rice & Breads'; // default
      
      if (item.name.includes('Curry') && item.isVeg === false && item.ingredients.some(ing => 
        ['Crab', 'Prawn', 'Fish'].some(seafood => ing.includes(seafood))
      )) {
        categoryName = 'Seafood';
      } else if (item.name.includes('Curry') && item.isVeg === false) {
        categoryName = 'Meat Dishes';
      } else if (item.name.includes('Curry') && item.isVeg === true) {
        categoryName = 'Vegetarian';
      } else if (item.isBreakfast && (item.name.includes('Appam') || item.name.includes('Idiyappam') || 
        item.name.includes('Pittu') || item.name.includes('Dosai'))) {
        categoryName = 'Breakfast';
      } else if (item.name.includes('Juice') || item.name.includes('Coffee') || item.name.includes('Toddy')) {
        categoryName = 'Beverages';
      } else if (item.name.includes('Vadai') || item.name.includes('Kavum') || 
        item.name.includes('Watalappan') || item.name.includes('Curd')) {
        categoryName = 'Desserts';
      } else if (item.name.includes('Kottu') || item.name.includes('Sambol')) {
        categoryName = 'Rice & Breads';
      }

      return {
        ...item,
        category: categoryMap[categoryName],
        image: getImageUrlForDish(item.name),
        isAvailable: true
      };
    });

    // Insert menu items
    console.log('🍽️  Inserting menu items...');
    const insertedItems = await MenuItem.insertMany(menuItemsWithCategories);
    console.log(`✅ Inserted ${insertedItems.length} menu items`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Categories: ${insertedCategories.length}`);
    console.log(`   - Menu Items: ${insertedItems.length}`);
    console.log('\n🌐 You can now view the menu at:');
    console.log('   - Guest Menu: http://localhost:5173/menu');
    console.log('   - Food Ordering: http://localhost:5173/food-ordering');
    console.log('   - Admin Management: http://localhost:5173/admin/food/menu');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Helper function to get appropriate image URLs for dishes
function getImageUrlForDish(dishName) {
  const imageMap = {
    'Appam': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
    'Idiyappam': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500',
    'Pittu': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
    'Crab Curry': 'https://images.unsplash.com/photo-1559737558-2f0fbcc87734?w=500',
    'Prawn': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500',
    'Fish Curry': 'https://images.unsplash.com/photo-1615361200098-0a96e7d08af0?w=500',
    'Mutton': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500',
    'Chicken': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500',
    'Brinjal': 'https://images.unsplash.com/photo-1600289031464-74d374b64991?w=500',
    'Drumstick': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
    'Dhal': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
    'Coconut Sambol': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=500',
    'Dosai': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500',
    'Kottu': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
    'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500',
    'Lime Juice': 'https://images.unsplash.com/photo-1523677011781-c91d1bbe1e0c?w=500',
    'Toddy': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500',
    'Vadai': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
    'Kavum': 'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=500',
    'Watalappan': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500',
    'Curd': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500'
  };

  // Find matching image based on dish name keywords
  for (const [keyword, url] of Object.entries(imageMap)) {
    if (dishName.includes(keyword)) {
      return url;
    }
  }

  // Default fallback image
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
}

// Run the seed function
seedDatabase();
