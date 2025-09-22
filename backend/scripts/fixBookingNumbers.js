// 📁 backend/scripts/fixBookingNumbers.js
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixBookingNumbers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('✅ Connected to MongoDB');

    // Find all bookings with null or empty booking numbers
    const bookingsWithNullNumbers = await Booking.find({
      $or: [
        { bookingNumber: null },
        { bookingNumber: { $exists: false } },
        { bookingNumber: '' }
      ]
    });

    console.log(`Found ${bookingsWithNullNumbers.length} bookings with null/empty booking numbers`);

    // Generate unique booking numbers for each
    for (const booking of bookingsWithNullNumbers) {
      let bookingNumber;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const timestamp = booking.createdAt ? booking.createdAt.getTime() : Date.now();
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        bookingNumber = `BK${timestamp}${random}`;

        const existingBooking = await Booking.findOne({ bookingNumber });
        if (!existingBooking || existingBooking._id.toString() === booking._id.toString()) {
          break;
        }
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error(`Could not generate unique booking number for booking ${booking._id}`);
        continue;
      }

      booking.bookingNumber = bookingNumber;
      await booking.save();
      console.log(`✅ Updated booking ${booking._id} with booking number: ${bookingNumber}`);
    }

    console.log('✅ Successfully fixed all booking numbers!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing booking numbers:', error);
    process.exit(1);
  }
};

// Run the script
fixBookingNumbers();
