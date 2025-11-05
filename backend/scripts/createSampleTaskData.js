// Sample data creation script for testing the task management system
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { User } from '../models/User.js';
import GuestServiceRequest from '../models/GuestServiceRequest.js';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-management');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSampleData = async () => {
  await connectDB();
  
  try {
    console.log('Creating sample guest user...');
    
    // Create a sample guest user
    const guestUser = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'guest',
      emailVerified: true,
      isActive: true,
      isApproved: true
    });
    
    console.log('Creating staff members...');
    
    // Create sample staff members
    const staffMembers = await User.insertMany([
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@hotel.com',
        password: 'staff123',
        role: 'staff',
        department: 'Maintenance',
        emailVerified: true,
        isActive: true,
        isApproved: true
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@hotel.com',
        password: 'staff123',
        role: 'staff',
        department: 'Housekeeping',
        emailVerified: true,
        isActive: true,
        isApproved: true
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@hotel.com',
        password: 'staff123',
        role: 'staff',
        department: 'Room Service',
        emailVerified: true,
        isActive: true,
        isApproved: true
      }
    ]);
    
    console.log('Creating sample tasks...');
    
    // Create sample tasks
    const tasks = await Task.insertMany([
      {
        title: 'AC Repair in Room 203',
        description: 'The air conditioning unit is not working properly. Guest complaints of no cooling.',
        status: 'pending',
        priority: 'high',
        department: 'Maintenance',
        requestedAt: new Date(),
        guestId: guestUser._id,
        roomNumber: '203',
        estimatedDuration: 120, // 2 hours
        category: 'Maintenance',
        urgencyLevel: 'high'
      },
      {
        title: 'Fresh Towels Request',
        description: 'Guest requested additional fresh towels for the bathroom.',
        status: 'pending',
        priority: 'medium',
        department: 'Housekeeping',
        requestedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        guestId: guestUser._id,
        roomNumber: '205',
        estimatedDuration: 15,
        category: 'Housekeeping',
        urgencyLevel: 'medium'
      },
      {
        title: 'Room Service - Dinner Order',
        description: 'Late dinner order: Grilled salmon with vegetables and red wine.',
        status: 'pending',
        priority: 'medium',
        department: 'Room Service',
        requestedAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
        guestId: guestUser._id,
        roomNumber: '210',
        estimatedDuration: 45,
        category: 'Food & Beverage',
        urgencyLevel: 'medium'
      },
      {
        title: 'Bathroom Drain Clogged',
        description: 'The bathroom sink drain is completely blocked. Water not draining.',
        status: 'pending',
        priority: 'critical',
        department: 'Maintenance',
        requestedAt: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago (should trigger auto-assignment)
        guestId: guestUser._id,
        roomNumber: '107',
        estimatedDuration: 90,
        category: 'Emergency',
        urgencyLevel: 'critical'
      }
    ]);
    
    console.log('Sample data created successfully!');
    console.log(`Created:
    - 1 guest user (${guestUser.name})
    - ${staffMembers.length} staff members
    - ${tasks.length} tasks
    `);
    
    console.log('Tasks created:');
    tasks.forEach(task => {
      console.log(`- ${task.title} (${task.priority}) - ${task.department}`);
    });
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createSampleData();