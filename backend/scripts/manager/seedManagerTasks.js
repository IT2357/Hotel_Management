import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

import config from "../../config/environment.js";
import ManagerTask, {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_DEPARTMENTS,
  TASK_TYPES,
} from "../../models/ManagerTask.js";
import { User } from "../../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const resolveEnumValue = (value, allowed, fallback) => {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  const match = allowed.find((item) => item.toLowerCase() === normalized);
  return match || fallback;
};

const SAMPLE_TASKS = [
  {
    title: "Deep clean presidential suite",
    description:
      "Full housekeeping service for presidential suite including linen change, amenities restock, and floor polishing.",
    department: "Housekeeping",
    type: "cleaning",
    priority: "High",
    status: "Pending",
    location: "Presidential Suite",
    roomNumber: "PH-01",
    dueDate: () => new Date(Date.now() + 3 * 60 * 60 * 1000),
    estimatedDuration: 180,
    tags: ["VIP", "Housekeeping"],
  },
  {
    title: "Kitchen equipment inspection",
    description:
      "Perform scheduled maintenance on primary kitchen line and verify refrigeration temperatures.",
    department: "Kitchen",
    type: "maintenance",
    priority: "Urgent",
    status: "In-Progress",
    location: "Main Kitchen",
    dueDate: () => new Date(Date.now() + 90 * 60 * 1000),
    estimatedDuration: 120,
    tags: ["Maintenance", "Safety"],
  },
  {
    title: "Executive lounge welcome setup",
    description:
      "Arrange welcome amenities and staff briefing for corporate delegation arriving this evening.",
    department: "Guest Services",
    type: "service",
    priority: "Medium",
    status: "Assigned",
    location: "Executive Lounge",
    dueDate: () => new Date(Date.now() + 6 * 60 * 60 * 1000),
    estimatedDuration: 150,
    tags: ["Corporate", "Event"],
  },
  {
    title: "Front desk night audit briefing",
    description:
      "Prepare nightly audit checklist and assign staff for overnight guest assistance coverage.",
    department: "Front Desk",
    type: "general",
    priority: "Low",
    status: "Pending",
    location: "Front Desk",
    dueDate: () => new Date(Date.now() + 12 * 60 * 60 * 1000),
    estimatedDuration: 45,
    tags: ["Operations"],
  },
];

const connectDatabase = async () => {
  const uri = config.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Please update backend/.env");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("✅ Connected to MongoDB");
};

const ensureManagerAccount = async () => {
  const existingManager = await User.findOne({ role: "manager" }).lean();
  if (existingManager) {
    console.log(`👤 Using existing manager account: ${existingManager.email}`);
    return existingManager._id;
  }

  console.log("⚠️ No manager account found. Creating a seed manager user...");
  const manager = await User.create({
    name: "Demo Manager",
    email: "manager.demo@valdorhotel.com",
    password: "Manager123!",
    role: "manager",
    emailVerified: true,
    isActive: true,
    isApproved: true,
  });

  console.log(`✅ Created manager account with email ${manager.email}`);
  return manager._id;
};

const formatTaskPayload = (task, managerId) => {
  const dueDate = typeof task.dueDate === "function" ? task.dueDate() : task.dueDate;

  return {
    title: task.title,
    description: task.description,
    department: resolveEnumValue(task.department, TASK_DEPARTMENTS, "Other"),
    type: resolveEnumValue(task.type, TASK_TYPES, "general"),
    priority: resolveEnumValue(task.priority, TASK_PRIORITIES, "Medium"),
    status: resolveEnumValue(task.status, TASK_STATUSES, "Pending"),
    location: task.location ?? "",
    roomNumber: task.roomNumber,
    dueDate,
    estimatedDuration: task.estimatedDuration,
    tags: task.tags,
    createdBy: managerId,
    updatedBy: managerId,
    notes: {
      manager: `Seeded on ${new Date().toLocaleString()}`,
    },
  };
};

const seedManagerTasks = async () => {
  await connectDatabase();

  try {
    const managerId = await ensureManagerAccount();
    const existingCount = await ManagerTask.countDocuments();

    if (existingCount > 0) {
      console.log(`ℹ️ Manager tasks already exist (${existingCount}). Seeding skipped.`);
      return;
    }

    const payload = SAMPLE_TASKS.map((task) => formatTaskPayload(task, managerId));
    const created = await ManagerTask.insertMany(payload);

    console.log(`✅ Inserted ${created.length} manager tasks into manager_tasks collection.`);
  } catch (error) {
    console.error("❌ Failed to seed manager tasks:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedManagerTasks();
