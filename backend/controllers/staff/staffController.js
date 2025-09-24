import User from '../../models/User.js';
import Task from '../../models/Task.js';
import Booking from '../../models/Booking.js';
import Room from '../../models/Room.js';
import { responseFormatter } from '../../utils/responseFormatter.js';

// Get staff dashboard data
export const getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Get staff's assigned bookings count
    const myBookings = await Booking.countDocuments({ 
      assignedStaff: staffId,
      status: { $in: ['confirmed', 'checked-in'] }
    });

    // Get room status overview
    const roomStatus = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const roomStatusObj = {
      available: 0,
      occupied: 0,
      maintenance: 0
    };

    roomStatus.forEach(status => {
      if (status._id in roomStatusObj) {
        roomStatusObj[status._id] = status.count;
      }
    });

    // Get support requests (tasks assigned to this staff member)
    const supportRequests = await Task.countDocuments({ 
      assignedTo: staffId,
      status: { $in: ['pending', 'assigned'] },
      type: 'support'
    });

    // Get task summary
    const taskSummary = await Task.aggregate([
      { $match: { assignedTo: staffId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const tasks = {
      pending: 0,
      completed: 0,
      'in-progress': 0
    };

    taskSummary.forEach(task => {
      if (task._id in tasks) {
        tasks[task._id] = task.count;
      }
    });

    const dashboardData = {
      myBookings,
      roomStatus: roomStatusObj,
      supportRequests,
      tasks
    };

    return responseFormatter.success(res, dashboardData, 'Staff dashboard data retrieved successfully');
  } catch (error) {
    console.error('Error fetching staff dashboard:', error);
    return responseFormatter.error(res, 'Failed to fetch staff dashboard data', 500);
  }
};

// Get staff's assigned bookings
export const getMyBookings = async (req, res) => {
  try {
    const staffId = req.user._id;
    
    const bookings = await Booking.find({ 
      assignedStaff: staffId 
    })
    .populate('guest', 'name email phone')
    .populate('room', 'number type')
    .sort({ checkInDate: -1 })
    .limit(20);

    return responseFormatter.success(res, bookings, 'Staff bookings retrieved successfully');
  } catch (error) {
    console.error('Error fetching staff bookings:', error);
    return responseFormatter.error(res, 'Failed to fetch staff bookings', 500);
  }
};

// Get room status for staff
export const getRoomStatus = async (req, res) => {
  try {
    const rooms = await Room.find({})
      .populate('currentGuest', 'name email')
      .sort({ number: 1 });

    return responseFormatter.success(res, rooms, 'Room status retrieved successfully');
  } catch (error) {
    console.error('Error fetching room status:', error);
    return responseFormatter.error(res, 'Failed to fetch room status', 500);
  }
};

// Get support requests assigned to staff
export const getSupportRequests = async (req, res) => {
  try {
    const staffId = req.user._id;
    
    const supportRequests = await Task.find({ 
      assignedTo: staffId,
      type: 'support',
      status: { $in: ['pending', 'assigned', 'in-progress'] }
    })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

    return responseFormatter.success(res, supportRequests, 'Support requests retrieved successfully');
  } catch (error) {
    console.error('Error fetching support requests:', error);
    return responseFormatter.error(res, 'Failed to fetch support requests', 500);
  }
};

// Get staff's assigned tasks
export const getMyTasks = async (req, res) => {
  try {
    const staffId = req.user._id;
    
    const tasks = await Task.find({ 
      assignedTo: staffId 
    })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

    return responseFormatter.success(res, tasks, 'Staff tasks retrieved successfully');
  } catch (error) {
    console.error('Error fetching staff tasks:', error);
    return responseFormatter.error(res, 'Failed to fetch staff tasks', 500);
  }
};