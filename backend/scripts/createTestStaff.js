import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const createTestStaff = async () => {
  try {
    console.log('🔄 Creating test staff...');
    
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create just a few staff members for testing
    const testStaff = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.test@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Front Office',
        position: 'Front Desk Supervisor',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0011'
      },
      {
        name: 'Mike Anderson',
        email: 'mike.test@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Maintenance',
        position: 'Maintenance Manager',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0031'
      },
      {
        name: 'Lisa Wilson',
        email: 'lisa.test@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Housekeeping',
        position: 'Housekeeping Supervisor',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0021'
      }
    ];

    for (const staffMember of testStaff) {
      const existingStaff = await User.findOne({ email: staffMember.email });
      if (!existingStaff) {
        await User.create(staffMember);
        console.log(`✅ Created ${staffMember.name} - ${staffMember.department}`);
      } else {
        console.log(`⏭️ Skipped ${staffMember.name} (already exists)`);
      }
    }

    console.log('🎉 Test staff created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test staff:', error);
    process.exit(1);
  }
};

createTestStaff();