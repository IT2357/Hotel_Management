import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import { User } from '../models/User.js';
import { pick, randomInt, dates } from './utils.js';

export const seedBookings = async (count = 30) => {
  await connectDB();
  await Booking.deleteMany({});
  const rooms = await Room.find({}).lean();
  const users = await User.find({ role: 'guest' }).lean();
  if (!rooms.length) throw new Error('Seed Rooms first');

  const statuses = [
    'Pending Approval','On Hold','Approved - Payment Pending','Approved - Payment Processing','Confirmed','Rejected','Cancelled','Completed','No Show'
  ];

  const docs = [];
  for (let i = 0; i < count; i++) {
    const room = pick(rooms);
    const guest = pick(users);
    const checkIn = dates.futureDays(randomInt(1, 20));
    const nights = randomInt(1, 7);
    const checkOut = new Date(checkIn.getTime() + nights*86400000);
    const roomRate = room.basePrice;
    const roomCost = roomRate * nights;
    const mealPlanCost = pick([0, 2000, 4000]);
    const subtotal = roomCost + mealPlanCost;
    const tax = Math.round(subtotal * 0.08);
    const serviceFee = Math.round(subtotal * 0.1);
    const total = subtotal + tax + serviceFee;

    docs.push({
      roomId: room._id,
      userId: guest?._id,
      checkIn,
      checkOut,
      guests: randomInt(1, 3),
      guestCount: { adults: randomInt(1, 2), children: randomInt(0, 2) },
      specialRequests: pick(['High floor','Sea view','Extra pillow','Late check-in', undefined]),
      foodPlan: pick(['None','Breakfast','Half Board','Full Board','À la carte']),
      selectedMeals: [],
      paymentMethod: pick(['card','bank','cash']),
      status: pick(statuses),
      paymentStatus: pick(['pending','processing','completed','failed','cancelled']),
      totalPrice: total,
      depositAmount: pick([0, 5000, 10000]),
      depositPaid: pick([true,false]),
      costBreakdown: { nights, roomRate, roomCost, subtotal, tax, serviceFee, mealPlanCost, total, currency: 'LKR', deposit: 0, depositRequired: false },
      bookingSettings: { checkInTime: '14:00', checkOutTime: '12:00', cancellationPolicy: 'Moderate', operationalHours: { startTime: '08:00', endTime: '22:00', allowedDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] } },
      operationalHoursValid: true,
      isActive: true,
      requiresReview: false,
      autoCancelled: false,
      roomTitle: room.title,
      roomBasePrice: room.basePrice,
      nights,
      source: pick(['website','walk-in','phone']),
      metadata: { bookingSource: 'seed', version: 'v1' },
    });
  }
  const created = await Booking.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedBookings.js')) {
  seedBookings().then(() => { console.log('✅ Bookings seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
