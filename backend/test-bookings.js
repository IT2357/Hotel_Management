// Quick test script to check if booking data exists
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';

async function testBookings() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Test 1: Count all bookings
    const totalCount = await Booking.countDocuments();
    console.log(`📊 Total bookings in DB: ${totalCount}`);

    // Test 2: Count bookings in 2024
    const count2024 = await Booking.countDocuments({
      createdAt: {
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      }
    });
    console.log(`📅 Bookings in 2024: ${count2024}`);

    // Test 3: Check source field
    const withSource = await Booking.countDocuments({ source: { $exists: true } });
    console.log(`🔗 Bookings with source field: ${withSource}`);

    // Test 4: Sample booking
    const sample = await Booking.findOne().lean();
    console.log('\n📋 Sample booking:');
    console.log(JSON.stringify({
      _id: sample?._id,
      status: sample?.status,
      source: sample?.source,
      createdAt: sample?.createdAt,
      totalPrice: sample?.totalPrice
    }, null, 2));

    // Test 5: Bookings by channel
    console.log('\n📊 Bookings by channel:');
    const byChannel = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date('2024-01-01'), $lte: new Date('2024-12-31') },
          status: { $in: ['Confirmed', 'Approved - Payment Pending', 'Completed', 'Cancelled'] }
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$source', '$bookingChannel'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log(byChannel);

    // Test 6: Distinct statuses
    const statuses = await Booking.distinct('status');
    console.log('\n📌 All statuses in DB:', statuses);

    await mongoose.connection.close();
    console.log('\n👋 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testBookings();
