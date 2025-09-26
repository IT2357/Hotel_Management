import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testData = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking existing data...');
    
    // Check collections
    const Booking = mongoose.model('Booking', {}, 'bookings');
    const Payment = mongoose.model('Payment', {}, 'payments');
    const Room = mongoose.model('Room', {}, 'rooms');
    const User = mongoose.model('User', {}, 'users');
    
    const bookingCount = await Booking.countDocuments();
    const paymentCount = await Payment.countDocuments();
    const roomCount = await Room.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('📊 Current data:');
    console.log(`- Bookings: ${bookingCount}`);
    console.log(`- Payments: ${paymentCount}`);
    console.log(`- Rooms: ${roomCount}`);
    console.log(`- Users: ${userCount}`);
    
    // Check a sample booking
    const sampleBooking = await Booking.findOne().populate('userId').populate('roomId');
    if (sampleBooking) {
      console.log('📋 Sample booking:');
      console.log(`- Total Amount: ${sampleBooking.totalAmount}`);
      console.log(`- Payment Status: ${sampleBooking.paymentStatus}`);
      console.log(`- Room Price: ${sampleBooking.roomId?.basePrice}`);
      console.log(`- User: ${sampleBooking.userId?.name}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testData();