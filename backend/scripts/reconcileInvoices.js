// 📁 backend/scripts/reconcileInvoices.js
// One-off repair script to reconcile invoice amounts with booking costBreakdown
import dotenv from 'dotenv';
import { connectDB, closeDBConnection } from '../config/database.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';

dotenv.config();

const mapPaymentMethod = (pm) => {
  switch ((pm || '').toLowerCase()) {
    case 'cash': return 'Cash';
    case 'card': return 'Credit Card';
    case 'paypal': return 'Online';
    case 'bank': return 'Online';
    default: return 'Online';
  }
};

async function reconcileOne(booking) {
  const cb = booking.costBreakdown || {};
  const nights = booking.nights || cb.nights || 0;
  const roomRate = booking.roomBasePrice || cb.roomRate || 0;
  const mealPlanCost = typeof cb.mealPlanCost === 'number' ? cb.mealPlanCost : 0;
  const subtotal = typeof cb.subtotal === 'number' ? cb.subtotal : ((nights * roomRate) + mealPlanCost);
  const tax = typeof cb.tax === 'number' ? cb.tax : 0;
  const serviceFee = typeof cb.serviceFee === 'number' ? cb.serviceFee : 0;
  const total = typeof cb.total === 'number' ? cb.total : (subtotal + tax + serviceFee);

  let invoice = await Invoice.findOne({ bookingId: booking._id });
  if (!invoice) {
    console.log(`ℹ️  No invoice for booking ${booking.bookingNumber}, creating...`);
    invoice = new Invoice({
      bookingId: booking._id,
      userId: booking.userId,
      invoiceNumber: `INV${Date.now()}`,
      amount: total,
      currency: cb.currency || 'LKR',
      taxRate: 0,
      discountApplied: 0,
      status: (booking.status === 'Confirmed') ? 'Sent - Payment Pending' : 'Draft',
      paymentMethod: mapPaymentMethod(booking.paymentMethod),
      issuedAt: new Date(),
      items: []
    });
  }

  // Update amount if mismatch
  if (Math.abs((invoice.amount || 0) - total) > 0.01) {
    console.log(`🔧 Fixing invoice ${invoice.invoiceNumber || '(new)'} amount: ${invoice.amount} -> ${total}`);
    invoice.amount = total;
  }

  // Ensure payment method mapping
  const mapped = mapPaymentMethod(booking.paymentMethod);
  if (invoice.paymentMethod !== mapped) {
    invoice.paymentMethod = mapped;
  }

  await invoice.save();
}

async function main() {
  try {
    await connectDB();
    const bookingNumberArg = process.argv[2];
    let query = {};
    if (bookingNumberArg) {
      query.bookingNumber = bookingNumberArg;
    }

    const bookings = await Booking.find(query).limit(500);
    console.log(`Found ${bookings.length} booking(s) to reconcile`);

    for (const booking of bookings) {
      await reconcileOne(booking);
    }

    console.log('✅ Reconciliation complete');
  } catch (err) {
    console.error('❌ Reconciliation failed:', err);
  } finally {
    await closeDBConnection();
  }
}

main();
