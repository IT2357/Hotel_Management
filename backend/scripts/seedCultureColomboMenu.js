// 📁 backend/scripts/seedCultureColomboMenu.js
import mongoose from "mongoose";
import "dotenv/config";
import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

const cultureColomboData = {
  categories: [
    {
      name: "Bamboo Biriyani",
      description: "Authentic Sri Lankan biriyani cooked in bamboo",
      displayOrder: 1
    },
    {
      name: "Dry Curry Bowls",
      description: "Traditional Sri Lankan dry curries served with rice",
      displayOrder: 2
    },
    {
      name: "Kottu",
      description: "Popular Sri Lankan street food with chopped roti",
      displayOrder: 3
    },
    {
      name: "Seafood Specialties",
      description: "Fresh seafood dishes with authentic spices",
      displayOrder: 4
    },
    {
      name: "Rice & Curry",
      description: "Traditional rice and curry combinations",
      displayOrder: 5
    },
    {
      name: "Hoppers & String Hoppers",
      description: "Traditional Sri Lankan pancakes and noodles",
      displayOrder: 6
    },
    {
      name: "Fresh Juices & Beverages",
      description: "Refreshing drinks and traditional beverages",
      displayOrder: 7
    },
    {
      name: "Desserts",
      description: "Traditional Sri Lankan sweets and desserts",
      displayOrder: 8
    }
  ],

  menuItems: [
    // Bamboo Biriyani
    {
      name: "Chicken Bamboo Biriyani",
      description: "Aromatic basmati rice cooked with tender chicken pieces in traditional spices, slow-cooked in bamboo for authentic flavor",
      category: "Bamboo Biriyani",
      type: "Non-Veg",
      spiceLevel: "Medium",
      basePrice: 1800,
      dietaryTags: ["Halal"],
      ingredients: ["Basmati rice", "Chicken", "Saffron", "Cardamom", "Cinnamon", "Bay leaves"],
      preparationTime: 45,
      images: [{ url: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=500", alt: "Chicken Bamboo Biriyani", isPrimary: true }]
    },
    {
      name: "Mutton Bamboo Biriyani",
      description: "Premium mutton pieces layered with fragrant basmati rice and cooked in bamboo for exceptional taste",
      category: "Bamboo Biriyani",
      type: "Non-Veg",
      spiceLevel: "Medium",
      basePrice: 2200,
      dietaryTags: ["Halal"],
      ingredients: ["Basmati rice", "Mutton", "Saffron", "Cardamom", "Cinnamon", "Mint"],
      preparationTime: 50,
      images: [{ url: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=500", alt: "Mutton Bamboo Biriyani", isPrimary: true }]
    },

    // Dry Curry Bowls
    {
      name: "Mixed Seafood Dry Curry Bowl",
      description: "Assorted fresh seafood including prawns, fish, and squid cooked in traditional dry curry spices, served with steamed rice",
      category: "Dry Curry Bowls",
      type: "Seafood",
      spiceLevel: "Hot",
      dietaryTags: ["Halal"],
      portions: [
        { name: "Half", price: 1200, isDefault: false },
        { name: "Full", price: 2000, isDefault: true }
      ],
      ingredients: ["Fish", "Prawns", "Squid", "Curry leaves", "Coconut", "Chili", "Turmeric"],
      preparationTime: 25,
      images: [{ url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500", alt: "Mixed Seafood Dry Curry Bowl", isPrimary: true }]
    },
    {
      name: "Chicken Dry Curry Bowl",
      description: "Tender chicken pieces cooked in aromatic dry curry spices with coconut, served with jasmine rice",
      category: "Dry Curry Bowls",
      type: "Non-Veg",
      spiceLevel: "Medium",
      dietaryTags: ["Halal"],
      portions: [
        { name: "Half", price: 900, isDefault: false },
        { name: "Full", price: 1500, isDefault: true }
      ],
      ingredients: ["Chicken", "Coconut", "Curry leaves", "Onions", "Garlic", "Ginger"],
      preparationTime: 20,
      images: [{ url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500", alt: "Chicken Dry Curry Bowl", isPrimary: true }]
    },

    // Kottu
    {
      name: "Chicken Kottu",
      description: "Chopped roti stir-fried with chicken, vegetables, egg, and spices - a Sri Lankan street food favorite",
      category: "Kottu",
      type: "Non-Veg",
      spiceLevel: "Medium",
      basePrice: 800,
      dietaryTags: ["Halal"],
      ingredients: ["Roti", "Chicken", "Cabbage", "Carrots", "Onions", "Egg", "Curry powder"],
      preparationTime: 15,
      images: [{ url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500", alt: "Chicken Kottu", isPrimary: true }]
    },
    {
      name: "Seafood Kottu",
      description: "Mixed seafood kottu with prawns and fish, stir-fried with roti and aromatic spices",
      category: "Kottu",
      type: "Seafood",
      spiceLevel: "Hot",
      basePrice: 1200,
      dietaryTags: ["Halal"],
      ingredients: ["Roti", "Prawns", "Fish", "Vegetables", "Egg", "Chili flakes"],
      preparationTime: 18,
      images: [{ url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500", alt: "Seafood Kottu", isPrimary: true }]
    },

    // Seafood Specialties
    {
      name: "Negombo Crab Curry",
      description: "Fresh mud crab cooked in rich coconut milk curry with traditional Sri Lankan spices",
      category: "Seafood Specialties",
      type: "Seafood",
      spiceLevel: "Medium",
      basePrice: 2500,
      dietaryTags: ["Halal"],
      ingredients: ["Fresh crab", "Coconut milk", "Curry leaves", "Lemongrass", "Tamarind"],
      preparationTime: 30,
      images: [{ url: "https://images.unsplash.com/photo-1559847844-d721426d6edc?w=500", alt: "Negombo Crab Curry", isPrimary: true }]
    },
    {
      name: "Prawn Curry",
      description: "Jumbo prawns in creamy coconut curry with curry leaves and aromatic spices",
      category: "Seafood Specialties",
      type: "Seafood",
      spiceLevel: "Medium",
      basePrice: 1800,
      dietaryTags: ["Halal"],
      ingredients: ["Jumbo prawns", "Coconut milk", "Curry leaves", "Onions", "Tomatoes"],
      preparationTime: 20,
      images: [{ url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500", alt: "Prawn Curry", isPrimary: true }]
    },

    // Hoppers
    {
      name: "Egg Hopper",
      description: "Traditional Sri Lankan pancake with crispy edges and soft center, topped with an egg",
      category: "Hoppers & String Hoppers",
      type: "Veg",
      spiceLevel: "Mild",
      basePrice: 150,
      ingredients: ["Rice flour", "Coconut milk", "Egg", "Palm toddy"],
      preparationTime: 10,
      images: [{ url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500", alt: "Egg Hopper", isPrimary: true }]
    },
    {
      name: "String Hoppers with Curry",
      description: "Steamed rice noodle nests served with chicken curry and coconut sambol",
      category: "Hoppers & String Hoppers",
      type: "Non-Veg",
      spiceLevel: "Medium",
      basePrice: 600,
      dietaryTags: ["Halal"],
      ingredients: ["Rice flour", "Chicken curry", "Coconut sambol", "Dhal curry"],
      preparationTime: 15,
      images: [{ url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500", alt: "String Hoppers", isPrimary: true }]
    },

    // Beverages
    {
      name: "Fresh King Coconut Water",
      description: "Refreshing natural coconut water served fresh from young king coconuts",
      category: "Fresh Juices & Beverages",
      type: "Veg",
      spiceLevel: "Mild",
      basePrice: 200,
      dietaryTags: ["Vegan", "Gluten-Free"],
      ingredients: ["Fresh king coconut"],
      preparationTime: 2,
      images: [{ url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500", alt: "King Coconut Water", isPrimary: true }]
    },
    {
      name: "Mango Lassi",
      description: "Creamy yogurt drink blended with fresh mango and a touch of cardamom",
      category: "Fresh Juices & Beverages",
      type: "Veg",
      spiceLevel: "Mild",
      basePrice: 300,
      ingredients: ["Fresh mango", "Yogurt", "Cardamom", "Sugar"],
      preparationTime: 5,
      images: [{ url: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=500", alt: "Mango Lassi", isPrimary: true }]
    },

    // Desserts
    {
      name: "Watalappan",
      description: "Traditional Sri Lankan steamed custard made with coconut milk, jaggery, and spices",
      category: "Desserts",
      type: "Veg",
      spiceLevel: "Mild",
      basePrice: 400,
      ingredients: ["Coconut milk", "Jaggery", "Eggs", "Cardamom", "Nutmeg"],
      preparationTime: 45,
      images: [{ url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500", alt: "Watalappan", isPrimary: true }]
    }
  ]
};

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting Culture Colombo menu seeding...");

    // Clear existing data
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    console.log("🧹 Cleared existing menu data");

    // Create categories
    const createdCategories = [];
    for (const categoryData of cultureColomboData.categories) {
      const category = await Category.create(categoryData);
      createdCategories.push(category);
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create menu items
    let createdItemsCount = 0;
    for (const itemData of cultureColomboData.menuItems) {
      // Find the category by name
      const category = createdCategories.find(cat => cat.name === itemData.category);
      if (!category) {
        console.error(`❌ Category not found: ${itemData.category}`);
        continue;
      }

      // Replace category name with category ID
      const menuItemData = {
        ...itemData,
        category: category._id
      };

      const menuItem = await MenuItem.create(menuItemData);
      createdItemsCount++;
      console.log(`✅ Created menu item: ${menuItem.name}`);
    }

    console.log("\n🎉 Culture Colombo menu seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Menu Items: ${createdItemsCount}`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run seeding
const runSeeding = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

runSeeding();
