// Seed SMS templates
export const seedSMSTemplates = async () => {
  const templates = [
    {
      name: "Booking Confirmation",
      type: "booking_confirmation",
      subject: "Booking Confirmed",
      content: "Dear {{guestName}}, your booking #{{bookingNumber}} is confirmed. Check-in: {{checkInDate}}, Check-out: {{checkOutDate}}. Total: {{currency}} {{totalAmount}}",
      variables: [
        { name: "guestName", description: "Guest's full name", required: true },
        { name: "bookingNumber", description: "Booking reference number", required: true },
        { name: "checkInDate", description: "Check-in date", required: true },
        { name: "checkOutDate", description: "Check-out date", required: true },
        { name: "currency", description: "Currency code", required: false, default: "LKR" },
        { name: "totalAmount", description: "Total booking amount", required: true }
      ],
      isActive: true,
      language: "en",
      senderId: "HotelBooking"
    },
    {
      name: "Payment Confirmation",
      type: "payment_confirmation",
      subject: "Payment Received",
      content: "Payment received! Amount: {{currency}} {{amount}}. Booking #{{bookingNumber}} confirmed. Thank you!",
      variables: [
        { name: "currency", description: "Currency code", required: false, default: "LKR" },
        { name: "amount", description: "Payment amount", required: true },
        { name: "bookingNumber", description: "Booking reference number", required: true }
      ],
      isActive: true,
      language: "en",
      senderId: "PaymentConfirm"
    },
    {
      name: "Check-in Reminder",
      type: "checkin_reminder",
      subject: "Check-in Reminder",
      content: "Hi {{guestName}}, reminder: Check-in tomorrow at {{hotelName}}. Booking #{{bookingNumber}}",
      variables: [
        { name: "guestName", description: "Guest's full name", required: true },
        { name: "hotelName", description: "Hotel name", required: true },
        { name: "bookingNumber", description: "Booking reference number", required: true }
      ],
      isActive: true,
      language: "en",
      senderId: "CheckInReminder"
    },
    {
      name: "Booking Cancellation",
      type: "booking_cancellation",
      subject: "Booking Cancelled",
      content: "Dear {{guestName}}, your booking #{{bookingNumber}} has been cancelled. Refund will be processed within 5-7 business days.",
      variables: [
        { name: "guestName", description: "Guest's full name", required: true },
        { name: "bookingNumber", description: "Booking reference number", required: true }
      ],
      isActive: true,
      language: "en",
      senderId: "BookingCancel"
    }
  ];

  try {
    const SMSTemplate = (await import('../models/SMSTemplate.js')).default;

    for (const template of templates) {
      const existing = await SMSTemplate.findOne({
        type: template.type,
        language: template.language
      });

      if (!existing) {
        await SMSTemplate.create(template);
        console.log(`Created SMS template: ${template.name}`);
      }
    }

    console.log('SMS templates seeding completed');
  } catch (error) {
    console.error('Error seeding SMS templates:', error);
  }
};
