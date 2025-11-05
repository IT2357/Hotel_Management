import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const testLogin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    // Test credentials
    const testUsers = [
      { email: 'admin@hotel.com', password: 'admin123', role: 'admin' },
      { email: 'manager@hotel.com', password: 'password123', role: 'manager' },
      { email: 'sarah@hotel.com', password: 'password123', role: 'staff' },
    ];

    for (const testUser of testUsers) {
      console.log(`\n🔍 Testing: ${testUser.email}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Password: ${testUser.password}`);

      // Find user
      const user = await User.findOne({ email: testUser.email });
      
      if (!user) {
        console.log(`   ❌ User not found in database`);
        continue;
      }

      console.log(`   ✅ User found in database`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Active: ${user.isActive}`);
      console.log(`   - Approved: ${user.isApproved}`);
      console.log(`   - Email Verified: ${user.emailVerified}`);
      console.log(`   - Password exists: ${!!user.password}`);
      console.log(`   - Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'MISSING'}`);
      
      // Check if password exists
      if (!user.password) {
        console.log(`   ❌ Password is missing! Fixing...`);
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        user.password = hashedPassword;
        user.isActive = true;
        user.isApproved = true;
        user.emailVerified = true;
        await user.save();
        console.log(`   ✅ Password set to: ${testUser.password}`);
        continue;
      }
      
      // Test password
      const isMatch = await bcrypt.compare(testUser.password, user.password);
      console.log(`   ${isMatch ? '✅' : '❌'} Password ${isMatch ? 'matches' : 'does NOT match'}`);

      if (!isMatch) {
        console.log(`   🔧 Updating password to: ${testUser.password}`);
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        user.password = hashedPassword;
        user.isActive = true;
        user.isApproved = true;
        user.emailVerified = true;
        await user.save();
        console.log(`   ✅ Password updated successfully`);
      }
    }

    console.log('\n🎉 Test complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();
