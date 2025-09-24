// 📁 backend/scripts/seedRoomsAndKeyCards.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "../models/Room.js";
import KeyCard from "../models/KeyCard.js";

const roomsSeedData = [
  {
    title: "Deluxe Ocean View Room",
    description:
      "Spacious deluxe room featuring panoramic ocean views, private balcony, and premium amenities.",
    roomNumber: "D-401",
    status: "Available",
    occupancy: { adults: 2, children: 1 },
    images: [
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
        isPrimary: true,
        caption: "Ocean view from the balcony",
      },
      {
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        caption: "Deluxe room interior",
      },
    ],
    availability: [
      {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isAvailable: true,
      },
    ],
    amenities: [
      "WiFi",
      "TV",
      "AC",
      "Minibar",
      "RoomService",
      "DailyCleaning",
      "CoffeeMaker",
      "Balcony",
      "OceanView",
    ],
    size: 48,
    type: "Deluxe",
    bedType: "King",
    view: "Ocean",
    floor: 4,
    basePrice: 320,
    cancellationPolicy: "Moderate",
    rating: "Excellent",
    packages: [
      {
        name: "Romance Escape",
        price: 120,
        description: "Includes welcome champagne, spa credit, and late checkout.",
        inclusions: ["Champagne", "Spa Credit", "Late Checkout"],
      },
    ],
    keyCards: [
      {
        cardNumber: "OC-401-A",
        status: "active",
        activationDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        cardNumber: "OC-401-B",
        status: "inactive",
      },
    ],
  },
  {
    title: "Executive City Suite",
    description:
      "Executive level suite with separate living area, city skyline views, and dedicated concierge service.",
    roomNumber: "E-1502",
    status: "Available",
    occupancy: { adults: 3, children: 1 },
    images: [
      {
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        isPrimary: true,
        caption: "Executive suite living room",
      },
      {
        url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
        caption: "Master bedroom with city view",
      },
    ],
    availability: [
      {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isAvailable: true,
      },
    ],
    amenities: [
      "WiFi",
      "TV",
      "AC",
      "Minibar",
      "Safe",
      "Desk",
      "RoomService",
      "DailyCleaning",
      "Jacuzzi",
    ],
    size: 72,
    type: "Executive",
    bedType: "Queen",
    view: "City",
    floor: 15,
    basePrice: 450,
    cancellationPolicy: "Flexible",
    rating: "Good",
    keyCards: [
      {
        cardNumber: "EX-1502-A",
        status: "inactive",
      },
      {
        cardNumber: "EX-1502-B",
        status: "inactive",
      },
    ],
  },
  {
    title: "Family Garden Suite",
    description:
      "Two-bedroom family suite with private garden access, kitchenette, and kid-friendly amenities.",
    roomNumber: "F-207",
    status: "Available",
    occupancy: { adults: 4, children: 2 },
    images: [
      {
        url: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353",
        isPrimary: true,
        caption: "Family suite with garden terrace",
      },
      {
        url: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
        caption: "Kids bedroom",
      },
    ],
    availability: [
      {
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isAvailable: true,
      },
    ],
    amenities: [
      "WiFi",
      "TV",
      "AC",
      "Minibar",
      "RoomService",
      "DailyCleaning",
      "CoffeeMaker",
      "Balcony",
      "PoolView",
    ],
    size: 95,
    type: "Family",
    bedType: "Twin",
    view: "Garden",
    floor: 2,
    basePrice: 380,
    cancellationPolicy: "Moderate",
    rating: "Excellent",
    keyCards: [
      {
        cardNumber: "FM-207-A",
        status: "active",
        activationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      {
        cardNumber: "FM-207-B",
        status: "active",
        activationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    ],
  },
];

async function seedRoomsAndKeyCards({ reset = false } = {}) {
  dotenv.config();

  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_management";

  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    if (reset) {
      await Promise.all([Room.deleteMany({}), KeyCard.deleteMany({})]);
      console.log("🧹 Existing rooms and key cards cleared");
    }

    const existingRooms = await Room.countDocuments();
    if (existingRooms > 0 && !reset) {
      console.log(
        "ℹ️ Rooms already exist. Run with --reset to overwrite existing data."
      );
      return;
    }

    // Insert rooms
    const rooms = await Room.insertMany(
      roomsSeedData.map(({ keyCards, ...room }) => room)
    );
    console.log(`🏨 Inserted ${rooms.length} rooms`);

    // Build key card payload from inserted rooms
    const keyCardPayload = rooms.flatMap((room) => {
      const roomSeed = roomsSeedData.find(
        (seed) => seed.roomNumber === room.roomNumber
      );
      if (!roomSeed || !roomSeed.keyCards) {
        return [];
      }

      return roomSeed.keyCards.map((card) => ({
        ...card,
        assignedRoom: room._id,
      }));
    });

    if (keyCardPayload.length > 0) {
      const keyCards = await KeyCard.insertMany(keyCardPayload);
      console.log(`🔑 Inserted ${keyCards.length} key cards`);
    } else {
      console.log("ℹ️ No key cards specified for seeding");
    }

    console.log("✅ Room and key card seeding complete");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// CLI handling
const args = process.argv.slice(2);
const reset = args.includes("--reset") || args.includes("-r");

seedRoomsAndKeyCards({ reset }).then(() => {
  if (!process.exitCode) {
    process.exit(0);
  }
});
