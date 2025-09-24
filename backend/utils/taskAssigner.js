import StaffTask from "../models/StaffTask.js";
import StaffProfile from "../models/profiles/StaffProfile.js";

const taskPriorities = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4
};

export const assignTask = async (taskId) => {
  const task = await StaffTask.findById(taskId);
  if (!task) throw new Error('Task not found');

  // Get all staff in the required department
  const staffMembers = await StaffProfile.find({ 
    department: task.department 
  }).populate('userId');

  if (staffMembers.length === 0) {
    throw new Error('No staff available in this department');
  }

  // Calculate workload for each staff member
  const staffWithWorkload = await Promise.all(staffMembers.map(async (staff) => {
    const pendingTasks = await StaffTask.countDocuments({
      assignedTo: staff.userId._id,
      status: { $in: ['assigned', 'in_progress'] }
    });
    
    const recentCompleted = await StaffTask.countDocuments({
      assignedTo: staff.userId._id,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    return {
      staff,
      pendingTasks,
      completionRate: recentCompleted / 7, // avg per day
      skillMatch: calculateSkillMatch(staff, task)
    };
  }));

  // Sort by priority factors
  staffWithWorkload.sort((a, b) => {
    // Higher priority tasks go to less busy staff
    const workloadDiff = a.pendingTasks - b.pendingTasks;
    if (workloadDiff !== 0) return workloadDiff;
    
    // Then by skill match
    const skillDiff = b.skillMatch - a.skillMatch;
    if (skillDiff !== 0) return skillDiff;
    
    // Then by historical performance
    return b.completionRate - a.completionRate;
  });

  // Assign to top available staff
  const assignedTo = staffWithWorkload[0].staff.userId._id;
  task.assignedTo = assignedTo;
  task.status = 'assigned';
  task.assignmentSource = 'system';
  task.assignedBy = null; // system assignment
  
  // Log assignment
  task.assignmentHistory.push({
    assignedTo,
    assignedBy: null,
    source: 'system',
    status: 'assigned',
    notes: 'Automatically assigned by system'
  });

  await task.save();
  return task;
};

const calculateSkillMatch = (staff, task) => {
  if (!task.skillRequirements || task.skillRequirements.length === 0) return 1;
  
  let totalMatch = 0;
  task.skillRequirements.forEach(req => {
    const staffSkill = staff.skills?.find(s => s.skill === req.skill);
    if (staffSkill) {
      totalMatch += Math.min(staffSkill.level, req.level) / req.level;
    }
  });
  
  return totalMatch / task.skillRequirements.length;
};

export const escalateTask = async (taskId) => {
  const task = await StaffTask.findById(taskId);
  if (!task) throw new Error('Task not found');
  
  // Increase priority
  if (task.priority === 'low') task.priority = 'medium';
  else if (task.priority === 'medium') task.priority = 'high';
  else if (task.priority === 'high') task.priority = 'urgent';
  
  // Reassign if needed
  if (task.priority === 'urgent') {
    await assignTask(taskId);
  }
  
  await task.save();
  return task;
};

export const handoffTask = async (taskId, fromStaffId, toStaffId, reason) => {
  const task = await StaffTask.findById(taskId);
  if (!task) throw new Error('Task not found');
  
  // Verify current assignment
  if (task.assignedTo.toString() !== fromStaffId.toString()) {
    throw new Error('Task not assigned to this staff member');
  }
  
  // Update assignment
  task.assignedTo = toStaffId;
  task.assignmentHistory.push({
    assignedTo: toStaffId,
    assignedFrom: fromStaffId,
    status: 'reassigned',
    notes: reason
  });
  
  await task.save();
  return task;
};
