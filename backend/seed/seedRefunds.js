import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import RefundRequest from '../models/RefundRequest.js';
import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import { User } from '../models/User.js';
import { pick, randomInt, dates } from './utils.js';

export const seedRefunds = async (count = 30) => {
  await connectDB();
  await RefundRequest.deleteMany({});
  const invoices = await Invoice.find({}).lean();
  const bookings = await Booking.find({}).lean();
  const guests = await User.find({ role: 'guest' }).lean();
  if (!invoices.length || !bookings.length || !guests.length) throw new Error('Seed Invoices, Bookings, and Users first');

  const statuses = ['pending','approved','denied','processed','failed','info_requested'];

  const docs = [];
  for (let i = 0; i < count; i++) {
    const booking = pick(bookings);
    const invoice = pick(invoices);
    const guest = pick(guests);
    const amount = randomInt(500, 15000);

    docs.push({
      bookingId: booking._id,
      guestId: guest._id,
      invoiceId: invoice._id,
      amount,
      currency: 'LKR',
      reason: pick(['Overcharge','Service Issue','Cancellation','Duplicate Payment']),
      evidence: [ { type: 'receipt', description: 'Receipt copy', fileUrl: 'https://example.com/receipt.jpg' } ],
      paymentGatewayRef: `GW-${randomInt(100000,999999)}`,
      status: pick(statuses),
      approvedBy: undefined,
      deniedBy: undefined,
      infoRequested: undefined,
      processedAt: undefined,
    });
  }

  const created = await RefundRequest.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedRefunds.js')) {
  seedRefunds().then(() => { console.log('✅ RefundRequests seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
