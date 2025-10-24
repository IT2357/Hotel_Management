import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import FoodOrder from '../models/FoodOrder.js';
import MenuItem from '../models/MenuItem.js';
import { User } from '../models/User.js';
import { pick, randomInt, dates } from './utils.js';

export const seedFoodOrders = async (count = 30) => {
  await connectDB();
  await FoodOrder.deleteMany({});
  const users = await User.find({ role: { $in: ['guest','staff','manager'] } }).lean();
  const items = await MenuItem.find({}).lean();
  if (items.length === 0) throw new Error('Seed MenuItems first');

  const docs = [];
  for (let i = 0; i < count; i++) {
    const orderType = pick(["dine-in","takeaway","delivery"]);
    const cart = Array.from({ length: randomInt(1,3) }).map(() => {
      const mi = pick(items);
      return { foodId: mi._id, quantity: randomInt(1,3), price: mi.price, name: mi.name };
    });
    const subtotal = cart.reduce((a,c)=>a + c.price * c.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const service = Math.round(subtotal * 0.1);
    const deliveryFee = orderType === 'delivery' ? 300 : 0;
    const total = subtotal + tax + service + deliveryFee;

    docs.push({
      userId: pick(users)?._id,
      items: cart,
      scheduledTime: dates.futureMinutes(randomInt(15,90)),
      deliveryLocation: orderType === 'delivery' ? 'Room Service - Colombo' : undefined,
      subtotal,
      tax,
      serviceCharge: service,
      deliveryFee,
      totalPrice: total,
      currency: 'LKR',
      orderType,
      isTakeaway: orderType === 'takeaway',
      tableNumber: orderType === 'dine-in' ? `${randomInt(1,30)}` : undefined,
      pickupTime: orderType === 'takeaway' ? randomInt(10,30) : undefined,
      pickupCode: orderType === 'takeaway' ? `${randomInt(1000,9999)}` : undefined,
      priorityLevel: undefined,
      customerDetails: { name: 'Walk-in', phone: '+94770000000' },
      paymentStatus: pick(["pending","paid","refunded","failed"]),
      paymentMethod: pick(["CASH","CARD","WALLET","ONLINE"]),
      paymentGateway: pick(["PayHere","Stripe","PayPal","Other"]),
      status: pick(["pending","confirmed","preparing","ready","delivered","cancelled","modified"]),
      kitchenStatus: pick(["pending","assigned","preparing","ready","delivered","cancelled"]),
      taskHistory: [],
      notes: 'SRL test order',
    });
  }
  const created = await FoodOrder.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedFoodOrders.js')) {
  seedFoodOrders().then(() => { console.log('✅ FoodOrders seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
