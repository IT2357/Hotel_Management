import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from './models/User.js';

const testStaffList = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all staff members
    const staff = await User.find({ role: 'staff' })
      .select('name email role department isActive')
      .sort({ name: 1 });

    console.log('\n📊 Staff Members in Database:');
    console.log('─────────────────────────────────────────');
    console.log(`Total Staff: ${staff.length}\n`);

    if (staff.length === 0) {
      console.log('❌ No staff members found in database!');
      console.log('\n💡 You need to create staff users first.');
      console.log('   Options:');
      console.log('   1. Use admin panel to create staff');
      console.log('   2. Register users with role="staff"');
    } else {
      staff.forEach((s, index) => {
        console.log(`${index + 1}. ${s.name}`);
        console.log(`   Email: ${s.email}`);
        console.log(`   Department: ${s.department || 'Not set'}`);
        console.log(`   Active: ${s.isActive ? 'Yes' : 'No'}`);
        console.log('');
      });

      const activeStaff = staff.filter(s => s.isActive);
      console.log(`✅ Active Staff: ${activeStaff.length}`);
      console.log(`⚠️  Inactive Staff: ${staff.length - activeStaff.length}`);
    }

    console.log('─────────────────────────────────────────\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testStaffList();
