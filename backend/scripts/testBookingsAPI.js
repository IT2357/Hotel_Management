import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { connectDB } from '../config/database.js';

const testBookingsData = async () => {
  try {
    console.log('🔍 Testing Bookings Data...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Count total bookings
    const totalCount = await Booking.countDocuments();
    console.log(`📊 Total Bookings: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log('⚠️  No bookings found in database!');
      console.log('Run: node scripts/seedRecentReportData.js\n');
      return;
    }
    
    // Check date ranges
    const earliest = await Booking.findOne().sort({ createdAt: 1 }).select('createdAt checkIn status').lean();
    const latest = await Booking.findOne().sort({ createdAt: -1 }).select('createdAt checkIn status').lean();
    
    console.log('📅 Date Ranges:');
    console.log(`   Created At: ${earliest.createdAt.toISOString().split('T')[0]} to ${latest.createdAt.toISOString().split('T')[0]}`);
    console.log(`   Check In: ${earliest.checkIn.toISOString().split('T')[0]} to ${latest.checkIn.toISOString().split('T')[0]}\n`);
    
    // Test date filter (last 12 months)
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    console.log('🔍 Testing Date Filter (Last 12 months):');
    console.log(`   Range: ${twelveMonthsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}\n`);
    
    const matchStage = {
      createdAt: { $gte: twelveMonthsAgo, $lte: today },
      status: { $in: ['Confirmed', 'Approved - Payment Pending', 'Completed', 'Cancelled'] }
    };
    
    const bookingsInRange = await Booking.countDocuments(matchStage);
    console.log(`   Bookings in range: ${bookingsInRange}/${totalCount}\n`);
    
    if (bookingsInRange === 0) {
      console.log('⚠️  No bookings match the date filter!');
      console.log('💡 Try widening the date range or re-seeding with recent data\n');
    }
    
    // Sample aggregate query (like the API does)
    const totalStats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      }
    ]);
    
    console.log('📊 Aggregation Results:');
    if (totalStats.length > 0) {
      console.log(`   Total Bookings: ${totalStats[0].totalBookings}`);
      console.log(`   Confirmed: ${totalStats[0].confirmedBookings}`);
      console.log(`   Total Revenue: LKR ${totalStats[0].totalRevenue.toLocaleString()}`);
      console.log(`   Avg. Value: LKR ${Math.round(totalStats[0].averageBookingValue).toLocaleString()}\n`);
    } else {
      console.log('   No results from aggregation\n');
    }
    
    // Test byDate aggregation
    const bookingsByDate = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 5 }
    ]);
    
    console.log('📈 Sample byDate Data (first 5):');
    bookingsByDate.forEach(item => {
      console.log(`   ${item._id}: ${item.bookings} bookings, LKR ${item.revenue.toLocaleString()}`);
    });
    console.log();
    
    // Sample bookings
    const samples = await Booking.find(matchStage).limit(3).select('createdAt checkIn status totalPrice').lean();
    console.log('📋 Sample Bookings:');
    samples.forEach((b, i) => {
      console.log(`   ${i + 1}. Created: ${b.createdAt.toISOString().split('T')[0]}, Status: ${b.status}, Price: LKR ${b.totalPrice.toLocaleString()}`);
    });
    
    console.log('\n✅ Bookings data is available!');
    console.log('If the frontend shows "No data available", check:');
    console.log('1. Browser console for API responses');
    console.log('2. Network tab for /api/reports/bookings endpoint');
    console.log('3. Date filters match the data range\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

testBookingsData();
