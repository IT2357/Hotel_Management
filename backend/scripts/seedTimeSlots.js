// 📁 backend/scripts/seedTimeSlots.js
import 'dotenv/config';
import mongoose from 'mongoose';
import TimeSlots from '../models/TimeSlots.js';
import { timeSlots } from '../data/menuSeedData.js';

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management';
    await mongoose.connect(uri, { maxPoolSize: 5 });
    console.log('✅ Connected to MongoDB');

    // Clear existing time slots
    await TimeSlots.deleteMany({});
    console.log('🧹 Cleared existing time slots');

    const inserted = await TimeSlots.insertMany(timeSlots);
    console.log(`✅ Inserted ${inserted.length} time slots.`);

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