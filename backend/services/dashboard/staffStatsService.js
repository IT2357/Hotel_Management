// services/dashboard/staffStatsService.js
import { User } from '../../models/User.js';
import StaffProfile from '../../models/profiles/StaffProfile.js';

/**
 * Get staff statistics
 * @returns {Object} Staff statistics including total active, by department, and by availability
 */
export const getStaffStatistics = async () => {
  const staffStats = await Promise.all([
    // Total active staff
    User.countDocuments({ role: 'staff', isActive: true }),
    
    // Staff by department
    StaffProfile.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Staff by availability
    StaffProfile.aggregate([
      {
        $group: {
          _id: '$availability',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    totalActive: staffStats[0] || 0,
    byDepartment: staffStats[1].reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byAvailability: staffStats[2].reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};
