// 📁 backend/create-test-users.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import GuestProfile from './models/profiles/GuestProfile.js';
import AdminProfile from './models/profiles/AdminProfile.js';
import 'dotenv/config';

async function createTestUsers() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ email: { $in: ['admin@test.com', 'guest@test.com'] } });
    await GuestProfile.deleteMany({});
    await AdminProfile.deleteMany({});
    console.log('🧹 Cleared existing test users');

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
      authProviders: []
    });

    // Create Admin Profile
    await AdminProfile.create({
      userId: adminUser._id,
      permissions: [
        { module: 'users', actions: ['read', 'create', 'update', 'delete'] },
        { module: 'reports', actions: ['read', 'create'] },
        { module: 'system', actions: ['read', 'update'] }
      ],
      accessLevel: 'Full'
    });

    console.log('✅ Created admin user: admin@test.com / admin123');

    // Create Guest User
    const guestUser = await User.create({
      name: 'Guest User',
      email: 'guest@test.com',
      password: 'guest123',
      role: 'guest',
      isApproved: true,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
      authProviders: []
    });

    // Create Guest Profile
    await GuestProfile.create({
      userId: guestUser._id,
      preferences: { 
        preferredLanguage: 'en',
        notifications: true
      }
    });

    console.log('✅ Created guest user: guest@test.com / guest123');

    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    console.log('\n🎉 Test users created successfully!');
    console.log('👤 Admin: admin@test.com / admin123');
    console.log('👤 Guest: guest@test.com / guest123');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
