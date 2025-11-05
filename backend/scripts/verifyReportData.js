import mongoose from 'mongoose';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import KPI from '../models/KPI.js';
import { connectDB } from '../config/database.js';

const verifyReportData = async () => {
  try {
    console.log('🔍 Verifying report data in MongoDB...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Count documents
    const counts = {
      revenues: await Revenue.countDocuments(),
      expenses: await Expense.countDocuments(),
      bookings: await Booking.countDocuments(),
      rooms: await Room.countDocuments(),
      kpis: await KPI.countDocuments()
    };
    
    console.log('📊 Database Statistics:');
    console.log('=======================');
    console.log(`💰 Revenue Records: ${counts.revenues}`);
    console.log(`💸 Expense Records: ${counts.expenses}`);
    console.log(`📅 Booking Records: ${counts.bookings}`);
    console.log(`🏨 Room Records: ${counts.rooms}`);
    console.log(`📈 KPI Records: ${counts.kpis}`);
    console.log('=======================\n');
    
    // Get sample data
    if (counts.revenues > 0) {
      const sampleRevenue = await Revenue.findOne().lean();
      console.log('💰 Sample Revenue Record:');
      console.log(`   - Source: ${sampleRevenue.source}`);
      console.log(`   - Amount: LKR ${sampleRevenue.amount.toLocaleString()}`);
      console.log(`   - Date: ${sampleRevenue.serviceDate.toISOString().split('T')[0]}\n`);
    }
    
    if (counts.kpis > 0) {
      const latestKPI = await KPI.findOne().sort({ date: -1 }).lean();
      console.log('📊 Latest KPI Record:');
      console.log(`   - Date: ${latestKPI.date.toISOString().split('T')[0]}`);
      console.log(`   - Occupancy Rate: ${latestKPI.occupancyRate}%`);
      console.log(`   - Total Revenue: LKR ${latestKPI.totalRevenue.toLocaleString()}`);
      console.log(`   - Profit Margin: ${latestKPI.profitMargin}%\n`);
    }
    
    if (counts.revenues === 0 && counts.expenses === 0 && counts.kpis === 0) {
      console.log('⚠️  No report data found in database!');
      console.log('Run "npm run seed:reports" to populate sample data.\n');
    } else {
      console.log('✅ Report data is available in MongoDB!');
      console.log('The reports page should now display data.\n');
    }
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

verifyReportData();
