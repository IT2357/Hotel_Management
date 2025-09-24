// controllers/manager/staffController.js
import Staff from '../../models/profiles/StaffProfile.js';
import { User } from '../../models/User.js';

// Get all staff members
export const getStaff = async (req, res) => {
  try {
    const { department, availability, page = 1, limit = 10 } = req.query;
    
    // Build filter query
    const filter = { role: 'staff' };
    
    // Get staff users and populate with profile
    const staffUsers = await User.find(filter)
      .populate({
        path: 'staffProfile',
        match: department ? { department } : {},
        select: 'department position phone address availability currentTasks'
      })
      .select('name email isActive createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Filter out users without staff profiles (in case they exist)
    const filteredStaff = staffUsers.filter(user => user.staffProfile);

    // Apply availability filter if specified
    let finalStaff = filteredStaff;
    if (availability) {
      finalStaff = filteredStaff.filter(user => 
        user.staffProfile.availability === availability
      );
    }

    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        staff: finalStaff,
        pagination: {
          current: parseInt(page),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff members',
      error: error.message
    });
  }
};

// Create new staff member
export const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      position,
      phone,
      address,
      shift
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password, // This should be hashed in the User model
      role: 'staff',
      isActive: true
    });

    await user.save();

    // Create staff profile
    const staffProfile = new Staff({
      userId: user._id,
      department,
      position,
      phone,
      address,
      shift: shift || 'morning',
      availability: 'available',
      currentTasks: []
    });

    await staffProfile.save();

    // Link staff profile to user
    user.staffProfile = staffProfile._id;
    await user.save();

    // Populate response
    await user.populate('staffProfile');

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: user
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
};

// Update staff status
export const updateStaffStatus = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { availability, isActive } = req.body;

    // Find staff user
    const user = await User.findById(staffId).populate('staffProfile');
    if (!user || user.role !== 'staff') {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Update user active status if provided
    if (typeof isActive !== 'undefined') {
      user.isActive = isActive;
      await user.save();
    }

    // Update staff profile availability if provided
    if (availability && user.staffProfile) {
      user.staffProfile.availability = availability;
      await user.staffProfile.save();
    }

    await user.populate('staffProfile');

    res.json({
      success: true,
      message: 'Staff status updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating staff status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff status',
      error: error.message
    });
  }
};

// Get staff by department (used for task assignment)
export const getStaffByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const staffUsers = await User.find({ role: 'staff', isActive: true })
      .populate({
        path: 'staffProfile',
        match: { department, availability: 'available' },
        select: 'department position currentTasks'
      })
      .select('name email');

    // Filter out users without matching staff profiles
    const availableStaff = staffUsers.filter(user => user.staffProfile);

    res.json({
      success: true,
      data: availableStaff
    });
  } catch (error) {
    console.error('Error fetching staff by department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff by department',
      error: error.message
    });
  }
};

// Get staff performance metrics
export const getStaffPerformance = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    // This is a placeholder - you'll need to implement based on your Task model
    // and performance tracking requirements
    
    res.json({
      success: true,
      data: {
        message: 'Staff performance endpoint - to be implemented',
        staffId,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff performance',
      error: error.message
    });
  }
};
