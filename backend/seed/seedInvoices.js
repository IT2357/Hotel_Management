import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import FoodOrder from '../models/FoodOrder.js';
import { pick, randomInt, dates } from './utils.js';

export const seedInvoices = async (count = 30) => {
  await connectDB();
  await Invoice.deleteMany({});
  const bookings = await Booking.find({}).lean();
  const orders = await FoodOrder.find({}).lean();
  if (!bookings.length && !orders.length) throw new Error('Seed Bookings or FoodOrders first');

  const statuses = [
    'Draft','Sent - Payment Pending','Sent - Payment Processing','Paid','Overdue','Cancelled','Refunded','Failed','Awaiting Approval'
  ];

  const docs = [];
  for (let i = 0; i < count; i++) {
    const linkBooking = pick([true,false]);
    const booking = linkBooking && bookings.length ? pick(bookings) : null;
    const order = !linkBooking && orders.length ? pick(orders) : null;

    const items = [];
    let subtotal = 0;
    if (booking) {
      items.push({ description: `Room ${booking.roomTitle}`, quantity: booking.nights || 1, unitPrice: booking.roomBasePrice || 10000, amount: (booking.nights||1) * (booking.roomBasePrice||10000), type: 'room' });
      if (booking.costBreakdown?.mealPlanCost) {
        items.push({ description: 'Meal Plan', quantity: 1, unitPrice: booking.costBreakdown.mealPlanCost, amount: booking.costBreakdown.mealPlanCost, type: 'meal_plan' });
      }
    }
    if (order) {
      for (const it of order.items.slice(0,2)) {
        items.push({ description: it.name, quantity: it.quantity, unitPrice: it.price, amount: it.quantity * it.price, type: 'meal' });
      }
      if (order.serviceCharge) items.push({ description: 'Service Fee', quantity: 1, unitPrice: order.serviceCharge, amount: order.serviceCharge, type: 'service_fee' });
      if (order.tax) items.push({ description: 'Tax', quantity: 1, unitPrice: order.tax, amount: order.tax, type: 'tax' });
    }
    subtotal = items.reduce((a,c)=> a + (c.amount||0), 0);
    const discountApplied = pick([0, 0, 500]);
    const taxRate = 8;
    const totalAmount = subtotal - discountApplied;

    docs.push({
      bookingId: booking?._id,
      foodOrderId: order?._id,
      userId: booking?.userId || order?.userId,
      invoiceNumber: `INV-${Date.now()}-${i}-${randomInt(100,999)}`,
      amount: subtotal,
      totalAmount,
      currency: 'LKR',
      taxRate,
      discountApplied,
      status: pick(statuses),
      paymentMethod: pick(['Cash','Credit Card','Online','Wallet']),
      transactionId: `TX-${randomInt(100000,999999)}`,
      issuedAt: dates.pastDays(randomInt(0,5)),
      dueDate: dates.futureDays(randomInt(1,10)),
      items,
      statusNotes: 'Seed data',
      overstayTracking: pick([undefined,{ isOverstayInvoice: true, originalCheckOutDate: dates.pastDays(2), currentCheckOutDate: dates.pastDays(0), daysOverstayed: 2, dailyRate: 20000, chargeBreakdown: { baseCharges: 40000, accumulatedCharges: 0 }, lastUpdatedAt: new Date(), updatedByAdmin: false }]),
      paymentApproval: { approvalStatus: pick(['pending','approved','rejected']), approvalNotes: 'Seed' },
    });
  }
  const created = await Invoice.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedInvoices.js')) {
  seedInvoices().then(() => { console.log('✅ Invoices seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
