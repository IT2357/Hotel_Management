import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import passport from "passport"; // Added for social login
import http from 'http';
import { initSocket } from './utils/socket.js';
import "dotenv/config";
import "./utils/passport.js"; // Added to initialize Passport strategies
// Import database configuration
import { connectDB, dbHealthCheck } from "./config/database.js";
// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import webhookRoutes from "./routes/webhooks.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import checkInOutRoutes from "./routes/checkInOutRoutes.js";
import guestServiceRoutes from "./routes/guestServiceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import keyCardRoutes from './routes/keyCardRoutes.js';
import "./eventListeners/notificationListeners.js";
import EmailService from "./services/notification/emailService.js";
// Import SMS template seeder
import { seedSMSTemplates } from "./utils/smsTemplatesSeeder.js";
// Import booking scheduler
import BookingScheduler from "./services/booking/bookingScheduler.js";
import staffRoutes from "./routes/staff.js";
import messageRoutes from "./routes/messages.js";

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.set("trust proxy", 1);
// Initialize Passport
app.use(passport.initialize()); // Added
// Global middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
if (process.env.NODE_ENV === "production") {
  app.use("/api/", limiter);
  app.use("/api/auth/", authLimiter);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());
} else {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
}

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// Start server after attempting database connection
const startBookingScheduler = () => {
  // Process expired bookings every hour
  const processExpiredBookings = async () => {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
        const result = await BookingScheduler.processExpiredBookings();
        if (result.processed > 0) {
          console.log(`🕐 Auto-processed ${result.processed} expired bookings`);
        }
      } else {
        console.log('⏸️  Booking scheduler disabled (set ENABLE_SCHEDULER=true to enable)');
      }
    } catch (error) {
      console.error('❌ Booking scheduler error:', error);
    }
  };

  // Send expiry reminders every 6 hours
  const sendExpiryReminders = async () => {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
        const result = await BookingScheduler.sendExpiryReminders(24); // 24 hours before expiry
        if (result.sent > 0) {
          console.log(`📧 Sent ${result.sent} expiry reminders`);
        }
      }
    } catch (error) {
      console.error('❌ Expiry reminders error:', error);
    }
  };

  // Cleanup old bookings daily at midnight
  const cleanupOldBookings = async () => {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
        const deletedCount = await BookingScheduler.cleanupOldBookings(90); // 90 days old
        if (deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount} old bookings`);
        }
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  };

  // Initial run after 1 minute delay to ensure server is fully started
  setTimeout(() => {
    processExpiredBookings();
    sendExpiryReminders();
  }, 60000); // 1 minute delay

  // Schedule regular runs
  setInterval(processExpiredBookings, 60 * 60 * 1000); // Every hour
  setInterval(sendExpiryReminders, 6 * 60 * 60 * 1000); // Every 6 hours

  // Daily cleanup at midnight (next day 00:00:00)
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
  const timeUntilMidnight = nextMidnight - now.getTime();

  setTimeout(() => {
    cleanupOldBookings();
    // Then run daily at midnight thereafter
    setInterval(cleanupOldBookings, 24 * 60 * 60 * 1000); // Daily
  }, timeUntilMidnight);

  console.log('✅ Booking scheduler started successfully');
};

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connection established");

    // Add this line to initialize the email transporter
    await EmailService.reinitializeTransporter();
    
    // Seed SMS templates after successful database connection and email transporter initialization
    await seedSMSTemplates();

    // Start booking scheduler
    console.log("🚀 Starting booking scheduler...");
    startBookingScheduler();
  } catch (dbError) {
    console.warn("⚠️ Database connection failed, but server will start anyway");
    console.warn("📝 Some features may not work until database is available");
    console.warn("🔧 Check your MONGODB_URI in .env file");
  }

  // Routes (defined after middleware setup)
  app.get("/health", async (req, res) => {
    const dbHealth = await dbHealthCheck();
    res.status(dbHealth.status === "healthy" ? 200 : 503).json({
      success: dbHealth.status === "healthy",
      message: "Server health check",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbHealth,
    });
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/webhooks", webhookRoutes);
  app.use("/api/check-in-out", checkInOutRoutes);
  app.use("/api/guest-services", guestServiceRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use('/api/key-cards', keyCardRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/messages", messageRoutes);

  app.use("/api", (req, res) => {
    console.warn(`🔍 Unknown API route: ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  });
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Hotel Management System API",
      version: "1.0.0",
      documentation: "/api/docs",
      endpoints: {
        auth: "/api/auth",
        admin: "/api/admin",
        bookings: "/api/bookings",
        invoices: "/api/invoices",
        rooms: "/api/rooms",
        notifications: "/api/notifications",
        webhooks: "/api/webhooks",
        checkInOut: "/api/check-in-out",
        guestServices: "/api/guest-services",
        tasks: "/api/tasks",
        keyCards: '/api/key-cards',
        health: "/health",
      },
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  // Start the server regardless of database status
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`
🚀 Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
🔐 Auth API: http://localhost:${PORT}/api/auth
📚 Admin API: http://localhost:${PORT}/api/admin
📅 Bookings API: http://localhost:${PORT}/api/bookings
🧾 Invoices API: http://localhost:${PORT}/api/invoices
🏨 Rooms API: http://localhost:${PORT}/api/rooms
📱 Webhooks: http://localhost:${PORT}/api/webhooks
    `);
  });

  // Handle termination
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
    server.close(() => process.exit(1));
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => console.log("Process terminated"));
  });
  process.on("SIGINT", () => {
    console.log("SIGINT received. Shutting down gracefully...");
    server.close(() => console.log("Process terminated"));
  });
};

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
