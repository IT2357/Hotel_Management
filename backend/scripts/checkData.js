import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import StaffTask from '../models/StaffTask.js';
import { User } from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';

async function checkData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check data counts
    const [users, bookings, revenues, expenses, tasks] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Revenue.countDocuments(),
      Expense.countDocuments(),
      StaffTask.countDocuments()
    ]);

    console.log('📊 Data Summary:');
    console.log('─'.repeat(50));
    console.log(`  Users:       ${users}`);
    console.log(`  Bookings:    ${bookings}`);
    console.log(`  Revenues:    ${revenues}`);
    console.log(`  Expenses:    ${expenses}`);
    console.log(`  Tasks:       ${tasks}`);
    console.log('─'.repeat(50));

    // Check date ranges
    const bookingDates = await Booking.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$createdAt' },
          maxDate: { $max: '$createdAt' }
        }
      }
    ]);

    if (bookingDates.length > 0) {
      console.log('\n📅 Booking Date Range:');
      console.log(`  From: ${bookingDates[0].minDate}`);
      console.log(`  To:   ${bookingDates[0].maxDate}`);
    }

    // Sample booking
    const sampleBooking = await Booking.findOne().lean();
    if (sampleBooking) {
      console.log('\n📝 Sample Booking:');
      console.log(`  Created: ${sampleBooking.createdAt}`);
      console.log(`  Status:  ${sampleBooking.status}`);
      console.log(`  Source:  ${sampleBooking.source || sampleBooking.bookingChannel || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

checkData();
