import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const fixStaffData = async () => {
  try {
    console.log('🔧 Fixing staff data...');
    
    // Wait for connection
    setTimeout(async () => {
      try {
        const hashedPassword = await bcrypt.hash('password123', 12);

        // Update the existing "Test Staff" user
        const existingTestStaff = await User.findOne({ name: 'Test Staff' });
        if (existingTestStaff) {
          await User.findByIdAndUpdate(existingTestStaff._id, {
            name: 'Sarah Johnson',
            department: 'Front Office',
            position: 'Front Desk Supervisor',
            shift: 'morning',
            email: 'sarah@hotel.com',
            phone: '+1-555-0011'
          });
          console.log('✅ Updated Test Staff to Sarah Johnson');
        }

        // Add a few more staff members directly
        const additionalStaff = [
          {
            name: 'Mike Anderson',
            email: 'mike@hotel.com',
            password: hashedPassword,
            role: 'staff',
            department: 'Maintenance',
            position: 'Maintenance Manager',
            shift: 'morning',
            isActive: true,
            emailVerified: true,
            phone: '+1-555-0031'
          },
          {
            name: 'Lisa Wilson', 
            email: 'lisa@hotel.com',
            password: hashedPassword,
            role: 'staff',
            department: 'Housekeeping',
            position: 'Housekeeping Supervisor',
            shift: 'morning',
            isActive: true,
            emailVerified: true,
            phone: '+1-555-0021'
          },
          {
            name: 'David Brown',
            email: 'david@hotel.com', 
            password: hashedPassword,
            role: 'staff',
            department: 'Food & Beverage',
            position: 'Restaurant Manager',
            shift: 'morning',
            isActive: true,
            emailVerified: true,
            phone: '+1-555-0041'
          }
        ];

        for (const staff of additionalStaff) {
          const exists = await User.findOne({ email: staff.email });
          if (!exists) {
            await User.create(staff);
            console.log(`✅ Created ${staff.name} - ${staff.department}`);
          }
        }

        // Verify the changes
        const allStaff = await User.find({ role: 'staff' }, 'name department position');
        console.log('\n📋 Current Staff:');
        allStaff.forEach(s => {
          console.log(`  - ${s.name} - ${s.department || 'No Dept'} (${s.position || 'No Position'})`);
        });
        
        console.log('\n🎉 Staff data fixed successfully!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
};

fixStaffData();