import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import 'dotenv/config';

const menuItems = [
  {
    name: "Grilled Chicken Breast",
    description: "Tender grilled chicken breast served with seasonal vegetables and herb butter",
    price: 24.99,
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Chicken breast", "Mixed vegetables", "Herb butter", "Garlic", "Rosemary"],
    nutritionalInfo: {
      calories: 350,
      protein: 45,
      carbs: 8,
      fat: 15
    },
    cookingTime: 20
  },
  {
    name: "Margherita Pizza",
    description: "Classic Italian pizza with fresh mozzarella, tomatoes, and basil",
    price: 18.99,
    category: "main-course",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Pizza dough", "Mozzarella", "Tomatoes", "Fresh basil", "Olive oil"],
    nutritionalInfo: {
      calories: 280,
      protein: 12,
      carbs: 35,
      fat: 10
    },
    cookingTime: 15
  },
  {
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with parmesan cheese, croutons, and Caesar dressing",
    price: 12.99,
    category: "appetizers",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ["Romaine lettuce", "Parmesan cheese", "Croutons", "Caesar dressing"],
    nutritionalInfo: {
      calories: 180,
      protein: 8,
      carbs: 12,
      fat: 12
    },
    cookingTime: 5
  },
  {
    name: "Spicy Thai Curry",
    description: "Authentic Thai red curry with coconut milk, vegetables, and jasmine rice",
    price: 19.99,
    category: "main-course",
    isAvailable: true,
    isVeg: true,
    isSpicy: true,
    isPopular: false,
    ingredients: ["Red curry paste", "Coconut milk", "Mixed vegetables", "Jasmine rice", "Thai basil"],
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 45,
      fat: 12
    },
    cookingTime: 25
  },
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center, served with vanilla ice cream",
    price: 8.99,
    category: "desserts",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Dark chocolate", "Butter", "Eggs", "Sugar", "Flour", "Vanilla ice cream"],
    nutritionalInfo: {
      calories: 420,
      protein: 6,
      carbs: 45,
      fat: 24
    },
    cookingTime: 12
  },
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice, rich in vitamin C",
    price: 4.99,
    category: "beverages",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ["Fresh oranges"],
    nutritionalInfo: {
      calories: 110,
      protein: 2,
      carbs: 26,
      fat: 0
    },
    cookingTime: 2
  },
  {
    name: "Fish and Chips",
    description: "Beer-battered fish with crispy fries and tartar sauce",
    price: 22.99,
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Fresh fish", "Beer batter", "Potatoes", "Tartar sauce", "Lemon"],
    nutritionalInfo: {
      calories: 580,
      protein: 35,
      carbs: 45,
      fat: 28
    },
    cookingTime: 18
  },
  {
    name: "Vegetable Spring Rolls",
    description: "Crispy spring rolls filled with fresh vegetables, served with sweet chili sauce",
    price: 9.99,
    category: "appetizers",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ["Spring roll wrapper", "Cabbage", "Carrots", "Bean sprouts", "Sweet chili sauce"],
    nutritionalInfo: {
      calories: 150,
      protein: 4,
      carbs: 20,
      fat: 6
    },
    cookingTime: 8
  },
  {
    name: "Beef Burger",
    description: "Juicy beef patty with lettuce, tomato, cheese, and fries",
    price: 16.99,
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Beef patty", "Burger bun", "Lettuce", "Tomato", "Cheese", "Fries"],
    nutritionalInfo: {
      calories: 650,
      protein: 35,
      carbs: 45,
      fat: 35
    },
    cookingTime: 15
  },
  {
    name: "Iced Coffee",
    description: "Cold brew coffee served over ice with milk and sugar",
    price: 3.99,
    category: "beverages",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ["Coffee beans", "Ice", "Milk", "Sugar"],
    nutritionalInfo: {
      calories: 80,
      protein: 3,
      carbs: 12,
      fat: 2
    },
    cookingTime: 3
  },
  {
    name: "Continental Breakfast",
    description: "Fresh croissants, fruits, yogurt, and coffee",
    price: 15.99,
    category: "breakfast",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Croissants", "Fruits", "Yogurt", "Coffee"],
    nutritionalInfo: {
      calories: 450,
      protein: 15,
      carbs: 60,
      fat: 18
    },
    cookingTime: 5
  },
  {
    name: "Chicken Fried Rice",
    description: "Wok-tossed rice with chicken, vegetables, and eggs",
    price: 18.99,
    category: "lunch",
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Rice", "Chicken", "Vegetables", "Eggs", "Soy sauce"],
    nutritionalInfo: {
      calories: 520,
      protein: 28,
      carbs: 65,
      fat: 16
    },
    cookingTime: 15
  },
  {
    name: "Grilled Salmon Dinner",
    description: "Fresh salmon fillet with roasted vegetables and rice",
    price: 32.99,
    category: "dinner",
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Salmon", "Vegetables", "Rice", "Herbs"],
    nutritionalInfo: {
      calories: 480,
      protein: 35,
      carbs: 30,
      fat: 22
    },
    cookingTime: 20
  }
];

async function seedMenuItems() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing menu items
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    // Get all categories and create a map
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      // Direct mapping for exact name matches
      categoryMap[cat.name] = cat._id;
      categoryMap[cat.name.toLowerCase()] = cat._id;
      categoryMap[cat.name.toLowerCase().replace(/\s+/g, '-')] = cat._id;

      // Also map common variations
      if (cat.name === 'Main Courses') categoryMap['main-course'] = cat._id;
      if (cat.name === 'Appetizers & Starters') categoryMap['appetizers'] = cat._id;
      if (cat.name === 'Desserts & Sweets') categoryMap['desserts'] = cat._id;
      if (cat.name === 'Beverages') categoryMap['beverages'] = cat._id;
    });

    console.log('Category mapping:', categoryMap);

    // Insert new menu items one by one to trigger pre-save middleware
    const insertedItems = [];
    for (const itemData of menuItems) {
      // Replace category string with ObjectId
      if (typeof itemData.category === 'string') {
        const categoryId = categoryMap[itemData.category];
        if (!categoryId) {
          console.warn(`⚠️ Category "${itemData.category}" not found, skipping item "${itemData.name}"`);
          continue;
        }
        itemData.category = categoryId;
      }

      const item = new MenuItem(itemData);
      const savedItem = await item.save();
      insertedItems.push(savedItem);
    }
    console.log(`Inserted ${insertedItems.length} menu items`);

    // Display inserted items
    insertedItems.forEach(item => {
      console.log(`- ${item.name} (${item.category}) - $${item.price} [${item.slug}]`);
    });

    console.log('Menu seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu items:', error);
    process.exit(1);
  }
}

seedMenuItems();
