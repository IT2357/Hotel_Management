import mongoose from 'mongoose';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import { User } from '../models/User.js';
import { connectDB } from '../config/database.js';

const generateRecentRevenue = (userId, roomId) => {
  const sources = [
    'room_booking', 'food_order', 'event_service', 
    'laundry_service', 'spa_service', 'transportation', 
    'room_service', 'conference_room', 'parking', 'minibar'
  ];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'digital_wallet', 'bank_transfer', 'corporate_account'];
  const bookingChannels = ['direct', 'online', 'phone', 'walk-in', 'agent', 'corporate'];
  
  const revenues = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6); // Start from 6 months ago
  
  console.log(`   Generating revenue from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
  
  for (let i = 0; i < 150; i++) {
    // Random date within the last 6 months
    const dayOffset = Math.floor(Math.random() * 180);
    const serviceDate = new Date(startDate);
    serviceDate.setDate(serviceDate.getDate() + dayOffset);
    
    const baseAmount = Math.floor(Math.random() * 50000) + 5000;
    const tax = baseAmount * 0.15;
    const discount = Math.random() > 0.7 ? baseAmount * 0.1 : 0;
    const serviceCharge = baseAmount * 0.1;
    const amount = baseAmount + tax + serviceCharge - discount;
    
    revenues.push({
      source: sources[Math.floor(Math.random() * sources.length)],
      amount: Math.round(amount),
      baseAmount: Math.round(baseAmount),
      tax: Math.round(tax),
      discount: Math.round(discount),
      serviceCharge: Math.round(serviceCharge),
      sourceId: new mongoose.Types.ObjectId(),
      sourceModel: 'Booking',
      customerId: userId,
      customerType: ['guest', 'walk-in', 'corporate', 'event'][Math.floor(Math.random() * 4)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: 'completed',
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
      bookingChannel: bookingChannels[Math.floor(Math.random() * bookingChannels.length)],
      serviceDate: serviceDate,
      receivedAt: serviceDate,
      roomNumber: `R${Math.floor(Math.random() * 50) + 1}`,
      description: `Service for room ${Math.floor(Math.random() * 50) + 1}`,
      notes: Math.random() > 0.8 ? 'Special request handled' : undefined,
      refundAmount: Math.random() > 0.95 ? Math.floor(Math.random() * 5000) : 0
    });
  }
  
  return revenues;
};

const generateRecentExpenses = (userId) => {
  const categories = [
    'staff_salaries', 'maintenance', 'food_raw_materials', 
    'cleaning_supplies', 'utilities', 'marketing', 
    'technology', 'insurance', 'rent', 'equipment', 'training', 'other'
  ];
  const departments = ['Kitchen', 'Services', 'Maintenance', 'Cleaning', 'Management', 'General'];
  const paymentMethods = ['cash', 'bank_transfer', 'credit_card', 'check', 'digital_wallet'];
  
  const expenses = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6);
  
  console.log(`   Generating expenses from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
  
  for (let i = 0; i < 100; i++) {
    const dayOffset = Math.floor(Math.random() * 180);
    const paidAt = new Date(startDate);
    paidAt.setDate(paidAt.getDate() + dayOffset);
    
    const amount = Math.floor(Math.random() * 25000) + 1000;
    
    expenses.push({
      title: `Expense ${i + 1}`,
      description: `Monthly expense for ${categories[Math.floor(Math.random() * categories.length)]}`,
      amount: amount,
      category: categories[Math.floor(Math.random() * categories.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      vendor: {
        name: `Vendor ${Math.floor(Math.random() * 20) + 1}`,
        contact: `+94${Math.floor(Math.random() * 90000000) + 10000000}`,
        email: `vendor${Math.floor(Math.random() * 20) + 1}@example.com`
      },
      invoiceNumber: `INV-${Date.now()}-${i + 1}`,
      isRecurring: Math.random() > 0.7,
      isApproved: Math.random() > 0.1,
      approvedBy: userId,
      approvedAt: Math.random() > 0.1 ? new Date() : undefined,
      paidBy: userId,
      paidAt: paidAt,
      tags: ['urgent', 'monthly', 'quarterly'].filter(() => Math.random() > 0.7)
    });
  }
  
  return expenses;
};

const generateRecentBookings = (userId, roomIds) => {
  const statuses = [
    'Approved - Payment Pending', 'Approved - Payment Processing', 
    'Confirmed', 'Completed', 'Cancelled', 'No Show'
  ];
  const paymentMethods = ['card', 'bank', 'cash'];
  const foodPlans = ['None', 'Breakfast', 'Half Board', 'Full Board', 'À la carte'];
  
  const bookings = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6);
  
  console.log(`   Generating bookings from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
  
  for (let i = 0; i < 80; i++) {
    const dayOffset = Math.floor(Math.random() * 180);
    
    // Set createdAt to a random date within the 6-month range (for chart data)
    const createdAt = new Date(startDate);
    createdAt.setDate(createdAt.getDate() + dayOffset);
    
    // CheckIn is a few days after creation
    const checkIn = new Date(createdAt);
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 days after booking
    
    const nights = Math.floor(Math.random() * 7) + 1;
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    
    const roomRate = Math.floor(Math.random() * 15000) + 5000;
    const subtotal = roomRate * nights;
    const tax = subtotal * 0.15;
    const serviceFee = subtotal * 0.1;
    const total = subtotal + tax + serviceFee;
    
    bookings.push({
      roomId: roomIds[Math.floor(Math.random() * roomIds.length)],
      userId: userId,
      createdAt: createdAt, // ✅ Add createdAt field
      checkIn: checkIn,
      checkOut: checkOut,
      guests: Math.floor(Math.random() * 4) + 1,
      guestCount: {
        adults: Math.floor(Math.random() * 3) + 1,
        children: Math.floor(Math.random() * 2)
      },
      foodPlan: foodPlans[Math.floor(Math.random() * foodPlans.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentStatus: ['pending', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)],
      totalPrice: total,
      depositAmount: Math.floor(total * 0.2),
      depositPaid: Math.random() > 0.3,
      costBreakdown: {
        nights: nights,
        roomRate: roomRate,
        subtotal: subtotal,
        tax: tax,
        serviceFee: serviceFee,
        total: total,
        currency: 'LKR'
      },
      isActive: Math.random() > 0.1
    });
  }
  
  return bookings;
};

const seedRecentReportData = async () => {
  try {
    console.log('🌱 Starting RECENT report data seeding...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Clear existing data
    console.log('🧹 Clearing existing Revenue, Expense, and Booking data...');
    await Promise.all([
      Revenue.deleteMany({}),
      Expense.deleteMany({}),
      Booking.deleteMany({})
    ]);
    console.log('✅ Cleared old data\n');
    
    // Get or create test user
    let testUser = await User.findOne({ email: 'test@hotel.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test Manager',
        email: 'test@hotel.com',
        password: 'password123',
        role: 'manager',
        phone: '+94123456789',
        isActive: true
      });
      await testUser.save();
    }
    
    // Get existing rooms or create if needed
    let rooms = await Room.find().limit(50);
    if (rooms.length === 0) {
      console.log('🏨 Creating sample rooms...');
      const roomData = [];
      for (let i = 1; i <= 50; i++) {
        roomData.push({
          roomNumber: `R${i}`,
          roomType: ['Standard', 'Deluxe', 'Suite', 'Presidential'][Math.floor(Math.random() * 4)],
          capacity: Math.floor(Math.random() * 4) + 1,
          price: Math.floor(Math.random() * 15000) + 5000,
          status: ['Available', 'Occupied', 'Maintenance'][Math.floor(Math.random() * 3)]
        });
      }
      rooms = await Room.insertMany(roomData);
      console.log(`✅ Created ${rooms.length} rooms\n`);
    }
    
    const roomIds = rooms.map(room => room._id);
    
    // Generate and save recent revenue
    console.log('💰 Creating RECENT revenue data...');
    const revenues = generateRecentRevenue(testUser._id, roomIds[0]);
    await Revenue.insertMany(revenues);
    console.log(`✅ Created ${revenues.length} revenue records\n`);
    
    // Generate and save recent expenses
    console.log('💸 Creating RECENT expense data...');
    const expenses = generateRecentExpenses(testUser._id);
    await Expense.insertMany(expenses);
    console.log(`✅ Created ${expenses.length} expense records\n`);
    
    // Generate and save recent bookings
    console.log('📅 Creating RECENT booking data...');
    const bookings = generateRecentBookings(testUser._id, roomIds);
    await Booking.insertMany(bookings);
    console.log(`✅ Created ${bookings.length} booking records\n`);
    
    // Verify dates
    const latestRevenue = await Revenue.findOne().sort({ serviceDate: -1 });
    const earliestRevenue = await Revenue.findOne().sort({ serviceDate: 1 });
    
    console.log('📊 Data Verification:');
    console.log(`   Revenue date range: ${earliestRevenue.serviceDate.toISOString().split('T')[0]} to ${latestRevenue.serviceDate.toISOString().split('T')[0]}`);
    console.log(`   Latest revenue is ${Math.floor((new Date() - latestRevenue.serviceDate) / (1000 * 60 * 60 * 24))} days old\n`);
    
    console.log('🎉 Recent report data seeding completed successfully!\n');
    console.log('📈 Summary:');
    console.log(`- Revenue Records: ${revenues.length}`);
    console.log(`- Expense Records: ${expenses.length}`);
    console.log(`- Booking Records: ${bookings.length}`);
    console.log(`- Rooms: ${rooms.length}\n`);
    
    console.log('✅ Your reports page should now display data!');
    console.log('🔄 Refresh your browser to see the updated reports.\n');
    
  } catch (error) {
    console.error('❌ Error seeding recent report data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedRecentReportData();
