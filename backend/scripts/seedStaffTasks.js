// Seed StaffTask data
import mongoose from 'mongoose';
import StaffTask from '../models/StaffTask.js';
import { User } from '../models/User.js';

async function seedStaffTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('Connected to MongoDB');

    // Find users
    const manager = await User.findOne({ role: 'manager' });
    const staffUsers = await User.find({ role: 'staff' }).limit(3);

    if (!manager) {
      console.log('No manager found');
      return;
    }

    // Clear existing tasks
    await StaffTask.deleteMany({});

    // Create sample tasks
    const tasks = [
      {
        title: 'Room 101 Deep Cleaning',
        description: 'Complete deep cleaning and maintenance check for room 101',
        department: 'Housekeeping',
        priority: 'high',
        status: 'assigned',
        assignedBy: manager._id,
        assignedTo: staffUsers[0]?._id,
        location: 'room',
        roomNumber: '101',
        category: 'deep_cleaning',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        estimatedDuration: 120
      },
      {
        title: 'Kitchen Equipment Maintenance',
        description: 'Perform routine maintenance on kitchen appliances',
        department: 'Maintenance',
        priority: 'medium',
        status: 'pending',
        assignedBy: manager._id,
        location: 'kitchen',
        category: 'appliance',
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        estimatedDuration: 90
      },
      {
        title: 'Guest Welcome Preparation',
        description: 'Prepare welcome amenities for suite guest arriving tomorrow',
        department: 'Service',
        priority: 'low',
        status: 'assigned',
        assignedBy: manager._id,
        assignedTo: staffUsers[1]?._id,
        location: 'lobby',
        category: 'guest_request',
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        estimatedDuration: 30
      }
    ];

    const createdTasks = await StaffTask.insertMany(tasks);
    console.log(`Created ${createdTasks.length} staff tasks`);

    createdTasks.forEach(task => {
      console.log(`- ${task.title} (${task.department}) - ${task.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedStaffTasks();
