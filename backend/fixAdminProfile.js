import mongoose from 'mongoose';
import { User } from './models/User.js';
import AdminProfile from './models/profiles/AdminProfile.js';

async function fixAdminProfile() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🔍 Looking for admin user...');
    const admin = await User.findOne({ email: 'admin@hotel.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    console.log('✅ Found admin user:', admin._id);
    
    // Check if AdminProfile exists
    let adminProfile = await AdminProfile.findOne({ userId: admin._id });
    
    if (!adminProfile) {
      console.log('📝 Creating new AdminProfile...');
      adminProfile = new AdminProfile({
        userId: admin._id,
        permissions: {
          modules: ['users', 'food', 'ai', 'menu', 'reports', 'bookings', 'invoices'],
          actions: ['create', 'read', 'update', 'delete', 'manage']
        },
        accessLevel: 'full',
        lastActive: new Date()
      });
      await adminProfile.save();
      console.log('✅ AdminProfile created:', adminProfile._id);
    } else {
      console.log('✅ AdminProfile already exists:', adminProfile._id);
    }
    
    // Update user to reference the profile
    admin.adminProfile = adminProfile._id;
    await admin.save();
    console.log('✅ Admin user updated with profile reference');
    
    // Verify the setup
    const updatedAdmin = await User.findOne({ email: 'admin@hotel.com' }).populate('adminProfile');
    console.log('🔍 Verification - Admin has profile:', !!updatedAdmin.adminProfile);
    
    console.log('🎉 AdminProfile setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixAdminProfile();