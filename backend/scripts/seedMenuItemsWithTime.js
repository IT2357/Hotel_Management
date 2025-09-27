// 📁 backend/scripts/seedMenuItemsWithTime.js
import 'dotenv/config';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import { foodItems } from '../data/menuSeedData.js';

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management';
    await mongoose.connect(uri, { maxPoolSize: 5 });
    console.log('✅ Connected to MongoDB');

    // Clear existing menu items that match our seed data
    const names = foodItems.map((f) => f.name);
    await MenuItem.deleteMany({ name: { $in: names } });
    console.log('🧹 Cleared existing matching menu items');

    // Insert new menu items with time availability one by one to trigger pre-save hooks
    const inserted = [];
    for (const itemData of foodItems) {
      const item = new MenuItem({
        ...itemData,
        preparationTimeMinutes: itemData.preparationTimeMinutes ?? 20,
        imageUrl: itemData.images ? itemData.images[0] : itemData.image,
      });
      const savedItem = await item.save();
      inserted.push(savedItem);
    }

    console.log(`✅ Inserted ${inserted.length} menu items with time availability.`);
    await mongoose.connection.close();
    console.log('🔌 Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  }
}

run();