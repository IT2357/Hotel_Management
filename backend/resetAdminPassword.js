// Quick password reset script
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');

    const newPassword = 'admin123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await users.findOneAndUpdate(
      { email: 'admin@valdora.com' },
      {
        password: hashedPassword,
        tokenVersion: 0 // Reset token version to invalidate old tokens
      },
      { new: true }
    );

    if (result) {
      console.log('✅ Admin password reset successful!');
      console.log(`📧 Email: admin@valdora.com`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log('🔒 Please change this password after logging in!');
    } else {
      console.log('❌ Admin user not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Password reset failed:', error);
  }
}

resetAdminPassword();
