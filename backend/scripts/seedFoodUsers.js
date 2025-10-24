import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from '../models/User.js';
import GuestProfile from '../models/profiles/GuestProfile.js';

// Sample food ordering guest users
const sampleUsers = [
  {
    name: 'Test Guest',
    email: 'guest@test.com',
    password: 'password123',
    role: 'guest',
    phone: '+94771234567',
    isActive: true,
    isApproved: true,
    emailVerified: true  // Set email as verified to bypass email verification
  },
  {
    name: 'Food Customer',
    email: 'food@customer.com',
    password: 'password123',
    role: 'guest',
    phone: '+94779876543',
    isActive: true,
    isApproved: true,
    emailVerified: true  // Set email as verified to bypass email verification
  },
  {
    name: 'Jaffna Food Lover',
    email: 'jaffna@food.com',
    password: 'password123',
    role: 'guest',
    phone: '+94771122334',
    isActive: true,
    isApproved: true,
    emailVerified: true  // Set email as verified to bypass email verification
  }
];

async function seedFoodUsers() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');

    // Clear existing guest users (but be careful not to delete other important users)
    console.log('🗑️  Clearing existing food test users...');
    const emailsToDelete = sampleUsers.map(user => user.email);
    await User.deleteMany({ email: { $in: emailsToDelete } });
    console.log('✅ Existing food test users cleared');

    // Hash passwords and create users
    console.log('👤 Creating food test users...');
    const usersToInsert = await Promise.all(sampleUsers.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      return {
        ...user,
        password: hashedPassword
      };
    }));

    const createdUsers = await User.insertMany(usersToInsert);
    console.log(`✅ Created ${createdUsers.length} food test users`);

    // Create guest profiles for these users
    console.log('📝 Creating guest profiles...');
    const guestProfiles = await Promise.all(createdUsers.map(async (user) => {
      if (user.role === 'guest') {
        const profile = new GuestProfile({
          userId: user._id,
          verificationStatus: 'verified',
          isFoodOnlyCustomer: true,
          preferences: {
            preferredLanguage: 'en',
            allergies: [],
            dietaryRestrictions: []
          },
          loyaltyPoints: 0,
          membershipLevel: 'standard'
        });
        return await profile.save();
      }
      return null;
    }));

    const validProfiles = guestProfiles.filter(profile => profile !== null);
    console.log(`✅ Created ${validProfiles.length} guest profiles`);

    // Display login credentials
    console.log('\n🔐 Login Credentials for Food Ordering:');
    sampleUsers.forEach(user => {
      console.log(`   - Email: ${user.email}`);
      console.log(`     Password: ${user.password}`);
      console.log(`     Role: ${user.role}`);
      console.log('');
    });

    console.log('\n✨ Food user seeding completed successfully!');
    console.log('\n🌐 You can now test food ordering at:');
    console.log('   - Guest Menu: http://localhost:5173/menu');
    console.log('   - Food Ordering: http://localhost:5173/food');
    console.log('   - My Orders: http://localhost:5173/my-orders');

  } catch (error) {
    console.error('❌ Error seeding food users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedFoodUsers();