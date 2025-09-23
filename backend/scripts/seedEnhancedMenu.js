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
  { name: 'Hoppers & Traditional', description: 'Hoppers and traditional dinner items', displayOrder: 11 },
  { name: 'Kottu', description: 'Traditional Sri Lankan kottu varieties', displayOrder: 12 },
  { name: 'Sides', description: 'Accompaniments and side dishes', displayOrder: 13 },
  { name: 'Fresh Juice', description: 'Freshly squeezed juices', displayOrder: 14 },
  { name: 'Soft Drinks', description: 'Refreshing beverages', displayOrder: 15 },
  { name: 'Desserts', description: 'Traditional and modern desserts', displayOrder: 16 }
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
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1619894991209-32b8fb1d5ce3?w=600', alt: 'Mullaguthanni Soup' }]
  },
  {
    name: 'Sweet Corn Chicken Soup',
    description: 'Sweet corn kernels in a flavourful chicken soup with egg drop.',
    category: 'Soups',
    basePrice: 1050,
    type: 'Non-Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1619894991209-32b8fb1d5ce3?w=600', alt: 'Sweet Corn Chicken Soup' }]
  },

  // Sambols & Salads
  {
    name: 'Gotukola Sambolaya',
    description: 'Fresh gotukola leaves mixed with coconut, onions and lime.',
    category: 'Sambols & Salads',
    basePrice: 750,
    type: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', alt: 'Gotukola Sambolaya' }]
  },
  {
    name: 'Seeni Sambol',
    description: 'Sweet and spicy onion sambol with Maldive fish.',
    category: 'Sambols & Salads',
    basePrice: 650,
    type: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Seeni Sambol' }]
  },
  {
    name: 'Mixed Salad',
    description: 'Fresh garden salad with cucumber, tomato, and lettuce.',
    category: 'Sambols & Salads',
    basePrice: 850,
    type: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', alt: 'Mixed Salad' }]
  },

  // Fish
  {
    name: 'Maalu Mirisata',
    description: 'Spicy Fish curry cooked with Fresh Spices from the Heart of Ceylon.',
    category: 'Fish',
    basePrice: 1995,
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600', alt: 'Maalu Mirisata' }]
  },
  {
    name: 'Maalu Ambulthiyal',
    description: 'Traditional sour fish curry with goraka and spices.',
    category: 'Fish',
    basePrice: 2150,
    type: 'Seafood',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600', alt: 'Maalu Ambulthiyal' }]
  },
  {
    name: 'Marianized Fried Fish Sauted with Onions and Capricum',
    description: 'Marianized Fried Fish Sauted with Onions and Capricum.',
    category: 'Fish',
    basePrice: 2250,
    type: 'Seafood',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600', alt: 'Marianized Fried Fish' }]
  },

  // Cuttlefish
  {
    name: 'Dailo Rathata',
    description: 'Spicy cuttlefish curry with coconut milk and spices.',
    category: 'Cuttlefish',
    basePrice: 2450,
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Dailo Rathata' }]
  },
  {
    name: 'Hot Butter Cuttlefish',
    description: 'Crispy cuttlefish tossed in spicy butter sauce.',
    category: 'Cuttlefish',
    basePrice: 2650,
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Hot Butter Cuttlefish' }]
  },

  // Prawns & Crab
  {
    name: 'Isso Thempradu',
    description: 'Spicy prawn curry with coconut milk and curry leaves.',
    category: 'Prawns & Crab',
    basePrice: 2850,
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Isso Thempradu' }]
  },
  {
    name: 'Lankan Chilli Kakuluwo',
    description: 'Spicy crab curry with Sri Lankan chilies and spices.',
    category: 'Prawns & Crab',
    basePrice: 3250,
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Lankan Chilli Kakuluwo' }]
  },

  // Chicken
  {
    name: 'Kukulmas Thamparadu',
    description: 'Traditional chicken curry with roasted spices.',
    category: 'Chicken',
    basePrice: 1650,
    type: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600', alt: 'Kukulmas Thamparadu' }]
  },
  {
    name: 'Kukulmas Yapanaya Kramayata (Jaffna Style)',
    description: 'Chicken marinated and slow cooked using a recipe unique to the Northern province of Sri Lanka.',
    category: 'Chicken',
    basePrice: 1750,
    type: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600', alt: 'Jaffna Style Chicken' }]
  },
  {
    name: 'Meat Balls Kirata',
    description: 'Spiced chicken meatballs in rich curry sauce.',
    category: 'Chicken',
    basePrice: 1850,
    type: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600', alt: 'Meat Balls Kirata' }]
  },

  // Dry Curry Bowls
  {
    name: 'Mixed Seafood Dry Curry Bowl',
    description: 'Assorted seafood in dry curry spices.',
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
  {
    name: 'Chicken Dry Curry Bowl',
    description: 'Tender chicken pieces in aromatic dry curry.',
    category: 'Dry Curry Bowls',
    portions: [
      { name: 'Half', price: 3850 },
      { name: 'Full', price: 7250 }
    ],
    type: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600', alt: 'Chicken Dry Curry Bowl' }]
  },

  // Rice Specialities
  {
    name: 'Bamboo Biriyani - Chicken',
    description: 'Biriyani served in a steaming hot bamboo with Raita, Homemade Chutney and Masala Curry.',
    category: 'Rice Specialities',
    basePrice: 1950,
    type: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1633945274415-8d3c6c8c8c6f?w=600', alt: 'Bamboo Biriyani Chicken' }]
  },
  {
    name: 'Bamboo Biriyani - Vegetable',
    description: 'Vegetarian biriyani served in bamboo with accompaniments.',
    category: 'Rice Specialities',
    basePrice: 1650,
    type: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1633945274415-8d3c6c8c8c6f?w=600', alt: 'Bamboo Biriyani Vegetable' }]
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
  {
    name: 'Seafood Kottu',
    description: 'Mixed seafood kottu with traditional spices.',
    category: 'Kottu',
    basePrice: 2950,
    type: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: [{ url: 'https://images.unsplash.com/photo-1594007654729-407eedc4fe0f?w=600', alt: 'Seafood Kottu' }]
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
  {
    name: 'Mango Lassi',
    description: 'Creamy mango yogurt drink.',
    category: 'Fresh Juice',
    basePrice: 850,
    type: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: [{ url: 'https://images.unsplash.com/photo-1625758473102-100ac660249c?w=600', alt: 'Mango Lassi' }]
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
    console.log('🌱 Starting enhanced Culture Colombo menu seeding...');
    
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
    
    console.log('\n🎉 Enhanced Culture Colombo menu seeding completed successfully!');
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
