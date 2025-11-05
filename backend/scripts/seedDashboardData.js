import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { User } from '../models/User.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import KPI from '../models/KPI.js';
import Review from '../models/Review.js';
import Task from '../models/Task.js';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateBookingData = async () => {
  console.log('📋 Generating booking data...');
  
  // Get existing users and rooms
  const guests = await User.find({ role: 'guest' }).limit(20);
  const managers = await User.find({ role: 'manager' });
  const rooms = await Room.find({});
  
  if (guests.length === 0) {
    console.log('⚠️ No guest users found. Creating sample guests...');
    const sampleGuests = [];
    for (let i = 1; i <= 20; i++) {
      const guest = new User({
        name: `Guest User ${i}`,
        email: `guest${i}@example.com`,
        password: 'hashedpassword',
        role: 'guest',
        phone: `+1234567${String(i).padStart(3, '0')}`,
        isActive: true,
        emailVerified: true,
        isApproved: true
      });
      sampleGuests.push(guest);
    }
    await User.insertMany(sampleGuests);
    console.log('✅ Created 20 sample guests');
  }
  
  if (rooms.length === 0) {
    console.log('⚠️ No rooms found. Creating sample rooms...');
    const sampleRooms = [];
    const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];
    const bedTypes = ['Single', 'Double', 'Queen', 'King', 'Twin'];
    const amenities = ['WiFi', 'AC', 'TV', 'Minibar', 'Balcony', 'PoolView'];
    const views = ['City', 'Garden', 'Pool', 'Ocean', 'Mountain'];
    const statuses = ['Available', 'Booked', 'Maintenance', 'Cleaning'];
    
    for (let i = 101; i <= 150; i++) {
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const bedType = bedTypes[Math.floor(Math.random() * bedTypes.length)];
      const adults = Math.floor(Math.random() * 4) + 1;
      const basePrice = Math.floor(Math.random() * 300) + 100;
      
      const room = new Room({
        title: `${roomType} Room ${i}`,
        description: `Beautiful ${roomType.toLowerCase()} room with modern amenities`,
        roomNumber: i.toString(),
        type: roomType,
        bedType: bedType,
        occupancy: {
          adults: adults,
          children: Math.floor(adults / 2)
        },
        size: Math.floor(Math.random() * 30) + 20, // 20-50 sqm
        basePrice: basePrice,
        amenities: amenities.slice(0, Math.floor(Math.random() * 4) + 2),
        view: views[Math.floor(Math.random() * views.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        floor: Math.floor((i - 100) / 10) + 1,
        cancellationPolicy: 'Moderate',
        images: [{
          url: `https://example.com/room-${i}.jpg`,
          isPrimary: true,
          caption: `${roomType} Room ${i}`
        }]
      });
      sampleRooms.push(room);
    }
    await Room.insertMany(sampleRooms);
    console.log('✅ Created 50 sample rooms');
  }
  
  // Refresh data after creation
  const allGuests = await User.find({ role: 'guest' });
  const allRooms = await Room.find({});
  const manager = await User.findOne({ role: 'manager' });
  
  // Generate bookings for the last 90 days
  const bookings = [];
  const today = new Date();
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < 150; i++) {
    const guest = allGuests[Math.floor(Math.random() * allGuests.length)];
    const room = allRooms[Math.floor(Math.random() * allRooms.length)];
    
    const checkInDate = generateRandomDate(ninetyDaysAgo, today);
    const checkOutDate = new Date(checkInDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);
    const nights = Math.ceil((checkOutDate - checkInDate) / (24 * 60 * 60 * 1000));
    const totalAmount = nights * room.basePrice;
    
    const statuses = ['confirmed', 'pending', 'cancelled', 'completed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const bookingStatuses = ['Pending Approval', 'Confirmed', 'Completed', 'Cancelled'];
    const bookingStatus = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
    
    const booking = {
      userId: guest._id,
      roomId: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Math.floor(Math.random() * room.occupancy.adults) + 1,
      guestCount: {
        adults: Math.floor(Math.random() * room.occupancy.adults) + 1,
        children: Math.floor(Math.random() * 2)
      },
      status: bookingStatus,
      paymentStatus: bookingStatus === 'Cancelled' ? 'failed' : 
                     bookingStatus === 'Completed' ? 'completed' : 
                     Math.random() > 0.3 ? 'completed' : 'pending',
      paymentMethod: ['card', 'bank', 'cash'][Math.floor(Math.random() * 3)],
      specialRequests: Math.random() > 0.7 ? 'Late check-in requested' : '',
      totalAmount,
      foodPlan: ['None', 'Breakfast', 'Half Board'][Math.floor(Math.random() * 3)],
      createdAt: new Date(checkInDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
    
    bookings.push(booking);
  }
  
  await Booking.deleteMany({}); // Clear existing bookings
  const insertedBookings = await Booking.insertMany(bookings);
  console.log(`✅ Created ${bookings.length} sample bookings`);
  
  return insertedBookings;
};

const generatePaymentData = async (bookings) => {
  console.log('💳 Generating payment data...');
  
  const payments = [];
  
  for (const booking of bookings) {
    if (booking.paymentStatus === 'completed') {
      const payment = {
        orderId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
        bookingId: booking._id,
        userId: booking.userId,
        amount: booking.totalAmount,
        currency: 'LKR',
        provider: ['payhere', 'stripe', 'paypal'][Math.floor(Math.random() * 3)],
        status: 'success',
        paymentId: `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
        completedAt: booking.checkIn,
        createdAt: booking.createdAt,
        updatedAt: new Date()
      };
      payments.push(payment);
    }
  }
  
  await Payment.deleteMany({});
  await Payment.insertMany(payments);
  console.log(`✅ Created ${payments.length} payment records`);
  
  return payments;
};

const generateRevenueData = async (payments) => {
  console.log('📈 Generating revenue data...');
  
  const revenues = [];
  const revenueByDate = {};
  
  // Group payments by date
  payments.forEach(payment => {
    const date = payment.completedAt.toISOString().split('T')[0];
    if (!revenueByDate[date]) {
      revenueByDate[date] = 0;
    }
    revenueByDate[date] += payment.amount;
  });
  
  // Create revenue records
  for (const [date, amount] of Object.entries(revenueByDate)) {
    const revenue = {
      date: new Date(date),
      amount,
      source: 'bookings',
      category: 'room_revenue',
      description: `Room booking revenue for ${date}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    revenues.push(revenue);
  }
  
  await Revenue.deleteMany({});
  await Revenue.insertMany(revenues);
  console.log(`✅ Created ${revenues.length} revenue records`);
  
  return revenues;
};

const generateExpenseData = async () => {
  console.log('💰 Generating expense data...');
  
  const expenses = [];
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const expenseCategories = [
    { category: 'utilities', description: 'Electricity, Water, Gas', range: [500, 2000] },
    { category: 'maintenance', description: 'Room maintenance and repairs', range: [200, 1500] },
    { category: 'supplies', description: 'Cleaning supplies and amenities', range: [300, 800] },
    { category: 'staff', description: 'Staff salaries and benefits', range: [5000, 15000] },
    { category: 'marketing', description: 'Advertising and marketing', range: [1000, 3000] }
  ];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Generate 1-3 expenses per day
    const dailyExpenses = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < dailyExpenses; j++) {
      const categoryData = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amount = Math.floor(Math.random() * (categoryData.range[1] - categoryData.range[0])) + categoryData.range[0];
      
      const expense = {
        date,
        amount,
        category: categoryData.category,
        description: categoryData.description,
        vendor: `Vendor ${Math.floor(Math.random() * 10) + 1}`,
        createdAt: date,
        updatedAt: new Date()
      };
      expenses.push(expense);
    }
  }
  
  await Expense.deleteMany({});
  await Expense.insertMany(expenses);
  console.log(`✅ Created ${expenses.length} expense records`);
  
  return expenses;
};

const generateKPIData = async () => {
  console.log('📊 Generating KPI data...');
  
  const kpis = [
    {
      name: 'Occupancy Rate',
      value: Math.floor(Math.random() * 40) + 60, // 60-100%
      target: 85,
      unit: '%',
      category: 'operational',
      status: 'on_track',
      trend: 'up',
      lastUpdated: new Date()
    },
    {
      name: 'Average Daily Rate',
      value: Math.floor(Math.random() * 100) + 150, // $150-250
      target: 200,
      unit: '$',
      category: 'financial',
      status: 'on_track',
      trend: 'stable',
      lastUpdated: new Date()
    },
    {
      name: 'Guest Satisfaction',
      value: Math.floor(Math.random() * 20) + 80, // 80-100%
      target: 90,
      unit: '%',
      category: 'service',
      status: 'on_track',
      trend: 'up',
      lastUpdated: new Date()
    },
    {
      name: 'Revenue per Available Room',
      value: Math.floor(Math.random() * 80) + 120, // $120-200
      target: 180,
      unit: '$',
      category: 'financial',
      status: 'needs_attention',
      trend: 'down',
      lastUpdated: new Date()
    },
    {
      name: 'Staff Productivity',
      value: Math.floor(Math.random() * 30) + 70, // 70-100%
      target: 85,
      unit: '%',
      category: 'operational',
      status: 'on_track',
      trend: 'stable',
      lastUpdated: new Date()
    }
  ];
  
  await KPI.deleteMany({});
  await KPI.insertMany(kpis);
  console.log(`✅ Created ${kpis.length} KPI records`);
  
  return kpis;
};

const generateReviewData = async () => {
  console.log('⭐ Generating review data...');
  
  const bookings = await Booking.find({ status: 'completed' }).populate('guestId').limit(50);
  const reviews = [];
  
  const reviewTexts = [
    "Excellent service and beautiful rooms!",
    "Great location and friendly staff.",
    "Clean rooms and comfortable beds.",
    "Outstanding hospitality and amenities.",
    "Perfect for a business trip.",
    "Wonderful vacation experience.",
    "Good value for money.",
    "Professional and courteous staff."
  ];
  
  for (const booking of bookings) {
    if (Math.random() > 0.3 && booking.guestId) { // 70% chance of review
      const review = {
        guestId: booking.guestId._id,
        bookingId: booking._id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
        comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        serviceRating: Math.floor(Math.random() * 2) + 4,
        cleanlinessRating: Math.floor(Math.random() * 2) + 4,
        locationRating: Math.floor(Math.random() * 2) + 4,
        valueRating: Math.floor(Math.random() * 2) + 4,
        createdAt: new Date(booking.checkOutDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
      reviews.push(review);
    }
  }
  
  await Review.deleteMany({});
  await Review.insertMany(reviews);
  console.log(`✅ Created ${reviews.length} review records`);
  
  return reviews;
};

const seedDashboardData = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting dashboard data seeding...\n');
    
    // Generate data in sequence
    const bookings = await generateBookingData();
    const payments = await generatePaymentData(bookings);
    const revenues = await generateRevenueData(payments);
    const expenses = await generateExpenseData();
    const kpis = await generateKPIData();
    const reviews = await generateReviewData();
    
    console.log('\n✅ Dashboard data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Bookings: ${bookings.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Revenue records: ${revenues.length}`);
    console.log(`- Expense records: ${expenses.length}`);
    console.log(`- KPIs: ${kpis.length}`);
    console.log(`- Reviews: ${reviews.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedDashboardData();