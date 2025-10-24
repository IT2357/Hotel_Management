/**
 * MongoDB Food Data Import Script - Jaffna Cuisine
 * Imports categories and menu items with proper references
 * Based on authentic Jaffna/Sri Lankan cuisine
 * 
 * Usage: cd backend && node ../mongodb-data/import-food-data.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management';

// Import models - assuming we run from backend directory
import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';

const importFoodData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read JSON files
    console.log('\n📂 Reading data files...');
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '08-food-categories.json'), 'utf8')
    );
    const menuItemsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '09-menu-items.json'), 'utf8')
    );

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n🗑️  Clearing existing food data...');
    await MenuItem.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Existing data cleared');

    // Import categories
    console.log('\n📥 Importing categories...');
    const categoryMap = new Map();
    
    for (const catData of categoriesData) {
      const category = await Category.create(catData);
      categoryMap.set(catData.name, category._id);
      console.log(`  ✓ Created category: ${catData.name} (${catData.icon})`);
    }
    console.log(`✅ Imported ${categoryMap.size} categories`);

    // Import menu items with category references
    console.log('\n📥 Importing menu items...');
    let successCount = 0;
    let errorCount = 0;

    for (const itemData of menuItemsData) {
      try {
        // Replace category name with ObjectId reference
        const categoryName = itemData.category;
        const categoryId = categoryMap.get(categoryName);

        if (!categoryId) {
          console.warn(`  ⚠️  Category not found for: ${itemData.name} (${categoryName})`);
          errorCount++;
          continue;
        }

        // Create menu item with category reference
        const menuItem = await MenuItem.create({
          ...itemData,
          category: categoryId
        });

        console.log(`  ✓ Created: ${menuItem.name} - ${categoryName} (${itemData.isBreakfast ? '🌅' : ''}${itemData.isLunch ? '🌞' : ''}${itemData.isDinner ? '🌙' : ''})`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Error creating ${itemData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Success: ${successCount} items`);
    console.log(`   Errors: ${errorCount} items`);

    // Display summary
    console.log('\n📊 Summary:');
    const categoryCounts = await Category.getCategoriesWithCount();
    categoryCounts.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name}: ${cat.menuItemsCount} items`);
    });

    // Display time slot breakdown
    console.log('\n🕐 Time Slot Availability:');
    const breakfastCount = await MenuItem.countDocuments({ isBreakfast: true });
    const lunchCount = await MenuItem.countDocuments({ isLunch: true });
    const dinnerCount = await MenuItem.countDocuments({ isDinner: true });
    const snacksCount = await MenuItem.countDocuments({ isSnacks: true });

    console.log(`   🌅 Breakfast: ${breakfastCount} items`);
    console.log(`   🌞 Lunch: ${lunchCount} items`);
    console.log(`   🌙 Dinner: ${dinnerCount} items`);
    console.log(`   🍿 Snacks: ${snacksCount} items`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
    process.exit(0);
  }
};

// Run the import
importFoodData();

