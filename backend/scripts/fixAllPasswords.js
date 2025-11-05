import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const fixAllPasswords = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    const users = [
      { email: 'admin@hotel.com', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'manager@hotel.com', password: 'password123', name: 'John Manager', role: 'manager' },
      { email: 'sarah@hotel.com', password: 'password123', name: 'Sarah Johnson', role: 'staff' },
      { email: 'lisa@hotel.com', password: 'password123', name: 'Lisa Wilson', role: 'staff' },
      { email: 'mike@hotel.com', password: 'password123', name: 'Mike Anderson', role: 'staff' },
      { email: 'david@hotel.com', password: 'password123', name: 'David Brown', role: 'staff' },
    ];

    for (const userData of users) {
      console.log(`\n🔧 Processing: ${userData.email}`);
      
      // Find user with password field
      let user = await User.findOne({ email: userData.email }).select('+password');
      
      if (!user) {
        console.log(`   📝 Creating new user...`);
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        user = new User({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: true,
          isApproved: true,
          emailVerified: true,
          authProviders: [] // Important: empty array for local auth
        });
        await user.save();
        console.log(`   ✅ User created`);
      } else {
        console.log(`   ✅ User found`);
        console.log(`   - Current password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NONE'}`);
        
        // Always update password to ensure it's correct
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Use update with $set to bypass pre-save hook
        await User.updateOne(
          { email: userData.email },
          { 
            $set: {
              password: hashedPassword,
              isActive: true,
              isApproved: true,
              emailVerified: true,
              authProviders: [] // Ensure local auth
            }
          }
        );
        console.log(`   ✅ Password updated via updateOne`);
      }
      
      // Verify password works
      const testUser = await User.findOne({ email: userData.email }).select('+password');
      if (testUser && testUser.password) {
        const isMatch = await bcrypt.compare(userData.password, testUser.password);
        console.log(`   ${isMatch ? '✅' : '❌'} Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
      } else {
        console.log(`   ❌ Password still missing after update!`);
      }
    }

    console.log('\n\n🎉 All passwords fixed!');
    console.log('\n📋 Login Credentials:');
    console.log('══════════════════════════════════════════════');
    console.log('👨‍💼 MANAGER:');
    console.log('   Email: manager@hotel.com');
    console.log('   Password: password123');
    console.log('\n👷 STAFF:');
    console.log('   Email: sarah@hotel.com | Password: password123');
    console.log('   Email: lisa@hotel.com  | Password: password123');
    console.log('   Email: mike@hotel.com  | Password: password123');
    console.log('   Email: david@hotel.com | Password: password123');
    console.log('\n👨‍💻 ADMIN:');
    console.log('   Email: admin@hotel.com');
    console.log('   Password: admin123');
    console.log('══════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAllPasswords();
