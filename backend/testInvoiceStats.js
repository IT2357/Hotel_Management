// Quick test to check invoice stats
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Invoice = (await import('./models/Invoice.js')).default;

async function testInvoiceStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');

    console.log('Connected to database');

    // Count total invoices
    const totalInvoices = await Invoice.countDocuments();
    console.log('Total invoices in DB:', totalInvoices);

    // Get stats using aggregation (same as API)
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          paid: {
            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $in: ["$status", ["Sent - Payment Pending", "Draft", "Awaiting Approval"]] }, 1, 0] }
          },
          refunded: {
            $sum: { $cond: [{ $eq: ["$status", "Refunded"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalInvoices: 0,
      paid: 0,
      pending: 0,
      refunded: 0,
      totalRevenue: 0
    };

    console.log('Invoice stats from aggregation:', result);

    // Get all unique statuses
    const uniqueStatuses = await Invoice.distinct('status');
    console.log('Unique statuses in database:', uniqueStatuses);

    // Count by status
    for (const status of uniqueStatuses) {
      const count = await Invoice.countDocuments({ status });
      console.log(`Status "${status}": ${count} invoices`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from database');

  } catch (error) {
    console.error('Error:', error);
  }
}

testInvoiceStats();