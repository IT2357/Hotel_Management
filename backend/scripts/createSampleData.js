import mongoose from 'mongoose';
import { User } from '../models/User.js';
import Booking from '../models/Booking.js';
import Task from '../models/Task.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import Review from '../models/Review.js';
import Room from '../models/Room.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample data creation functions
const createSampleUsers = async () => {
  console.log('🔄 Creating sample users...');
  
  const sampleUsers = [
    {
      name: 'Manager John',
      email: 'manager@hotel.com',
      password: '$2b$10$rOvOBKXnEPNOW7Qw6sXsJeCdYrQq9sJGGwA5QPGWdKqsLNaZdLJly', // password: 'manager123'
      role: 'manager',
      isActive: true,
      lastLogin: new Date()
    },
    {
      name: 'Maria Santos',
      email: 'maria.santos@hotel.com',
      password: '$2b$10$rOvOBKXnEPNOW7Qw6sXsJeCdYrQq9sJGGwA5QPGWdKqsLNaZdLJly', // password: 'staff123'
      role: 'staff',
      isActive: true,
      lastLogin: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      profile: {
        department: 'Cleaning',
        position: 'Housekeeper',
        phone: '+1234567890'
      }
    },
    {
      name: 'John Mitchell',
      email: 'john.mitchell@hotel.com',
      password: '$2b$10$rOvOBKXnEPNOW7Qw6sXsJeCdYrQq9sJGGwA5QPGWdKqsLNaZdLJly', // password: 'staff123'
      role: 'staff',
      isActive: true,
      lastLogin: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      profile: {
        department: 'Maintenance',
        position: 'Maintenance Technician',
        phone: '+1234567891'
      }
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@hotel.com',
      password: '$2b$10$rOvOBKXnEPNOW7Qw6sXsJeCdYrQq9sJGGwA5QPGWdKqsLNaZdLJly', // password: 'staff123'
      role: 'staff',
      isActive: true,
      lastLogin: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      profile: {
        department: 'Kitchen',
        position: 'Chef',
        phone: '+1234567892'
      }
    },
    {
      name: 'Guest User',
      email: 'guest@example.com',
      password: '$2b$10$rOvOBKXnEPNOW7Qw6sXsJeCdYrQq9sJGGwA5QPGWdKqsLNaZdLJly', // password: 'guest123'
      role: 'guest',
      isActive: true,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567893'
      }
    }
  ];

  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      await User.create(userData);
      console.log(`✅ Created user: ${userData.name}`);
    } else {
      console.log(`⚠️  User already exists: ${userData.name}`);
    }
  }
};

const createSampleRooms = async () => {
  console.log('🔄 Creating sample rooms...');
  
  const sampleRooms = [
    {
      roomNumber: '101',
      type: 'Standard',
      pricePerNight: 120,
      capacity: 2,
      amenities: ['WiFi', 'TV', 'AC'],
      status: 'available',
      description: 'Comfortable standard room with city view'
    },
    {
      roomNumber: '102',
      type: 'Standard',
      pricePerNight: 120,
      capacity: 2,
      amenities: ['WiFi', 'TV', 'AC'],
      status: 'occupied',
      description: 'Comfortable standard room with city view'
    },
    {
      roomNumber: '201',
      type: 'Deluxe',
      pricePerNight: 180,
      capacity: 3,
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
      status: 'available',
      description: 'Spacious deluxe room with premium amenities'
    },
    {
      roomNumber: '301',
      type: 'Suite',
      pricePerNight: 350,
      capacity: 4,
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Room Service'],
      status: 'maintenance',
      description: 'Luxury suite with panoramic views'
    }
  ];

  for (const roomData of sampleRooms) {
    const existingRoom = await Room.findOne({ roomNumber: roomData.roomNumber });
    if (!existingRoom) {
      await Room.create(roomData);
      console.log(`✅ Created room: ${roomData.roomNumber}`);
    } else {
      console.log(`⚠️  Room already exists: ${roomData.roomNumber}`);
    }
  }
};

const createSampleBookings = async () => {
  console.log('🔄 Creating sample bookings...');
  
  const guest = await User.findOne({ role: 'guest' });
  const rooms = await Room.find();
  
  if (!guest || rooms.length === 0) {
    console.log('⚠️  No guest or rooms found, skipping bookings');
    return;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const sampleBookings = [
    {
      userId: guest._id,
      roomId: rooms[0]._id,
      bookingNumber: "BK" + Date.now().toString().slice(-6),
      checkIn: today,
      checkOut: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      totalAmount: 360, // 3 nights * $120
      status: 'Confirmed',
      paymentStatus: 'completed',
      guests: 2,
      guestCount: { adults: 2, children: 0 },
      specialRequests: 'Late check-in',
      createdAt: today
    },
    {
      userId: guest._id,
      roomId: rooms[1]._id,
      bookingNumber: "BK" + (Date.now() + 1).toString().slice(-6),
      checkIn: yesterday,
      checkOut: new Date(yesterday.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from yesterday
      totalAmount: 240, // 2 nights * $120
      status: 'Confirmed',
      paymentStatus: 'completed',
      guests: 1,
      guestCount: { adults: 1, children: 0 },
      createdAt: yesterday
    },
    {
      userId: guest._id,
      roomId: rooms[2]._id,
      bookingNumber: "BK" + (Date.now() + 2).toString().slice(-6),
      checkIn: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      checkOut: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
      totalAmount: 360, // 2 nights * $180
      status: 'Confirmed',
      paymentStatus: 'completed',
      guests: 2,
      guestCount: { adults: 2, children: 0 },
      createdAt: today
    }
  ];

  for (const bookingData of sampleBookings) {
    const existingBooking = await Booking.findOne({ 
      userId: bookingData.userId, 
      roomId: bookingData.roomId,
      checkIn: bookingData.checkIn 
    });
    if (!existingBooking) {
      await Booking.create(bookingData);
      console.log(`✅ Created booking for room ${rooms.find(r => r._id.equals(bookingData.room))?.roomNumber}`);
    }
  }
};

const createSampleTasks = async () => {
  console.log('🔄 Creating sample tasks...');
  
  const staffMembers = await User.find({ role: 'staff' });
  const rooms = await Room.find();
  
  if (staffMembers.length === 0) {
    console.log('⚠️  No staff members found, skipping tasks');
    return;
  }

  const now = new Date();
  const manager = await User.findOne({ role: 'manager' });
  
  const sampleTasks = [
    {
      title: 'Room 204 cleaning completed',
      description: 'Deep cleaning and maintenance check',
      type: 'cleaning',
      department: 'Housekeeping',
      priority: 'medium',
      status: 'completed',
      assignedTo: staffMembers.find(s => s.profile?.department === 'Housekeeping')?._id,
      assignedBy: manager?._id,
      location: 'Room 204',
      requestedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      dueDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      completedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      title: 'Kitchen maintenance scheduled',
      description: 'Regular equipment maintenance and safety check',
      type: 'maintenance',
      department: 'Maintenance',
      priority: 'high',
      status: 'assigned',
      assignedTo: staffMembers.find(s => s.profile?.department === 'Maintenance')?._id,
      assignedBy: manager?._id,
      location: 'Kitchen',
      requestedAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
      dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      createdAt: new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes ago
    },
    {
      title: 'Special dietary meal preparation',
      description: 'Prepare gluten-free meal for suite guest',
      type: 'food',
      department: 'Kitchen',
      priority: 'medium',
      status: 'in-progress',
      assignedTo: staffMembers.find(s => s.profile?.department === 'Kitchen')?._id,
      assignedBy: manager?._id,
      location: 'Kitchen',
      requestedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      dueDate: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
      createdAt: new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      title: 'New booking received',
      description: 'Suite reservation for tomorrow - prepare welcome amenities',
      type: 'services',
      department: 'Services',
      priority: 'low',
      status: 'pending',
      assignedBy: manager?._id,
      location: 'Suite 301',
      requestedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      createdAt: new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
    }
  ];

  // Clear existing sample tasks
  await Task.deleteMany({ title: { $in: sampleTasks.map(t => t.title) } });

  for (const taskData of sampleTasks) {
    await Task.create(taskData);
    console.log(`✅ Created task: ${taskData.title}`);
  }
};

const createSampleRevenue = async () => {
  console.log('🔄 Creating sample revenue data...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const guest = await User.findOne({ role: 'guest' });
  const bookings = await Booking.find();
  
  if (!guest || bookings.length === 0) {
    console.log('⚠️  No guest or bookings found, skipping revenue');
    return;
  }

  const sampleRevenues = [
    {
      source: 'room_booking',
      amount: 1200,
      baseAmount: 1000,
      tax: 150,
      serviceCharge: 50,
      sourceId: bookings[0]._id,
      sourceModel: 'Booking',
      customerId: guest._id,
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      serviceDate: today,
      bookingChannel: 'direct',
      receivedAt: today
    },
    {
      source: 'room_booking',
      amount: 960,
      baseAmount: 800,
      tax: 120,
      serviceCharge: 40,
      sourceId: bookings[1] ? bookings[1]._id : bookings[0]._id,
      sourceModel: 'Booking',
      customerId: guest._id,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      serviceDate: yesterday,
      bookingChannel: 'direct',
      receivedAt: yesterday
    },
    {
      source: 'food_order',
      amount: 300,
      baseAmount: 250,
      tax: 30,
      serviceCharge: 20,
      sourceId: bookings[0]._id, // Using booking as reference
      sourceModel: 'Booking',
      customerId: guest._id,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      serviceDate: today,
      receivedAt: today
    },
    {
      source: 'food_order',
      amount: 280,
      baseAmount: 230,
      tax: 28,
      serviceCharge: 22,
      sourceId: bookings[1] ? bookings[1]._id : bookings[0]._id,
      sourceModel: 'Booking',
      customerId: guest._id,
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      serviceDate: yesterday,
      receivedAt: yesterday
    }
  ];

  // Clear existing sample revenue
  await Revenue.deleteMany({ source: { $in: ['room_booking', 'food_order'] } });

  for (const revenueData of sampleRevenues) {
    await Revenue.create(revenueData);
    console.log(`✅ Created revenue entry: ${revenueData.source} - $${revenueData.amount}`);
  }
};

const createSampleExpenses = async () => {
  console.log('🔄 Creating sample expense data...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const manager = await User.findOne({ role: 'manager' });
  
  if (!manager) {
    console.log('⚠️  No manager found, skipping expenses');
    return;
  }

  const sampleExpenses = [
    {
      title: 'Monthly Utilities Payment',
      category: 'utilities',
      amount: 200,
      description: 'Electricity and water bills',
      department: 'General',
      paidBy: manager._id,
      vendor: {
        name: 'Utility Company',
        contact: '+94-11-123-4567'
      },
      paymentMethod: 'bank_transfer',
      isApproved: true,
      approvedBy: manager._id,
      approvedAt: today
    },
    {
      title: 'Cleaning Supplies Purchase',
      category: 'cleaning_supplies',
      amount: 150,
      description: 'Cleaning supplies and amenities',
      department: 'Cleaning',
      paidBy: manager._id,
      vendor: {
        name: 'Hotel Supplies Co',
        contact: '+94-11-987-6543'
      },
      paymentMethod: 'credit_card',
      isApproved: true,
      approvedBy: manager._id,
      approvedAt: yesterday
    },
    {
      title: 'HVAC System Maintenance',
      category: 'maintenance',
      amount: 300,
      description: 'HVAC system maintenance',
      department: 'Maintenance',
      paidBy: manager._id,
      vendor: {
        name: 'HVAC Services Inc',
        contact: '+94-11-555-0123'
      },
      paymentMethod: 'bank_transfer',
      isApproved: true,
      approvedBy: manager._id,
      approvedAt: yesterday
    }
  ];

  // Clear existing sample expenses
  await Expense.deleteMany({ 'vendor.name': { $in: ['Utility Company', 'Hotel Supplies Co', 'HVAC Services Inc'] } });

  for (const expenseData of sampleExpenses) {
    await Expense.create(expenseData);
    console.log(`✅ Created expense entry: ${expenseData.title} - $${expenseData.amount}`);
  }
};

const createSampleReviews = async () => {
  console.log('🔄 Creating sample reviews...');
  
  const guest = await User.findOne({ role: 'guest' });
  const rooms = await Room.find();
  
  if (!guest || rooms.length === 0) {
    console.log('⚠️  No guest or rooms found, skipping reviews');
    return;
  }

  const sampleReviews = [
    {
      userId: guest._id,
      roomId: rooms[0]._id,
      overallRating: 5,
      cleanliness: 5,
      service: 5,
      location: 4,
      amenities: 5,
      comment: 'Excellent service and clean room! Had a wonderful stay.',
      sentimentLabel: 'Positive',
      isVisible: true,
      createdAt: new Date()
    },
    {
      userId: guest._id,
      roomId: rooms[1]._id,
      overallRating: 4,
      cleanliness: 4,
      service: 4,
      location: 4,
      amenities: 3,
      comment: 'Good stay, friendly staff. Room was comfortable.',
      sentimentLabel: 'Positive',
      isVisible: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
    },
    {
      userId: guest._id,
      roomId: rooms[2] ? rooms[2]._id : rooms[0]._id,
      overallRating: 3,
      cleanliness: 3,
      service: 3,
      location: 4,
      amenities: 2,
      comment: 'Average experience. Room could use some improvements.',
      sentimentLabel: 'Neutral',
      isVisible: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
    }
  ];

  // Clear existing sample reviews
  await Review.deleteMany({ userId: guest._id });

  for (const reviewData of sampleReviews) {
    await Review.create(reviewData);
    console.log(`✅ Created review: ${reviewData.overallRating} stars`);
  }
};

// Main execution function
const createAllSampleData = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting sample data creation...');
    
    await createSampleUsers();
    await createSampleRooms();
    await createSampleBookings();
    await createSampleTasks();
    await createSampleRevenue();
    await createSampleExpenses();
    await createSampleReviews();
    
    console.log('🎉 Sample data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Rooms: ${await Room.countDocuments()}`);
    console.log(`- Bookings: ${await Booking.countDocuments()}`);
    console.log(`- Tasks: ${await Task.countDocuments()}`);
    console.log(`- Revenue entries: ${await Revenue.countDocuments()}`);
    console.log(`- Expense entries: ${await Expense.countDocuments()}`);
    console.log(`- Reviews: ${await Review.countDocuments()}`);
    
    console.log('\n🔐 Login credentials:');
    console.log('Manager: manager@hotel.com / manager123');
    console.log('Staff: maria.santos@hotel.com / staff123');
    console.log('Guest: guest@example.com / guest123');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
createAllSampleData();