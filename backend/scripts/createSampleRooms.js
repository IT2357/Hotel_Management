// 📁 backend/scripts/createSampleRooms.js
import mongoose from "mongoose";
import Room from "../models/Room.js";
import { connectDB } from "../config/database.js";
import "dotenv/config";

const sampleRooms = [
  {
    title: "Deluxe Ocean View Room",
    description: "Spacious room with breathtaking ocean views, featuring a king-size bed and modern amenities.",
    roomNumber: "101",
    status: "Available",
    occupancy: {
      adults: 2,
      children: 1
    },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Safe", "OceanView", "Balcony"],
    size: 45,
    type: "Deluxe",
    bedType: "King",
    view: "Ocean",
    floor: 1,
    basePrice: 25000
  },
  {
    title: "Standard City View Room",
    description: "Comfortable standard room with city views, perfect for business travelers.",
    roomNumber: "201",
    status: "Available",
    occupancy: {
      adults: 2,
      children: 0
    },
    amenities: ["WiFi", "TV", "AC", "Desk"],
    size: 35,
    type: "Standard",
    bedType: "Queen",
    view: "City",
    floor: 2,
    basePrice: 18000
  },
  {
    title: "Executive Suite",
    description: "Luxurious suite with separate living area, perfect for extended stays.",
    roomNumber: "301",
    status: "Available",
    occupancy: {
      adults: 3,
      children: 2
    },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Safe", "Desk", "RoomService", "Jacuzzi"],
    size: 75,
    type: "Suite",
    bedType: "King",
    view: "Ocean",
    floor: 3,
    basePrice: 45000
  },
  {
    title: "Family Room",
    description: "Spacious family room with two queen beds, ideal for families with children.",
    roomNumber: "102",
    status: "Available",
    occupancy: {
      adults: 4,
      children: 2
    },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Desk", "DailyCleaning"],
    size: 50,
    type: "Family",
    bedType: "Queen",
    view: "Garden",
    floor: 1,
    basePrice: 32000
  },
  {
    title: "Presidential Suite",
    description: "Ultimate luxury suite with panoramic views, private terrace, and premium amenities.",
    roomNumber: "501",
    status: "Available",
    occupancy: {
      adults: 4,
      children: 2
    },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Safe", "Desk", "Balcony", "OceanView", "RoomService", "Jacuzzi", "Bathrobes", "Slippers"],
    size: 120,
    type: "Presidential",
    bedType: "King",
    view: "Ocean",
    floor: 5,
    basePrice: 85000
  }
];

async function createSampleRooms() {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();

    console.log("🗑️ Clearing existing rooms...");
    await Room.deleteMany({});

    console.log("🌱 Creating sample rooms...");
    const createdRooms = await Room.insertMany(sampleRooms);

    console.log(`✅ Successfully created ${createdRooms.length} sample rooms:`);
    createdRooms.forEach(room => {
      console.log(`  - ${room.roomNumber}: ${room.title} (${room.type}) - ₨${room.basePrice.toLocaleString()}`);
    });

    console.log("\n🏨 Sample rooms created successfully!");
    console.log("You can now test the room search functionality.");

  } catch (error) {
    console.error("❌ Error creating sample rooms:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
createSampleRooms();
