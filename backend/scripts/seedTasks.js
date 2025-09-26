// scripts/seedTasks.js
import mongoose from 'mongoose';
import StaffTask from '../models/StaffTask.js';
import { connectDB } from '../config/database.js';

const seedTasks = async () => {
  try {
    console.log('🌱 Seeding staff tasks...');

    // Connect to database
    await connectDB();

    // Check if tasks already exist
    const existingCount = await StaffTask.countDocuments();
    if (existingCount > 0) {
      console.log(`📋 Tasks already exist (${existingCount} tasks found). Skipping seed.`);
      return;
    }

    // Sample tasks data
    const tasks = [
      {
        title: 'Clean Room 101 - Deep Cleaning',
        description: 'Perform deep cleaning of Deluxe Room 101 including carpet shampoo, window cleaning, and appliance sanitization.',
        department: 'Housekeeping',
        priority: 'high',
        status: 'pending',
        location: 'room',
        roomNumber: '101',
        category: 'deep_cleaning',
        estimatedDuration: 120, // 2 hours
        complexity: 4,
        estimatedPoints: 15,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        tags: ['checkout', 'cleaning', 'urgent'],
        notes: [{
          content: 'Guest complained about room cleanliness on previous stay',
          addedAt: new Date()
        }]
      },
      {
        title: 'Fix leaking faucet in Room 205',
        description: 'Repair the leaking faucet in the bathroom of Room 205. Replace washer and check for pipe damage.',
        department: 'Maintenance',
        priority: 'medium',
        status: 'assigned',
        location: 'room',
        roomNumber: '205',
        category: 'plumbing',
        estimatedDuration: 45,
        complexity: 2,
        estimatedPoints: 8,
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        materials: ['washer', 'pipe tape', 'pliers'],
        tags: ['plumbing', 'repair']
      },
      {
        title: 'Restock minibar in Executive Suite 301',
        description: 'Restock minibar with beverages, snacks, and amenities as per the executive suite checklist.',
        department: 'Housekeeping',
        priority: 'low',
        status: 'in_progress',
        location: 'room',
        roomNumber: '301',
        category: 'restocking',
        estimatedDuration: 30,
        complexity: 1,
        estimatedPoints: 5,
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        tags: ['restocking', 'minibar']
      },
      {
        title: 'Prepare welcome amenities for VIP guest',
        description: 'Arrange special welcome amenities including champagne, fruit basket, and personalized note for VIP guest arriving tomorrow.',
        department: 'Service',
        priority: 'high',
        status: 'pending',
        location: 'room',
        roomNumber: '501',
        category: 'guest_request',
        estimatedDuration: 60,
        complexity: 3,
        estimatedPoints: 10,
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        tags: ['vip', 'welcome', 'amenities']
      },
      {
        title: 'Repair broken air conditioning in Pool Area',
        description: 'Diagnose and repair the malfunctioning air conditioning unit serving the pool deck area.',
        department: 'Maintenance',
        priority: 'urgent',
        status: 'pending',
        location: 'pool',
        category: 'hvac',
        estimatedDuration: 180, // 3 hours
        complexity: 5,
        estimatedPoints: 25,
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        materials: ['multimeter', 'refrigerant', 'tools'],
        tags: ['hvac', 'pool', 'urgent'],
        isUrgent: true
      },
      {
        title: 'Clean and organize kitchen storage',
        description: 'Deep clean and reorganize the main kitchen storage area, including shelving, inventory check, and pest control inspection.',
        department: 'Kitchen',
        priority: 'medium',
        status: 'pending',
        location: 'kitchen',
        category: 'cleaning',
        estimatedDuration: 90,
        complexity: 3,
        estimatedPoints: 12,
        dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        tags: ['kitchen', 'organization', 'inventory']
      },
      {
        title: 'Replace burned out light bulbs in Lobby',
        description: 'Replace all burned out light bulbs in the main lobby chandelier and wall sconces.',
        department: 'Maintenance',
        priority: 'low',
        status: 'completed',
        location: 'lobby',
        category: 'electrical',
        estimatedDuration: 20,
        complexity: 1,
        estimatedPoints: 3,
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        tags: ['electrical', 'lighting', 'lobby']
      },
      {
        title: 'Guest requested extra towels',
        description: 'Guest in Room 112 requested additional towels and bathrobes for their extended stay.',
        department: 'Housekeeping',
        priority: 'medium',
        status: 'assigned',
        location: 'room',
        roomNumber: '112',
        category: 'guest_request',
        estimatedDuration: 15,
        complexity: 1,
        estimatedPoints: 4,
        dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        tags: ['guest_request', 'linens']
      }
    ];

    await StaffTask.insertMany(tasks);
    console.log(`✅ Successfully seeded ${tasks.length} staff tasks`);
    console.log('📋 Task statuses: 3 pending, 2 assigned, 1 in_progress, 1 completed, 1 urgent');

  } catch (error) {
    console.error('❌ Error seeding tasks:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedTasks().catch(console.error);
