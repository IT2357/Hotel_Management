import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

import config from "../../config/environment.js";
import { User } from "../../models/User.js";
import GuestServiceRequest from "../../models/GuestServiceRequest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SAMPLE_GUESTS = [
  {
    name: "Evelyn Carter",
    email: "evelyn.carter@example.com",
    phone: "+94 71 234 5678",
    roomHint: "Skyline Suite 1902",
  },
  {
    name: "Liam Fernando",
    email: "liam.fernando@example.com",
    phone: "+94 77 555 8899",
    roomHint: "Executive Deluxe 1204",
  },
];

const SAMPLE_REQUESTS = [
  {
    requestType: "housekeeping",
    title: "Fresh linens and turndown service",
    description:
      "Guest requested a full turndown with hypoallergenic pillows and extra bath towels before 8 PM tonight.",
    priority: "high",
    status: "pending",
    guestLocation: "Skyline Suite 1902",
    specialInstructions: "Allergies to feather pillows; use microfiber set.",
    requiresFollowUp: true,
    followUpNotes: "Confirm allergy-friendly amenities restocked.",
  },
  {
    requestType: "maintenance",
    title: "Air conditioning humming noise",
    description:
      "Guest reports a loud vibration from the vent near the minibar. Noise increases when setting below 22°C.",
    priority: "urgent",
    status: "pending",
    guestLocation: "Executive Deluxe 1204",
    specialInstructions: "Guest will be at dinner 7-9 PM, please fix in that window.",
  },
  {
    requestType: "room_service",
    title: "Late night dining order",
    description:
      "Order requested: grilled reef fish, garlic mashed potatoes, mango mousse, and chamomile tea for two.",
    priority: "medium",
    status: "assigned",
    guestLocation: "Poolside cabana 3",
    specialInstructions: "Set table with candlelight setup, anniversary card provided at concierge.",
  },
  {
    requestType: "concierge",
    title: "Airport transfer confirmation",
    description:
      "Guest needs confirmation of 6:30 AM transfer with infant seat and extra luggage capacity.",
    priority: "medium",
    status: "in_progress",
    guestLocation: "Lobby lounge",
    specialInstructions: "Send confirmation via SMS and place hard copy with bell desk.",
  },
];

const connectDatabase = async () => {
  const uri = config.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Please update backend/.env");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("✅ Connected to MongoDB");
};

const ensureSampleGuests = async () => {
  const results = [];

  for (const guest of SAMPLE_GUESTS) {
    let existing = await User.findOne({ email: guest.email }).lean();
    if (!existing) {
      console.log(`ℹ️ Creating sample guest ${guest.email}`);
      existing = await User.create({
        name: guest.name,
        email: guest.email,
        password: "Guest123!",
        role: "guest",
        emailVerified: true,
        isActive: true,
        isApproved: true,
        profile: {
          phone: guest.phone,
          preferredRoom: guest.roomHint,
        },
      });
    }
    results.push(existing._id);
  }

  return results;
};

const buildRequestPayloads = (guestIds) => {
  const now = Date.now();
  return SAMPLE_REQUESTS.map((request, index) => {
    const guestId = guestIds[index % guestIds.length];
    const createdAt = new Date(now - index * 35 * 60 * 1000); // 35-minute spacing
    const estimatedCompletionTime = new Date(createdAt.getTime() + 90 * 60 * 1000);

    return {
      ...request,
      guest: guestId,
      estimatedCompletionTime,
      createdAt,
      updatedAt: createdAt,
      notes: [
        {
          content: `Seeded request note for ${request.title}`,
          addedBy: guestId,
          addedAt: createdAt,
        },
      ],
    };
  });
};

const seedGuestRequests = async () => {
  await connectDatabase();

  try {
    const existingCount = await GuestServiceRequest.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️ Guest service requests already exist (${existingCount}). Seeding skipped.`);
      return;
    }

    const guestIds = await ensureSampleGuests();
    const payloads = buildRequestPayloads(guestIds);
    const created = await GuestServiceRequest.insertMany(payloads);

    console.log(`✅ Inserted ${created.length} guest service requests.`);
  } catch (error) {
    console.error("❌ Failed to seed guest requests:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedGuestRequests();
