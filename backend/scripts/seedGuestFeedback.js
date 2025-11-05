import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the model
import GuestFeedback from '../models/GuestFeedback.js';

const sampleFeedback = [
  {
    guestName: "Mr. Anderson",
    roomTitle: "Deluxe Ocean View Suite",
    roomNumber: "501",
    stayDate: new Date("2025-01-15"),
    rating: 5,
    title: "Exceptional Stay",
    comment: "Absolutely loved our stay! The ocean view suite was breathtaking, and the service was impeccable. The staff went above and beyond to make our anniversary special.",
    highlights: ["Ocean view", "Personalized welcome", "Attentive housekeeping", "Seamless check-in"],
    concerns: [],
    helpful: 18,
    status: "published",
    sentiment: "positive",
    response: {
      hasResponse: true,
      message: "Thank you for choosing us for your anniversary, Mr. Anderson! We have shared your feedback with the housekeeping and concierge teams.",
      respondedAt: new Date("2025-01-18"),
      respondedBy: "Ms. Perera",
    },
  },
  {
    guestName: "Ms. Thompson",
    roomTitle: "Executive Business Room",
    roomNumber: "301",
    stayDate: new Date("2025-01-08"),
    rating: 4,
    title: "Productive Business Trip",
    comment: "Great location and business amenities. Meeting room access was a bonus. WiFi dipped during peak hours, but staff quickly offered a mobile hotspot.",
    highlights: ["Co-working lounge", "Express laundry", "Executive breakfast"],
    concerns: ["Peak hour WiFi slow"],
    helpful: 9,
    status: "published",
    sentiment: "neutral",
    response: {
      hasResponse: false,
    },
  },
  {
    guestName: "Dr. Williams",
    roomTitle: "Garden Villa",
    roomNumber: "GV-01",
    stayDate: new Date("2024-12-20"),
    rating: 5,
    title: "Peaceful Retreat",
    comment: "The private garden setting was a dream. Sri Lankan high-tea experience was unforgettable. Would love to see more yoga session slots in the morning.",
    highlights: ["Garden ambience", "High-tea experience", "Attentive butler"],
    concerns: ["Limited yoga slots"],
    helpful: 21,
    status: "pending",
    sentiment: "positive",
    response: {
      hasResponse: false,
    },
  },
  {
    guestName: "Mrs. Johnson",
    roomTitle: "Standard Room",
    roomNumber: "205",
    stayDate: new Date("2025-01-10"),
    rating: 2,
    title: "Poor Experience",
    comment: "Room was not clean, AC was not working properly, and the staff was unhelpful. Very disappointed with the service.",
    highlights: [],
    concerns: ["Dirty room", "AC not working", "Unhelpful staff"],
    helpful: 3,
    status: "pending",
    sentiment: "negative",
    response: {
      hasResponse: false,
    },
  },
  {
    guestName: "Mr. Chen",
    roomTitle: "Family Suite",
    roomNumber: "405",
    stayDate: new Date("2025-01-12"),
    rating: 4,
    title: "Great Family Stay",
    comment: "Perfect for families with kids. Spacious rooms and great amenities. Minor issue with room service timing but overall great experience.",
    highlights: ["Family-friendly", "Spacious rooms", "Good amenities"],
    concerns: ["Room service timing"],
    helpful: 12,
    status: "published",
    sentiment: "positive",
    response: {
      hasResponse: true,
      message: "Thank you for your feedback, Mr. Chen! We'll work on improving our room service timing.",
      respondedAt: new Date("2025-01-13"),
      respondedBy: "Ms. Perera",
    },
  },
  {
    guestName: "Mrs. Rodriguez",
    roomTitle: "Presidential Suite",
    roomNumber: "PH-01",
    stayDate: new Date("2025-01-20"),
    rating: 5,
    title: "Luxury at its Finest",
    comment: "The presidential suite exceeded all expectations. From the private terrace to the personal concierge service, everything was perfect. Will definitely return!",
    highlights: ["Spacious suite", "Private terrace", "Personal concierge", "Stunning views"],
    concerns: [],
    helpful: 27,
    status: "published",
    sentiment: "positive",
    response: {
      hasResponse: true,
      message: "We're thrilled you enjoyed your stay, Mrs. Rodriguez! We look forward to welcoming you back soon.",
      respondedAt: new Date("2025-01-21"),
      respondedBy: "Hotel Manager",
    },
  },
  {
    guestName: "Mr. Patel",
    roomTitle: "Standard Room",
    roomNumber: "112",
    stayDate: new Date("2025-01-05"),
    rating: 3,
    title: "Average Experience",
    comment: "Room was decent but nothing special. Location is good but the room needs some maintenance. Breakfast was good though.",
    highlights: ["Good breakfast", "Nice location"],
    concerns: ["Room needs maintenance", "Outdated decor"],
    helpful: 5,
    status: "pending",
    sentiment: "neutral",
    response: {
      hasResponse: false,
    },
  },
  {
    guestName: "Ms. Kim",
    roomTitle: "Superior Room",
    roomNumber: "315",
    stayDate: new Date("2025-01-18"),
    rating: 4,
    title: "Pleasant Stay",
    comment: "Very comfortable room with modern amenities. Staff was friendly and helpful. Only minor issue was noise from the hallway at night.",
    highlights: ["Modern amenities", "Friendly staff", "Comfortable bed"],
    concerns: ["Hallway noise at night"],
    helpful: 8,
    status: "published",
    sentiment: "positive",
    response: {
      hasResponse: false,
    },
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing feedback
    console.log('\n🗑️  Clearing existing guest feedback...');
    await GuestFeedback.deleteMany({});
    console.log('✅ Cleared existing data');

    // Insert sample feedback
    console.log('\n📝 Inserting sample guest feedback...');
    const insertedFeedback = await GuestFeedback.insertMany(sampleFeedback);
    console.log(`✅ Inserted ${insertedFeedback.length} feedback entries`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`   Total feedback: ${insertedFeedback.length}`);
    console.log(`   Pending: ${insertedFeedback.filter(f => f.status === 'pending').length}`);
    console.log(`   Published: ${insertedFeedback.filter(f => f.status === 'published').length}`);
    console.log(`   With responses: ${insertedFeedback.filter(f => f.response?.hasResponse).length}`);
    console.log(`   Positive sentiment: ${insertedFeedback.filter(f => f.sentiment === 'positive').length}`);
    console.log(`   Neutral sentiment: ${insertedFeedback.filter(f => f.sentiment === 'neutral').length}`);
    console.log(`   Negative sentiment: ${insertedFeedback.filter(f => f.sentiment === 'negative').length}`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
