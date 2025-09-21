import mongoose from 'mongoose';
import SMSTemplate from './models/SMSTemplate.js';

async function seedSMSTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');
    console.log('Connected to database');

    const templates = [
      {
        name: 'Booking Confirmation',
        type: 'booking_confirmation',
        content: 'Dear {{guestName}}, your booking #{{bookingNumber}} is confirmed. Check-in: {{checkInDate}}, Check-out: {{checkOutDate}}. Total: {{currency}} {{totalAmount}}',
        variables: [
          { name: 'guestName', description: 'Guest name', required: true },
          { name: 'bookingNumber', description: 'Booking number', required: true },
          { name: 'checkInDate', description: 'Check-in date', required: true },
          { name: 'checkOutDate', description: 'Check-out date', required: true },
          { name: 'currency', description: 'Currency', required: false, default: 'LKR' },
          { name: 'totalAmount', description: 'Total amount', required: true }
        ],
        isActive: true,
        language: 'en',
        senderId: 'HotelBooking'
      },
      {
        name: 'Payment Confirmation',
        type: 'payment_confirmation',
        content: 'Payment received! Amount: {{currency}} {{amount}}. Booking #{{bookingNumber}} confirmed. Thank you!',
        variables: [
          { name: 'currency', description: 'Currency', required: false, default: 'LKR' },
          { name: 'amount', description: 'Payment amount', required: true },
          { name: 'bookingNumber', description: 'Booking number', required: true }
        ],
        isActive: true,
        language: 'en',
        senderId: 'PaymentConfirm'
      },
      {
        name: 'Check-in Reminder',
        type: 'checkin_reminder',
        content: 'Hi {{guestName}}, reminder: Check-in tomorrow at {{hotelName}}. Booking #{{bookingNumber}}',
        variables: [
          { name: 'guestName', description: 'Guest name', required: true },
          { name: 'hotelName', description: 'Hotel name', required: true },
          { name: 'bookingNumber', description: 'Booking number', required: true }
        ],
        isActive: true,
        language: 'en',
        senderId: 'CheckInReminder'
      }
    ];

    for (const template of templates) {
      const existing = await SMSTemplate.findOne({
        type: template.type,
        language: template.language
      });

      if (!existing) {
        await SMSTemplate.create(template);
        console.log(`✅ Created SMS template: ${template.name}`);
      } else {
        console.log(`⏭️  SMS template already exists: ${template.name}`);
      }
    }

    console.log('🎉 SMS templates seeding completed successfully!');
    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ SMS template seeding failed:', error);
    process.exit(1);
  }
}

seedSMSTemplates();
