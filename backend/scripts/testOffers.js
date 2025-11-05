// Test script for offers functionality
const mongoose = require('mongoose');
const Offer = require('../models/Offer');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hotel_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample offers for testing
const sampleOffers = [
  {
    title: "Seafood Lover's Special",
    description: "20% off on all seafood dishes for our regular customers",
    type: "percentage",
    discountValue: 20,
    target: {
      minOrders: 5,
      itemType: "seafood"
    },
    jaffnaItems: ["seafood"],
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    createdBy: "64a1b2c3d4e5f6789012345" // Sample admin ID
  },
  {
    title: "Curry Connoisseur Deal",
    description: "15% off on all curry dishes for our loyal fans",
    type: "percentage",
    discountValue: 15,
    target: {
      minOrders: 3,
      category: "Main Course"
    },
    jaffnaItems: ["curry", "கறிக்கோசு"],
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    createdBy: "64a1b2c3d4e5f6789012345" // Sample admin ID
  },
  {
    title: "Hoppers Heaven",
    description: "10% off on all hoppers for our regular customers",
    type: "percentage",
    discountValue: 10,
    target: {
      minOrders: 3,
      itemType: "hoppers"
    },
    jaffnaItems: ["ஆட்டுக்கறி", "கொத்து"],
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    createdBy: "64a1b2c3d4e5f6789012345" // Sample admin ID
  }
];

async function seedOffers() {
  try {
    // Clear existing offers
    await Offer.deleteMany({});
    
    // Insert sample offers
    const insertedOffers = await Offer.insertMany(sampleOffers);
    console.log('Sample offers inserted:', insertedOffers.length);
    
    // Verify insertion
    const allOffers = await Offer.find({});
    console.log('All offers in database:', allOffers);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding offers:', error);
    mongoose.connection.close();
  }
}

// Run the seed function
seedOffers();