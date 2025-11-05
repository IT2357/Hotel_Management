import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Invitation from '../models/Invitation.js';
import { genToken, pick, dates } from './utils.js';
import { User } from '../models/User.js';

export const seedInvitations = async (count = 30) => {
  await connectDB();
  await Invitation.deleteMany({});

  const roles = ['staff','manager','admin'];
  const departments = ['Housekeeping','Kitchen','Maintenance','Service'];
  const modules = ['invitations','notification','users','rooms','bookings','inventory','staff','finance','reports','system'];
  const actions = ['create','read','update','delete','approve','reject','export','manage'];

  const admins = await User.find({ role: 'admin' }).lean();

  const docs = [];
  for (let i = 0; i < count; i++) {
    const role = pick(roles);
    const permissions = role === 'admin' ? [ { module: pick(modules), actions: [pick(actions), pick(actions)] } ] : undefined;
    docs.push({
      email: `invitee${i+1}@example.lk`,
      role,
      department: role === 'staff' ? pick(departments) : undefined,
      position: role === 'staff' ? pick(['Waiter','Cook','Cleaner','Technician']) : undefined,
      permissions,
      token: genToken(),
      createdBy: admins[0]?._id,
      expiresAt: dates.futureDays(14),
      used: pick([false,false,true]),
    });
  }

  const created = await Invitation.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedInvitations.js')) {
  seedInvitations().then(() => { console.log('✅ Invitations seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
