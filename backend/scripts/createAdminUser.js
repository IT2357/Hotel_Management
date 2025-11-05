import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
import { User } from '../models/User.js';

const createAdminUser = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@hotel.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Active: ${existingAdmin.isActive}`);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('admin123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.isApproved = true;
      existingAdmin.emailVerified = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('\n✅ Admin password updated to: admin123');
    } else {
      // Create new admin user
      console.log('📝 Creating new admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@hotel.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        authProviders: [], // Empty for local auth
        notificationPreferences: {
          email: true,
          sms: false,
          push: true
        },
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

      await adminUser.save();
      console.log('✅ Admin user created successfully!\n');
    }

    console.log('📋 Admin Credentials:');
    console.log('   Email: admin@hotel.com');
    console.log('   Password: admin123');
    console.log('\n🔐 You can now login with these credentials\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createAdminUser();
