// Seed comprehensive Staff Analytics data for Performance Charts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StaffTask from '../models/StaffTask.js';
import { User } from '../models/User.js';

dotenv.config();

const departments = ['Housekeeping', 'Maintenance', 'Kitchen', 'Service'];

// Sample staff members data
const staffMembers = [
  { name: 'Maria Rodriguez', email: 'maria.rodriguez@hotel.com', role: 'staff', department: 'Housekeeping', position: 'Housekeeping Lead', status: 'active' },
  { name: 'John Smith', email: 'john.smith@hotel.com', role: 'staff', department: 'Maintenance', position: 'Maintenance Tech', status: 'active' },
  { name: 'Lisa Chen', email: 'lisa.chen@hotel.com', role: 'staff', department: 'Service', position: 'Front Desk Manager', status: 'active' },
  { name: 'Carlos Martinez', email: 'carlos.martinez@hotel.com', role: 'staff', department: 'Kitchen', position: 'Head Chef', status: 'active' },
  { name: 'Sarah Williams', email: 'sarah.williams@hotel.com', role: 'staff', department: 'Housekeeping', position: 'Senior Housekeeper', status: 'inactive' },
  { name: 'Mike Johnson', email: 'mike.johnson@hotel.com', role: 'staff', department: 'Maintenance', position: 'Maintenance Lead', status: 'active' },
  { name: 'Emily Davis', email: 'emily.davis@hotel.com', role: 'staff', department: 'Service', position: 'Receptionist', status: 'active' },
  { name: 'David Lee', email: 'david.lee@hotel.com', role: 'staff', department: 'Kitchen', position: 'Sous Chef', status: 'inactive' },
];

// Task categories (must match StaffTask schema enum)
const taskCategories = [
  'cleaning',
  'deep_cleaning',
  'laundry',
  'restocking',
  'inspection',
  'guest_request',
  'room_service',
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'food_preparation',
  'cooking',
  'inventory',
  'equipment',
];

const priorities = ['low', 'medium', 'high'];
const statuses = ['completed', 'in_progress', 'pending', 'cancelled'];

// Generate tasks for the last 30 days
function generateTasksForDateRange(staffUsers, manager, daysAgo = 30) {
  const tasks = [];
  const now = new Date();

  for (let i = 0; i < daysAgo; i++) {
    const taskDate = new Date(now);
    taskDate.setDate(taskDate.getDate() - i);

    // Generate 10-20 tasks per day
    const tasksPerDay = Math.floor(Math.random() * 11) + 10;

    for (let j = 0; j < tasksPerDay; j++) {
      const randomStaff = staffUsers[Math.floor(Math.random() * staffUsers.length)];
      const department = randomStaff.department; // Use department from our mapping
      const category = taskCategories[Math.floor(Math.random() * taskCategories.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      // 70% completion rate for older tasks, 50% for recent
      const completionChance = i > 7 ? 0.7 : 0.5;
      let status = Math.random() < completionChance ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];

      // Create task creation date and completion date
      const createdAt = new Date(taskDate);
      createdAt.setHours(8 + Math.floor(Math.random() * 12));
      
      let completedAt = null;
      let actualDuration = null;
      let performanceMetrics = null;

      if (status === 'completed') {
        completedAt = new Date(createdAt);
        completedAt.setHours(createdAt.getHours() + Math.floor(Math.random() * 4) + 1);
        actualDuration = Math.floor((completedAt - createdAt) / (1000 * 60)); // minutes
        
        // Generate performance metrics for completed tasks
        performanceMetrics = {
          qualityRating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
          timeEfficiency: Math.floor(Math.random() * 30) + 70, // 70-100%
          guestSatisfaction: Math.floor(Math.random() * 2) + 4, // 4-5 rating
        };
      }

      // Determine location based on department
      let location;
      if (department === 'Housekeeping') {
        location = Math.random() > 0.3 ? 'room' : 'lobby';
      } else if (department === 'Kitchen') {
        location = 'kitchen';
      } else if (department === 'Maintenance') {
        const locations = ['room', 'kitchen', 'lobby', 'gym', 'pool', 'parking'];
        location = locations[Math.floor(Math.random() * locations.length)];
      } else {
        location = Math.random() > 0.5 ? 'lobby' : 'room';
      }

      tasks.push({
        title: `${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${i}d${j}`,
        description: `Task ${j + 1} for ${taskDate.toLocaleDateString()}`,
        department,
        category,
        priority,
        status,
        assignedBy: manager._id,
        assignedTo: randomStaff.user._id,
        location,
        roomNumber: location === 'room' ? `${Math.floor(Math.random() * 300) + 100}` : undefined,
        createdAt,
        completedAt,
        actualDuration,
        performanceMetrics,
        estimatedDuration: Math.floor(Math.random() * 90) + 30,
        dueDate: new Date(taskDate.getTime() + 8 * 60 * 60 * 1000),
      });
    }
  }

  return tasks;
}

async function seedStaffAnalytics() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');

    // Find or create manager
    let manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.log('📝 Creating manager user...');
      manager = await User.create({
        name: 'Hotel Manager',
        email: 'manager@hotel.com',
        password: 'manager123', // Will be hashed by the model
        role: 'manager',
        status: 'active',
      });
      console.log('✅ Manager created');
    }

    // Create or update staff members
    console.log('👥 Creating/updating staff members...');
    const createdStaff = [];
    const staffDepartmentMap = new Map(); // Map staff ID to department
    
    for (const staffData of staffMembers) {
      let staff = await User.findOne({ email: staffData.email });
      
      if (!staff) {
        staff = await User.create({
          name: staffData.name,
          email: staffData.email,
          password: 'staff123', // Will be hashed by the model
          role: staffData.role,
          department: staffData.department,
          position: staffData.position,
          status: staffData.status,
          isOnline: staffData.status === 'active',
        });
        console.log(`✅ Created: ${staff.name} (${staffData.department})`);
      } else {
        // Update existing staff
        staff = await User.findByIdAndUpdate(
          staff._id,
          {
            department: staffData.department,
            position: staffData.position,
            status: staffData.status,
            isOnline: staffData.status === 'active',
          },
          { new: true } // Return the updated document
        );
        console.log(`🔄 Updated: ${staff.name} (${staffData.department})`);
      }
      
      // Store department mapping
      staffDepartmentMap.set(staff._id.toString(), staffData.department);
      createdStaff.push({ user: staff, department: staffData.department });
    }

    // Clear existing staff tasks
    console.log('🗑️  Clearing existing staff tasks...');
    await StaffTask.deleteMany({});

    // Generate tasks for last 30 days
    console.log('📊 Generating 30 days of task data...');
    const tasks = generateTasksForDateRange(createdStaff, manager, 30);

    // Insert tasks in batches
    console.log(`💾 Inserting ${tasks.length} tasks...`);
    await StaffTask.insertMany(tasks);

    // Calculate and display statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = ((completedTasks / totalTasks) * 100).toFixed(1);

    const departmentStats = {};
    departments.forEach(dept => {
      const deptTasks = tasks.filter(t => t.department === dept);
      const deptCompleted = deptTasks.filter(t => t.status === 'completed').length;
      departmentStats[dept] = {
        total: deptTasks.length,
        completed: deptCompleted,
        rate: deptTasks.length > 0 ? ((deptCompleted / deptTasks.length) * 100).toFixed(1) : 0,
      };
    });

    console.log('\n✨ ============================================');
    console.log('✨ STAFF ANALYTICS DATA SEEDED SUCCESSFULLY!');
    console.log('✨ ============================================\n');
    
    console.log('📈 Overall Statistics:');
    console.log(`   Total Staff: ${createdStaff.length}`);
    console.log(`   Active Staff: ${createdStaff.filter(s => s.user.status === 'active').length}`);
    console.log(`   Total Tasks: ${totalTasks}`);
    console.log(`   Completed Tasks: ${completedTasks}`);
    console.log(`   Completion Rate: ${completionRate}%\n`);

    console.log('🏢 Department Statistics:');
    Object.entries(departmentStats).forEach(([dept, stats]) => {
      console.log(`   ${dept}: ${stats.completed}/${stats.total} tasks (${stats.rate}%)`);
    });

    console.log('\n👥 Staff Members:');
    createdStaff.forEach(staffObj => {
      console.log(`   - ${staffObj.user.name} (${staffObj.department}) - ${staffObj.user.status}`);
    });

    console.log('\n🎯 You can now view the Staff Analytics page with real data!');
    console.log('📊 Navigate to: /manager/staff/analytics\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedStaffAnalytics()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
