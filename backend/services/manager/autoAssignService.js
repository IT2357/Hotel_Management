import { User } from '../../models/User.js';

// Suggest best staff based on department, availability, workload, performance
const suggestStaff = async (taskType, priority) => {
  const departmentMap = {
    Food: 'Kitchen',
    Cleaning: 'Cleaning',
    Maintenance: 'Maintenance',
    Services: 'Services',
  };
  const dept = departmentMap[taskType];

  let staff = await User.find({ role: 'Staff', department: dept, availability: true });

  // Score: lower workload better, higher performance better, priority boosts urgent
  staff = staff.map(s => ({
    ...s.toObject(),
    score: (10 - s.workload) * 0.4 + s.performanceScore * 0.4 + (priority === 'High' ? 2 : 0),
  })).sort((a, b) => b.score - a.score);

  return staff.slice(0, 3); // Top 3 suggestions
};

// Update workload
const updateStaffWorkload = async (staffId, delta) => {
  await User.findByIdAndUpdate(staffId, { $inc: { workload: delta } });
};

// Update performance score (e.g., rolling average)
const updatePerformanceScore = async (staffId, newRating) => {
  const staff = await User.findById(staffId);
  staff.performanceScore = (staff.performanceScore + newRating) / 2; // Simple average, improve as needed
  await staff.save();
};


export { suggestStaff, updateStaffWorkload, updatePerformanceScore };