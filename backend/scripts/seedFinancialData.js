import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import Booking from '../models/Booking.js';
import { User } from '../models/User.js';
import Room from '../models/Room.js';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const generateFinancialData = async () => {
  try {
    await connectDB();
    
    console.log('💰 Generating financial data...');
    
    // Get confirmed bookings that need payments
    const confirmedBookings = await Booking.find({ 
      status: 'Confirmed',
      paymentStatus: 'completed' 
    }).populate('userId').populate('roomId');
    
    console.log(`Found ${confirmedBookings.length} confirmed bookings`);
    
    // Clear existing payments and revenue
    await Payment.deleteMany({});
    await Revenue.deleteMany({});
    await Expense.deleteMany({});
    
    const payments = [];
    const revenues = [];
    
    // Generate payments for confirmed bookings
    for (const booking of confirmedBookings) {
      if (booking.totalAmount && booking.totalAmount > 0) {
        const payment = {
          orderId: `ORD-${booking._id}`,
          userId: booking.userId._id,
          bookingId: booking._id,
          amount: booking.totalAmount,
          currency: 'LKR',
          provider: 'payhere',
          status: 'success',
          paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          completedAt: booking.checkIn,
          createdAt: booking.createdAt,
          updatedAt: new Date()
        };
        payments.push(payment);
        
        // Create corresponding revenue record
        const revenue = {
          date: booking.checkIn,
          amount: booking.totalAmount,
          source: 'bookings',
          category: 'room_revenue',
          description: `Room booking revenue for ${booking.roomId?.roomNumber}`,
          createdAt: booking.createdAt,
          updatedAt: new Date()
        };
        revenues.push(revenue);
      }
    }
    
    // Insert payments
    if (payments.length > 0) {
      await Payment.insertMany(payments);
      console.log(`✅ Created ${payments.length} payment records`);
    }
    
    // Insert revenues
    if (revenues.length > 0) {
      await Revenue.insertMany(revenues);
      console.log(`✅ Created ${revenues.length} revenue records`);
    }
    
    // Generate some expenses for the past 30 days
    const expenses = [];
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const expenseCategories = [
      { category: 'utilities', description: 'Electricity and utilities', amount: 15000 },
      { category: 'maintenance', description: 'Room maintenance', amount: 8000 },
      { category: 'supplies', description: 'Cleaning supplies', amount: 5000 },
      { category: 'staff', description: 'Staff salaries', amount: 25000 }
    ];
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      
      const expense = {
        date,
        amount: Math.floor(Math.random() * category.amount) + 1000,
        category: category.category,
        description: category.description,
        vendor: `Vendor ${Math.floor(Math.random() * 5) + 1}`,
        createdAt: date,
        updatedAt: new Date()
      };
      expenses.push(expense);
    }
    
    await Expense.insertMany(expenses);
    console.log(`✅ Created ${expenses.length} expense records`);
    
    // Summary
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    console.log('\\n📊 Financial Summary:');
    console.log(`- Total Revenue: LKR ${totalRevenue.toLocaleString()}`);
    console.log(`- Total Expenses: LKR ${totalExpenses.toLocaleString()}`);
    console.log(`- Net Profit: LKR ${(totalRevenue - totalExpenses).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error generating financial data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

generateFinancialData();