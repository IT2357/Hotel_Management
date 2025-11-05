import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const createStaffMembers = async () => {
  try {
    console.log('🔄 Creating staff members with proper department and position data...');

    // First, remove any existing test staff
    await User.deleteMany({ 
      role: 'staff',
      email: { $regex: /@hotel\.com$/ }
    });
    console.log('🗑️ Removed existing staff');

    const hashedPassword = await bcrypt.hash('password123', 12);

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
        emailVerified: true,
        phone: '+1-555-0011'
      },
      {
        name: 'Emma Davis',
        email: 'emma@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Front Office',
        position: 'Front Desk Agent',
        shift: 'evening',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0012'
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
        emailVerified: true,
        phone: '+1-555-0021'
      },
      {
        name: 'Maria Rodriguez',
        email: 'maria@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Housekeeping',
        position: 'Room Attendant',
        shift: 'morning',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0022'
      },
      {
        name: 'Carlos Martinez',
        email: 'carlos@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Housekeeping',
        position: 'Room Attendant',
        shift: 'afternoon',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0023'
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
        emailVerified: true,
        phone: '+1-555-0031'
      },
      {
        name: 'Robert Taylor',
        email: 'robert@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Maintenance',
        position: 'Technician',
        shift: 'afternoon',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0032'
      },
      {
        name: 'Tom Jackson',
        email: 'tom@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Maintenance',
        position: 'Assistant Technician',
        shift: 'evening',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0033'
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
        emailVerified: true,
        phone: '+1-555-0041'
      },
      {
        name: 'Julia White',
        email: 'julia@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Food & Beverage',
        position: 'Server',
        shift: 'afternoon',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0042'
      },
      {
        name: 'Alex Green',
        email: 'alex@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Food & Beverage',
        position: 'Chef',
        shift: 'morning',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0043'
      },
      {
        name: 'Sophie Clark',
        email: 'sophie@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Food & Beverage',
        position: 'Bartender',
        shift: 'evening',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0044'
      },
      {
        name: 'James Lewis',
        email: 'james@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Security',
        position: 'Security Supervisor',
        shift: 'night',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0051'
      },
      {
        name: 'Daniel Miller',
        email: 'daniel@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Security',
        position: 'Security Guard',
        shift: 'evening',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0052'
      },
      {
        name: 'Nina Thompson',
        email: 'nina@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Spa & Wellness',
        position: 'Spa Manager',
        shift: 'morning',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0061'
      },
      {
        name: 'Kevin Adams',
        email: 'kevin@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Spa & Wellness',
        position: 'Massage Therapist',
        shift: 'afternoon',
        status: 'active',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0062'
      }
    ];

    const insertedStaff = await User.insertMany(staffMembers);
    console.log(`✅ Created ${insertedStaff.length} staff members`);

    // Also create a manager for testing
    const existingManager = await User.findOne({ role: 'manager' });
    if (!existingManager) {
      await User.create({
        name: 'John Manager',
        email: 'manager@hotel.com',
        password: hashedPassword,
        role: 'manager',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0001'
      });
      console.log('✅ Created manager account');
    }

    console.log('🎉 All staff created successfully!');
    
    // Verify the creation
    const staffCount = await User.countDocuments({ role: 'staff' });
    console.log(`📊 Total staff members: ${staffCount}`);

    console.log('\n📋 Staff Members:');
    const staff = await User.find({ role: 'staff' }, 'name department position').sort({ name: 1 });
    staff.forEach(member => {
      console.log(`  - ${member.name} - ${member.department} (${member.position})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating staff:', error);
    process.exit(1);
  }
};

createStaffMembers();