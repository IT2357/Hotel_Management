// Test script to create sample tasks for testing
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { User } from '../models/User.js';

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-management');
    console.log('Connected to MongoDB');

    // Find a manager user
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.log('No manager user found. Please create a manager user first.');
      return;
    }

    // Find staff users
    const staffUsers = await User.find({ role: 'staff' }).limit(4);
    console.log(`Found ${staffUsers.length} staff users`);

    // Find a guest user for test data
    const guest = await User.findOne({ role: 'guest' });
    const guestId = guest ? guest._id : manager._id; // Use manager if no guest found

    // Create sample tasks
    const now = new Date();
    const sampleTasks = [
      {
        title: 'Room 101 - Extra Towels',
        description: 'Guest requested additional towels for room 101',
        type: 'services',
        department: 'Services',
        priority: 'medium',
        guestId: guestId,
        guestName: 'John Smith',
        roomNumber: '101',
        assignedBy: manager._id,
        assignedTo: staffUsers[0]?._id,
        status: staffUsers[0] ? 'assigned' : 'pending',
        requestDate: now,
        dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
      },
      {
        title: 'Kitchen - Special Diet Meal',
        description: 'Prepare gluten-free meal for guest in room 205',
        type: 'food',
        department: 'Kitchen',
        priority: 'high',
        guestId: guestId,
        guestName: 'Sarah Johnson',
        roomNumber: '205',
        assignedBy: manager._id,
        assignedTo: staffUsers[0]?._id,
        status: staffUsers[0] ? 'in-progress' : 'pending',
        requestDate: now,
        dueDate: new Date(now.getTime() + 1 * 60 * 60 * 1000) // 1 hour from now
      },
      {
        title: 'Maintenance - AC Repair',
        description: 'Air conditioning not working in room 308',
        type: 'maintenance',
        department: 'Maintenance',
        priority: 'high',
        guestId: guestId,
        guestName: 'Mike Wilson',
        roomNumber: '308',
        assignedBy: manager._id,
        status: 'pending',
        requestDate: now,
        dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours from now
      },
      {
        title: 'Cleaning - Deep Clean',
        description: 'Deep cleaning requested for room 412 after checkout',
        type: 'cleaning',
        department: 'Cleaning',
        priority: 'medium',
        guestId: guestId,
        guestName: 'Emma Davis',
        roomNumber: '412',
        assignedBy: manager._id,
        status: 'pending',
        requestDate: now,
        dueDate: new Date(now.getTime() + 3 * 60 * 60 * 1000) // 3 hours from now
      },
      {
        title: 'Kitchen - Room Service',
        description: 'Guest requested breakfast in room',
        type: 'food',
        department: 'Kitchen',
        priority: 'low',
        guestId: guestId,
        guestName: 'Robert Brown',
        roomNumber: '156',
        assignedBy: manager._id,
        assignedTo: staffUsers[0]?._id,
        status: staffUsers[0] ? 'completed' : 'pending',
        requestDate: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        dueDate: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        completedAt: staffUsers[0] ? new Date() : undefined
      }
    ];

    // Delete existing test tasks
    await Task.deleteMany({ title: { $regex: /^(Room|Kitchen|Maintenance|Cleaning)/ } });
    console.log('Cleared existing test tasks');

    // Insert new tasks
    const createdTasks = await Task.insertMany(sampleTasks);
    console.log(`Created ${createdTasks.length} test tasks:`);
    
    createdTasks.forEach(task => {
      console.log(`- ${task.title} (${task.department}) - ${task.status}`);
    });

    console.log('\nTest data created successfully!');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();