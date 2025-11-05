import mongoose from 'mongoose';
import { User } from '../models/User.js';
import StaffTask from '../models/StaffTask.js';
import config from '../config/environment.js';

const checkStaffUsers = async () => {
  try {
    // Use the same connection options as database.js to avoid bufferCommands issues
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      bufferCommands: false, // Must match database.js config
    };

    await mongoose.connect(config.MONGODB_URI, options);
    console.log('✅ Connected to MongoDB');

    // Check for staff users
    const staffUsers = await User.find({ role: 'staff', isActive: true })
      .select('name email role department')
      .lean();

    console.log('\n📊 Staff Users in Database:');
    console.log('Total staff members:', staffUsers.length);
    
    if (staffUsers.length === 0) {
      console.log('⚠️ NO STAFF USERS FOUND! You need to create staff users.');
    } else {
      staffUsers.forEach((staff, index) => {
        console.log(`\n${index + 1}. ${staff.name}`);
        console.log(`   Email: ${staff.email}`);
        console.log(`   ID: ${staff._id}`);
        console.log(`   Department: ${staff.department || 'Not set'}`);
      });
    }

    // Check for manager users
    const managerUsers = await User.find({ role: 'manager', isActive: true })
      .select('name email role')
      .lean();

    console.log('\n📊 Manager Users in Database:');
    console.log('Total managers:', managerUsers.length);
    
    if (managerUsers.length === 0) {
      console.log('⚠️ NO MANAGER USERS FOUND!');
    } else {
      managerUsers.forEach((manager, index) => {
        console.log(`\n${index + 1}. ${manager.name}`);
        console.log(`   Email: ${manager.email}`);
        console.log(`   ID: ${manager._id}`);
      });
    }

    // Check existing tasks
    const taskCount = await StaffTask.countDocuments();
    console.log(`\n📋 Total Tasks in Database: ${taskCount}`);

    if (taskCount > 0) {
      const tasksByStatus = await StaffTask.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      console.log('\nTasks by Status:');
      tasksByStatus.forEach(({ _id, count }) => {
        console.log(`  ${_id}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

checkStaffUsers();
