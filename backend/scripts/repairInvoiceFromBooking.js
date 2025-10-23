// 📁 backend/scripts/repairInvoiceFromBooking.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, closeDBConnection } from '../config/database.js';
import Booking from '../models/Booking.js';
import InvoiceService from '../services/payment/invoiceService.js';

dotenv.config();

async function main() {
  const bookingNumber = process.argv[2] || process.env.BOOKING_NUMBER;
  if (!bookingNumber) {
    console.error('Usage: node backend/scripts/repairInvoiceFromBooking.js <BOOKING_NUMBER>');
    process.exit(1);
  }

  try {
    await connectDB();
    const booking = await Booking.findOne({ bookingNumber });
    if (!booking) {
      console.error(`Booking not found for number: ${bookingNumber}`);
      process.exit(2);
    }

    console.log(`🔧 Repairing invoice for booking ${booking.bookingNumber} (${booking._id})`);
    const before = await (await import('../models/Invoice.js')).default.findOne({ bookingId: booking._id });
    if (before) {
      console.log(`Before: invoice ${before.invoiceNumber} amount=${before.currency} ${(before.amount || 0).toFixed(2)}`);
    } else {
      console.log('Before: No invoice found. One will be created.');
    }

    const invoice = await InvoiceService.recalculateInvoiceFromBooking(booking._id);

    console.log(`✅ After: invoice ${invoice.invoiceNumber} amount=${invoice.currency} ${(invoice.amount || 0).toFixed(2)}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Repair failed:', err);
    process.exit(3);
  } finally {
    try { await closeDBConnection(); } catch {}
  }
}

main();
