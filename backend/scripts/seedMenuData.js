// 📁 backend/scripts/seedMenuData.js
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import 'dotenv/config';

const categories = [
  {
    name: 'Breakfast',
    slug: 'breakfast',
    description: 'Morning meals and breakfast items',
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'Appetizers & Starters',
    slug: 'appetizers-starters',
    description: 'Perfect way to begin your culinary journey',
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'Main Courses',
    slug: 'main-courses',
    description: 'Hearty and satisfying main dishes',
    displayOrder: 3,
    isActive: true
  },
  {
    name: 'Seafood Specialties',
    slug: 'seafood-specialties',
    description: 'Fresh catches from the ocean',
    displayOrder: 4,
    isActive: true
  },
  {
    name: 'Vegetarian Delights',
    slug: 'vegetarian-delights',
    description: 'Plant-based culinary masterpieces',
    displayOrder: 5,
    isActive: true
  },
  {
    name: 'Desserts & Sweets',
    slug: 'desserts-sweets',
    description: 'Sweet endings to your meal',
    displayOrder: 6,
    isActive: true
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    description: 'Refreshing drinks and specialty coffees',
    displayOrder: 7,
    isActive: true
  }
];

const menuItems = [
  // Breakfast
  {
    name: 'Idli with Sambar',
    description: 'Steamed rice cakes served with lentil soup and coconut chutney',
    price: 250,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
    ingredients: ['Rice flour', 'Urad dal', 'Coconut', 'Tamarind', 'Spices'],
    allergens: [],
    nutritionalInfo: {
      calories: 180,
      protein: 6,
      carbs: 32,
      fat: 3
    },
    dietaryTags: ['vegetarian', 'vegan'],
    spiceLevel: 'mild',
    cookingTime: 15,
    portions: [
      { name: 'Regular', price: 250 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },
  {
    name: 'Dosa',
    description: 'Crispy fermented crepe filled with potato masala',
    price: 300,
    image: 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b5c?w=500',
    ingredients: ['Rice', 'Urad dal', 'Potatoes', 'Onions', 'Spices'],
    allergens: [],
    nutritionalInfo: {
      calories: 220,
      protein: 8,
      carbs: 35,
      fat: 5
    },
    dietaryTags: ['vegetarian', 'vegan'],
    spiceLevel: 'mild',
    cookingTime: 20,
    portions: [
      { name: 'Regular', price: 300 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },

  // Appetizers & Starters
  {
    name: 'Truffle Arancini',
    description: 'Crispy risotto balls filled with truffle and parmesan, served with garlic aioli',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
    ingredients: ['Arborio rice', 'Truffle oil', 'Parmesan cheese', 'Garlic', 'Breadcrumbs'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritionalInfo: {
      calories: 320,
      protein: 12,
      carbs: 28,
      fat: 18
    },
    dietaryTags: ['vegetarian'],
    spiceLevel: 'mild',
    cookingTime: 15,
    portions: [
      { name: 'Regular', price: 16.99 },
      { name: 'Large', price: 22.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },
  {
    name: 'Seared Scallops',
    description: 'Pan-seared scallops with cauliflower puree and crispy pancetta',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1559847844-d721426d6edc?w=500',
    ingredients: ['Fresh scallops', 'Cauliflower', 'Pancetta', 'Butter', 'Herbs'],
    allergens: ['Shellfish', 'Dairy'],
    nutritionalInfo: {
      calories: 280,
      protein: 22,
      carbs: 8,
      fat: 16
    },
    dietaryTags: ['gluten-free', 'seafood'],
    spiceLevel: 'mild',
    cookingTime: 12,
    portions: [
      { name: 'Regular', price: 24.99 }
    ],
    isAvailable: true,
    isPopular: false,
    isFeatured: true
  },

  // Main Courses
  {
    name: 'Wagyu Beef Tenderloin',
    description: 'Premium wagyu beef with roasted vegetables and red wine jus',
    price: 65.99,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
    ingredients: ['Wagyu beef', 'Seasonal vegetables', 'Red wine', 'Herbs', 'Garlic'],
    allergens: ['Sulfites'],
    nutritionalInfo: {
      calories: 520,
      protein: 45,
      carbs: 12,
      fat: 32
    },
    dietaryTags: ['gluten-free', 'halal'],
    spiceLevel: 'mild',
    cookingTime: 25,
    portions: [
      { name: '8oz', price: 65.99 },
      { name: '12oz', price: 89.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: true
  },
  {
    name: 'Duck Confit',
    description: 'Slow-cooked duck leg with cherry gastrique and roasted potatoes',
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    ingredients: ['Duck leg', 'Cherries', 'Potatoes', 'Thyme', 'Garlic'],
    allergens: [],
    nutritionalInfo: {
      calories: 480,
      protein: 38,
      carbs: 18,
      fat: 28
    },
    dietaryTags: ['gluten-free'],
    spiceLevel: 'mild',
    cookingTime: 30,
    portions: [
      { name: 'Regular', price: 32.99 }
    ],
    isAvailable: true,
    isPopular: false,
    isFeatured: false
  },

  // Seafood Specialties
  {
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon herb butter and quinoa pilaf',
    price: 28.99,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500',
    ingredients: ['Atlantic salmon', 'Quinoa', 'Lemon', 'Herbs', 'Butter'],
    allergens: ['Fish', 'Dairy'],
    nutritionalInfo: {
      calories: 420,
      protein: 35,
      carbs: 22,
      fat: 20
    },
    dietaryTags: ['gluten-free', 'seafood'],
    spiceLevel: 'mild',
    cookingTime: 18,
    portions: [
      { name: '6oz', price: 28.99 },
      { name: '8oz', price: 34.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },
  {
    name: 'Lobster Thermidor',
    description: 'Classic lobster thermidor with gruyere cheese and cognac',
    price: 48.99,
    image: 'https://images.unsplash.com/photo-1559847844-d721426d6edc?w=500',
    ingredients: ['Fresh lobster', 'Gruyere cheese', 'Cognac', 'Cream', 'Mustard'],
    allergens: ['Shellfish', 'Dairy', 'Alcohol'],
    nutritionalInfo: {
      calories: 380,
      protein: 28,
      carbs: 6,
      fat: 26
    },
    dietaryTags: ['gluten-free', 'seafood'],
    spiceLevel: 'mild',
    cookingTime: 22,
    portions: [
      { name: 'Half Lobster', price: 48.99 },
      { name: 'Whole Lobster', price: 78.99 }
    ],
    isAvailable: true,
    isPopular: false,
    isFeatured: true
  },

  // Vegetarian Delights
  {
    name: 'Mushroom Wellington',
    description: 'Wild mushroom duxelles wrapped in flaky pastry with herb sauce',
    price: 26.99,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
    ingredients: ['Mixed mushrooms', 'Puff pastry', 'Herbs', 'Shallots', 'Wine'],
    allergens: ['Gluten', 'Dairy'],
    nutritionalInfo: {
      calories: 380,
      protein: 12,
      carbs: 32,
      fat: 22
    },
    dietaryTags: ['vegetarian'],
    spiceLevel: 'mild',
    cookingTime: 25,
    portions: [
      { name: 'Individual', price: 26.99 },
      { name: 'Sharing', price: 45.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },
  {
    name: 'Eggplant Parmigiana',
    description: 'Layers of grilled eggplant with tomato sauce and mozzarella',
    price: 22.99,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
    ingredients: ['Eggplant', 'Tomato sauce', 'Mozzarella', 'Basil', 'Parmesan'],
    allergens: ['Dairy'],
    nutritionalInfo: {
      calories: 320,
      protein: 18,
      carbs: 24,
      fat: 16
    },
    dietaryTags: ['vegetarian', 'gluten-free'],
    spiceLevel: 'mild',
    cookingTime: 20,
    portions: [
      { name: 'Regular', price: 22.99 }
    ],
    isAvailable: true,
    isPopular: false,
    isFeatured: false
  },

  // Desserts & Sweets
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Sugar', 'Vanilla ice cream'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritionalInfo: {
      calories: 450,
      protein: 8,
      carbs: 52,
      fat: 24
    },
    dietaryTags: ['vegetarian'],
    spiceLevel: 'mild',
    cookingTime: 12,
    portions: [
      { name: 'Individual', price: 12.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
    price: 10.99,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
    ingredients: ['Mascarpone', 'Ladyfingers', 'Coffee', 'Cocoa', 'Marsala wine'],
    allergens: ['Gluten', 'Dairy', 'Eggs', 'Alcohol'],
    nutritionalInfo: {
      calories: 380,
      protein: 6,
      carbs: 28,
      fat: 26
    },
    dietaryTags: ['vegetarian'],
    spiceLevel: 'mild',
    cookingTime: 5,
    portions: [
      { name: 'Regular', price: 10.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },

  // Beverages
  {
    name: 'Artisan Coffee',
    description: 'Single-origin coffee beans, expertly roasted and brewed',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500',
    ingredients: ['Single-origin coffee beans', 'Filtered water'],
    allergens: [],
    nutritionalInfo: {
      calories: 5,
      protein: 0,
      carbs: 1,
      fat: 0
    },
    dietaryTags: ['vegan', 'gluten-free'],
    spiceLevel: 'mild',
    cookingTime: 3,
    portions: [
      { name: 'Regular', price: 4.99 },
      { name: 'Large', price: 6.99 }
    ],
    isAvailable: true,
    isPopular: true,
    isFeatured: false
  },
  {
    name: 'Fresh Fruit Smoothie',
    description: 'Blend of seasonal fruits with yogurt and honey',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500',
    ingredients: ['Seasonal fruits', 'Greek yogurt', 'Honey', 'Ice'],
    allergens: ['Dairy'],
    nutritionalInfo: {
      calories: 180,
      protein: 8,
      carbs: 32,
      fat: 2
    },
    dietaryTags: ['vegetarian', 'gluten-free'],
    spiceLevel: 'mild',
    cookingTime: 2,
    portions: [
      { name: 'Regular', price: 8.99 },
      { name: 'Large', price: 11.99 }
    ],
    isAvailable: true,
    isPopular: false,
    isFeatured: false
  }
];

async function seedMenuData() {
  try {
    console.log('🌱 Starting menu data seeding...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Cleared existing menu data');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create category mapping
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Assign categories to menu items
    const menuItemsWithCategories = menuItems.map((item, index) => {
      let categorySlug;
      if (index < 2) categorySlug = 'breakfast';
      else if (index < 4) categorySlug = 'appetizers-starters';
      else if (index < 6) categorySlug = 'main-courses';
      else if (index < 8) categorySlug = 'seafood-specialties';
      else if (index < 10) categorySlug = 'vegetarian-delights';
      else if (index < 12) categorySlug = 'desserts-sweets';
      else categorySlug = 'beverages';

      // Generate slug manually
      const baseSlug = item.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .replace(/^-|-$/g, '');

      const slug = `${baseSlug}-${Date.now()}-${index}`;

      return {
        ...item,
        category: categoryMap[categorySlug],
        slug: slug
      };
    });

    // Create menu items
    const createdItems = await MenuItem.insertMany(menuItemsWithCategories);
    console.log(`✅ Created ${createdItems.length} menu items`);

    console.log('🎉 Menu data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Menu Items: ${createdItems.length}`);
    console.log(`Featured Items: ${createdItems.filter(item => item.isFeatured).length}`);
    console.log(`Popular Items: ${createdItems.filter(item => item.isPopular).length}`);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding menu data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMenuData();
}

export default seedMenuData;
