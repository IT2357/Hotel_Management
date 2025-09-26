import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Food model schema
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  dietType: { type: String, enum: ['veg', 'non-veg'], required: true },
  isHalal: { type: Boolean, default: true },
  images: [{ type: String }],
  isSpicy: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Food = mongoose.models.Food || mongoose.model('Food', foodSchema);

// Comprehensive food data
const foodSeedData = [
  // Soup Section
  {
    name: "Vegetable Soup",
    category: "Soup",
    description: "Farm Fresh Vegetable soup with a pinch of salt for your liking.",
    price: 850,
    dietType: "veg",
    isHalal: true,
    images: ["/images/soup/vegetable-soup.jpg"],
    isSpicy: false
  },
  {
    name: "Sweet Corn Chicken Soup",
    category: "Soup",
    description: "Sweet corn kernels in a flavourful chicken soup with egg drop.",
    price: 1050,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/soup/chicken-soup.jpg"],
    isSpicy: false
  },
  {
    name: "Roasted Fish Soup",
    category: "Soup",
    description: "Roasted fish soup along with roasted cumin seeds and red onions.",
    price: 1050,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/soup/fish-soup.jpg"],
    isSpicy: true
  },
  {
    name: "Mullaguthanni Soup",
    category: "Soup",
    description: "Coconut milk based soup made with a combination of accompaniments to create an authentic Sri Lankan curry flavor.",
    price: 850,
    dietType: "veg",
    isHalal: true,
    images: ["/images/soup/mullaguthanni.jpg"],
    isSpicy: true
  },

  // Fish Section
  {
    name: "Maalu Mirisata",
    category: "Fish",
    subcategory: "Serves 1-2pax",
    description: "Spicy Fish curry cooked with Fresh Spices from the Heart of Ceylon.",
    price: 1995,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/fish/mirisa-fish.jpg"],
    isSpicy: true
  },
  {
    name: "Maalu Ambulthiyal",
    category: "Fish",
    subcategory: "Serves 1-2pax",
    description: "A Unique Sri Lankan fish recipe marinated in tangy and peppery sauce.",
    price: 1995,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/fish/ambulthiyal.jpg"],
    isSpicy: true
  },
  {
    name: "Maalu Suduwata",
    category: "Fish",
    subcategory: "Serves 1-2pax",
    description: "It's our lighter version of the Miris Maalu. Cooked with Coconut milk, Turmeric and Mustard cream.",
    price: 2250,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/fish/suduwata.jpg"],
    isSpicy: false
  },

  // Chicken Section
  {
    name: "Kukulmas Yapanaya Kramayata (Jaffna Style)",
    category: "Chicken",
    subcategory: "Serves 1-2pax",
    description: "Chicken marinated and slow cooked using a recipe unique to the Northern province of Sri Lanka.",
    price: 1650,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/chicken/jaffna-chicken.jpg"],
    isSpicy: true
  },
  {
    name: "Kukulmas Themparadu",
    category: "Chicken",
    subcategory: "Serves 1-2pax",
    description: "Marinated Fried Chicken sautéed with onions and capsicum.",
    price: 1850,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/chicken/fried-chicken.jpg"],
    isSpicy: true
  },

  // Kottu Section
  {
    name: "Vegetable Kottu",
    category: "Kottu",
    description: "Shredded flatbread mixed with fresh vegetables and spices.",
    price: 1400,
    dietType: "veg",
    isHalal: true,
    images: ["/images/kottu/veg-kottu.jpg"],
    isSpicy: true
  },
  {
    name: "Chicken Kottu",
    category: "Kottu",
    description: "Shredded flatbread with tender chicken and vegetables.",
    price: 1850,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/kottu/chicken-kottu.jpg"],
    isSpicy: true
  },
  {
    name: "Culture Special Chicken Kottu",
    category: "Kottu",
    description: "Kottu Rotti softend and Soaked in a thick curry, topped with 2 type of cheese sauce to bring the cheesiest kottu in town.",
    price: 2750,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/kottu/special-chicken-kottu.jpg"],
    isSpicy: true
  },

  // Rice Specialities
  {
    name: "Rice and Curry Special",
    category: "Rice Specialities",
    description: "Red Rice/ White Rice, Mallum or Salad, 03 Vegetable Curries, Papadam/Dry Chilli/Lime Pickle/Male Pickle",
    price: 1190,
    dietType: "veg",
    isHalal: true,
    images: ["/images/rice/rice-curry-special.jpg"],
    isSpicy: false
  },
  {
    name: "Bamboo Biriyani - Chicken",
    category: "Rice Specialities",
    description: "Biriyani served in a steaming hot bamboo with Raita, Homemade Chutney and Masala Curry",
    price: 1950,
    dietType: "non-veg",
    isHalal: true,
    images: ["/images/rice/chicken-bamboo-biriyani.jpg"],
    isSpicy: true
  },

  // Fresh Juice Section
  {
    name: "Orange Juice",
    category: "Fresh Juice",
    description: "Freshly squeezed orange juice.",
    price: 1500,
    dietType: "veg",
    isHalal: true,
    images: ["/images/juice/orange-juice.jpg"],
    isSpicy: false
  },
  {
    name: "King Coconut",
    category: "Fresh Juice",
    description: "Fresh king coconut water.",
    price: 775,
    dietType: "veg",
    isHalal: true,
    images: ["/images/juice/king-coconut.jpg"],
    isSpicy: false
  },

  // Desserts Section
  {
    name: "Watalappam",
    category: "Desserts",
    description: "Traditional Sri Lankan coconut custard.",
    price: 925,
    dietType: "veg",
    isHalal: true,
    images: ["/images/desserts/watalappam.jpg"],
    isSpicy: false
  },
  {
    name: "Curd and Treacle",
    category: "Desserts",
    description: "Fresh curd with palm treacle.",
    price: 975,
    dietType: "veg",
    isHalal: true,
    images: ["/images/desserts/curd-treacle.jpg"],
    isSpicy: false
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Food.deleteMany({});
    console.log("Cleared existing food data");

    // Insert seed data
    const result = await Food.insertMany(foodSeedData);
    console.log(`Inserted ${result.length} food items`);

    // Create indexes
    await Food.createIndexes();
    console.log("Created indexes");

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
