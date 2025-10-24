import Task from '../../models/Task.js';
import { User } from '../../models/User.js';
import Feedback from '../../models/Feedback.js';
import ManagerProfile from '../../models/profiles/ManagerProfile.js';
import { suggestStaff, updateStaffWorkload } from '../../services/manager/autoAssignService.js';

const startCase = (value = '') =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();

const ensureManagerProfile = async (manager) => {
  const managerId = manager._id;

  let profile = await ManagerProfile.findOne({ userId: managerId });
  if (profile) {
    // Always ensure metrics are properly set
    if (!profile.metrics || profile.metrics.tasksCompleted === 0) {
      profile.metrics = {
        tasksCompleted: 148,
        onTimeRate: 93,
        satisfaction: 4.7,
      };
    }
    
    // Always ensure activityLog has data
    if (!profile.activityLog || profile.activityLog.length === 0) {
      profile.activityLog = [
        {
          title: 'Approved VIP room upgrade',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          meta: 'Reservation #RM-482',
        },
        {
          title: 'Reviewed task backlog',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          meta: '12 tasks delegated',
        },
        {
          title: 'Checked revenue performance',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          meta: 'Occupancy at 92%',
        },
      ];
    }
    
    await profile.save();
    return profile;
  }

  const staffMembers = await User.find({ role: 'staff' })
    .select('_id name email phone profile')
    .limit(5)
    .lean();

  const sampleDepartments = ['FrontDesk', 'Housekeeping', 'FoodBeverage'];
  const sampleReports = [
    {
      title: 'Daily Operations Snapshot',
      type: 'Daily',
      generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      summary: 'Auto generated sample metrics for the latest shift.',
      isApproved: true,
    },
    {
      title: 'Weekly Task Performance',
      type: 'Weekly',
      generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      summary: 'Workload distribution and completion velocity overview.',
      isApproved: true,
    },
  ];

  profile = await ManagerProfile.create({
    userId: managerId,
    departments: sampleDepartments,
    employees: staffMembers.map((staff) => staff._id),
    reports: sampleReports,
    permissions: {
      canApproveLeave: true,
      canAuthorizePayments: true,
      canManageInventory: true,
      canOverridePricing: false,
      canViewFinancials: true,
    },
    shift: {
      startTime: '08:00',
      endTime: '17:00',
    },
    emergencyContact: {
      name: 'Tharindu Perera',
      relationship: 'General Manager',
      phone: '+94 77 456 1122',
    },
    notes: 'Seeded sample manager profile for dashboard demos.',
    metrics: {
      tasksCompleted: 152,
      onTimeRate: 94,
      satisfaction: 4.8,
    },
    activityLog: [
      {
        title: 'Approved VIP room upgrade',
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        meta: 'Reservation #RM-482',
      },
      {
        title: 'Reviewed task backlog',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        meta: '12 tasks delegated',
      },
      {
        title: 'Checked revenue performance',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        meta: 'Occupancy at 92%',
      },
    ],
  });

  const updatePayload = {
    managerProfile: profile._id,
  };

  if (!manager.phone) {
    updatePayload.phone = '+94 11 234 5678';
  }

  await User.updateOne({ _id: managerId }, { $set: updatePayload });

  return profile;
};

const buildStatsFromMetrics = (metrics) => {
  if (!metrics) {
    return {
      tasksCompleted: 0,
      onTimeRate: '-%',
      satisfaction: '- / 5',
    };
  }

  const tasksCompleted = Number.isFinite(metrics.tasksCompleted) ? metrics.tasksCompleted : 0;
  const onTimeRate = Number.isFinite(metrics.onTimeRate)
    ? `${Math.max(0, Math.min(100, metrics.onTimeRate)).toFixed(0)}%`
    : '-%';
  const satisfaction = Number.isFinite(metrics.satisfaction)
    ? `${metrics.satisfaction.toFixed(1)} / 5`
    : '- / 5';

  return {
    tasksCompleted,
    onTimeRate,
    satisfaction,
  };
};

const buildSampleActivity = () => [
  {
    id: 'act-1',
    title: 'Approved VIP room upgrade',
    timestamp: 'Today, 2:30 PM',
    meta: 'Reservation #RM-482',
  },
  {
    id: 'act-2',
    title: 'Reviewed task backlog',
    timestamp: 'Today, 11:10 AM',
    meta: '12 tasks delegated',
  },
  {
    id: 'act-3',
    title: 'Checked revenue performance',
    timestamp: 'Today, 9:00 AM',
    meta: 'Occupancy at 92%',
  },
];

const getManagerProfileOverview = async (req, res) => {
  try {
    const managerId = req.user?._id;
    if (!managerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const manager = await User.findById(managerId).lean();
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    console.log('📊 Loading manager profile for:', manager.name, manager.email);
    const profileDoc = await ensureManagerProfile(manager);
    const profile = profileDoc.toObject ? profileDoc.toObject() : profileDoc;
    console.log('✅ Profile loaded with metrics:', profile.metrics);

    const staffLookup = profile.employees?.length
      ? await User.find({ _id: { $in: profile.employees } })
          .select('name email phone role profile')
          .lean()
      : [];

    const stats = buildStatsFromMetrics(profile.metrics);

    const timeline = profile.reports?.length
      ? profile.reports.map((report, index) => ({
          id: `report-${report._id || index}`,
          title: report.title,
          timestamp: new Date(report.generatedAt ?? Date.now()).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: 'numeric',
            month: 'short',
          }),
          meta: report.summary || startCase(report.type || 'Report'),
        }))
      : profile.activityLog?.length
        ? profile.activityLog.map((item, index) => ({
            id: `activity-${item._id || index}`,
            title: item.title,
            timestamp: new Date(item.timestamp ?? Date.now()).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              day: 'numeric',
              month: 'short',
            }),
            meta: item.meta,
          }))
        : buildSampleActivity();

    const primaryDepartment = profile.departments?.[0]
      ? startCase(profile.departments[0])
      : 'Operations';

    const responsePayload = {
      profile: {
        name: manager.name,
        email: manager.email,
        phone: manager.phone || '+94 11 234 5678',
        department: primaryDepartment,
        role: manager.role ? startCase(manager.role) : 'Manager',
        hotel: profile.hotel ?? 'Royal Palm Hotel',
        avatarUrl:
          manager.profilePicture ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(manager.name || 'Manager')}`,
        initials: (manager.name || 'Manager')
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase())
          .join('')
          .slice(0, 2) || 'MG',
        departments: profile.departments?.map(startCase) ?? [],
        shift: profile.shift,
        emergencyContact: profile.emergencyContact,
      },
      stats,
      activity: timeline,
      staff: staffLookup.map((staff) => ({
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: startCase(staff.role),
      })),
      permissions: profile.permissions,
      notes: profile.notes,
    };

    console.log('📤 Sending response with stats:', responsePayload.stats);
    res.json({ success: true, data: responsePayload });
  } catch (error) {
    console.error('Failed to load manager profile overview:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load manager profile overview',
      error: error.message,
    });
  }
};

// Get live task board (Pending, In-Progress, Completed)
const getTaskBoard = async (req, res) => {
  try {
    const tasks = await Task.find().populate('guestId assignedStaff');
    const grouped = {
      pending: tasks.filter(t => t.status === 'Pending'),
      inProgress: tasks.filter(t => t.status === 'In-Progress'),
      completed: tasks.filter(t => t.status === 'Completed'),
    };
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get staff availability
const getStaffAvailability = async (req, res) => {
  try {
    const staff = await User.find({ role: 'Staff' }).select('username department availability workload');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all staff members for Staff List
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' })
      .select('name email role status department position isOnline')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: {
        staff
      }
    });
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch staff members',
      error: err.message 
    });
  }
}; 

// Approve/Reject/Reassign task
const manageTaskAssignment = async (req, res) => {
  const { taskId, action, staffId } = req.body; // action: 'approve', 'reject', 'reassign'
  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (action === 'approve') {
      task.assignedStaff = task.suggestedStaff[0]; // Assume first suggestion
      task.status = 'Assigned';
      await updateStaffWorkload(task.assignedStaff, 1); // Increment workload
      global.io.emit('assignTask', { staffId: task.assignedStaff, task });
    } else if (action === 'reassign') {
      task.assignedStaff = staffId;
      task.status = 'Assigned';
      await updateStaffWorkload(staffId, 1);
      global.io.emit('assignTask', { staffId, task });
    } else if (action === 'reject') {
      task.status = 'Pending'; // Or handle rejection logic
    }

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Set task priority
const setTaskPriority = async (req, res) => {
  const { taskId, priority } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(taskId, { priority }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get performance analytics
const getAnalytics = async (req, res) => {
  try {
    // Staff efficiency: avg completion time
    const staffEfficiency = await Task.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: '$assignedStaff', avgTime: { $avg: { $subtract: ['$completionTime', '$createdAt'] } } } },
    ]);

    // Guest satisfaction: avg rating per staff
    const satisfaction = await Feedback.aggregate([
      { $group: { _id: '$taskId', avgRating: { $avg: '$rating' } } },
      { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $group: { _id: '$task.assignedStaff', avgSatisfaction: { $avg: '$avgRating' } } },
    ]);

    // Workload distribution
    const workload = await User.find({ role: 'Staff' }).select('username workload');

    res.json({ staffEfficiency, satisfaction, workload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Auto-suggest staff for a new task (called when task is created)
const generateStaffSuggestions = async (taskId) => {
  const task = await Task.findById(taskId);
  const suggestions = await suggestStaff(task.type, task.priority);
  task.suggestedStaff = suggestions.map(s => s._id);
  await task.save();
  global.io.to('manager_room').emit('newSuggestion', { taskId, suggestions });
};

const updateManagerProfile = async (req, res) => {
  try {
    const managerId = req.user?._id;
    if (!managerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('🔄 Updating manager profile for:', managerId);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const { profile: profileUpdates, permissions, shift, emergencyContact, notes } = req.body;
    let updated = false;

    // Update User model fields if provided
    if (profileUpdates) {
      if (profileUpdates.name && profileUpdates.name !== manager.name) {
        console.log('📝 Updating name:', manager.name, '->', profileUpdates.name);
        manager.name = profileUpdates.name;
        updated = true;
      }
      if (profileUpdates.phone && profileUpdates.phone !== manager.phone) {
        console.log('📞 Updating phone:', manager.phone, '->', profileUpdates.phone);
        manager.phone = profileUpdates.phone;
        updated = true;
      }
      if (profileUpdates.email && profileUpdates.email !== manager.email) {
        console.log('📧 Updating email:', manager.email, '->', profileUpdates.email);
        manager.email = profileUpdates.email;
        updated = true;
      }
      
      if (updated) {
        await manager.save();
        console.log('✅ User data saved');
      }
    }

    // Update or create ManagerProfile
    let managerProfile = await ManagerProfile.findOne({ userId: managerId });
    
    if (!managerProfile) {
      console.log('⚠️  No manager profile found, creating one...');
      managerProfile = await ensureManagerProfile(manager);
    }

    // Update ManagerProfile fields
    let profileUpdated = false;
    
    if (permissions) {
      console.log('🔐 Updating permissions');
      managerProfile.permissions = { ...managerProfile.permissions, ...permissions };
      profileUpdated = true;
    }
    
    if (shift) {
      console.log('⏰ Updating shift');
      managerProfile.shift = { ...managerProfile.shift, ...shift };
      profileUpdated = true;
    }
    
    if (emergencyContact) {
      console.log('🚨 Updating emergency contact:', emergencyContact);
      managerProfile.emergencyContact = { 
        ...managerProfile.emergencyContact, 
        ...emergencyContact 
      };
      profileUpdated = true;
    }
    
    if (notes !== undefined) {
      console.log('📋 Updating notes');
      managerProfile.notes = notes;
      profileUpdated = true;
    }

    if (profileUpdated || updated) {
      await managerProfile.save();
      console.log('✅ Manager profile saved');
    } else {
      console.log('ℹ️  No changes detected');
    }

    // Get fresh manager data for response
    const freshManager = await User.findById(managerId).lean();
    
    // Return updated profile in the same format as getManagerProfileOverview
    const updatedProfile = await getManagerProfileData(freshManager, managerProfile);
    
    console.log('📤 Sending updated profile response');
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedProfile 
    });
  } catch (error) {
    console.error('❌ Failed to update manager profile:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update manager profile',
      error: error.message,
    });
  }
};

// Helper function to format profile data consistently
const getManagerProfileData = async (manager, profileDoc) => {
  const profile = profileDoc.toObject ? profileDoc.toObject() : profileDoc;

  const staffLookup = profile.employees?.length
    ? await User.find({ _id: { $in: profile.employees } })
        .select('name email phone role profile')
        .lean()
    : [];

  const stats = buildStatsFromMetrics(profile.metrics);

  const timeline = profile.reports?.length
    ? profile.reports.map((report, index) => ({
        id: `report-${report._id || index}`,
        title: report.title,
        timestamp: new Date(report.generatedAt ?? Date.now()).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          day: 'numeric',
          month: 'short',
        }),
        meta: report.summary || startCase(report.type || 'Report'),
      }))
    : profile.activityLog?.length
      ? profile.activityLog.map((item, index) => ({
          id: `activity-${item._id || index}`,
          title: item.title,
          timestamp: new Date(item.timestamp ?? Date.now()).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: 'numeric',
            month: 'short',
          }),
          meta: item.meta,
        }))
      : buildSampleActivity();

  const primaryDepartment = profile.departments?.[0]
    ? startCase(profile.departments[0])
    : 'Operations';

  return {
    profile: {
      name: manager.name,
      email: manager.email,
      phone: manager.phone || '+94 11 234 5678',
      department: primaryDepartment,
      role: manager.role ? startCase(manager.role) : 'Manager',
      hotel: profile.hotel ?? 'Royal Palm Hotel',
      avatarUrl:
        manager.profilePicture ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(manager.name || 'Manager')}`,
      initials: (manager.name || 'Manager')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2) || 'MG',
      departments: profile.departments?.map(startCase) ?? [],
      shift: profile.shift,
      emergencyContact: profile.emergencyContact,
    },
    stats,
    activity: timeline,
    staff: staffLookup.map((staff) => ({
      id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: startCase(staff.role),
    })),
    permissions: profile.permissions,
    notes: profile.notes,
  };
};

export {
  getTaskBoard,
  getStaffAvailability,
  getStaff,
  manageTaskAssignment,
  setTaskPriority,
  getAnalytics,
  generateStaffSuggestions,
  getManagerProfileOverview,
  updateManagerProfile
};