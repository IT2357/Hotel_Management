import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';
import GuestProfile from '../models/profiles/GuestProfile.js';
import StaffProfile from '../models/profiles/StaffProfile.js';
import ManagerProfile from '../models/profiles/ManagerProfile.js';
import AdminProfile from '../models/profiles/AdminProfile.js';
import { avatar, randAddressLK, randEmail, randPhoneLK, pick, cities } from './utils.js';

const makeUser = (overrides = {}) => {
  const name = overrides.name || `User ${Math.random().toString(36).slice(2,7)}`;
  return {
    name,
    email: overrides.email || randEmail(name),
    password: overrides.password || 'Password!123',
    phone: overrides.phone || randPhoneLK(),
    profilePicture: overrides.profilePicture || avatar(name),
    address: overrides.address || randAddressLK(),
    role: overrides.role || 'guest',
    department: overrides.department,
    position: overrides.position,
    isApproved: overrides.isApproved ?? true,
  };
};

export const seedUsers = async () => {
  await connectDB();
  // Do NOT clean users per requirement
  const created = { admins: [], managers: [], staff: [], guests: [] };

  // Ensure at least one of each core role exists; if not, create
  const ensureOne = async (role, doc) => {
    const exists = await User.findOne({ role }).lean();
    if (!exists) {
      const u = await User.create(doc); // pre-save will hash
      return u;
    }
    return exists;
  };

  // Admin
  const adminDoc = makeUser({ name: 'Admin LK', email: 'admin.lk@example.com', role: 'admin', password: 'Admin!123' });
  const admin = await ensureOne('admin', adminDoc);
  if (admin && !(await AdminProfile.findOne({ userId: admin._id }))) {
    await AdminProfile.create({ userId: admin._id });
  }
  created.admins.push(admin);

  // Manager
  const managerDoc = makeUser({ name: 'Manager Colombo', email: 'manager.colombo@example.com', role: 'manager', password: 'Manager!123' });
  const manager = await ensureOne('manager', managerDoc);
  if (manager && !(await ManagerProfile.findOne({ userId: manager._id }))) {
    await ManagerProfile.create({ userId: manager._id });
  }
  created.managers.push(manager);

  // Staff (4: Kitchen, Housekeeping, Maintenance, Service)
  const staffDefs = [
    { name: 'Kitchen Staff Jaffna', department: 'Kitchen', position: 'Cook' },
    { name: 'Housekeeping Kandy', department: 'Housekeeping', position: 'Cleaner' },
    { name: 'Maintenance Galle', department: 'Maintenance', position: 'Technician' },
    { name: 'Service Negombo', department: 'Service', position: 'Waiter' },
  ];
  for (const def of staffDefs) {
    const doc = makeUser({ name: def.name, email: randEmail(def.name), role: 'staff', password: 'Staff!123', department: def.department, position: def.position });
    const u = await User.findOne({ email: doc.email }) || await User.create(doc);
    if (!(await StaffProfile.findOne({ userId: u._id }))) {
      await StaffProfile.create({ userId: u._id, department: def.department, position: def.position, shifts: [{ day: 'Monday', startTime: '09:00', endTime: '17:00' }] });
    }
    created.staff.push(u);
  }

  // Guests (8)
  for (let i = 0; i < 8; i++) {
    const city = pick(cities);
    const doc = makeUser({ name: `Guest ${city} ${i+1}`, role: 'guest', password: 'Guest!123' });
    const u = await User.findOne({ email: doc.email }) || await User.create(doc);
    if (!(await GuestProfile.findOne({ userId: u._id }))) {
      await GuestProfile.create({ userId: u._id, nationality: 'Sri Lankan', verificationStatus: 'verified' });
    }
    created.guests.push(u);
  }

  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedUsers.js')) {
  seedUsers().then(() => { console.log('✅ Users seeded'); mongoose.connection.close(); }).catch(err => { console.error(err); mongoose.connection.close(); process.exit(1); });
}
