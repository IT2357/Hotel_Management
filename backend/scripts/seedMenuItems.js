import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import 'dotenv/config';

const menuItems = [
  {
    name: "Jaffna Chicken Biryani",
    description: "Aromatic basmati rice cooked with tender chicken and traditional Jaffna spices",
    price: 1650, // LKR with -5% Jaffna adjustment
    currency: 'LKR',
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ["Basmati rice", "Chicken", "Jaffna spices", "Onions", "Ghee"],
    nutritionalInfo: {
      calories: 650,
      protein: 35,
      carbs: 75,
      fat: 20
    },
    cookingTime: 45
  },
  {
    name: "String Hoppers with Curry",
    description: "Traditional Sri Lankan string hoppers served with fish curry and coconut sambol",
    price: 1200,
    currency: 'LKR',
    category: "breakfast",
    isAvailable: true,
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ["Rice flour", "Fish", "Coconut", "Chili", "Curry leaves"],
    nutritionalInfo: {
      calories: 480,
      protein: 25,
      carbs: 65,
      fat: 15
    },
    cookingTime: 30
  },
  {
    name: "Vegetable Kottu",
    description: "Mixed vegetables chopped with roti and traditional Sri Lankan spices",
    price: 1100,
    currency: 'LKR',
    category: "main-course",
    isAvailable: true,
    isVeg: true,
    isSpicy: true,
    isPopular: false,
    ingredients: ["Roti", "Mixed vegetables", "Eggs", "Sri Lankan spices"],
    nutritionalInfo: {
      calories: 520,
      protein: 18,
      carbs: 70,
      fat: 18
    },
    cookingTime: 20
  },
  {
    name: "Jaffna Crab Curry",
    description: "Signature Jaffna crab curry made with roasted spices and coconut milk",
    price: 2550,
    currency: 'LKR',
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ["Crab", "Coconut milk", "Jaffna spices", "Curry leaves", "Garlic"],
    nutritionalInfo: {
      calories: 380,
      protein: 45,
      carbs: 12,
      fat: 18
    },
    cookingTime: 35
  },
  {
    name: "Watalappam",
    description: "Traditional Sri Lankan coconut custard pudding with Jaffna spices",
    price: 750,
    currency: 'LKR',
    category: "desserts",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    ingredients: ["Coconut milk", "Jaggery", "Eggs", "Cardamom", "Cashews"],
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 35,
      fat: 16
    },
    cookingTime: 60
  },
  {
    name: "Fresh King Coconut Water",
    description: "Fresh king coconut water, naturally sweet and refreshing",
    price: 350,
    currency: 'LKR',
    category: "beverages",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ["Fresh king coconut"],
    nutritionalInfo: {
      calories: 45,
      protein: 1,
      carbs: 10,
      fat: 0
    },
    cookingTime: 2
  },
  {
    name: "Fish Ambul Thiyal",
    description: "Sour fish curry from Jaffna with goraka and traditional spices",
    price: 1850,
    currency: 'LKR',
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ["Fish", "Goraka", "Jaffna spices", "Coconut milk", "Tamarind"],
    nutritionalInfo: {
      calories: 420,
      protein: 40,
      carbs: 15,
      fat: 20
    },
    cookingTime: 40
  },
  {
    name: "Pol Sambol",
    description: "Traditional Sri Lankan coconut sambol with chili and lime",
    price: 450,
    currency: 'LKR',
    category: "appetizers",
    isAvailable: true,
    isVeg: true,
    isSpicy: true,
    isPopular: false,
    ingredients: ["Coconut", "Chili", "Lime", "Onions", "Salt"],
    nutritionalInfo: {
      calories: 180,
      protein: 3,
      carbs: 8,
      fat: 15
    },
    cookingTime: 10
  },
  {
    name: "Mutton Curry (Jaffna Style)",
    description: "Tender mutton cooked in traditional Jaffna curry paste with potatoes",
    price: 2100,
    currency: 'LKR',
    category: "main-course",
    isAvailable: true,
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    ingredients: ["Mutton", "Jaffna curry paste", "Potatoes", "Coconut milk", "Curry leaves"],
    nutritionalInfo: {
      calories: 550,
      protein: 45,
      carbs: 20,
      fat: 28
    },
    cookingTime: 90
  },
  {
    name: "Ceylon Tea",
    description: "Traditional Sri Lankan tea with milk and sugar",
    price: 250,
    currency: 'LKR',
    category: "beverages",
    isAvailable: true,
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    ingredients: ["Ceylon tea", "Milk", "Sugar"],
    nutritionalInfo: {
      calories: 80,
      protein: 3,
      carbs: 12,
      fat: 2
    },
    cookingTime: 5
  },
  {
    name: "Hoppers with Lunu Miris",
    description: "Crispy Sri Lankan hoppers served with spicy onion sambol",
    price: 950,
    currency: 'LKR',
    category: "breakfast",
    isAvailable: true,
    isVeg: true,
    isSpicy: true,
    isPopular: true,
    ingredients: ["Rice flour", "Coconut milk", "Onions", "Chili", "Lime"],
    nutritionalInfo: {
      calories: 280,
      protein: 6,
      carbs: 50,
      fat: 8
    },
    cookingTime: 15
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
      console.log(`- ${item.name} (${item.category}) - LKR ${item.price} [${item.slug}]`);
    });

    console.log('Menu seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu items:', error);
    process.exit(1);
  }
}

seedMenuItems();
