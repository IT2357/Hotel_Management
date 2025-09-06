import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import "dotenv/config";

// Import database configuration
import { connectDB, dbHealthCheck } from "./config/database.js";

// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/adminRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
app.set("trust proxy", 1);

// Global middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Optionally add logger, dev-specific middleware here
}

connectDB();

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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/orders", orderRoutes);

// API 404 Handler
app.use("/api", (req, res) => {
  console.warn(`🔍 Unknown API route: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// console.log("👀 Starting server.mjs...");

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hotel Management System API",
    version: "1.0.0",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      menu: "/api/menu", 
      bookings: "/api/bookings",
      orders: "/api/orders",
      admin: "/api/admin",
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

// Start server
const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${
    process.env.NODE_ENV || "development"
  } mode on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
🔐 Auth API: http://localhost:${PORT}/api/auth
📚 Documentation: http://localhost:${PORT}/api/docs
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

export default app;
