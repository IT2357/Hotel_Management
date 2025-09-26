// 📁 backend/scripts/seed-valdor.js
import mongoose from 'mongoose';
import Food from '../models/Food.js';
import 'dotenv/config';

// Comprehensive Valdor menu data based on their website
const valdorMenuData = [
  // Breakfast Items
  {
    name: "String Hoppers with Curry",
    category: "Breakfast",
    description: "Traditional Sri Lankan string hoppers served with spicy curry and coconut sambol. A perfect start to your day.",
    imageUrl: "https://valdor.foodorders.lk/images/food/string-hoppers.jpg",
    price: 450,
    preparationTimeMinutes: 25,
    ingredients: ["Rice Flour", "Coconut", "Curry Leaves", "Spices", "Onions"],
    allergens: [],
    dietaryTags: ["Vegetarian", "Gluten-Free"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Egg Hoppers",
    category: "Breakfast",
    description: "Crispy bowl-shaped pancakes with a perfectly cooked egg in the center, served with spicy sambol.",
    imageUrl: "https://valdor.foodorders.lk/images/food/egg-hoppers.jpg",
    price: 380,
    preparationTimeMinutes: 20,
    ingredients: ["Rice Flour", "Coconut Milk", "Egg", "Spices"],
    allergens: ["Egg"],
    dietaryTags: ["Non-Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },

  // Lunch Items
  {
    name: "Chicken Lamprais",
    category: "Lunch",
    description: "Chicken lamprais with rice, egg and accompaniments. Available Time: 05:00 pm - 10:00 pm",
    imageUrl: "https://valdor.foodorders.lk/images/food/phpf3MSqd.jpg",
    price: 950,
    preparationTimeMinutes: 40,
    ingredients: ["Rice", "Chicken", "Egg", "Sambol", "Spices", "Banana Leaf"],
    allergens: ["Egg"],
    dietaryTags: ["Non-Vegetarian", "Spicy"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Fish Curry with Rice",
    category: "Lunch",
    description: "Fresh fish cooked in aromatic Sri Lankan spices with coconut milk, served with steamed rice.",
    imageUrl: "https://valdor.foodorders.lk/images/food/fish-curry.jpg",
    price: 850,
    preparationTimeMinutes: 35,
    ingredients: ["Fish", "Coconut Milk", "Curry Leaves", "Spices", "Rice"],
    allergens: ["Fish"],
    dietaryTags: ["Non-Vegetarian", "Spicy"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Vegetable Rice and Curry",
    category: "Lunch",
    description: "Traditional Sri Lankan rice and curry with mixed vegetables, dhal, and coconut sambol.",
    imageUrl: "https://valdor.foodorders.lk/images/food/veg-rice-curry.jpg",
    price: 650,
    preparationTimeMinutes: 30,
    ingredients: ["Rice", "Mixed Vegetables", "Lentils", "Coconut", "Spices"],
    allergens: [],
    dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },

  // Dinner Items
  {
    name: "Kizhi Parotta Chicken",
    category: "Dinner",
    description: "Kizhi parotta with chicken masala. Flaky layered bread served with spicy chicken curry.",
    imageUrl: "https://valdor.foodorders.lk/images/food/kizhi-parotta.jpg",
    price: 850,
    preparationTimeMinutes: 35,
    ingredients: ["Parotta", "Chicken", "Spices", "Onions", "Tomatoes"],
    allergens: ["Gluten"],
    dietaryTags: ["Spicy", "Non-Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Kottu Roti",
    category: "Dinner",
    description: "Chopped roti stir-fried with vegetables, egg, and your choice of meat. A Sri Lankan street food favorite.",
    imageUrl: "https://valdor.foodorders.lk/images/food/kottu-roti.jpg",
    price: 750,
    preparationTimeMinutes: 25,
    ingredients: ["Roti", "Vegetables", "Egg", "Spices", "Meat"],
    allergens: ["Gluten", "Egg"],
    dietaryTags: ["Non-Vegetarian", "Spicy"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Fried Rice",
    category: "Dinner",
    description: "Aromatic fried rice with vegetables and your choice of protein, cooked in traditional Sri Lankan style.",
    imageUrl: "https://valdor.foodorders.lk/images/food/fried-rice.jpg",
    price: 680,
    preparationTimeMinutes: 20,
    ingredients: ["Rice", "Vegetables", "Soy Sauce", "Spices", "Protein"],
    allergens: [],
    dietaryTags: ["Non-Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },

  // Snacks
  {
    name: "Shawarma Regular",
    category: "Snacks",
    description: "Regular chicken shawarma wrap with garlic sauce, vegetables, and pickles.",
    imageUrl: "https://valdor.foodorders.lk/images/food/shawarma.jpg",
    price: 950,
    preparationTimeMinutes: 20,
    ingredients: ["Flatbread", "Chicken", "Garlic Sauce", "Vegetables", "Pickles"],
    allergens: ["Gluten"],
    dietaryTags: ["Non-Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Chicken Rolls",
    category: "Snacks",
    description: "Crispy chicken rolls filled with spiced chicken and vegetables, perfect for a quick snack.",
    imageUrl: "https://valdor.foodorders.lk/images/food/chicken-rolls.jpg",
    price: 450,
    preparationTimeMinutes: 15,
    ingredients: ["Pastry", "Chicken", "Vegetables", "Spices"],
    allergens: ["Gluten", "Egg"],
    dietaryTags: ["Non-Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Fish Cutlets",
    category: "Snacks",
    description: "Deep-fried fish cutlets with a crispy coating and tender fish filling, served with chili sauce.",
    imageUrl: "https://valdor.foodorders.lk/images/food/fish-cutlets.jpg",
    price: 380,
    preparationTimeMinutes: 18,
    ingredients: ["Fish", "Breadcrumbs", "Spices", "Onions"],
    allergens: ["Fish", "Gluten"],
    dietaryTags: ["Non-Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Vegetable Samosas",
    category: "Snacks",
    description: "Crispy triangular pastries filled with spiced vegetables, served with mint chutney.",
    imageUrl: "https://valdor.foodorders.lk/images/food/samosas.jpg",
    price: 320,
    preparationTimeMinutes: 12,
    ingredients: ["Pastry", "Potatoes", "Peas", "Spices", "Onions"],
    allergens: ["Gluten"],
    dietaryTags: ["Vegetarian", "Vegan"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },

  // Beverages
  {
    name: "Fresh Lime Juice",
    category: "Beverage",
    description: "Freshly squeezed lime juice with a hint of mint and sugar, perfect for hot weather.",
    imageUrl: "https://valdor.foodorders.lk/images/food/lime-juice.jpg",
    price: 280,
    preparationTimeMinutes: 5,
    ingredients: ["Fresh Lime", "Sugar", "Mint", "Water", "Ice"],
    allergens: [],
    dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "King Coconut Water",
    category: "Beverage",
    description: "Fresh king coconut water straight from the coconut, naturally refreshing and healthy.",
    imageUrl: "https://valdor.foodorders.lk/images/food/king-coconut.jpg",
    price: 350,
    preparationTimeMinutes: 3,
    ingredients: ["King Coconut Water"],
    allergens: [],
    dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free", "Natural"],
    seasonal: true,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Ceylon Tea",
    category: "Beverage",
    description: "Premium Ceylon black tea served hot with milk and sugar on the side.",
    imageUrl: "https://valdor.foodorders.lk/images/food/ceylon-tea.jpg",
    price: 180,
    preparationTimeMinutes: 5,
    ingredients: ["Ceylon Tea Leaves", "Water", "Milk", "Sugar"],
    allergens: ["Dairy"],
    dietaryTags: ["Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Fresh Fruit Juice",
    category: "Beverage",
    description: "Seasonal fresh fruit juice made from locally sourced fruits. Flavors vary by season.",
    imageUrl: "https://valdor.foodorders.lk/images/food/fruit-juice.jpg",
    price: 420,
    preparationTimeMinutes: 8,
    ingredients: ["Seasonal Fruits", "Sugar", "Water", "Ice"],
    allergens: [],
    dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"],
    seasonal: true,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },

  // Desserts
  {
    name: "Watalappan",
    category: "Dessert",
    description: "Traditional Sri Lankan steamed custard made with coconut milk, jaggery, and spices.",
    imageUrl: "https://valdor.foodorders.lk/images/food/watalappan.jpg",
    price: 380,
    preparationTimeMinutes: 15,
    ingredients: ["Coconut Milk", "Jaggery", "Eggs", "Cardamom", "Nutmeg"],
    allergens: ["Egg", "Dairy"],
    dietaryTags: ["Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Coconut Ice Cream",
    category: "Dessert",
    description: "Homemade coconut ice cream with fresh coconut flakes and a hint of vanilla.",
    imageUrl: "https://valdor.foodorders.lk/images/food/coconut-ice-cream.jpg",
    price: 450,
    preparationTimeMinutes: 5,
    ingredients: ["Coconut Milk", "Sugar", "Vanilla", "Fresh Coconut"],
    allergens: ["Dairy"],
    dietaryTags: ["Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Kiri Pani",
    category: "Dessert",
    description: "Traditional Sri Lankan milk toffee made with condensed milk and cashews.",
    imageUrl: "https://valdor.foodorders.lk/images/food/kiri-pani.jpg",
    price: 320,
    preparationTimeMinutes: 10,
    ingredients: ["Condensed Milk", "Sugar", "Cashews", "Cardamom"],
    allergens: ["Dairy", "Nuts"],
    dietaryTags: ["Vegetarian"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },

  // Additional Popular Items
  {
    name: "Chicken Biryani",
    category: "Lunch",
    description: "Aromatic basmati rice cooked with tender chicken pieces, saffron, and traditional spices.",
    imageUrl: "https://valdor.foodorders.lk/images/food/chicken-biryani.jpg",
    price: 1200,
    preparationTimeMinutes: 45,
    ingredients: ["Basmati Rice", "Chicken", "Saffron", "Spices", "Fried Onions", "Yogurt"],
    allergens: ["Dairy"],
    dietaryTags: ["Non-Vegetarian", "Spicy"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Prawn Curry",
    category: "Lunch",
    description: "Fresh prawns cooked in rich coconut curry with Sri Lankan spices and curry leaves.",
    imageUrl: "https://valdor.foodorders.lk/images/food/prawn-curry.jpg",
    price: 1150,
    preparationTimeMinutes: 30,
    ingredients: ["Prawns", "Coconut Milk", "Curry Leaves", "Spices", "Onions"],
    allergens: ["Shellfish"],
    dietaryTags: ["Non-Vegetarian", "Spicy"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  },
  {
    name: "Devilled Chicken",
    category: "Dinner",
    description: "Spicy stir-fried chicken with bell peppers, onions, and special devilled sauce.",
    imageUrl: "https://valdor.foodorders.lk/images/food/devilled-chicken.jpg",
    price: 980,
    preparationTimeMinutes: 25,
    ingredients: ["Chicken", "Bell Peppers", "Onions", "Soy Sauce", "Chili Sauce", "Spices"],
    allergens: [],
    dietaryTags: ["Non-Vegetarian", "Spicy"],
    seasonal: false,
    isAvailable: true,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  }
];

/**
 * Seed Valdor menu data to MongoDB
 */
async function seedValdorMenu() {
  try {
    console.log('🌱 Starting Valdor menu seeding...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing Valdor data (optional)
    const existingCount = await Food.countDocuments();
    console.log(`📊 Found ${existingCount} existing food items`);

    // Ask user if they want to clear existing data
    if (existingCount > 0) {
      console.log('⚠️  Existing food items found. This will add new items without removing existing ones.');
    }

    // Insert Valdor menu items
    const insertedItems = [];
    let skippedItems = 0;

    for (const itemData of valdorMenuData) {
      try {
        // Check if item already exists (by name and price)
        const existingItem = await Food.findOne({
          name: { $regex: new RegExp(itemData.name, 'i') },
          price: itemData.price
        });

        if (existingItem) {
          console.log(`⏭️  Skipping existing item: ${itemData.name}`);
          skippedItems++;
          continue;
        }

        // Create new food item
        const foodItem = new Food(itemData);
        await foodItem.save();
        insertedItems.push(foodItem);
        console.log(`✅ Added: ${itemData.name} (${itemData.category}) - LKR ${itemData.price}`);

      } catch (itemError) {
        console.error(`❌ Error adding ${itemData.name}:`, itemError.message);
      }
    }

    // Generate statistics
    const stats = await Food.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('\n🎉 Valdor menu seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`Total items processed: ${valdorMenuData.length}`);
    console.log(`New items added: ${insertedItems.length}`);
    console.log(`Existing items skipped: ${skippedItems}`);
    console.log(`Total items in database: ${await Food.countDocuments()}`);

    console.log('\n📈 Category Statistics:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} items (LKR ${stat.minPrice}-${stat.maxPrice}, avg: ${Math.round(stat.avgPrice)})`);
    });

    console.log('\n🍽️  Sample Items Added:');
    insertedItems.slice(0, 5).forEach(item => {
      console.log(`- ${item.name} (${item.category}) - LKR ${item.price}`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding Valdor menu:', error);
    process.exit(1);
  }
}

/**
 * Clear all food items (use with caution)
 */
async function clearFoodItems() {
  try {
    console.log('🧹 Clearing all food items...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';
    await mongoose.connect(mongoUri);
    
    const result = await Food.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} food items`);
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error clearing food items:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'clear') {
    clearFoodItems();
  } else {
    seedValdorMenu();
  }
}

export { seedValdorMenu, clearFoodItems, valdorMenuData };
