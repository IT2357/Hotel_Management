// 📁 backend/scripts/seedRooms.js
import mongoose from "mongoose";
import "dotenv/config";
import Room from "../models/Room.js";
import { connectDB } from "../config/database.js";

const sampleRooms = [
  {
    title: "Deluxe Ocean View Room",
    description: "Spacious room with stunning ocean views, perfect for a relaxing getaway",
    images: [
      {
        url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
        isPrimary: true,
        caption: "Ocean view from the balcony"
      }
    ],
    roomNumber: "101",
    status: "Available",
    occupancy: { adults: 2, children: 2 },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Balcony", "OceanView"],
    size: 35,
    type: "Deluxe",
    bedType: "King",
    view: "Ocean",
    floor: 1,
    basePrice: 250,
    cancellationPolicy: "Flexible",
    rating: "Excellent"
  },
  {
    title: "Standard Garden View Room",
    description: "Comfortable room overlooking our beautiful garden, ideal for budget-conscious travelers",
    images: [
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
        isPrimary: true,
        caption: "Garden view"
      }
    ],
    roomNumber: "102",
    status: "Available",
    occupancy: { adults: 2, children: 1 },
    amenities: ["WiFi", "TV", "AC", "CoffeeMaker"],
    size: 25,
    type: "Standard",
    bedType: "Queen",
    view: "Garden",
    floor: 1,
    basePrice: 150,
    cancellationPolicy: "Moderate",
    rating: "Good"
  },
  {
    title: "Executive Suite",
    description: "Luxurious suite with separate living area, perfect for business travelers",
    images: [
      {
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        isPrimary: true,
        caption: "Executive suite living area"
      }
    ],
    roomNumber: "201",
    status: "Available",
    occupancy: { adults: 2, children: 0 },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Safe", "Desk", "RoomService"],
    size: 50,
    type: "Executive",
    bedType: "King",
    view: "City",
    floor: 2,
    basePrice: 350,
    cancellationPolicy: "Strict",
    rating: "Excellent"
  },
  {
    title: "Family Suite",
    description: "Spacious suite designed for families with connecting rooms and kids' amenities",
    images: [
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
        isPrimary: true,
        caption: "Family suite with connecting rooms"
      }
    ],
    roomNumber: "202",
    status: "Available",
    occupancy: { adults: 4, children: 3 },
    amenities: ["WiFi", "TV", "AC", "Minibar", "Safe", "CoffeeMaker", "Balcony"],
    size: 65,
    type: "Family",
    bedType: "Twin",
    view: "Garden",
    floor: 2,
    basePrice: 400,
    cancellationPolicy: "Flexible",
    rating: "Excellent"
  }
];

const seedRooms = async () => {
  try {
    console.log("🌱 Seeding rooms...");

    // Clear existing rooms
    await Room.deleteMany({});
    console.log("🗑️  Cleared existing rooms");

    // Insert sample rooms
    const rooms = await Room.insertMany(sampleRooms);
    console.log(`✅ Successfully seeded ${rooms.length} rooms`);

    // Log the seeded rooms
    rooms.forEach(room => {
      console.log(`   - ${room.roomNumber}: ${room.title} (${room.type}) - $${room.basePrice}/night`);
    });

  } catch (error) {
    console.error("❌ Error seeding rooms:", error);
    throw error;
  }
};

const runSeeder = async () => {
  try {
    await connectDB();
    await seedRooms();
    console.log("🎉 Room seeding completed successfully!");
  } catch (error) {
    console.error("💥 Room seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}

export default seedRooms;