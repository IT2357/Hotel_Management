import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';

async function importUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read users JSON file
    const usersPath = path.join(__dirname, '../../mongodb-data/01-users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    console.log(`\n📥 Found ${usersData.length} users to import`);

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert users
    await User.insertMany(usersData);
    console.log(`✅ Imported ${usersData.length} users`);

    // Show summary
    const counts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 User Summary:');
    console.log('─'.repeat(40));
    counts.forEach(({ _id, count }) => {
      console.log(`  ${_id.padEnd(10)}: ${count}`);
    });
    console.log('─'.repeat(40));

    console.log('\n✨ User import completed successfully!');

  } catch (error) {
    console.error('❌ Error importing users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

importUsers();
