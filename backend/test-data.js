import mongoose from 'mongoose';
import Revenue from './models/Revenue.js';
import Expense from './models/Expense.js';
import Booking from './models/Booking.js';
import Room from './models/Room.js';
import StaffTask from './models/StaffTask.js';
import ManagerTask from './models/ManagerTask.js';
import { User } from './models/User.js';
import KPI from './models/KPI.js';
import { connectDB } from './config/database.js';

const testData = async () => {
  try {
    console.log('🔍 Testing data in database...');
    
    await connectDB();
    console.log('✅ Connected to database');
    
    // Count documents in each collection
    const counts = await Promise.all([
      Revenue.countDocuments(),
      Expense.countDocuments(),
      Booking.countDocuments(),
      Room.countDocuments(),
      StaffTask.countDocuments(),
      ManagerTask.countDocuments(),
      User.countDocuments(),
      KPI.countDocuments()
    ]);
    
    console.log('\n📊 Database counts:');
    console.log(`- Revenue Records: ${counts[0]}`);
    console.log(`- Expense Records: ${counts[1]}`);
    console.log(`- Booking Records: ${counts[2]}`);
    console.log(`- Room Records: ${counts[3]}`);
    console.log(`- Staff Task Records: ${counts[4]}`);
    console.log(`- Manager Task Records: ${counts[5]}`);
    console.log(`- User Records: ${counts[6]}`);
    console.log(`- KPI Records: ${counts[7]}`);
    
    if (counts[0] > 0) {
      console.log('\n✅ Sample data found!');
    } else {
      console.log('\n❌ No sample data found. Running seeding script...');
    }
    
  } catch (error) {
    console.error('❌ Error testing data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testData();
