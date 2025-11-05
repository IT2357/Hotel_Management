import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const createUsers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create/Update Manager
    const manager = await User.findOneAndUpdate(
      { email: 'manager@hotel.com' },
      {
        name: 'John Manager',
        email: 'manager@hotel.com',
        password: hashedPassword,
        role: 'manager',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        phone: '+1-555-0001'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Manager created/updated:', manager.email);

    // Create/Update Staff Members
    const staffMembers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Front Office',
        position: 'Front Desk Supervisor',
        shift: 'morning',
        status: 'active',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        phone: '+1-555-0011'
      },
      {
        name: 'Lisa Wilson',
        email: 'lisa@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Housekeeping',
        position: 'Housekeeping Supervisor',
        shift: 'morning',
        status: 'active',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        phone: '+1-555-0021'
      },
      {
        name: 'Mike Anderson',
        email: 'mike@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Maintenance',
        position: 'Maintenance Manager',
        shift: 'morning',
        status: 'active',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        phone: '+1-555-0031'
      },
      {
        name: 'David Brown',
        email: 'david@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Food & Beverage',
        position: 'Restaurant Manager',
        shift: 'morning',
        status: 'active',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        phone: '+1-555-0041'
      }
    ];

    for (const staffData of staffMembers) {
      const staff = await User.findOneAndUpdate(
        { email: staffData.email },
        staffData,
        { upsert: true, new: true }
      );
      console.log(`✅ Staff created/updated: ${staff.email} - ${staff.department}`);
    }

    console.log('\n🎉 All users created successfully!');
    console.log('\n📋 Login Credentials (all use password: password123):');
    console.log('   Manager: manager@hotel.com');
    console.log('   Staff: sarah@hotel.com, lisa@hotel.com, mike@hotel.com, david@hotel.com');
    console.log('   Admin: admin@hotel.com (password: admin123)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createUsers();
