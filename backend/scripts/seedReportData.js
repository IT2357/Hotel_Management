import mongoose from 'mongoose';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import StaffTask from '../models/StaffTask.js';
import ManagerTask from '../models/ManagerTask.js';
import { User } from '../models/User.js';
import KPI from '../models/KPI.js';
import { connectDB } from '../config/database.js';

// Sample data generation functions
const generateSampleRevenue = async (userId, roomId) => {
  const sources = [
    'room_booking', 'food_order', 'event_service', 
    'laundry_service', 'spa_service', 'transportation', 
    'room_service', 'conference_room', 'parking', 'minibar'
  ];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'digital_wallet', 'bank_transfer', 'corporate_account'];
  const bookingChannels = ['direct', 'online', 'phone', 'walk-in', 'agent', 'corporate'];
  
  const revenues = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 months ago
  
  for (let i = 0; i < 150; i++) {
    const serviceDate = new Date(startDate);
    serviceDate.setDate(serviceDate.getDate() + Math.floor(Math.random() * 180));
    
    const baseAmount = Math.floor(Math.random() * 50000) + 5000; // 5k to 55k
    const tax = baseAmount * 0.15; // 15% tax
    const discount = Math.random() > 0.7 ? baseAmount * 0.1 : 0; // 10% discount sometimes
    const serviceCharge = baseAmount * 0.1; // 10% service charge
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
      refundAmount: Math.random() > 0.95 ? Math.floor(Math.random() * 5000) : 0,
      refundReason: Math.random() > 0.95 ? 'Guest cancellation' : undefined,
      refundedAt: Math.random() > 0.95 ? new Date() : undefined
    });
  }
  
  return revenues;
};

const generateSampleExpenses = async (userId) => {
  const categories = [
    'staff_salaries', 'maintenance', 'food_raw_materials', 
    'cleaning_supplies', 'utilities', 'marketing', 
    'technology', 'insurance', 'rent', 'equipment', 'training', 'other'
  ];
  const departments = ['Kitchen', 'Services', 'Maintenance', 'Cleaning', 'Management', 'General'];
  const paymentMethods = ['cash', 'bank_transfer', 'credit_card', 'check', 'digital_wallet'];
  
  const expenses = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  for (let i = 0; i < 100; i++) {
    const paidAt = new Date(startDate);
    paidAt.setDate(paidAt.getDate() + Math.floor(Math.random() * 180));
    
    const amount = Math.floor(Math.random() * 25000) + 1000; // 1k to 26k
    
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
      receiptUrl: Math.random() > 0.5 ? `https://example.com/receipts/receipt_${i + 1}.pdf` : undefined,
      invoiceNumber: `INV-${Date.now()}-${i + 1}`,
      isRecurring: Math.random() > 0.7,
      recurringFrequency: Math.random() > 0.7 ? ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'][Math.floor(Math.random() * 5)] : undefined,
      nextRecurringDate: Math.random() > 0.7 ? new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined,
      isApproved: Math.random() > 0.1,
      approvedBy: userId,
      approvedAt: Math.random() > 0.1 ? new Date() : undefined,
      paidBy: userId,
      paidAt: paidAt,
      tags: ['urgent', 'monthly', 'quarterly'].filter(() => Math.random() > 0.7),
      notes: Math.random() > 0.8 ? 'Additional notes for this expense' : undefined
    });
  }
  
  return expenses;
};

const generateSampleBookings = async (userId, roomIds) => {
  const statuses = [
    'Approved - Payment Pending', 'Approved - Payment Processing', 
    'Confirmed', 'Completed', 'Cancelled', 'No Show'
  ];
  const paymentMethods = ['card', 'bank', 'cash'];
  const foodPlans = ['None', 'Breakfast', 'Half Board', 'Full Board', 'À la carte'];
  
  const bookings = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  for (let i = 0; i < 80; i++) {
    const checkIn = new Date(startDate);
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 180));
    
    const nights = Math.floor(Math.random() * 7) + 1; // 1-7 nights
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    
    const roomRate = Math.floor(Math.random() * 15000) + 5000; // 5k to 20k per night
    const subtotal = roomRate * nights;
    const tax = subtotal * 0.15;
    const serviceFee = subtotal * 0.1;
    const total = subtotal + tax + serviceFee;
    
    bookings.push({
      roomId: roomIds[Math.floor(Math.random() * roomIds.length)],
      userId: userId,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: Math.floor(Math.random() * 4) + 1,
      guestCount: {
        adults: Math.floor(Math.random() * 3) + 1,
        children: Math.floor(Math.random() * 2)
      },
      specialRequests: Math.random() > 0.7 ? 'Late check-in requested' : undefined,
      foodPlan: foodPlans[Math.floor(Math.random() * foodPlans.length)],
      selectedMeals: Math.random() > 0.5 ? [
        {
          name: 'Breakfast Buffet',
          price: 1500,
          description: 'Continental breakfast',
          scheduledTime: new Date(checkIn.getTime() + 8 * 60 * 60 * 1000) // 8 AM
        }
      ] : [],
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
        currency: 'LKR',
        deposit: Math.floor(total * 0.2),
        depositRequired: true
      },
      isActive: Math.random() > 0.1,
      requiresReview: Math.random() > 0.5,
      lastStatusChange: new Date()
    });
  }
  
  return bookings;
};

const generateSampleRooms = () => {
  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];
  const statuses = ['Available', 'Occupied', 'Maintenance', 'OutOfService'];
  
  const rooms = [];
  for (let i = 1; i <= 50; i++) {
    rooms.push({
      roomNumber: `R${i}`,
      roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      capacity: Math.floor(Math.random() * 4) + 1,
      price: Math.floor(Math.random() * 15000) + 5000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'].filter(() => Math.random() > 0.3),
      description: `Comfortable ${roomTypes[Math.floor(Math.random() * roomTypes.length)]} room with modern amenities`
    });
  }
  
  return rooms;
};

const generateSampleStaffTasks = async (userId) => {
  const departments = ['Housekeeping', 'Kitchen', 'Maintenance', 'Service'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
  
  const tasks = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  for (let i = 0; i < 120; i++) {
    const createdAt = new Date(startDate);
    createdAt.setDate(createdAt.getDate() + Math.floor(Math.random() * 90));
    
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);
    
    const completedAt = Math.random() > 0.3 ? new Date(createdAt.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000) : undefined;
    const actualDuration = completedAt ? Math.floor((completedAt - createdAt) / (1000 * 60 * 60)) : undefined;
    
    tasks.push({
      title: `Task ${i + 1}`,
      description: `Detailed description for task ${i + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdBy: userId,
      assignedTo: Math.random() > 0.2 ? userId : undefined,
      assignedBy: userId,
      assignmentSource: 'user',
      acceptedBy: Math.random() > 0.2 ? userId : undefined,
      acceptedAt: Math.random() > 0.2 ? createdAt : undefined,
      completedBy: completedAt ? userId : undefined,
      dueDate: dueDate,
      completedAt: completedAt,
      complexity: Math.floor(Math.random() * 5) + 1,
      estimatedPoints: Math.floor(Math.random() * 10) + 1,
      skillRequirements: [
        { skill: 'Cleaning', level: Math.floor(Math.random() * 5) + 1 },
        { skill: 'Customer Service', level: Math.floor(Math.random() * 5) + 1 }
      ],
      actualDuration: actualDuration,
      performanceMetrics: {
        qualityRating: Math.floor(Math.random() * 5) + 1,
        efficiencyScore: Math.floor(Math.random() * 100) + 1,
        customerSatisfaction: Math.floor(Math.random() * 5) + 1
      },
      notes: Math.random() > 0.7 ? 'Additional notes for this task' : undefined,
      tags: ['urgent', 'maintenance', 'cleaning'].filter(() => Math.random() > 0.7)
    });
  }
  
  return tasks;
};

const generateSampleManagerTasks = async (userId) => {
  const departments = ['Housekeeping', 'Kitchen', 'Maintenance', 'Service', 'Management', 'General'];
  const types = ['cleaning', 'maintenance', 'food_service', 'guest_service', 'Kitchen', 'general'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold'];
  
  const tasks = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  for (let i = 0; i < 60; i++) {
    const createdAt = new Date(startDate);
    createdAt.setDate(createdAt.getDate() + Math.floor(Math.random() * 90));
    
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1);
    
    tasks.push({
      title: `Manager Task ${i + 1}`,
      description: `Manager-level task description ${i + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      type: types[Math.floor(Math.random() * types.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: `Location ${Math.floor(Math.random() * 10) + 1}`,
      roomNumber: Math.random() > 0.5 ? `R${Math.floor(Math.random() * 50) + 1}` : undefined,
      dueDate: dueDate,
      estimatedDuration: Math.floor(Math.random() * 480) + 60, // 1-8 hours
      tags: ['urgent', 'monthly', 'quarterly'].filter(() => Math.random() > 0.7),
      recommendedStaff: [
        {
          staffId: userId,
          name: 'John Doe',
          role: 'Staff Member',
          match: Math.floor(Math.random() * 30) + 70
        }
      ],
      aiRecommendationScore: Math.floor(Math.random() * 30) + 70,
      assignedTo: Math.random() > 0.3 ? userId : undefined,
      assignmentHistory: Math.random() > 0.3 ? [
        {
          assignedTo: userId,
          assignedName: 'John Doe',
          assignedAt: createdAt,
          assignedBy: userId,
          notes: 'Initial assignment'
        }
      ] : [],
      notes: {
        manager: Math.random() > 0.7 ? 'Manager notes for this task' : undefined,
        staff: Math.random() > 0.7 ? 'Staff notes for this task' : undefined
      },
      createdBy: userId,
      isArchived: Math.random() > 0.9
    });
  }
  
  return tasks;
};

const generateSampleKPIs = () => {
  const kpis = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  for (let i = 0; i < 180; i++) { // 6 months of daily data
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const totalBookings = Math.floor(Math.random() * 20) + 5;
    const totalRooms = 50;
    const occupiedRooms = Math.floor(Math.random() * 40) + 5;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;
    
    const totalRevenue = Math.floor(Math.random() * 500000) + 100000;
    const roomRevenue = Math.floor(totalRevenue * 0.7);
    const foodRevenue = Math.floor(totalRevenue * 0.2);
    const serviceRevenue = Math.floor(totalRevenue * 0.1);
    
    const totalExpenses = Math.floor(Math.random() * 300000) + 80000;
    const staffExpenses = Math.floor(totalExpenses * 0.4);
    const maintenanceExpenses = Math.floor(totalExpenses * 0.2);
    const foodExpenses = Math.floor(totalExpenses * 0.15);
    const utilitiesExpenses = Math.floor(totalExpenses * 0.15);
    const otherExpenses = totalExpenses - staffExpenses - maintenanceExpenses - foodExpenses - utilitiesExpenses;
    
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit * 0.8; // Assuming 20% other costs
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const totalTasks = Math.floor(Math.random() * 50) + 20;
    const completedTasks = Math.floor(totalTasks * (0.7 + Math.random() * 0.3));
    const taskCompletionRate = (completedTasks / totalTasks) * 100;
    
    kpis.push({
      date: date,
      period: 'daily',
      totalBookings: totalBookings,
      totalRooms: totalRooms,
      occupiedRooms: occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      averageRoomRate: Math.floor(totalRevenue / totalBookings),
      revenuePerAvailableRoom: Math.floor(totalRevenue / totalRooms),
      totalRevenue: totalRevenue,
      roomRevenue: roomRevenue,
      foodRevenue: foodRevenue,
      serviceRevenue: serviceRevenue,
      averageRevenuePerBooking: Math.floor(totalRevenue / totalBookings),
      totalExpenses: totalExpenses,
      staffExpenses: staffExpenses,
      maintenanceExpenses: maintenanceExpenses,
      foodExpenses: foodExpenses,
      utilitiesExpenses: utilitiesExpenses,
      otherExpenses: otherExpenses,
      grossProfit: grossProfit,
      netProfit: netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      averageTaskCompletionTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
      guestSatisfactionScore: Math.round((3.5 + Math.random() * 1.5) * 100) / 100, // 3.5-5.0
      totalReviews: Math.floor(Math.random() * 20) + 5,
      averageResponseTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
      staffEfficiencyScore: Math.round((70 + Math.random() * 30) * 100) / 100, // 70-100
      energyEfficiencyScore: Math.round((60 + Math.random() * 40) * 100) / 100, // 60-100
      maintenanceScore: Math.round((70 + Math.random() * 30) * 100) / 100, // 70-100
      cleanlinessScore: Math.round((80 + Math.random() * 20) * 100) / 100, // 80-100
      serviceQualityScore: Math.round((75 + Math.random() * 25) * 100) / 100 // 75-100
    });
  }
  
  return kpis;
};

// Main seeding function
const seedReportData = async () => {
  try {
    console.log('🌱 Starting report data seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Revenue.deleteMany({}),
      Expense.deleteMany({}),
      Booking.deleteMany({}),
      Room.deleteMany({}),
      StaffTask.deleteMany({}),
      ManagerTask.deleteMany({}),
      KPI.deleteMany({})
    ]);
    console.log('✅ Cleared existing data');
    
    // Get or create a test user
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
    console.log('✅ Test user ready');
    
    // Generate and save rooms
    console.log('🏨 Creating sample rooms...');
    const rooms = generateSampleRooms();
    const savedRooms = await Room.insertMany(rooms);
    const roomIds = savedRooms.map(room => room._id);
    console.log(`✅ Created ${savedRooms.length} rooms`);
    
    // Generate and save revenue data
    console.log('💰 Creating sample revenue data...');
    const revenues = await generateSampleRevenue(testUser._id, roomIds[0]);
    await Revenue.insertMany(revenues);
    console.log(`✅ Created ${revenues.length} revenue records`);
    
    // Generate and save expense data
    console.log('💸 Creating sample expense data...');
    const expenses = await generateSampleExpenses(testUser._id);
    await Expense.insertMany(expenses);
    console.log(`✅ Created ${expenses.length} expense records`);
    
    // Generate and save booking data
    console.log('📅 Creating sample booking data...');
    const bookings = await generateSampleBookings(testUser._id, roomIds);
    await Booking.insertMany(bookings);
    console.log(`✅ Created ${bookings.length} booking records`);
    
    // Generate and save staff tasks
    console.log('👥 Creating sample staff tasks...');
    const staffTasks = await generateSampleStaffTasks(testUser._id);
    await StaffTask.insertMany(staffTasks);
    console.log(`✅ Created ${staffTasks.length} staff tasks`);
    
    // Generate and save manager tasks
    console.log('👨‍💼 Creating sample manager tasks...');
    const managerTasks = await generateSampleManagerTasks(testUser._id);
    await ManagerTask.insertMany(managerTasks);
    console.log(`✅ Created ${managerTasks.length} manager tasks`);
    
    // Generate and save KPI data
    console.log('📊 Creating sample KPI data...');
    const kpis = generateSampleKPIs();
    await KPI.insertMany(kpis);
    console.log(`✅ Created ${kpis.length} KPI records`);
    
    console.log('🎉 Report data seeding completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`- Rooms: ${savedRooms.length}`);
    console.log(`- Revenue Records: ${revenues.length}`);
    console.log(`- Expense Records: ${expenses.length}`);
    console.log(`- Booking Records: ${bookings.length}`);
    console.log(`- Staff Tasks: ${staffTasks.length}`);
    console.log(`- Manager Tasks: ${managerTasks.length}`);
    console.log(`- KPI Records: ${kpis.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding report data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedReportData()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedReportData;