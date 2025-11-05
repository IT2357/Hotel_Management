/**
 * MongoDB Food Data Import Script - Jaffna Cuisine
 * Imports categories and menu items with proper references
 * Based on authentic Jaffna/Sri Lankan cuisine from Valampuri Hotel
 * 
 * Usage: cd backend && node import-jaffna-food.js
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

// Import models
import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';

const importFoodData = async () => {
  try {
    console.log('🍛 Importing Authentic Jaffna Cuisine...');
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read JSON files from mongodb-data directory
    console.log('📂 Reading data files...');
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../mongodb-data/08-food-categories.json'), 'utf8')
    );
    const menuItemsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../mongodb-data/09-menu-items.json'), 'utf8')
    );

    // Clear existing data
    console.log('\n🗑️  Clearing existing food data...');
    const deletedItems = await MenuItem.deleteMany({});
    const deletedCats = await Category.deleteMany({});
    console.log(`   Deleted ${deletedItems.deletedCount} menu items`);
    console.log(`   Deleted ${deletedCats.deletedCount} categories`);

    // Import categories
    console.log('\n📥 Importing categories...');
    const categoryMap = new Map();
    
    for (const catData of categoriesData) {
      const category = await Category.create(catData);
      categoryMap.set(catData.name, category._id);
      console.log(`   ✓ ${catData.icon} ${catData.name}`);
    }
    console.log(`✅ Imported ${categoryMap.size} categories\n`);

    // Import menu items with category references
    console.log('📥 Importing menu items...');
    let successCount = 0;
    let errorCount = 0;
    const categoryStats = new Map();

    for (const itemData of menuItemsData) {
      try {
        // Replace category name with ObjectId reference
        const categoryName = itemData.category;
        const categoryId = categoryMap.get(categoryName);

        if (!categoryId) {
          console.warn(`   ⚠️  Category not found: ${categoryName} for ${itemData.name}`);
          errorCount++;
          continue;
        }

        // Create menu item with category reference
        const menuItem = await MenuItem.create({
          ...itemData,
          category: categoryId
        });

        // Update category stats
        if (!categoryStats.has(categoryName)) {
          categoryStats.set(categoryName, []);
        }
        categoryStats.get(categoryName).push(menuItem.name);

        const slots = [
          itemData.isBreakfast ? '🌅' : '',
          itemData.isLunch ? '🌞' : '',
          itemData.isDinner ? '🌙' : ''
        ].filter(Boolean).join('');

        console.log(`   ✓ ${menuItem.name} ${slots} - LKR ${menuItem.price}`);
        successCount++;
      } catch (error) {
        console.error(`   ✗ Error creating ${itemData.name}:`, error.message);
        errorCount++;
      }
    }

    // Display summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ IMPORT COMPLETE!');
    console.log(`${'='.repeat(70)}\n`);
    console.log(`   ✓ Categories: ${categoryMap.size}`);
    console.log(`   ✓ Menu Items: ${successCount}`);
    console.log(`   ✗ Errors: ${errorCount}\n`);

    console.log('📊 Items per Category:');
    categoryStats.forEach((items, catName) => {
      const catData = categoriesData.find(c => c.name === catName);
      console.log(`   ${catData?.icon || '📦'} ${catName}: ${items.length} items`);
    });

    // Display time slot breakdown
    console.log('\n🕐 Time Slot Availability:');
    const breakfastCount = await MenuItem.countDocuments({ isBreakfast: true });
    const lunchCount = await MenuItem.countDocuments({ isLunch: true });
    const dinnerCount = await MenuItem.countDocuments({ isDinner: true });
    const snacksCount = await MenuItem.countDocuments({ isSnacks: true });
    const vegCount = await MenuItem.countDocuments({ isVeg: true });
    const spicyCount = await MenuItem.countDocuments({ isSpicy: true });
    const popularCount = await MenuItem.countDocuments({ isPopular: true });

    console.log(`   🌅 Breakfast: ${breakfastCount} items`);
    console.log(`   🌞 Lunch: ${lunchCount} items`);
    console.log(`   🌙 Dinner: ${dinnerCount} items`);
    console.log(`   🍿 Snacks: ${snacksCount} items`);

    console.log('\n🏷️  Item Tags:');
    console.log(`   🌱 Vegetarian: ${vegCount} items`);
    console.log(`   🌶️  Spicy: ${spicyCount} items`);
    console.log(`   ⭐ Popular: ${popularCount} items`);

    console.log('\n💰 Price Range:');
    const prices = await MenuItem.find().select('price name').lean();
    const minPrice = Math.min(...prices.map(p => p.price));
    const maxPrice = Math.max(...prices.map(p => p.price));
    const avgPrice = Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length);
    
    console.log(`   Minimum: LKR ${minPrice}`);
    console.log(`   Maximum: LKR ${maxPrice}`);
    console.log(`   Average: LKR ${avgPrice}`);

    console.log('\n🎯 Food Plan Breakdown:');
    const breakfastPlan = await MenuItem.countDocuments({ isBreakfast: true });
    const halfBoard = await MenuItem.countDocuments({ 
      $or: [{ isBreakfast: true }, { isDinner: true }]
    });
    const fullBoard = await MenuItem.countDocuments({
      $or: [{ isBreakfast: true }, { isLunch: true }, { isDinner: true }]
    });

    console.log(`   🌅 Breakfast Only: ${breakfastPlan} items`);
    console.log(`   🌅🌙 Half Board: ${halfBoard} items`);
    console.log(`   🌅🌞🌙 Full Board: ${fullBoard} items`);
    console.log(`   🎯 A la carte: ${successCount} items (all)`);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 Your database is now ready with authentic Jaffna cuisine!');
    console.log('📖 Source: Valampuri Hotel, Jaffna, Sri Lanka');
    console.log('🔗 https://valampuri.foodorders.lk/menu/2');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
    process.exit(0);
  }
};

// Run the import
importFoodData();

