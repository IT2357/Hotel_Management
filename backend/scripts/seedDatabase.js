import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import Task from '../models/Task.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import '../config/database.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({ email: { $regex: /@example\.com$|@hotel\.com$/ } }),
      Task.deleteMany({}),
      Room.deleteMany({}),
      Booking.deleteMany({}),
      Revenue.deleteMany({}),
      Expense.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing test data');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await User.insertMany([
      // Manager
      {
        name: 'John Manager',
        email: 'manager@hotel.com',
        password: hashedPassword,
        role: 'manager',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        phone: '+1-555-0001',
        address: {
          country: 'USA',
          city: 'New York',
          street: '123 Manager St',
          postalCode: '10001'
        }
      },
      
      // Front Office Staff
      {
        name: 'Sarah Johnson',
        email: 'sarah@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Front Office',
        position: 'Front Desk Supervisor',
        shift: 'morning',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        phone: '+1-555-0011',
        address: {
          country: 'USA',
          city: 'New York',
          street: '456 Front Office Ave',
          postalCode: '10002'
        }
      },
      {
        name: 'Emma Davis',
        email: 'emma@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Front Office',
        position: 'Front Desk Agent',
        shift: 'evening',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        phone: '+1-555-0012',
        address: {
          country: 'USA',
          city: 'New York',
          street: '789 Reception Blvd',
          postalCode: '10003'
        }
      },
      
      // Housekeeping Staff
      {
        name: 'Lisa Housekeeping',
        email: 'lisa@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (offline)
        phone: '+1-555-0021',
        address: {
          country: 'USA',
          city: 'New York',
          street: '321 Clean Lane',
          postalCode: '10004'
        }
      },
      {
        name: 'Maria Cleaning',
        email: 'maria@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        phone: '+1-555-0022',
        address: {
          country: 'USA',
          city: 'New York',
          street: '654 Tidy Street',
          postalCode: '10005'
        }
      },
      {
        name: 'Carlos Laundry',
        email: 'carlos@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago (offline)
        phone: '+1-555-0023',
        address: {
          country: 'USA',
          city: 'New York',
          street: '987 Wash Way',
          postalCode: '10006'
        }
      },
      
      // Maintenance Staff
      {
        name: 'Mike Maintenance',
        email: 'mike@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        phone: '+1-555-0031',
        address: {
          country: 'USA',
          city: 'New York',
          street: '147 Fix Street',
          postalCode: '10007'
        }
      },
      {
        name: 'Robert Plumber',
        email: 'robert@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago (offline)
        phone: '+1-555-0032',
        address: {
          country: 'USA',
          city: 'New York',
          street: '258 Pipe Plaza',
          postalCode: '10008'
        }
      },
      {
        name: 'Tom Electrician',
        email: 'tom@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        phone: '+1-555-0033',
        address: {
          country: 'USA',
          city: 'New York',
          street: '369 Electric Drive',
          postalCode: '10009'
        }
      },
      
      // Food & Beverage Staff
      {
        name: 'David Service',
        email: 'david@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        phone: '+1-555-0041',
        address: {
          country: 'USA',
          city: 'New York',
          street: '741 Service Street',
          postalCode: '10010'
        }
      },
      {
        name: 'Julia Chef',
        email: 'julia@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
        phone: '+1-555-0042',
        address: {
          country: 'USA',
          city: 'New York',
          street: '852 Kitchen Court',
          postalCode: '10011'
        }
      },
      {
        name: 'Alex Waiter',
        email: 'alex@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
        phone: '+1-555-0043',
        address: {
          country: 'USA',
          city: 'New York',
          street: '963 Dining Drive',
          postalCode: '10012'
        }
      },
      {
        name: 'Sophie Bartender',
        email: 'sophie@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 22 * 60 * 1000), // 22 minutes ago
        phone: '+1-555-0044',
        address: {
          country: 'USA',
          city: 'New York',
          street: '159 Bar Boulevard',
          postalCode: '10013'
        }
      },
      
      // Security Staff
      {
        name: 'James Security',
        email: 'james@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        phone: '+1-555-0051',
        address: {
          country: 'USA',
          city: 'New York',
          street: '357 Guard Gate',
          postalCode: '10014'
        }
      },
      {
        name: 'Daniel Guard',
        email: 'daniel@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago (offline)
        phone: '+1-555-0052',
        address: {
          country: 'USA',
          city: 'New York',
          street: '468 Safety Street',
          postalCode: '10015'
        }
      },
      
      // Spa & Wellness Staff
      {
        name: 'Nina Therapist',
        email: 'nina@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 28 * 60 * 1000), // 28 minutes ago
        phone: '+1-555-0061',
        address: {
          country: 'USA',
          city: 'New York',
          street: '579 Spa Street',
          postalCode: '10016'
        }
      },
      {
        name: 'Kevin Fitness',
        email: 'kevin@hotel.com',
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago (offline)
        phone: '+1-555-0062',
        address: {
          country: 'USA',
          city: 'New York',
          street: '680 Gym Grove',
          postalCode: '10017'
        }
      },
      // Guests
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: hashedPassword,
        role: 'guest',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0101'
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: hashedPassword,
        role: 'guest',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0102'
      },
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        password: hashedPassword,
        role: 'guest',
        isActive: true,
        emailVerified: true,
        phone: '+1-555-0103'
      }
    ]);

    console.log('👥 Created sample users');

    // Create sample rooms
    const rooms = [];
    for (let floor = 1; floor <= 5; floor++) {
      for (let room = 1; room <= 20; room++) {
        const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
        rooms.push({
          number: roomNumber,
          floor,
          type: room <= 5 ? 'suite' : room <= 15 ? 'deluxe' : 'standard',
          status: Math.random() > 0.7 ? 'occupied' : 'available',
          price: room <= 5 ? 500 : room <= 15 ? 300 : 150,
          capacity: room <= 5 ? 4 : 2,
          amenities: ['WiFi', 'TV', 'Air Conditioning'],
          description: `Beautiful ${room <= 5 ? 'suite' : room <= 15 ? 'deluxe' : 'standard'} room`
        });
      }
    }
    
    const insertedRooms = await Room.insertMany(rooms);
    console.log('🏨 Created sample rooms');

    // Get staff and guests
    const manager = users.find(u => u.role === 'manager');
    const staff = users.filter(u => u.role === 'staff');
    const guests = users.filter(u => u.role === 'guest');

    // Create sample bookings
    const bookings = await Booking.insertMany([
      {
        guest: guests[0]._id,
        room: insertedRooms[4]._id, // Room 105
        checkInDate: new Date(),
        checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        totalAmount: 500,
        status: 'confirmed',
        assignedStaff: staff[0]._id
      },
      {
        guest: guests[1]._id,
        room: insertedRooms[31]._id, // Room 312
        checkInDate: new Date(),
        checkOutDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        totalAmount: 1500,
        status: 'checked-in',
        assignedStaff: staff[1]._id
      },
      {
        guest: guests[2]._id,
        room: insertedRooms[7]._id, // Room 108
        checkInDate: new Date(),
        checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        totalAmount: 300,
        status: 'confirmed',
        assignedStaff: staff[2]._id
      }
    ]);

    console.log('📅 Created sample bookings');

    // Create sample tasks with expanded staff assignments
    const tasks = await Task.insertMany([
      {
        title: 'Room Service Request',
        description: 'Guest requested extra towels and amenities',
        type: 'services',
        priority: 'medium',
        status: 'pending',
        guestId: guests[0]._id,
        guestName: guests[0].name,
        roomNumber: '105',
        department: 'Food & Beverage',
        assignedBy: manager._id,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        estimatedDuration: 15
      },
      {
        title: 'Air Conditioning Repair',
        description: 'AC unit not cooling properly in guest room',
        type: 'maintenance',
        priority: 'high',
        status: 'assigned',
        guestId: guests[1]._id,
        guestName: guests[1].name,
        roomNumber: '312',
        assignedTo: staff.find(s => s.name === 'Mike Maintenance')._id,
        department: 'Maintenance',
        assignedBy: manager._id,
        assignedAt: new Date(),
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
        estimatedDuration: 45
      },
      {
        title: 'Restaurant Reservation',
        description: 'Book dinner table for 4 guests',
        type: 'services',
        priority: 'low',
        status: 'completed',
        guestId: guests[2]._id,
        guestName: guests[2].name,
        roomNumber: '108',
        assignedTo: staff.find(s => s.name === 'Sarah Concierge')._id,
        department: 'Front Office',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
        completedAt: new Date(Date.now() - 30 * 60 * 1000),
        actualDuration: 10
      },
      {
        title: 'Room Cleaning',
        description: 'Deep cleaning required for checkout room',
        type: 'cleaning',
        priority: 'medium',
        status: 'in-progress',
        guestId: guests[0]._id,
        guestName: guests[0].name,
        roomNumber: '203',
        assignedTo: staff.find(s => s.name === 'Lisa Housekeeping')._id,
        department: 'Housekeeping',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 30 * 60 * 1000),
        startedAt: new Date(Date.now() - 15 * 60 * 1000),
        estimatedDuration: 60
      },
      {
        title: 'Plumbing Issue',
        description: 'Guest reports slow drain in bathroom sink',
        type: 'maintenance',
        priority: 'medium',
        status: 'assigned',
        guestId: guests[1]._id,
        guestName: guests[1].name,
        roomNumber: '201',
        assignedTo: staff.find(s => s.name === 'Robert Plumber')._id,
        department: 'Maintenance',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 20 * 60 * 1000),
        dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedDuration: 30
      },
      {
        title: 'Laundry Service',
        description: 'Express laundry service for VIP guest',
        type: 'services',
        priority: 'high',
        status: 'in-progress',
        guestId: guests[2]._id,
        guestName: guests[2].name,
        roomNumber: '501',
        assignedTo: staff.find(s => s.name === 'Carlos Laundry')._id,
        department: 'Housekeeping',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 45 * 60 * 1000),
        startedAt: new Date(Date.now() - 40 * 60 * 1000),
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
        estimatedDuration: 90
      },
      {
        title: 'Room Service Dinner',
        description: 'Special dietary requirements dinner service',
        type: 'food',
        priority: 'medium',
        status: 'assigned',
        guestId: guests[0]._id,
        guestName: guests[0].name,
        roomNumber: '305',
        assignedTo: staff.find(s => s.name === 'Julia Chef')._id,
        department: 'Food & Beverage',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 10 * 60 * 1000),
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        estimatedDuration: 45
      },
      {
        title: 'Spa Appointment Setup',
        description: 'Arrange couples massage for anniversary guests',
        type: 'services',
        priority: 'low',
        status: 'pending',
        guestId: guests[1]._id,
        guestName: guests[1].name,
        roomNumber: '401',
        department: 'Spa & Wellness',
        assignedBy: manager._id,
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        estimatedDuration: 20
      },
      {
        title: 'Security Check',
        description: 'Routine security check for VIP floor',
        type: 'other',
        priority: 'medium',
        status: 'completed',
        guestId: guests[2]._id,
        guestName: guests[2].name,
        roomNumber: '500-510',
        assignedTo: staff.find(s => s.name === 'James Security')._id,
        department: 'Security',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 90 * 60 * 1000),
        startedAt: new Date(Date.now() - 85 * 60 * 1000),
        completedAt: new Date(Date.now() - 60 * 60 * 1000),
        actualDuration: 25
      },
      {
        title: 'Electrical Repair',
        description: 'Fix flickering lights in corridor',
        type: 'maintenance',
        priority: 'medium',
        status: 'assigned',
        guestId: guests[0]._id,
        guestName: 'General Maintenance',
        roomNumber: '3rd Floor Corridor',
        assignedTo: staff.find(s => s.name === 'Tom Electrician')._id,
        department: 'Maintenance',
        assignedBy: manager._id,
        assignedAt: new Date(Date.now() - 5 * 60 * 1000),
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        estimatedDuration: 60
      }
    ]);

    console.log('📋 Created sample tasks');

    // Create sample revenue records
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    await Revenue.insertMany([
      {
        date: today,
        source: 'room_booking',
        amount: 2300,
        category: 'accommodation',
        description: 'Daily room bookings'
      },
      {
        date: yesterday,
        source: 'room_booking',
        amount: 2100,
        category: 'accommodation',
        description: 'Daily room bookings'
      },
      {
        date: twoDaysAgo,
        source: 'room_booking',
        amount: 1950,
        category: 'accommodation',
        description: 'Daily room bookings'
      }
    ]);

    console.log('💰 Created sample revenue records');

    // Create sample expense records
    await Expense.insertMany([
      {
        date: today,
        category: 'maintenance',
        amount: 450,
        description: 'HVAC maintenance and repairs',
        vendor: 'Cool Air Services'
      },
      {
        date: yesterday,
        category: 'utilities',
        amount: 320,
        description: 'Electricity bill',
        vendor: 'City Power Company'
      },
      {
        date: twoDaysAgo,
        category: 'supplies',
        amount: 180,
        description: 'Cleaning supplies and amenities',
        vendor: 'Hotel Supplies Inc'
      }
    ]);

    console.log('💸 Created sample expense records');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length} (1 manager, 16 staff, 3 guests)`);
    console.log(`   Rooms: ${insertedRooms.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log(`   Tasks: ${tasks.length}`);
    console.log('   Revenue & Expense records: 6');
    console.log('\n🏢 Staff by Department:');
    console.log('   Front Office: Sarah, Emma');
    console.log('   Housekeeping: Lisa, Maria, Carlos');
    console.log('   Maintenance: Mike, Robert, Tom');
    console.log('   Food & Beverage: David, Julia, Alex, Sophie');
    console.log('   Security: James, Daniel');
    console.log('   Spa & Wellness: Nina, Kevin');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;