// scripts/seedKeyCards.js
import mongoose from 'mongoose';
import KeyCard from '../backend/models/KeyCard.js';
import { connectDB } from '../backend/config/database.js';

const seedKeyCards = async () => {
  try {
    console.log('🌱 Seeding key cards...');

    // Connect to database
    await connectDB();

    // Check if key cards already exist
    const existingCount = await KeyCard.countDocuments();
    if (existingCount > 0) {
      console.log(`📋 Key cards already exist (${existingCount} cards found). Skipping seed.`);
      return;
    }

    // Create key cards 001 through 050
    const keyCards = [];
    for (let i = 1; i <= 50; i++) {
      const cardNumber = i.toString().padStart(3, '0');
      keyCards.push({
        cardNumber: cardNumber,
        status: 'inactive' // All cards start as inactive/available
      });
    }

    await KeyCard.insertMany(keyCards);
    console.log(`✅ Successfully seeded ${keyCards.length} key cards (001-050)`);
    console.log('🔑 All key cards are initially inactive and available for assignment');

  } catch (error) {
    console.error('❌ Error seeding key cards:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedKeyCards().catch(console.error);
