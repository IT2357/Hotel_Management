// routes/managerRoutes.js
import express from 'express';
import { getDashboardData } from '../controllers/manager/dashboardController.js';
import { getTasks, createTask, updateTask } from '../controllers/manager/taskController.js';
import { getStaff, createStaff, updateStaffStatus } from '../controllers/manager/staffController.js';
import { getPerformance } from '../controllers/manager/performanceController.js';
// NOTE: Seeding script was CommonJS and referenced non-existent models; omit for now to avoid runtime errors
// import { seedData } from '../scripts/seed.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import Staff from '../models/profiles/StaffProfile.js';
import Task from '../models/manager/Task.js';
import { Guest } from '../models/User.js';

// Router
const router = express.Router();

// 🌟 Temporary demo seed route (bypasses auth) - remove in production
router.post('/demo-seed-public', async (req, res) => {
  try {
    // Create or find staff
    const staffData = [
      { name: 'Carol Davis', email: 'carol.davis@hotel.com', role: 'maintenance', department: 'Maintenance', isOnline: true },
      { name: 'David Wilson', email: 'david.wilson@hotel.com', role: 'room-service', department: 'Food & Beverage', isOnline: true },
      { name: 'Bob Smith', email: 'bob.smith@hotel.com', role: 'housekeeping', department: 'Housekeeping', isOnline: true },
    ];

    const staffMap = {};
    for (const s of staffData) {
      const existing = await Staff.findOne({ email: s.email });
      if (existing) {
        staffMap[s.name] = existing;
      } else {
        const created = await Staff.create({ ...s, password: 'Temp#12345' });
        staffMap[s.name] = created;
      }
    }

    // Create guests (bypass password requirement using authProviders)
    const guestData = [
      { name: 'Mike Johnson', email: 'mike.johnson@guest.hotel', roomNumber: '156' },
      { name: 'John Doe', email: 'john.doe@guest.hotel', roomNumber: '204' },
      { name: 'Sarah Wilson', email: 'sarah.wilson@guest.hotel', roomNumber: '408' },
      { name: 'Jane Smith', email: 'jane.smith@guest.hotel', roomNumber: '312' },
      { name: 'Tom Brown', email: 'tom.brown@guest.hotel', roomNumber: '501' },
    ];

    const guestMap = {};
    for (const g of guestData) {
      let guest = await Guest.findOne({ email: g.email });
      if (!guest) {
        guest = new Guest({
          name: g.name,
          email: g.email,
          role: 'guest',
          emailVerified: true,
          isApproved: true,
          authProviders: [{ provider: 'google', providerId: `seed-${g.email}`, email: g.email }],
        });
        await guest.save();
      }
      guestMap[g.name] = { doc: guest, roomNumber: g.roomNumber };
    }

    // Helper to time offsets
    const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000);

    // Create tasks roughly matching the mockup cards
    const samples = [
      {
        title: 'Kitchen - Special Diet Meal',
        description: 'Gluten-free dinner for guest with dietary restrictions',
        category: 'General',
        priority: 'urgent',
        status: 'pending',
        guestName: 'Tom Brown',
        guestKey: 'Tom Brown',
        roomNumber: '501',
        estimatedTime: 45,
        createdAt: minutesAgo(15),
      },
      {
        title: 'Maintenance - AC Repair',
        description: 'Air conditioning not working properly in room',
        category: 'Maintenance',
        priority: 'high',
        status: 'completed',
        guestName: 'Mike Johnson',
        guestKey: 'Mike Johnson',
        roomNumber: '156',
        estimatedTime: 60,
        assignedToName: 'Carol Davis',
        createdAt: minutesAgo(120),
        completedAt: minutesAgo(30),
      },
      {
        title: 'Room Service - Breakfast',
        description: 'Continental breakfast for 2 guests',
        category: 'Room Service',
        priority: 'medium',
        status: 'pending',
        guestName: 'John Doe',
        guestKey: 'John Doe',
        roomNumber: '204',
        estimatedTime: 30,
        createdAt: minutesAgo(30),
      },
      {
        title: 'Concierge - Restaurant Reservation',
        description: 'Make dinner reservation for 4 people at 7 PM',
        category: 'Concierge',
        priority: 'medium',
        status: 'completed',
        guestName: 'Sarah Wilson',
        guestKey: 'Sarah Wilson',
        roomNumber: '408',
        estimatedTime: 15,
        assignedToName: 'David Wilson',
        createdAt: minutesAgo(180),
        completedAt: minutesAgo(160),
      },
      {
        title: 'Housekeeping - Extra Towels and Linens',
        description: 'Guest requested 4 extra towels and fresh linens',
        category: 'Housekeeping',
        priority: 'low',
        status: 'in-progress',
        guestName: 'Jane Smith',
        guestKey: 'Jane Smith',
        roomNumber: '312',
        estimatedTime: 20,
        assignedToName: 'Bob Smith',
        createdAt: minutesAgo(45),
      },
    ];

    const created = [];
    for (const s of samples) {
      const guestInfo = guestMap[s.guestKey];
      const payload = {
        title: s.title,
        description: s.description,
        category: s.category,
        priority: s.priority,
        status: s.status,
        guest: guestInfo.doc._id,
        guestName: s.guestName,
        roomNumber: s.roomNumber,
        estimatedTime: s.estimatedTime,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
      };
      if (s.assignedToName) {
        payload.assignedTo = staffMap[s.assignedToName]._id;
        if (payload.status === 'pending') payload.status = 'assigned';
      }

      // Prevent duplicates by title + roomNumber in last day
      const existing = await Task.findOne({ title: s.title, roomNumber: s.roomNumber, createdAt: { $gte: minutesAgo(1440) } });
      const doc = existing ? existing : await Task.create(payload);
      created.push(doc);
    }

    res.json({
      success: true,
      message: `Created ${created.length} sample tasks`,
      tasks: created
    });
  } catch (error) {
    console.error('Demo seed error:', error);
    res.status(500).json({ error: 'Failed to seed demo data', details: error.message });
  }
});

// 🔒 Global middleware for manager routes - only approved managers
router.use(authenticateToken, authorizeRoles({ roles: ['manager'] }));

// 📊 Dashboard routes
router.get('/dashboard', getDashboardData);

// 🧪 Test endpoint to verify API connectivity
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Manager API is working!',
      timestamp: new Date().toISOString(),
      tasks: [
        {
          id: 'test-1',
          title: 'Test Task 1',
          description: 'This is a test task',
          status: 'pending',
          priority: 'medium',
          category: 'General',
          guestName: 'Test Guest',
          roomNumber: '101',
          estimatedTime: 30,
          createdAt: new Date(),
          assignedStaff: null
        },
        {
          id: 'test-2', 
          title: 'Test Task 2',
          description: 'Another test task',
          status: 'in-progress',
          priority: 'high',
          category: 'Maintenance',
          guestName: 'Another Guest',
          roomNumber: '202',
          estimatedTime: 45,
          createdAt: new Date(),
          assignedStaff: {
            id: 'staff-1',
            name: 'John Staff',
            role: 'maintenance',
            isOnline: true
          }
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📋 Task management routes
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:taskId', updateTask);

// 👥 Staff management routes
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.patch('/staff/:staffId/status', updateStaffStatus);

// 📈 Performance metrics routes
router.get('/performance', getPerformance);

// 🛠️ Staff profiles route
router.get('/staff-profiles', async (req, res) => {
  try {
    const staffProfiles = await Staff.find({ isOnline: { $ne: false } })
      .select('name email role isOnline rating tasksCompleted lastActivity');

    res.json({
      success: true,
      data: staffProfiles.map((profile) => ({
        staffId: profile._id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        isOnline: profile.isOnline,
        rating: profile.rating,
        tasksCompleted: profile.tasksCompleted,
        lastActivity: profile.lastActivity,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff profiles',
      error: error.message,
    });
  }
});

// 🌟 Demo seed route to populate sample staff/guests/tasks for Task Management UI
router.post('/demo-seed', async (req, res) => {
  try {
    // Create or find staff
    const staffData = [
      { name: 'Carol Davis', email: 'carol.davis@hotel.com', role: 'maintenance', department: 'Maintenance', isOnline: true },
      { name: 'David Wilson', email: 'david.wilson@hotel.com', role: 'room-service', department: 'Food & Beverage', isOnline: true },
      { name: 'Bob Smith', email: 'bob.smith@hotel.com', role: 'housekeeping', department: 'Housekeeping', isOnline: true },
    ];

    const staffMap = {};
    for (const s of staffData) {
      const existing = await Staff.findOne({ email: s.email });
      if (existing) {
        staffMap[s.name] = existing;
      } else {
        const created = await Staff.create({ ...s, password: 'Temp#12345' });
        staffMap[s.name] = created;
      }
    }

    // Create guests (bypass password requirement using authProviders)
    const guestData = [
      { name: 'Mike Johnson', email: 'mike.johnson@guest.hotel', roomNumber: '156' },
      { name: 'John Doe', email: 'john.doe@guest.hotel', roomNumber: '204' },
      { name: 'Sarah Wilson', email: 'sarah.wilson@guest.hotel', roomNumber: '408' },
      { name: 'Jane Smith', email: 'jane.smith@guest.hotel', roomNumber: '312' },
      { name: 'Tom Brown', email: 'tom.brown@guest.hotel', roomNumber: '501' },
    ];

    const guestMap = {};
    for (const g of guestData) {
      let guest = await Guest.findOne({ email: g.email });
      if (!guest) {
        guest = new Guest({
          name: g.name,
          email: g.email,
          role: 'guest',
          emailVerified: true,
          isApproved: true,
          authProviders: [{ provider: 'google', providerId: `seed-${g.email}`, email: g.email }],
        });
        await guest.save();
      }
      guestMap[g.name] = { doc: guest, roomNumber: g.roomNumber };
    }

    // Helper to time offsets
    const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000);

    // Create tasks roughly matching the mockup cards
    const samples = [
      {
        title: 'Kitchen - Special Diet Meal',
        description: 'Gluten-free dinner for guest with dietary restrictions',
        category: 'General',
        priority: 'urgent',
        status: 'pending',
        guestName: 'Tom Brown',
        guestKey: 'Tom Brown',
        roomNumber: '501',
        estimatedTime: 45,
        createdAt: minutesAgo(15),
      },
      {
        title: 'Maintenance - AC Repair',
        description: 'Air conditioning not working properly in room',
        category: 'Maintenance',
        priority: 'high',
        status: 'completed',
        guestName: 'Mike Johnson',
        guestKey: 'Mike Johnson',
        roomNumber: '156',
        estimatedTime: 60,
        assignedToName: 'Carol Davis',
        createdAt: minutesAgo(120),
        completedAt: minutesAgo(30),
      },
      {
        title: 'Room Service - Breakfast',
        description: 'Continental breakfast for 2 guests',
        category: 'Room Service',
        priority: 'medium',
        status: 'pending',
        guestName: 'John Doe',
        guestKey: 'John Doe',
        roomNumber: '204',
        estimatedTime: 30,
        createdAt: minutesAgo(30),
      },
      {
        title: 'Concierge - Restaurant Reservation',
        description: 'Make dinner reservation for 4 people at 7 PM',
        category: 'Concierge',
        priority: 'medium',
        status: 'completed',
        guestName: 'Sarah Wilson',
        guestKey: 'Sarah Wilson',
        roomNumber: '408',
        estimatedTime: 15,
        assignedToName: 'David Wilson',
        createdAt: minutesAgo(180),
        completedAt: minutesAgo(160),
      },
      {
        title: 'Housekeeping - Extra Towels and Linens',
        description: 'Guest requested 4 extra towels and fresh linens',
        category: 'Housekeeping',
        priority: 'low',
        status: 'in-progress',
        guestName: 'Jane Smith',
        guestKey: 'Jane Smith',
        roomNumber: '312',
        estimatedTime: 20,
        assignedToName: 'Bob Smith',
        createdAt: minutesAgo(45),
      },
    ];

    const created = [];
    for (const s of samples) {
      const guestInfo = guestMap[s.guestKey];
      const payload = {
        title: s.title,
        description: s.description,
        category: s.category,
        priority: s.priority,
        status: s.status,
        guest: guestInfo.doc._id,
        guestName: s.guestName,
        roomNumber: s.roomNumber,
        estimatedTime: s.estimatedTime,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
      };
      if (s.assignedToName) {
        payload.assignedTo = staffMap[s.assignedToName]._id;
        if (payload.status === 'pending') payload.status = 'assigned';
      }

      // Prevent duplicates by title + roomNumber in last day
      const existing = await Task.findOne({ title: s.title, roomNumber: s.roomNumber, createdAt: { $gte: minutesAgo(1440) } });
      const doc = existing ? existing : await Task.create(payload);
      created.push(doc);
    }

    // Add more completed tasks for better dashboard metrics
    const additionalTasks = [
      {
        title: 'Room Service - Late Checkout',
        description: 'Process late checkout for VIP guest',
        category: 'Room Service',
        priority: 'high',
        status: 'completed',
        guestName: 'Tom Brown',
        guestKey: 'Tom Brown',
        roomNumber: '501',
        estimatedTime: 30,
        assignedToName: 'David Wilson',
        createdAt: minutesAgo(300),
        completedAt: minutesAgo(280),
      },
      {
        title: 'Maintenance - Light Bulb Replacement',
        description: 'Replace burnt light bulbs in bathroom',
        category: 'Maintenance',
        priority: 'low',
        status: 'completed',
        guestName: 'Mike Johnson',
        guestKey: 'Mike Johnson',
        roomNumber: '156',
        estimatedTime: 15,
        assignedToName: 'Carol Davis',
        createdAt: minutesAgo(240),
        completedAt: minutesAgo(220),
      },
      {
        title: 'Housekeeping - Deep Clean',
        description: 'Deep cleaning after guest checkout',
        category: 'Housekeeping',
        priority: 'medium',
        status: 'completed',
        guestName: 'Sarah Wilson',
        guestKey: 'Sarah Wilson',
        roomNumber: '408',
        estimatedTime: 90,
        assignedToName: 'Bob Smith',
        createdAt: minutesAgo(360),
        completedAt: minutesAgo(270),
      }
    ];

    // Create additional tasks for dashboard metrics
    for (const s of additionalTasks) {
      const guestInfo = guestMap[s.guestKey];
      const payload = {
        title: s.title,
        description: s.description,
        category: s.category,
        priority: s.priority,
        status: s.status,
        guest: guestInfo.doc._id,
        guestName: s.guestName,
        roomNumber: s.roomNumber,
        estimatedTime: s.estimatedTime,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
      };
      if (s.assignedToName) {
        payload.assignedTo = staffMap[s.assignedToName]._id;
      }

      // Prevent duplicates
      const existing = await Task.findOne({ title: s.title, roomNumber: s.roomNumber, createdAt: { $gte: minutesAgo(1440) } });
      if (!existing) {
        const doc = await Task.create(payload);
        created.push(doc);
      }
    }

    // Update staff ratings and completion counts for dashboard metrics
    await Staff.updateOne(
      { _id: staffMap['Carol Davis']._id },
      { $set: { rating: 4.8, tasksCompleted: 23, lastActivity: minutesAgo(30) } }
    );
    await Staff.updateOne(
      { _id: staffMap['David Wilson']._id },
      { $set: { rating: 4.6, tasksCompleted: 18, lastActivity: minutesAgo(15) } }
    );
    await Staff.updateOne(
      { _id: staffMap['Bob Smith']._id },
      { $set: { rating: 4.9, tasksCompleted: 31, lastActivity: minutesAgo(45) } }
    );

    const populated = await Task.find({ _id: { $in: created.map(d => d._id) } })
      .populate('assignedTo', 'name role avatar isOnline')
      .populate('guest', 'name email');

    res.json({ success: true, count: populated.length, tasks: populated });
  } catch (error) {
    console.error('Demo seed error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed demo data', error: error.message });
  }
});

// 🌱 Seed data route (disabled until script is migrated to ESM and corrected models)
// router.post('/seed', authorizeRoles({ permissions: ['seed:write'] }), seedData);

export default router;