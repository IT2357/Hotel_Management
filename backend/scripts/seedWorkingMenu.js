import mongoose from 'mongoose';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management')
  .then(() => console.log('✅ Connected to database'))
  .catch(err => console.error('❌ Database connection error:', err));

const categories = [
  { name: 'Soups', description: 'Fresh and flavorful soups', displayOrder: 1 },
  { name: 'Fish', description: 'Fresh fish preparations', displayOrder: 2 },
  { name: 'Chicken', description: 'Succulent chicken preparations', displayOrder: 3 },
  { name: 'Dry Curry Bowls', description: 'Signature dry curry bowls', displayOrder: 4 },
  { name: 'Rice Specialities', description: 'Rice and biriyani varieties', displayOrder: 5 },
  { name: 'Kottu', description: 'Traditional Sri Lankan kottu varieties', displayOrder: 6 },
  { name: 'Fresh Juice', description: 'Freshly squeezed juices', displayOrder: 7 },
  { name: 'Desserts', description: 'Traditional and modern desserts', displayOrder: 8 }
];

const menuItems = [
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
  {
    name: 'Mixed Seafood Dry Curry Bowl (W/Roast Bread)',
    description: 'Assorted seafood in dry curry spices served with roast bread.',
    category: 'Dry Curry Bowls',
    portions: [
      { name: 'Half', price: 4550 },
      { name: 'Full', price: 8750 }
    ],
    type: 'Seafood',
    foodType: 'seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Mixed Seafood Bowl' }]
  },
  {
    name: 'Bamboo Biriyani (Chicken)',
    description: 'Biriyani served in a steaming hot bamboo with Raita, Homemade Chutney and Masala Curry.',
    category: 'Rice Specialities',
    basePrice: 1950,
    type: 'Non-Veg',
    foodType: 'non-veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1633945274415-8d3c6c8c8c6f?w=600', alt: 'Bamboo Biriyani Chicken' }]
  },
  {
    name: 'VALDOR Special Chicken Kottu',
    description: 'Kottu Rotti softened and Soaked in a thick curry, topped with 2 types of cheese sauce.',
    category: 'Kottu',
    basePrice: 2750,
    type: 'Non-Veg',
    foodType: 'non-veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1594007654729-407eedc4fe0f?w=600', alt: 'VALDOR Special Chicken Kottu' }]
  },
  {
    name: 'Fresh King Coconut Water',
    description: 'Fresh king coconut water.',
    category: 'Fresh Juice',
    basePrice: 775,
    type: 'Veg',
    foodType: 'veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1625758473102-100ac660249c?w=600', alt: 'King Coconut Water' }]
  },
  {
    name: 'Watalappan',
    description: 'Traditional Sri Lankan coconut custard.',
    category: 'Desserts',
    basePrice: 925,
    type: 'Veg',
    foodType: 'veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600', alt: 'Watalappan' }]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting VALDOR menu seeding...');
    
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🧹 Cleared existing menu data');
    
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
      console.log(`✅ Created category: ${category.name}`);
    }
    
    let createdItemsCount = 0;
    for (const itemData of menuItems) {
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
    
    console.log('\n🎉 VALDOR menu seeding completed successfully!');
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
