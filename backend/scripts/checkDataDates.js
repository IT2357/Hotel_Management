import mongoose from 'mongoose';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import Booking from '../models/Booking.js';
import KPI from '../models/KPI.js';
import { connectDB } from '../config/database.js';

const checkDataDates = async () => {
  try {
    console.log('📅 Checking data date ranges...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Check Revenue dates
    const revenueEarliest = await Revenue.findOne().sort({ serviceDate: 1 }).select('serviceDate source amount').lean();
    const revenueLatest = await Revenue.findOne().sort({ serviceDate: -1 }).select('serviceDate source amount').lean();
    
    // Check Expense dates
    const expenseEarliest = await Expense.findOne().sort({ paidAt: 1 }).select('paidAt category amount').lean();
    const expenseLatest = await Expense.findOne().sort({ paidAt: -1 }).select('paidAt category amount').lean();
    
    // Check Booking dates
    const bookingEarliest = await Booking.findOne().sort({ checkIn: 1 }).select('checkIn checkOut status').lean();
    const bookingLatest = await Booking.findOne().sort({ checkIn: -1 }).select('checkIn checkOut status').lean();
    
    // Check KPI dates
    const kpiEarliest = await KPI.findOne().sort({ date: 1 }).select('date totalRevenue occupancyRate').lean();
    const kpiLatest = await KPI.findOne().sort({ date: -1 }).select('date totalRevenue occupancyRate').lean();
    
    console.log('📊 Data Date Ranges:');
    console.log('====================\n');
    
    if (revenueEarliest && revenueLatest) {
      console.log('💰 Revenue Records:');
      console.log(`   Earliest: ${revenueEarliest.serviceDate.toISOString().split('T')[0]}`);
      console.log(`   Latest:   ${revenueLatest.serviceDate.toISOString().split('T')[0]}`);
      console.log(`   Count: ${await Revenue.countDocuments()}\n`);
    }
    
    if (expenseEarliest && expenseLatest) {
      console.log('💸 Expense Records:');
      console.log(`   Earliest: ${expenseEarliest.paidAt.toISOString().split('T')[0]}`);
      console.log(`   Latest:   ${expenseLatest.paidAt.toISOString().split('T')[0]}`);
      console.log(`   Count: ${await Expense.countDocuments()}\n`);
    }
    
    if (bookingEarliest && bookingLatest) {
      console.log('📅 Booking Records:');
      console.log(`   Earliest: ${bookingEarliest.checkIn.toISOString().split('T')[0]}`);
      console.log(`   Latest:   ${bookingLatest.checkIn.toISOString().split('T')[0]}`);
      console.log(`   Count: ${await Booking.countDocuments()}\n`);
    }
    
    if (kpiEarliest && kpiLatest) {
      console.log('📈 KPI Records:');
      console.log(`   Earliest: ${kpiEarliest.date.toISOString().split('T')[0]}`);
      console.log(`   Latest:   ${kpiLatest.date.toISOString().split('T')[0]}`);
      console.log(`   Count: ${await KPI.countDocuments()}\n`);
    }
    
    // Calculate how many days ago
    const today = new Date();
    if (revenueLatest) {
      const daysAgo = Math.floor((today - revenueLatest.serviceDate) / (1000 * 60 * 60 * 24));
      console.log(`ℹ️  Latest revenue is ${daysAgo} days old`);
    }
    
    console.log(`\n📆 Today's date: ${today.toISOString().split('T')[0]}`);
    console.log('📆 Default filter (Last 3 months)');
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    console.log(`   Would show data from: ${threeMonthsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}\n`);
    
    // Check if data falls within default range
    const revenueInRange = await Revenue.countDocuments({
      serviceDate: { $gte: threeMonthsAgo, $lte: today }
    });
    const expenseInRange = await Expense.countDocuments({
      paidAt: { $gte: threeMonthsAgo, $lte: today }
    });
    
    console.log('✅ Records within default date range:');
    console.log(`   Revenue: ${revenueInRange}/${await Revenue.countDocuments()}`);
    console.log(`   Expenses: ${expenseInRange}/${await Expense.countDocuments()}\n`);
    
    if (revenueInRange === 0 || expenseInRange === 0) {
      console.log('⚠️  WARNING: No data in the default 3-month range!');
      console.log('💡 Solution: Either extend default range to 6 months or re-seed with recent dates\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

checkDataDates();
