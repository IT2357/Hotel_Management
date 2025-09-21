// controllers/manager/staffController.js
import Staff from '../../models/profiles/StaffProfile.js';
import Task from '../../models/manager/Task.js';
import bcrypt from 'bcryptjs';

export const getStaff = async (req, res) => {
  try {
    const { department, role, status, search } = req.query;
    let query = { isActive: true };
    if (department && department !== 'all') query.department = department;
    if (role && role !== 'all') query.role = role;
    if (status === 'online') query.isOnline = true;
    if (status === 'offline') query.isOnline = false;
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }
    const staff = await Staff.find(query).select('-password').sort({ name: 1 });
    const staffWithTasks = await Promise.all(
      staff.map(async (member) => {
        const currentTasks = await Task.countDocuments({ assignedTo: member._id, status: { $in: ['assigned', 'in-progress'] } });
        return { ...member.toObject(), currentTasks };
      })
    );
    res.json(staffWithTasks);
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, avatar, shift, skills } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const staff = new Staff({ name, email, password: hashedPassword, role, department, phone, avatar, shift, skills });
    await staff.save();
    res.status(201).json({ message: 'Staff member created', staffId: staff._id });
  } catch (error) {
    console.error('Staff creation error:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};

export const updateStaffStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const staff = await Staff.findByIdAndUpdate(req.params.staffId, { isOnline, lastActivity: new Date() }, { new: true }).select('-password');
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    console.error('Staff status update error:', error);
    res.status(500).json({ error: 'Failed to update staff status' });
  }
};