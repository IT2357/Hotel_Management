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
    title: "Prepare presidential suite for VIP arrival",
    description:
      "Full-service refresh of the presidential suite including linen change, minibar restock, and amenity placement.",
    department: "cleaning",
    type: "cleaning",
    priority: "Urgent",
      status: "Pending",
    location: "Presidential Suite",
    roomNumber: "PH-01",
    dueDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000),
    estimatedDuration: 180,
    tags: ["VIP", "Arrival"],
    recommendedStaff: [
      { name: "Angela Ortiz", role: "Senior Housekeeper", match: 94 },
      { name: "Priya Patel", role: "Housekeeping Lead", match: 89 },
    ],
  },
  {
    title: "Walk-in freezer temperature audit",
    description:
      "Verify temperature logs, calibrate sensors, and document variance report for the main kitchen freezer.",
  department: "Kitchen",
  type: "Kitchen",
    priority: "High",
      status: "Pending",
    location: "Main Kitchen",
    dueDate: () => new Date(Date.now() + 90 * 60 * 1000),
    estimatedDuration: 120,
    tags: ["Compliance", "Safety"],
    recommendedStaff: [
      { name: "Marcus Reid", role: "Sous Chef", match: 88 },
      { name: "Kim Lee", role: "Inventory Specialist", match: 83 },
    ],
  },
  {
    title: "Corporate delegation welcome briefing",
    description:
      "Coordinate welcome drinks, briefing cards, and concierge coverage for the arriving corporate delegation.",
  department: "service",
  type: "service",
    priority: "Medium",
      status: "Pending",
    location: "Executive Lounge",
    dueDate: () => new Date(Date.now() + 5 * 60 * 60 * 1000),
    estimatedDuration: 150,
    tags: ["Corporate", "Event"],
    recommendedStaff: [
      { name: "Daniel Kaban", role: "Guest Relations", match: 86 },
    ],
  },
  {
    title: "Front desk night audit checklist",
    description:
      "Compile financial reconciliation checklist, confirm shift coverage, and prepare turnover briefing notes.",
  department: "service",
  type: "service",
    priority: "Low",
    status: "Pending",
    location: "Front Desk",
    dueDate: () => new Date(Date.now() + 12 * 60 * 60 * 1000),
    estimatedDuration: 60,
    tags: ["Operations"],
  },
  {
    title: "Pool pump maintenance and safety check",
    description:
      "Inspect circulation pump, clean filters, verify chemical balance logs, and update maintenance dashboard.",
  department: "Maintenance",
  type: "Maintenance",
    priority: "High",
    status: "Pending",
    location: "Pool Deck",
    dueDate: () => new Date(Date.now() + 3 * 60 * 60 * 1000),
    estimatedDuration: 90,
    tags: ["Facilities", "Safety"],
  },
  {
    title: "Evening security briefing",
    description:
      "Review incident log, assign patrol zones, and confirm CCTV system status for the evening shift.",
  department: "service",
  type: "service",
    priority: "Medium",
      status: "Pending",
    location: "Security Office",
    dueDate: () => new Date(Date.now() - 1 * 60 * 60 * 1000),
    estimatedDuration: 45,
    tags: ["Security", "Briefing"],
    recommendedStaff: [
      { name: "Joseph Nilan", role: "Security Supervisor", match: 90 },
    ],
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
  department: resolveEnumValue(task.department, TASK_DEPARTMENTS, "service"),
    type: resolveEnumValue(task.type, TASK_TYPES, "general"),
    priority: resolveEnumValue(task.priority, TASK_PRIORITIES, "Medium"),
    status: resolveEnumValue(task.status, TASK_STATUSES, "Pending"),
    location: task.location ?? "",
    roomNumber: task.roomNumber,
    dueDate,
    estimatedDuration: task.estimatedDuration,
    tags: task.tags,
    recommendedStaff: task.recommendedStaff,
    aiRecommendationScore: task.aiRecommendationScore,
    createdBy: managerId,
    updatedBy: managerId,
    notes: {
      manager: `Seeded on ${new Date().toLocaleString()}`,
    },
  };
};

const normalizeDepartmentForSeed = (value) => {
  const map = {
    housekeeping: "cleaning",
    cleaning: "cleaning",
    kitchen: "Kitchen",
    food: "Kitchen",
    maintenance: "Maintenance",
    engineering: "Maintenance",
    services: "service",
    service: "service",
    "guest services": "service",
    concierge: "service",
    "front desk": "service",
    reception: "service",
  };

  const key = String(value || "").trim().toLowerCase();
  return map[key] || "service";
};

const normalizeTypeForSeed = (value, department) => {
  const map = {
    cleaning: "cleaning",
    housekeeping: "cleaning",
    kitchen: "Kitchen",
    food: "Kitchen",
    maintenance: "Maintenance",
    engineering: "Maintenance",
    services: "service",
    service: "service",
    concierge: "service",
    reception: "service",
  };

  const key = String(value || "").trim().toLowerCase();
  if (map[key]) return map[key];

  const deptKey = String(department || "").trim().toLowerCase();
  if (map[deptKey]) return map[deptKey];

  return "general";
};

const seedManagerTasks = async () => {
  await connectDatabase();

  try {
    const managerId = await ensureManagerAccount();
    const payload = SAMPLE_TASKS.map((task) => ({
      filter: { title: task.title },
      update: formatTaskPayload(task, managerId),
    }));

    const results = [];
    for (const entry of payload) {
      const updated = await ManagerTask.findOneAndUpdate(
        entry.filter,
        {
          ...entry.update,
          isArchived: false,
          updatedBy: managerId,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      results.push(updated);
    }

    let normalizedCount = 0;
    const existingTasks = await ManagerTask.find();
    for (const task of existingTasks) {
      const nextDepartment = normalizeDepartmentForSeed(task.department);
      const nextType = normalizeTypeForSeed(task.type, nextDepartment);
      const needsPending = task.status !== "Pending";
      const needsDepartment = task.department !== nextDepartment;
      const needsType = task.type !== nextType;
      const needsAssignmentReset = Boolean(task.assignedTo) || (Array.isArray(task.assignmentHistory) && task.assignmentHistory.length > 0);

      if (needsPending || needsDepartment || needsType || needsAssignmentReset || task.isArchived) {
        task.status = "Pending";
        task.department = nextDepartment;
        task.type = nextType;
        task.assignedTo = null;
        task.assignmentHistory = [];
        task.isArchived = false;
        await task.save();
        normalizedCount += 1;
      }
    }

    console.log(`✅ Ensured ${results.length} manager tasks are seeded. Normalized ${normalizedCount} tasks to pending state.`);
  } catch (error) {
    console.error("❌ Failed to seed manager tasks:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedManagerTasks();
