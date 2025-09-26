// 📁 backend/scripts/seedMenu.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Food from '../models/Food.js';
import { foodItems } from '../data/menuSeedData.js';

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management';
    await mongoose.connect(uri, { maxPoolSize: 5 });
    console.log('✅ Connected to MongoDB');

    // Optionally clear only demo items by name match, or clear all
    const names = foodItems.map((f) => f.name);
    await Food.deleteMany({ name: { $in: names } });

    const inserted = await Food.insertMany(foodItems.map((f) => ({
      ...f,
      // normalize fields to match model
      preparationTimeMinutes: f.preparationTimeMinutes ?? 20,
    })));

    console.log(`✅ Inserted ${inserted.length} food items.`);
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
