// Test script for room booking and management accuracy
import mongoose from 'mongoose';
import Room from './models/Room.js';
import Booking from './models/Booking.js';
import RoomService from './services/rooms/roomService.js';
import { createPreCheckInRecord } from './controllers/checkInOutController.js';
import StaffTask from './models/StaffTask.js';
import { User, Guest } from './models/User.js';

class RoomBookingTester {
  constructor() {
    this.testResults = [];
    this.roomService = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
      this.roomService = RoomService; // Initialize RoomService after DB connection
      this.log('Connected to MongoDB successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to connect to MongoDB: ${error.message}`, 'error');
      return false;
    }
  }

  async createTestData() {
    try {
      this.log('Creating test data...');

      // Create test user first
      const testUser = new Guest({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        role: 'guest',
        password: 'testpassword123'
      });
      await testUser.save();
      this.testUser = testUser;
      this.log(`Created test user: ${testUser.name} - ${testUser.email} - ID: ${testUser._id}`);

      // Create test rooms
      const testRooms = [
        {
          title: 'Deluxe Ocean View Room 101',
          roomNumber: '101',
          status: 'Available',
          occupancy: { adults: 2, children: 1 },
          type: 'Deluxe',
          bedType: 'King',
          view: 'Ocean',
          floor: 1,
          basePrice: 15000,
          size: 35,
          amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'OceanView']
        },
        {
          title: 'Standard City View Room 201',
          roomNumber: '201',
          status: 'Available',
          occupancy: { adults: 2, children: 0 },
          type: 'Standard',
          bedType: 'Queen',
          view: 'City',
          floor: 2,
          basePrice: 8000,
          size: 25,
          amenities: ['WiFi', 'TV', 'AC']
        },
        {
          title: 'Suite Room 301',
          roomNumber: '301',
          status: 'Available',
          occupancy: { adults: 4, children: 2 },
          type: 'Suite',
          bedType: 'King',
          view: 'Ocean',
          floor: 3,
          basePrice: 35000,
          size: 60,
          amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Jacuzzi', 'OceanView', 'RoomService']
        }
      ];

      for (const roomData of testRooms) {
        const room = new Room(roomData);
        await room.save();
        this.log(`Created test room: ${room.roomNumber} - ${room.title} - ID: ${room._id}`);
      }

      this.log('Test data created successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to create test data: ${error.message}`, 'error');
      console.error('Full error:', error);
      return false;
    }
  }

  async testRoomAvailability() {
    try {
      this.log('=== Testing Room Availability ===');

      // Get test rooms
      const rooms = await Room.find({ status: 'Available' });
      if (rooms.length === 0) {
        this.log('No test rooms found', 'error');
        return false;
      }

      const testRoom = rooms[0];
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1); // Tomorrow
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2); // 2 days later

      this.log(`Testing availability for room ${testRoom.roomNumber} from ${checkIn.toDateString()} to ${checkOut.toDateString()}`);

      // Test 1: Check availability for available room
      const availability = await this.roomService.checkRoomAvailability(testRoom._id, checkIn, checkOut);
      if (availability.available) {
        this.log('✅ Room availability check passed - room is available', 'success');
      } else {
        this.log(`❌ Room availability check failed: ${availability.reason}`, 'error');
        return false;
      }

      // Test 2: Create a conflicting booking
      const conflictingBooking = new Booking({
        roomId: testRoom._id,
        userId: this.testUser._id,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: 2,
        status: 'Confirmed',
        paymentMethod: 'cash',
        totalPrice: 30000
      });
      await conflictingBooking.save();
      this.log(`Created conflicting booking ${conflictingBooking.bookingNumber}`);

      // Test 3: Check availability again - should now be unavailable
      const availabilityAfterBooking = await this.roomService.checkRoomAvailability(testRoom._id, checkIn, checkOut);
      if (!availabilityAfterBooking.available && availabilityAfterBooking.conflicts) {
        this.log('✅ Room availability check correctly detected conflict', 'success');
      } else {
        this.log('❌ Room availability check failed to detect conflict', 'error');
        return false;
      }

      // Test 4: Check availability for different dates (should still be available)
      const futureCheckIn = new Date();
      futureCheckIn.setDate(futureCheckIn.getDate() + 10);
      const futureCheckOut = new Date(futureCheckIn);
      futureCheckOut.setDate(futureCheckOut.getDate() + 2);

      const futureAvailability = await this.roomService.checkRoomAvailability(testRoom._id, futureCheckIn, futureCheckOut);
      if (futureAvailability.available) {
        this.log('✅ Room availability check passed for different dates', 'success');
      } else {
        this.log(`❌ Room availability check failed for different dates: ${futureAvailability.reason}`, 'error');
        return false;
      }

      // Test 5: Get all available rooms
      const availableRooms = await this.roomService.getAvailableRooms(checkIn, checkOut);
      const availableRoomNumbers = availableRooms.map(room => room.roomNumber);
      this.log(`Available rooms for selected dates: ${availableRoomNumbers.join(', ')}`);

      if (availableRooms.length > 0) {
        this.log('✅ Get available rooms function working correctly', 'success');
      } else {
        this.log('❌ No available rooms found', 'error');
        return false;
      }

      return true;
    } catch (error) {
      this.log(`Room availability test failed: ${error.message}`, 'error');
      console.error('Full error:', error);
      return false;
    }
  }

  async testBookingCreation() {
    try {
      this.log('=== Testing Booking Creation ===');

      const rooms = await Room.find({ status: 'Available' });
      const availableRoom = rooms.find(room => room.roomNumber !== '101'); // Use different room than the one with conflict

      if (!availableRoom) {
        this.log('No available room found for booking test', 'error');
        return false;
      }

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 5); // 5 days from now
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 3); // 3 nights

      // Test booking creation
      const bookingData = {
        roomId: availableRoom._id,
        userId: this.testUser._id,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: 2,
        specialRequests: 'Late check-in requested',
        foodPlan: 'Breakfast',
        paymentMethod: 'cash'
      };

      const booking = new Booking(bookingData);
      await booking.save();

      this.log(`✅ Booking created successfully: ${booking.bookingNumber}`, 'success');

      // Verify booking was created correctly
      const savedBooking = await Booking.findById(booking._id).populate('roomId');
      if (savedBooking && savedBooking.status === 'Pending Approval') {
        this.log('✅ Booking status set correctly to Pending Approval', 'success');
      } else {
        this.log('❌ Booking status not set correctly', 'error');
        return false;
      }

      // Test pre-check-in record creation
      await createPreCheckInRecord(booking._id);
      const preCheckInRecord = await mongoose.model('CheckInOut').findOne({ booking: booking._id });

      if (preCheckInRecord && preCheckInRecord.status === 'pre_checkin') {
        this.log('✅ Pre-check-in record created successfully', 'success');
      } else {
        this.log('❌ Pre-check-in record not created correctly', 'error');
        return false;
      }

      return true;
    } catch (error) {
      this.log(`Booking creation test failed: ${error.message}`, 'error');
      console.error('Full error:', error);
      return false;
    }
  }

  async testStaffAssignment() {
    try {
      this.log('=== Testing Staff Assignment Integration ===');

      // Create a cleaning task
      const cleaningTask = new StaffTask({
        title: 'Clean Room 201 after checkout',
        description: 'Deep cleaning required for room 201',
        department: 'Housekeeping',
        priority: 'high',
        category: 'deep_cleaning',
        location: 'room',
        roomNumber: '201',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedDuration: 60, // 60 minutes
        createdBy: this.testUser._id,
        assignedBy: this.testUser._id,
        assignmentSource: 'system'
      });

      await cleaningTask.save();
      this.log(`✅ Cleaning task created: ${cleaningTask._id}`, 'success');

      // Test task status progression
      cleaningTask.status = 'assigned';
      await cleaningTask.save();
      this.log('✅ Task status updated to assigned', 'success');

      // Test priority escalation
      cleaningTask.priority = 'urgent';
      await cleaningTask.save();
      this.log('✅ Task priority escalated to urgent', 'success');

      return true;
    } catch (error) {
      this.log(`Staff assignment test failed: ${error.message}`, 'error');
      console.error('Full error:', error);
      return false;
    }
  }

  async testRoomManagement() {
    try {
      this.log('=== Testing Room Management Features ===');

      const room = await Room.findOne({ roomNumber: '201' });
      if (!room) {
        this.log('Test room not found', 'error');
        return false;
      }

      // Test room status updates
      room.status = 'Cleaning';
      await room.save();
      this.log('✅ Room status updated to Cleaning', 'success');

      // Test maintenance logging
      room.maintenanceLogs.push({
        title: 'AC Maintenance',
        description: 'Regular AC filter cleaning',
        reportedBy: this.testUser._id,
        priority: 'Medium',
        status: 'In Progress'
      });
      await room.save();
      this.log('✅ Maintenance log added to room', 'success');

      // Test cleaning schedule
      room.cleaningSchedule.push({
        date: new Date(),
        assignedTo: this.testUser._id,
        status: 'Completed',
        notes: 'Room cleaned and ready for next guest'
      });
      await room.save();
      this.log('✅ Cleaning schedule updated', 'success');

      return true;
    } catch (error) {
      this.log(`Room management test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Room Booking and Management Tests', 'info');
    this.log('=' .repeat(50), 'info');

    const connected = await this.connectToDatabase();
    if (!connected) {
      this.log('❌ Cannot proceed without database connection', 'error');
      return false;
    }

    // Clean up existing test data
    await this.cleanupTestData();

    // Run tests
    const tests = [
      { name: 'Room Availability', method: this.testRoomAvailability },
      { name: 'Booking Creation', method: this.testBookingCreation },
      { name: 'Staff Assignment', method: this.testStaffAssignment },
      { name: 'Room Management', method: this.testRoomManagement }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      this.log(`\n📋 Running ${test.name} Test...`, 'info');
      this.log('-'.repeat(30), 'info');

      try {
        const passed = await test.method.call(this);
        if (passed) {
          passedTests++;
          this.log(`✅ ${test.name} Test PASSED`, 'success');
        } else {
          this.log(`❌ ${test.name} Test FAILED`, 'error');
        }
      } catch (error) {
        this.log(`❌ ${test.name} Test ERROR: ${error.message}`, 'error');
        console.error('Full error:', error);
      }
    }

    // Summary
    this.log('\n' + '='.repeat(50), 'info');
    this.log('📊 TEST SUMMARY', 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${passedTests}`, 'info');
    this.log(`Failed: ${totalTests - passedTests}`, 'info');
    this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'info');

    if (passedTests === totalTests) {
      this.log('🎉 ALL TESTS PASSED! Room booking and management system is working correctly.', 'success');
      return true;
    } else {
      this.log('⚠️ Some tests failed. Please review the errors above.', 'error');
      return false;
    }
  }

  async cleanupTestData() {
    try {
      this.log('Cleaning up test data...');

      await Room.deleteMany({ roomNumber: { $in: ['101', '201', '301'] } });
      await Booking.deleteMany({ 'userId._id': this.testUser?._id });
      await mongoose.model('CheckInOut').deleteMany({ 'guest._id': this.testUser?._id });
      await StaffTask.deleteMany({ createdBy: this.testUser?._id });

      this.log('Test data cleaned up successfully', 'success');
    } catch (error) {
      this.log(`Failed to cleanup test data: ${error.message}`, 'error');
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.log('Disconnected from MongoDB', 'info');
    } catch (error) {
      this.log(`Error disconnecting: ${error.message}`, 'error');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RoomBookingTester();
  try {
    const success = await tester.runAllTests();
    await tester.disconnect();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test execution failed:', error);
    await tester.disconnect();
    process.exit(1);
  }
}

export default RoomBookingTester;