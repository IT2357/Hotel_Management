import mongoose from 'mongoose';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management')
  .then(() => console.log('✅ Connected to database'))
  .catch(err => console.error('❌ Database connection error:', err));

const categories = [
  { name: 'Soups', description: 'Fresh and flavorful soups', displayOrder: 1 },
  { name: 'Sambols & Salads', description: 'Traditional sambols and fresh salads', displayOrder: 2 },
  { name: 'Fish', description: 'Fresh fish preparations', displayOrder: 3 },
  { name: 'Cuttlefish', description: 'Tender cuttlefish dishes', displayOrder: 4 },
  { name: 'Prawns & Crab', description: 'Premium seafood specialties', displayOrder: 5 },
  { name: 'Chicken', description: 'Succulent chicken preparations', displayOrder: 6 },
  { name: 'Mutton', description: 'Rich mutton curries and dishes', displayOrder: 7 },
  { name: 'Vegetables', description: 'Fresh vegetable curries', displayOrder: 8 },
  { name: 'Dry Curry Bowls', description: 'Signature dry curry bowls', displayOrder: 9 },
  { name: 'Rice Specialities', description: 'Rice and biriyani varieties', displayOrder: 10 },
  { name: 'Kottu', description: 'Traditional Sri Lankan kottu varieties', displayOrder: 11 },
  { name: 'Fresh Juice', description: 'Freshly squeezed juices', displayOrder: 12 },
  { name: 'Desserts', description: 'Traditional and modern desserts', displayOrder: 13 }
];

const menuItems = [
  // Soups
  {
    name: 'Vegetable Soup',
    description: 'Farm Fresh Vegetable soup with a pinch of salt for your liking.',
    category: 'Soups',
    basePrice: 850,
    type: 'Veg',
    foodType: 'veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', alt: 'Vegetable Soup' }]
  },
  {
    name: 'Mullaguthanni Soup',
    description: 'Traditional Sri Lankan pepper soup with aromatic spices.',
    category: 'Soups',
    basePrice: 950,
    type: 'Non-Veg',
    foodType: 'non-veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1619894991209-32b8fb1d5ce3?w=600', alt: 'Mullaguthanni Soup' }]
  },

  // Fish
  {
    name: 'Maalu Mirisata',
    description: 'Spicy Fish curry cooked with Fresh Spices from the Heart of Ceylon.',
    category: 'Fish',
    basePrice: 1995,
    type: 'Seafood',
    foodType: 'seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600', alt: 'Maalu Mirisata' }]
  },
  {
    name: 'Marianized Fried Fish Sauted with Onions and Capricum',
    description: 'Marianized Fried Fish Sauted with Onions and Capricum.',
    category: 'Fish',
    basePrice: 2250,
    type: 'Seafood',
    foodType: 'seafood',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600', alt: 'Marianized Fried Fish' }]
  },

  // Prawns & Crab
  {
    name: 'Negambo Crab curry',
    description: 'Fresh crab curry with traditional Sri Lankan spices.',
    category: 'Prawns & Crab',
    basePrice: 2250,
    type: 'Seafood',
    foodType: 'seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Negambo Crab curry' }]
  },

  // Chicken
  {
    name: 'Kukulmas Yapanaya Kramayata (Jaffna Style)',
    description: 'Chicken marinated and slow cooked using a recipe unique to the Northern province of Sri Lanka.',
    category: 'Chicken',
    basePrice: 1750,
    type: 'Non-Veg',
    foodType: 'non-veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600', alt: 'Jaffna Style Chicken' }]
  },

  // Dry Curry Bowls
  {
    name: 'Mixed Seafood Dry Curry Bowl (W/Roast Bread)',
    description: 'Assorted seafood in dry curry spices served with roast bread.',
    category: 'Dry Curry Bowls',
    portions: [
      { name: 'Half', price: 4550 },
      { name: 'Full', price: 8750 }
    ],
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Mixed Seafood Bowl' }]
  },

  // Rice Specialities
  {
    name: 'Bamboo Biriyani (Chicken)',
    description: 'Biriyani served in a steaming hot bamboo with Raita, Homemade Chutney and Masala Curry.',
    category: 'Rice Specialities',
    basePrice: 1950,
    type: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1633945274415-8d3c6c8c8c6f?w=600', alt: 'Bamboo Biriyani Chicken' }]
  },
  {
    name: 'Kachal Rice',
    description: 'Traditional Sri Lankan rice preparation with spices.',
    category: 'Rice Specialities',
    basePrice: 4250,
    type: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600', alt: 'Kachal Rice' }]
  },
  {
    name: 'Waw Malu Meal',
    description: 'Traditional fish meal with rice and accompaniments.',
    category: 'Rice Specialities',
    basePrice: 2550,
    type: 'Seafood',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600', alt: 'Waw Malu Meal' }]
  },
  {
    name: 'Hot Butter Chicken Hopper Meal',
    description: 'Crispy hoppers with spicy butter chicken.',
    category: 'Rice Specialities',
    basePrice: 1950,
    type: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600', alt: 'Hot Butter Chicken Hopper Meal' }]
  },

  // Kottu
  {
    name: 'Culture Special Chicken Kottu',
    description: 'Kottu Rotti softened and Soaked in a thick curry, topped with 2 types of cheese sauce.',
    category: 'Kottu',
    basePrice: 2750,
    type: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1594007654729-407eedc4fe0f?w=600', alt: 'Culture Special Chicken Kottu' }]
  },

  // Fresh Juice
  {
    name: 'Fresh King Coconut Water',
    description: 'Fresh king coconut water.',
    category: 'Fresh Juice',
    basePrice: 775,
    type: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1625758473102-100ac660249c?w=600', alt: 'King Coconut Water' }]
  },

  // Desserts
  {
    name: 'Watalappan',
    description: 'Traditional Sri Lankan coconut custard.',
    category: 'Desserts',
    basePrice: 925,
    type: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600', alt: 'Watalappan' }]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting Culture Colombo menu seeding...');
    
    // Clear existing data
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🧹 Cleared existing menu data');
    
    // Create categories
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
      console.log(`✅ Created category: ${category.name}`);
    }
    
    // Create menu items
    let createdItemsCount = 0;
    for (const itemData of menuItems) {
      // Find the category
      const category = createdCategories.find(cat => cat.name === itemData.category);
      if (category) {
        const menuItem = new MenuItem({
          ...itemData,
          category: category._id
        });
        await menuItem.save();
        createdItemsCount++;
        console.log(`✅ Created menu item: ${menuItem.name}`);
      }
    }
    
    console.log('\n🎉 Culture Colombo menu seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Menu Items: ${createdItemsCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    console.log('🔌 Database connection closed');
    mongoose.connection.close();
  }
}

seedDatabase();
