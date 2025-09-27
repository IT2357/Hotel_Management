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
  { name: 'Cambodia (Sambols & Salads)', description: 'Traditional sambols and fresh salads', displayOrder: 2 },
  { name: 'Fish', description: 'Fresh fish preparations', displayOrder: 3 },
  { name: 'Cuttlefish', description: 'Tender cuttlefish dishes', displayOrder: 4 },
  { name: 'Prawns & Crab', description: 'Premium seafood specialties', displayOrder: 5 },
  { name: 'Chicken', description: 'Succulent chicken preparations', displayOrder: 6 },
  { name: 'Mutton', description: 'Rich mutton curries and dishes', displayOrder: 7 },
  { name: 'Vegetables', description: 'Fresh vegetable curries', displayOrder: 8 },
  { name: 'The Matt Walande Dry Curry Bowl', description: 'Signature dry curry bowls', displayOrder: 9 },
  { name: 'Rice Specialities', description: 'Rice and biriyani varieties', displayOrder: 10 },
  { name: 'Culture Colombo Dinner Menu', description: 'Hoppers and traditional dinner items', displayOrder: 11 },
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
    price: 1050,
    foodType: 'Non-Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1619894991209-32b8fb1d5ce3?w=600']
  },

  // Cambodia (Sambols & Salads)
  {
    name: 'Gotukola Sambolaya',
    description: 'Fresh gotukola leaves mixed with coconut, onions and lime.',
    category: 'Cambodia (Sambols & Salads)',
    price: 750,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600']
  },
  {
    name: 'Seeni Sambol',
    description: 'Sweet and spicy onion sambol with Maldive fish.',
    category: 'Cambodia (Sambols & Salads)',
    price: 650,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },
  {
    name: 'Mixed Salad',
    description: 'Fresh garden salad with cucumber, tomato, and lettuce.',
    category: 'Cambodia (Sambols & Salads)',
    price: 850,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600']
  },

  // Fish
  {
    name: 'Maalu Mirisata',
    description: 'Spicy Fish curry cooked with Fresh Spices from the Heart of Ceylon.',
    category: 'Fish',
    price: 1995,
    foodType: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600']
  },
  {
    name: 'Maalu Ambulthiyal',
    description: 'Traditional sour fish curry with goraka and spices.',
    category: 'Fish',
    price: 2150,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600']
  },
  {
    name: 'Marianized Fried Fish',
    description: 'Marianized Fried Fish Sauted with Onions and Capricum.',
    category: 'Fish',
    price: 2250,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600']
  },

  // Cuttlefish
  {
    name: 'Dailo Rathata',
    description: 'Spicy cuttlefish curry with coconut milk and spices.',
    category: 'Cuttlefish',
    price: 2450,
    foodType: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },
  {
    name: 'Hot Butter Cuttlefish',
    description: 'Crispy cuttlefish tossed in spicy butter sauce.',
    category: 'Cuttlefish',
    price: 2650,
    foodType: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },

  // Prawns & Crab
  {
    name: 'Isso Thempradu',
    description: 'Spicy prawn curry with coconut milk and curry leaves.',
    category: 'Prawns & Crab',
    price: 2850,
    foodType: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },
  {
    name: 'Lankan Chilli Kakuluwo',
    description: 'Spicy crab curry with Sri Lankan chilies and spices.',
    category: 'Prawns & Crab',
    price: 3250,
    foodType: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },

  // Chicken
  {
    name: 'Kukulmas Thamparadu',
    description: 'Traditional chicken curry with roasted spices.',
    category: 'Chicken',
    price: 1650,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600']
  },
  {
    name: 'Kukulmas Yapanaya Kramayata (Jaffna Style)',
    description: 'Chicken marinated and slow cooked using a recipe unique to the Northern province of Sri Lanka.',
    category: 'Chicken',
    price: 1750,
    foodType: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600']
  },
  {
    name: 'Meat Balls Kirata',
    description: 'Spiced chicken meatballs in rich curry sauce.',
    category: 'Chicken',
    price: 1850,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1604503469325-67c51140fa99?w=600']
  },

  // Mutton
  {
    name: 'Elu Mas Masala',
    description: 'Rich mutton curry with aromatic masala spices.',
    category: 'Mutton',
    price: 2150,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1574653853027-5e4e3ae2ca78?w=600']
  },
  {
    name: 'Elu Mas Devilled',
    description: 'Spicy devilled mutton with onions and peppers.',
    category: 'Mutton',
    price: 2250,
    foodType: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1574653853027-5e4e3ae2ca78?w=600']
  },

  // Vegetables
  {
    name: 'Soya Curry',
    description: 'Protein-rich soya chunks in spiced curry.',
    category: 'Vegetables',
    price: 950,
    foodType: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },
  {
    name: 'Kaju Maluwa',
    description: 'Cashew curry in coconut milk.',
    category: 'Vegetables',
    price: 1150,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },
  {
    name: 'Batu Mojuwa',
    description: 'Eggplant curry with traditional spices.',
    category: 'Vegetables',
    price: 850,
    foodType: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },

  // The Matt Walande Dry Curry Bowl
  {
    name: 'Mixed Seafood Bowl',
    description: 'Assorted seafood in dry curry spices.',
    category: 'The Matt Walande Dry Curry Bowl',
    portions: [
      { name: 'Half', price: 4550 },
      { name: 'Full', price: 8750 }
    ],
    price: 4550,
    foodType: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },
  {
    name: 'Crab Bowl',
    description: 'Fresh crab meat in aromatic dry curry.',
    category: 'The Matt Walande Dry Curry Bowl',
    portions: [
      { name: 'Half', price: 5250 },
      { name: 'Full', price: 9850 }
    ],
    price: 5250,
    foodType: 'Seafood',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600']
  },

  // Rice Specialities
  {
    name: 'Rice and Curry Special',
    description: 'Traditional rice and curry with multiple curries.',
    category: 'Rice Specialities',
    price: 1850,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600']
  },
  {
    name: 'Chicken Fried Rice',
    description: 'Fragrant fried rice with chicken pieces.',
    category: 'Rice Specialities',
    price: 1650,
    foodType: 'Non-Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600']
  },
  {
    name: 'Bamboo Biriyani - Chicken',
    description: 'Biriyani served in a steaming hot bamboo with Raita, Homemade Chutney and Masala Curry.',
    category: 'Rice Specialities',
    price: 1950,
    foodType: 'Non-Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1633945274415-8d3c6c8c8c6f?w=600']
  },
  {
    name: 'Bamboo Biriyani - Vegetable',
    description: 'Vegetarian biriyani served in bamboo with accompaniments.',
    category: 'Rice Specialities',
    price: 1650,
    foodType: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1633945274415-8d3c6c8c8c6f?w=600']
  },

  // Culture Colombo Dinner Menu
  {
    name: 'PITTU with Curry',
    description: 'Traditional steamed rice flour cylinders with curry.',
    category: 'Culture Colombo Dinner Menu',
    price: 1250,
    foodType: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600']
  },
  {
    name: 'STRING HOPPERS with Curry',
    description: 'Delicate rice noodle nests with curry accompaniments.',
    category: 'Culture Colombo Dinner Menu',
    price: 1150,
    foodType: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600']
  },
  {
    name: 'EGG ROTTI',
    description: 'Crispy rotti with egg and accompaniments.',
    category: 'Culture Colombo Dinner Menu',
    price: 950,
    foodType: 'Non-Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600']
  },
  {
    name: 'Hot Butter Chicken Hopper Meal',
    description: 'Crispy hoppers with spicy butter chicken.',
    category: 'Culture Colombo Dinner Menu',
    price: 1850,
    foodType: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600']
  },

  // Kottu
  {
    name: 'Vegetable Kottu',
    description: 'Chopped rotti with vegetables and spices.',
    category: 'Kottu',
    price: 1450,
    foodType: 'Veg',
    spiceLevel: 'Medium',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1594007654729-407eedc4fe0f?w=600']
  },
  {
    name: 'Culture Special Chicken Kottu',
    description: 'Kottu Rotti softened and Soaked in a thick curry, topped with 2 types of cheese sauce.',
    category: 'Kottu',
    price: 2750,
    foodType: 'Non-Veg',
    spiceLevel: 'Hot',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1594007654729-407eedc4fe0f?w=600']
  },

  // Sides
  {
    name: 'Roast Paan',
    description: 'Traditional roasted bread.',
    category: 'Sides',
    price: 150,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600']
  },
  {
    name: 'Basmathi Rice',
    description: 'Fragrant basmati rice.',
    category: 'Sides',
    price: 350,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600']
  },
  {
    name: 'Boiled Egg',
    description: 'Simple boiled egg.',
    category: 'Sides',
    price: 125,
    foodType: 'Non-Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600']
  },

  // Fresh Juice
  {
    name: 'Orange Juice',
    description: 'Freshly squeezed orange juice.',
    category: 'Fresh Juice',
    price: 650,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1625758473102-100ac660249c?w=600']
  },
  {
    name: 'King Coconut',
    description: 'Fresh king coconut water.',
    category: 'Fresh Juice',
    price: 775,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1625758473102-100ac660249c?w=600']
  },
  {
    name: 'Passion Fruit Juice',
    description: 'Tangy passion fruit juice.',
    category: 'Fresh Juice',
    price: 750,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1625758473102-100ac660249c?w=600']
  },

  // Soft Drinks
  {
    name: 'Coca-Cola',
    description: 'Classic Coca-Cola.',
    category: 'Soft Drinks',
    price: 350,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600']
  },
  {
    name: 'Sprite',
    description: 'Refreshing lemon-lime soda.',
    category: 'Soft Drinks',
    price: 350,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600']
  },
  {
    name: 'Cinnamon Iced Tea',
    description: 'Refreshing iced tea with cinnamon.',
    category: 'Soft Drinks',
    price: 450,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600']
  },

  // Desserts
  {
    name: 'Ice Cream',
    description: 'Vanilla ice cream.',
    category: 'Desserts',
    price: 650,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600']
  },
  {
    name: 'Wattalapam',
    description: 'Traditional Sri Lankan coconut custard.',
    category: 'Desserts',
    price: 925,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600']
  },
  {
    name: 'Honey Hopper',
    description: 'Sweet hopper drizzled with honey.',
    category: 'Desserts',
    price: 750,
    foodType: 'Veg',
    spiceLevel: 'Mild',
    isHalal: true,
    dietaryTags: ['vegetarian'],
    images: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600']
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive Culture Colombo menu seeding...');
    
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
    
    console.log('\n🎉 Comprehensive Culture Colombo menu seeding completed successfully!');
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
