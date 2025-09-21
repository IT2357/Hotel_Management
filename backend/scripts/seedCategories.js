// 📁 backend/scripts/seedCategories.js
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { connectDB } from '../config/database.js';

const defaultCategories = [
  {
    name: 'Appetizers',
    description: 'Small dishes served before the main course',
    displayOrder: 1,
  },
  {
    name: 'Main Course',
    description: 'Primary dishes and entrees',
    displayOrder: 2,
  },
  {
    name: 'Desserts',
    description: 'Sweet dishes served at the end of the meal',
    displayOrder: 3,
  },
  {
    name: 'Beverages',
    description: 'Drinks and refreshments',
    displayOrder: 4,
  },
  {
    name: 'Sides',
    description: 'Accompaniments and side dishes',
    displayOrder: 5,
  },
  {
    name: "Chef's Specials",
    description: 'Signature dishes from our chef',
    displayOrder: 6,
  },
  {
    name: 'Breakfast',
    description: 'Morning meals and breakfast items',
    displayOrder: 7,
  },
  {
    name: 'Lunch',
    description: 'Light meals for midday',
    displayOrder: 8,
  },
  {
    name: 'Dinner',
    description: 'Evening meals and dinner specials',
    displayOrder: 9,
  },
  {
    name: 'Snacks',
    description: 'Light bites and snacks',
    displayOrder: 10,
  },
];

const seedCategories = async () => {
  try {
    console.log('🌱 Seeding categories...');

    // Connect to database
    await connectDB();
    console.log('📊 Connected to database');

    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} categories already exist. Skipping seeding.`);
      return;
    }

    // Insert default categories
    const categories = await Category.insertMany(defaultCategories);
    console.log(`✅ Successfully seeded ${categories.length} categories`);

    // Display created categories
    console.log('📋 Created categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCategories();
}

export default seedCategories;