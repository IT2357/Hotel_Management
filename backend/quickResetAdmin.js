import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';

async function resetAdminPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected\n');

    const newPassword = 'Admin@123'; // Strong password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Find admin user - try both emails
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    const adminEmail = admin ? 'admin@gmail.com' : 'admin@hotel.com';
    
    if (!admin) {
      admin = await User.findOne({ email: 'admin@hotel.com' });
    }
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating new admin...');
      const newAdmin = new User({
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        authProviders: [],
        permissions: [
          'users:read', 'users:write', 'users:delete',
          'rooms:read', 'rooms:write', 'rooms:delete',
          'bookings:read', 'bookings:write', 'bookings:delete',
          'invoices:read', 'invoices:write',
          'reports:read',
          'settings:read', 'settings:write',
          'refunds:read', 'refunds:write',
          'invitations:read', 'invitations:write',
          'notification:read', 'notification:write'
        ]
      });
      await newAdmin.save();
      console.log('✅ New admin created!');
    } else {
      console.log(`✅ Admin user found: ${admin.email}`);
      console.log('✅ Updating password...');
      // Use updateOne to bypass pre-save hook
      await User.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      console.log('✅ Password updated!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${admin?.email || 'admin@gmail.com'}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n🔐 Please change this password after logging in!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword();
