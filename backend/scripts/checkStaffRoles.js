import mongoose from 'mongoose';
import { User } from '../models/User.js';
import '../config/database.js';

const checkStaffRoles = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    // Get all staff users
    const staffUsers = await User.find({ 
      email: { $in: ['sarah@hotel.com', 'lisa@hotel.com', 'mike@hotel.com', 'david@hotel.com'] } 
    }).select('+password');

    console.log('📋 Staff Users in Database:\n');
    console.log('═══════════════════════════════════════════════════════');
    
    for (const user of staffUsers) {
      console.log(`\n👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: "${user.role}" (type: ${typeof user.role})`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Is Approved: ${user.isApproved}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Has Password: ${!!user.password}`);
      console.log(`   Department: ${user.department || 'N/A'}`);
      console.log(`   Position: ${user.position || 'N/A'}`);
      
      // Check if role is exactly 'staff'
      if (user.role !== 'staff') {
        console.log(`   ⚠️  WARNING: Role is "${user.role}" but should be "staff"`);
        console.log(`   🔧 Fixing role...`);
        await User.updateOne(
          { _id: user._id },
          { $set: { role: 'staff' } }
        );
        console.log(`   ✅ Role fixed to "staff"`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n🔍 Summary:');
    const totalStaff = await User.countDocuments({ role: 'staff' });
    console.log(`   Total users with role="staff": ${totalStaff}`);

    // Also check manager
    const manager = await User.findOne({ email: 'manager@hotel.com' });
    if (manager) {
      console.log(`\n👨‍💼 Manager: ${manager.email}`);
      console.log(`   Role: "${manager.role}" (should be "manager")`);
      if (manager.role !== 'manager') {
        console.log(`   🔧 Fixing manager role...`);
        await User.updateOne(
          { email: 'manager@hotel.com' },
          { $set: { role: 'manager' } }
        );
        console.log(`   ✅ Role fixed to "manager"`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkStaffRoles();
