// Test login script
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    
    // Check if the admin user exists and what password it has
    const user = await User.findOne({ email: 'admin@test.com' });
    
    if (user) {
      console.log('✅ User found:');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🔧 Role: ${user.role}`);
      
      // Test password
      const testPassword = 'admin123';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`🔑 Password match for '${testPassword}': ${isMatch}`);
      
      if (!isMatch) {
        console.log('🔄 Testing other common passwords...');
        const commonPasswords = ['password123', 'guest123', 'manager123', 'staff123'];
        for (const password of commonPasswords) {
          const match = await bcrypt.compare(password, user.password);
          console.log(`🔑 Password match for '${password}': ${match}`);
          if (match) {
            console.log(`✅ Found correct password: ${password}`);
            break;
          }
        }
      }
    } else {
      console.log('❌ User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLogin();