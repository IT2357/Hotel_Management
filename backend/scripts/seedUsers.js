import mongoose from 'mongoose';
import { User } from '../models/User.js';
import GuestProfile from '../models/profiles/GuestProfile.js';
import bcrypt from 'bcryptjs';

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');

    console.log('🌱 Seeding users...');

    // Note: Not clearing existing users to preserve your data

    // Create test users
    const testUsers = [
      {
        name: 'Test Guest',
        email: 'guest@test.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'guest',
        emailVerified: true,
        isActive: true,
        isApproved: true,
      },
      {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'admin123',
        phone: '+1234567891',
        role: 'admin',
        emailVerified: true,
        isActive: true,
        isApproved: true,
      },
      {
        name: 'Ahsan Mohammed',
        email: 'ahsanmohammed828@gmail.com',
        password: 'Admin123.',
        phone: '+1234567892',
        role: 'admin',
        emailVerified: true,
        isActive: true,
        isApproved: true,
      },
      {
        name: 'Guest Ahsan',
        email: 'GUESTahsanmohammed@valdor.com',
        password: 'Admin123@',
        phone: '+1234567893',
        role: 'guest',
        emailVerified: true,
        isActive: true,
        isApproved: true,
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⏭️  User already exists: ${userData.email} (${userData.role})`);
        // Update password to ensure it's hashed
        existingUser.password = userData.password;
        existingUser.markModified('password');
        await existingUser.save();
        console.log(`🔄 Updated password for: ${userData.email}`);
        continue;
      }

      // Create user (password will be hashed by pre-save hook)
      const user = new User(userData);

      await user.save();

      // Create profile
      if (userData.role === 'guest') {
        await GuestProfile.create({
          userId: user._id,
          preferences: { preferredLanguage: 'en' },
        });
      }

      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('🎉 Users seeded successfully!');
    console.log('Login credentials:');
    console.log('Guest: guest@test.com / password123');
    console.log('Admin: admin@test.com / admin123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers();
}

export default seedUsers;