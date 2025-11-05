import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createManager = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if manager already exists
    const existingManager = await User.findOne({ 
      role: { $in: ['manager', 'admin'] },
      isActive: true 
    });

    if (existingManager) {
      console.log('✅ Manager already exists:');
      console.log('   Name:', existingManager.name);
      console.log('   Email:', existingManager.email);
      console.log('   Role:', existingManager.role);
      console.log('\n✅ No need to create a new manager!');
      process.exit(0);
    }

    // Create a manager
    const hashedPassword = await bcrypt.hash('manager123', 10);

    const manager = new User({
      name: 'Hotel Manager',
      email: 'manager@hotel.com',
      password: hashedPassword,
      role: 'manager',
      isActive: true,
      phone: '1234567890',
      address: 'Hotel HQ',
      staffProfile: {
        department: 'management',
        position: 'Manager',
        employeeId: 'MGR001',
        hireDate: new Date()
      }
    });

    await manager.save();

    console.log('\n✅ Manager created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: manager@hotel.com');
    console.log('🔑 Password: manager123');
    console.log('👤 Role: manager');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can now login and staff can send messages!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createManager();
