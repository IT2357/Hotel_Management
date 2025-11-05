import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import FoodTaskQueue from '../models/FoodTaskQueue.js';
import FoodOrder from '../models/FoodOrder.js';
import { User } from '../models/User.js';
import { pick, randomInt, dates } from './utils.js';

export const seedFoodTaskQueue = async (count = 30) => {
  await connectDB();
  await FoodTaskQueue.deleteMany({});
  const orders = await FoodOrder.find({}).lean();
  const staff = await User.find({ role: 'staff' }).lean();
  if (!orders.length) throw new Error('Seed FoodOrders first');

  const taskTypes = ['prep','cook','plate','delivery','quality-check'];
  const statuses = ['queued','assigned','in-progress','completed','failed','cancelled'];
  const priorities = ['low','normal','high','urgent'];

  const docs = [];
  for (let i = 0; i < count; i++) {
    const order = pick(orders);
    const assigned = pick([true,false]);
    const assignedTo = assigned && staff.length ? pick(staff)._id : undefined;
    const status = pick(statuses);
    const startedAt = pick([undefined, dates.pastDays(0)]);
    const completedAt = status === 'completed' ? dates.pastDays(0) : undefined;

    docs.push({
      orderId: order._id,
      taskType: pick(taskTypes),
      status,
      priority: pick(priorities),
      isRoomService: order.orderType === 'delivery',
      assignedTo,
      assignedAt: assigned ? dates.pastDays(0) : undefined,
      startedAt,
      completedAt,
      estimatedCompletionTime: dates.futureMinutes(randomInt(10,40)),
      actualCompletionTime: completedAt,
      kdsNotified: pick([true,false]),
      notes: 'Seeded kitchen task',
      qualityChecks: { temperature: pick([true,false]), presentation: pick([true,false]), portionSize: pick([true,false]), garnish: pick([true,false]) },
      allergyChecked: pick([true,false]),
      dietaryTagsVerified: pick([true,false]),
      taskHistory: []
    });
  }

  const created = await FoodTaskQueue.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedFoodTaskQueue.js')) {
  seedFoodTaskQueue().then(() => { console.log('✅ FoodTaskQueue seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
