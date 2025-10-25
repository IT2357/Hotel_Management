import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import '../config/database.js';

const createKitchenStaff = async () => {
  try {
    console.log('🍳 Creating Kitchen Staff...');
    
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hashedPassword = await bcrypt.hash('kitchen123', 12);

    // Kitchen staff member
    const kitchenStaff = {
      name: 'Carlos Martinez',
      email: 'carlos@hotel.com',
      password: hashedPassword,
      role: 'staff',
      department: 'Kitchen',
      position: 'Head Chef',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      phone: '+1-555-0050'
    };

    // Check if kitchen staff already exists
    const existingStaff = await User.findOne({ email: kitchenStaff.email });
    
    if (existingStaff) {
      // Update existing staff to ensure kitchen department
      existingStaff.department = 'Kitchen';
      existingStaff.position = 'Head Chef';
      existingStaff.password = hashedPassword;
      existingStaff.isActive = true;
      existingStaff.isApproved = true;
      await existingStaff.save();
      console.log(`✅ Updated existing staff: ${kitchenStaff.email}`);
    } else {
      await User.create(kitchenStaff);
      console.log(`✅ Created kitchen staff: ${kitchenStaff.email}`);
    }

    console.log('\n🎉 Kitchen staff ready!');
    console.log('\n📋 Kitchen Staff Login Credentials:');
    console.log('   Email: carlos@hotel.com');
    console.log('   Password: kitchen123');
    console.log('   Department: Kitchen');
    console.log('   Position: Head Chef');
    console.log('\n🍳 Kitchen Staff Dashboard: http://localhost:5173/kitchen/dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating kitchen staff:', error);
    process.exit(1);
  }
};

createKitchenStaff();

