// 📁 backend/scripts/seedRestaurantData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import { connectDB } from "../config/database.js";

// Load environment variables
dotenv.config({ path: "../.env" });

const categories = [
  {
    name: "Appetizers",
    description: "Delicious starters to begin your culinary journey",
    displayOrder: 1,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=500",
      publicId: "appetizers_category"
    }
  },
  {
    name: "Mains",
    description: "Our signature main courses featuring authentic Sri Lankan flavors",
    displayOrder: 2,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
      publicId: "mains_category"
    }
  },
  {
    name: "Seafood",
    description: "Fresh catch from the Indian Ocean, prepared to perfection",
    displayOrder: 3,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1559737558-2f5a35f0bdaa?w=500",
      publicId: "seafood_category"
    }
  },
  {
    name: "Rice & Biriyani",
    description: "Aromatic rice dishes and traditional biriyani varieties",
    displayOrder: 4,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=500",
      publicId: "rice_category"
    }
  },
  {
    name: "Vegetarian",
    description: "Plant-based delights bursting with flavor",
    displayOrder: 5,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
      publicId: "vegetarian_category"
    }
  },
  {
    name: "Desserts",
    description: "Sweet endings to your perfect meal",
    displayOrder: 6,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1488474339733-16c6e6ef2055?w=500",
      publicId: "desserts_category"
    }
  },
  {
    name: "Drinks",
    description: "Refreshing beverages and traditional drinks",
    displayOrder: 7,
    isActive: true,
    image: {
      url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500",
      publicId: "drinks_category"
    }
  }
];

const menuItems = [
  // Appetizers
  {
    name: "Negombo Crab Cakes",
    description: "Pan-fried crab cakes made with fresh Negombo crab meat, coconut, and Sri Lankan spices. Served with mango chutney.",
    basePrice: 1850,
    cuisineType: "Sri Lankan",
    foodType: "seafood",
    spiceLevel: "Medium",
    servingSize: "Individual",
    ingredients: ["Fresh crab meat", "Coconut", "Curry leaves", "Ginger", "Lime", "Mango chutney"],
    dietaryTags: ["gluten-free"],
    allergens: ["shellfish"],
    preparationTime: 15,
    isSignatureDish: true,
    images: [{
      url: "https://images.unsplash.com/photo-1559737558-2f5a35f0bdaa?w=500",
      isPrimary: true,
      alt: "Negombo Crab Cakes"
    }],
    nutritionalInfo: {
      calories: 285,
      protein: 22,
      carbs: 12,
      fat: 18
    },
    inventory: {
      stockLevel: 25,
      lowStockThreshold: 5
    }
  },
  {
    name: "Kottu Roti Spring Rolls",
    description: "Crispy spring rolls filled with kottu roti, vegetables, and spices. A modern twist on the classic street food.",
    basePrice: 1250,
    cuisineType: "Fusion",
    foodType: "veg",
    spiceLevel: "Mild",
    servingSize: "Individual",
    ingredients: ["Roti", "Cabbage", "Carrots", "Leeks", "Egg", "Curry powder"],
    dietaryTags: ["vegetarian"],
    preparationTime: 12,
    isNewItem: true,
    images: [{
      url: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=500",
      isPrimary: true,
      alt: "Kottu Roti Spring Rolls"
    }],
    inventory: {
      stockLevel: 30,
      lowStockThreshold: 8
    }
  },

  // Mains
  {
    name: "Black Pork Curry",
    description: "Traditional Sri Lankan black pork curry slow-cooked with roasted spices and coconut milk. Served with red rice.",
    basePrice: 2850,
    cuisineType: "Sri Lankan",
    foodType: "non-veg",
    spiceLevel: "Hot",
    servingSize: "Individual",
    ingredients: ["Pork belly", "Coconut milk", "Roasted curry powder", "Pandan leaves", "Curry leaves"],
    preparationTime: 45,
    isSignatureDish: true,
    isPopular: true,
    images: [{
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
      isPrimary: true,
      alt: "Black Pork Curry"
    }],
    nutritionalInfo: {
      calories: 520,
      protein: 32,
      carbs: 15,
      fat: 38
    },
    inventory: {
      stockLevel: 20,
      lowStockThreshold: 5
    }
  },
  {
    name: "Jaffna Goat Curry",
    description: "Spicy goat curry from the northern province, cooked with aromatic spices and fresh herbs.",
    basePrice: 3200,
    cuisineType: "Sri Lankan",
    foodType: "non-veg",
    spiceLevel: "Extra Hot",
    servingSize: "Individual",
    ingredients: ["Goat meat", "Fennel", "Cumin", "Coriander", "Curry leaves", "Coconut oil"],
    dietaryTags: ["halal"],
    preparationTime: 60,
    isChefSpecial: true,
    images: [{
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
      isPrimary: true,
      alt: "Jaffna Goat Curry"
    }],
    inventory: {
      stockLevel: 15,
      lowStockThreshold: 3
    }
  },

  // Seafood
  {
    name: "Negombo Crab Curry",
    description: "Fresh mud crabs from Negombo lagoon, cooked in rich coconut milk curry with Sri Lankan spices.",
    basePrice: 4500,
    cuisineType: "Sri Lankan",
    foodType: "seafood",
    spiceLevel: "Medium",
    servingSize: "Individual",
    ingredients: ["Mud crabs", "Coconut milk", "Curry leaves", "Lemongrass", "Tamarind"],
    allergens: ["shellfish"],
    preparationTime: 30,
    isSignatureDish: true,
    images: [{
      url: "https://images.unsplash.com/photo-1559737558-2f5a35f0bdaa?w=500",
      isPrimary: true,
      alt: "Negombo Crab Curry"
    }],
    nutritionalInfo: {
      calories: 380,
      protein: 28,
      carbs: 8,
      fat: 26
    },
    inventory: {
      stockLevel: 12,
      lowStockThreshold: 3
    }
  },
  {
    name: "Grilled Fish Ambul Thiyal",
    description: "Grilled fish marinated in goraka (garcinia) and spices, a traditional sour fish curry.",
    basePrice: 2650,
    cuisineType: "Sri Lankan",
    foodType: "seafood",
    spiceLevel: "Medium",
    servingSize: "Individual",
    ingredients: ["Fresh fish", "Goraka", "Curry powder", "Turmeric", "Onions"],
    allergens: ["fish"],
    preparationTime: 25,
    images: [{
      url: "https://images.unsplash.com/photo-1559737558-2f5a35f0bdaa?w=500",
      isPrimary: true,
      alt: "Grilled Fish Ambul Thiyal"
    }],
    inventory: {
      stockLevel: 18,
      lowStockThreshold: 5
    }
  },

  // Rice & Biriyani
  {
    name: "Lampries",
    description: "Traditional Dutch Burgher dish - rice and curry wrapped in banana leaf and baked.",
    basePrice: 2200,
    cuisineType: "Sri Lankan",
    foodType: "non-veg",
    spiceLevel: "Medium",
    servingSize: "Individual",
    ingredients: ["Basmati rice", "Chicken curry", "Pork", "Prawn blachan", "Seeni sambol"],
    preparationTime: 40,
    isSignatureDish: true,
    images: [{
      url: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=500",
      isPrimary: true,
      alt: "Lampries"
    }],
    inventory: {
      stockLevel: 22,
      lowStockThreshold: 6
    }
  },
  {
    name: "Seafood Biriyani",
    description: "Aromatic basmati rice layered with fresh seafood, saffron, and traditional biriyani spices.",
    basePrice: 3850,
    cuisineType: "Indian",
    foodType: "seafood",
    spiceLevel: "Medium",
    servingSize: "Individual",
    ingredients: ["Basmati rice", "Mixed seafood", "Saffron", "Biriyani masala", "Fried onions"],
    allergens: ["shellfish", "fish"],
    preparationTime: 35,
    isPopular: true,
    images: [{
      url: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=500",
      isPrimary: true,
      alt: "Seafood Biriyani"
    }],
    inventory: {
      stockLevel: 20,
      lowStockThreshold: 5
    }
  },

  // Vegetarian
  {
    name: "Jackfruit Curry",
    description: "Young jackfruit cooked in rich coconut milk curry with traditional Sri Lankan spices.",
    basePrice: 1850,
    cuisineType: "Sri Lankan",
    foodType: "vegan",
    spiceLevel: "Medium",
    servingSize: "Individual",
    ingredients: ["Young jackfruit", "Coconut milk", "Curry leaves", "Turmeric", "Chili powder"],
    dietaryTags: ["vegan", "gluten-free"],
    preparationTime: 30,
    images: [{
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
      isPrimary: true,
      alt: "Jackfruit Curry"
    }],
    inventory: {
      stockLevel: 25,
      lowStockThreshold: 8
    }
  },
  {
    name: "Dhal Curry with Tempered Spices",
    description: "Red lentil curry tempered with mustard seeds, curry leaves, and dried chilies.",
    basePrice: 1250,
    cuisineType: "Sri Lankan",
    foodType: "vegan",
    spiceLevel: "Mild",
    servingSize: "Individual",
    ingredients: ["Red lentils", "Turmeric", "Curry leaves", "Mustard seeds", "Coconut oil"],
    dietaryTags: ["vegan", "gluten-free", "protein-rich"],
    preparationTime: 20,
    images: [{
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
      isPrimary: true,
      alt: "Dhal Curry"
    }],
    inventory: {
      stockLevel: 35,
      lowStockThreshold: 10
    }
  },

  // Desserts
  {
    name: "Watalappan",
    description: "Traditional Sri Lankan steamed custard dessert made with coconut milk, jaggery, and spices.",
    basePrice: 850,
    cuisineType: "Sri Lankan",
    foodType: "veg",
    spiceLevel: "None",
    servingSize: "Individual",
    ingredients: ["Coconut milk", "Jaggery", "Eggs", "Cardamom", "Nutmeg"],
    dietaryTags: ["vegetarian", "gluten-free"],
    allergens: ["eggs", "dairy"],
    preparationTime: 45,
    isSignatureDish: true,
    images: [{
      url: "https://images.unsplash.com/photo-1488474339733-16c6e6ef2055?w=500",
      isPrimary: true,
      alt: "Watalappan"
    }],
    inventory: {
      stockLevel: 20,
      lowStockThreshold: 5
    }
  },
  {
    name: "Coconut Roti with Treacle",
    description: "Fresh coconut roti served warm with palm treacle and grated coconut.",
    basePrice: 650,
    cuisineType: "Sri Lankan",
    foodType: "veg",
    spiceLevel: "None",
    servingSize: "Individual",
    ingredients: ["Flour", "Fresh coconut", "Palm treacle", "Salt"],
    dietaryTags: ["vegetarian"],
    preparationTime: 15,
    images: [{
      url: "https://images.unsplash.com/photo-1488474339733-16c6e6ef2055?w=500",
      isPrimary: true,
      alt: "Coconut Roti with Treacle"
    }],
    inventory: {
      stockLevel: 30,
      lowStockThreshold: 8
    }
  },

  // Drinks
  {
    name: "King Coconut Water",
    description: "Fresh king coconut water served straight from the shell, naturally refreshing.",
    basePrice: 450,
    cuisineType: "Sri Lankan",
    foodType: "vegan",
    spiceLevel: "None",
    servingSize: "Individual",
    ingredients: ["Fresh king coconut"],
    dietaryTags: ["vegan", "gluten-free", "natural"],
    preparationTime: 5,
    images: [{
      url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500",
      isPrimary: true,
      alt: "King Coconut Water"
    }],
    inventory: {
      stockLevel: 40,
      lowStockThreshold: 15
    }
  },
  {
    name: "Ceylon Tea",
    description: "Premium Ceylon black tea served with optional milk and sugar. From the highlands of Sri Lanka.",
    basePrice: 350,
    cuisineType: "Sri Lankan",
    foodType: "vegan",
    spiceLevel: "None",
    servingSize: "Individual",
    ingredients: ["Ceylon tea leaves", "Hot water"],
    dietaryTags: ["vegan", "gluten-free"],
    preparationTime: 5,
    images: [{
      url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500",
      isPrimary: true,
      alt: "Ceylon Tea"
    }],
    inventory: {
      stockLevel: 50,
      lowStockThreshold: 20
    }
  }
];

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    
    await connectDB();
    
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    
    // Insert categories
    console.log("📂 Creating categories...");
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    // Create a map of category names to IDs
    const categoryMap = {};
    createdCategories.forEach(category => {
      categoryMap[category.name] = category._id;
    });
    
    // Assign category IDs to menu items
    const menuItemsWithCategories = menuItems.map(item => {
      let categoryName;
      
      // Determine category based on item characteristics
      if (item.name.includes("Spring Rolls") || item.name.includes("Crab Cakes")) {
        categoryName = "Appetizers";
      } else if (item.name.includes("Curry") && (item.foodType === "non-veg" && !item.name.includes("Crab") && !item.name.includes("Fish"))) {
        categoryName = "Mains";
      } else if (item.foodType === "seafood") {
        categoryName = "Seafood";
      } else if (item.name.includes("Biriyani") || item.name.includes("Lampries")) {
        categoryName = "Rice & Biriyani";
      } else if (item.foodType === "vegan" || (item.foodType === "veg" && item.name.includes("Curry"))) {
        categoryName = "Vegetarian";
      } else if (item.name.includes("Watalappan") || item.name.includes("Roti with Treacle")) {
        categoryName = "Desserts";
      } else if (item.name.includes("Water") || item.name.includes("Tea")) {
        categoryName = "Drinks";
      } else {
        categoryName = "Mains"; // default
      }
      
      return {
        ...item,
        category: categoryMap[categoryName]
      };
    });
    
    // Insert menu items
    console.log("🍽️  Creating menu items...");
    const createdItems = await MenuItem.insertMany(menuItemsWithCategories);
    console.log(`✅ Created ${createdItems.length} menu items`);
    
    console.log("🎉 Database seeding completed successfully!");
    console.log(`
📊 Summary:
- Categories: ${createdCategories.length}
- Menu Items: ${createdItems.length}
- Cuisines: Sri Lankan, Indian, Chinese, Continental, Fusion
- Food Types: Vegetarian, Non-Vegetarian, Seafood, Vegan
- Spice Levels: None, Mild, Medium, Hot, Extra Hot
    `);
    
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();