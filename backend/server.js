import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import passport from "passport";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { GridFSBucket } from 'mongodb';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import 'dotenv/config';

// Import security middlewares
import {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  dataSanitization,
  xssProtection,
  preventParamPollution,
  securityHeaders,
  securityLogger
} from './middleware/security.js';

// Environment variable validation
const validateEnvironment = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  // Log loaded environment variables (without sensitive data)
  console.log('✅ Environment validation passed');
  console.log(`📝 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔗 MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`🛡️ ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? '✅ Set' : '❌ Missing'}`);

  // Optional services
  if (!process.env.GOOGLE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('⚠️ Gemini AI API key not found. Image description generation will not work.');
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.warn('⚠️ Google Cloud credentials not found. Image processing will not work.');
  }
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary credentials not found. Cloud storage will not work.');
  }
};

// Validate environment before starting server
validateEnvironment();

// Connect to database
await connectDB();

// GridFS setup with proper configuration
let gfs;
const conn = mongoose.connection;

// Initialize GridFS bucket immediately since connection is already established
gfs = new GridFSBucket(conn.db, {
  bucketName: 'menu.Images'
});
console.log('✅ GridFS bucket initialized: menu.Images');

// GridFS Storage configuration with crypto for unique filenames
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'menu.Images',
          metadata: {
            originalName: file.originalname,
            uploadDate: new Date(),
            contentType: file.mimetype
          }
        };
        resolve(fileInfo);
      });
    });
  }
});

// Configure multer with GridFS storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit as per README
  },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp|avif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only! Supported formats: JPEG, JPG, PNG, WEBP, GIF, AVIF');
  }
}

import 'dotenv/config';
// import './utils/passport.js';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import database configuration
import { connectDB, dbHealthCheck } from "./config/database.js";
// Import models to register them with mongoose
import './models/Food.js';
import './models/FoodOrder.js';
import './models/MenuItem.js';
// Import services
import gridfsService from './services/gridfsService.js';
// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/adminRoutes.js";
import foodRoutes from "./routes/food.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import menuExtractionRoutes from "./routes/menuExtractionRoutes.js";
import menuSelectionRoutes from "./routes/menuSelectionRoutes.js";
import foodMenuRoutes from "./routes/food/menuRoutes.js";
import webhooksRoutes from "./routes/webhooks.js";
import roomsRoutes from "./routes/rooms.js";
import bookings from "./routes/bookings.js";
// import "./eventListeners/notificationListeners.js";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
// Initialize Passport
app.use(passport.initialize()); 

// Security middleware
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   contentSecurityPolicy: false,
// }));

// Security headers
// app.use(securityHeaders);

// Security logging
// app.use(securityLogger);

// Rate limiting
// if (process.env.NODE_ENV === "production") {
//   app.use("/api/", apiLimiter);
//   app.use("/api/auth/", authLimiter);
//   app.use("/api/uploadMenu/upload", uploadLimiter);
// }

// app.use(compression());
// app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization
// app.use(dataSanitization);
// app.use(xssProtection);
// app.use(preventParamPollution);

// CORS configuration - MUST be before other middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5180",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:5180"
  ].filter(Boolean), // Filter out any undefined values
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// Handle preflight requests explicitly
// app.options('*', cors(corsOptions));

// Rate limiting
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
  app.use(mongoSanitize());
  app.use(hpp());
}

// Health check endpoint
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
console.log('🔍 DEBUG: Registering API routes...');
app.use("/api/auth", authRoutes);
console.log('✅ DEBUG: Auth routes registered at /api/auth');
app.use("/api/admin", adminRoutes);
console.log('✅ DEBUG: Admin routes registered at /api/admin');
app.use("/api/rooms", roomsRoutes);
console.log('✅ DEBUG: Rooms routes registered at /api/rooms');
app.use("/api/bookings", bookings);
console.log('✅ DEBUG: Bookings routes registered at /api/bookings');
app.use("/api/food", foodRoutes);
console.log('✅ DEBUG: Food routes registered at /api/food');
app.use("/api/food/menu", foodMenuRoutes);
console.log('✅ DEBUG: Food menu routes registered at /api/food/menu');
console.log('✅ DEBUG: Available food menu endpoints:');
console.log('✅ DEBUG: - GET /api/food/menu/items');
console.log('✅ DEBUG: - GET /api/food/menu/categories');
console.log('✅ DEBUG: - POST /api/food/menu/items (protected)');
console.log('✅ DEBUG: - POST /api/food/menu/batch (protected)');
console.log('✅ DEBUG: - PUT /api/food/menu/items/:id (protected)');
console.log('✅ DEBUG: - DELETE /api/food/menu/items/:id (protected)');
app.use("/api/notifications", notificationRoutes);
console.log('✅ DEBUG: Notification routes registered at /api/notifications');
app.use("/api/menu", menuRoutes);
console.log('✅ DEBUG: Menu routes registered at /api/menu');
app.use("/api/uploadMenu", menuExtractionRoutes);
console.log('✅ DEBUG: Menu extraction routes registered at /api/uploadMenu');
app.use("/api/menu-selection", menuSelectionRoutes);
console.log('✅ DEBUG: Menu selection routes registered at /api/menu-selection');
app.use("/api/webhooks", webhooksRoutes);
console.log('✅ DEBUG: Webhooks routes registered at /api/webhooks');
app.post('/api/uploadMenu/image', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 DEBUG: Image upload request received');
    console.log('🔍 DEBUG: Request body keys:', Object.keys(req.body || {}));
    console.log('🔍 DEBUG: Request file:', req.file ? 'Present' : 'Missing');
    if (req.file) {
      console.log('🔍 DEBUG: File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    if (!req.file) {
      console.log('❌ DEBUG: No file uploaded - returning 400');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 File uploaded successfully to GridFS:', req.file.filename);
    console.log('📁 GridFS ID:', req.file.gridfsId);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      fileId: req.file.gridfsId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      imageUrl: `/api/menu/image/${req.file.gridfsId}`,
      uploadDate: new Date()
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Serve images from GridFS - /api/menu/image/:gridfsId
app.get('/api/menu/image/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    // Check if image exists
    const exists = await gridfsService.imageExists(fileId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Get image stream and metadata
    const { stream, metadata } = await gridfsService.getImageStream(fileId);

    // Set response headers for proper image serving
    res.set({
      'Content-Type': metadata.contentType,
      'Content-Length': metadata.length,
      'Content-Disposition': `inline; filename="${metadata.originalName || metadata.filename}"`,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': fileId
    });

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('❌ GridFS stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming image',
          error: error.message
        });
      }
    });

    // Stream the file to response
    stream.pipe(res);

  } catch (error) {
    console.error('❌ Image serve error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error serving image',
        error: error.message
      });
    }
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
import fs from 'fs';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// app.use("/api", (req, res) => {
//   console.warn(`🔍 Unknown API route: ${req.originalUrl}`);
//   res.status(404).json({
//     success: false,
//     message: "API endpoint not found",
//   });
// });
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hotel Management System API",
    version: "1.0.0",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin",
      notifications: "/api/notifications",
      health: "/health",
    },
  });
});
// Import error handler
import errorHandler from './middleware/errorHandler.js';

// Global error handler
app.use(errorHandler);
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

// Start server
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

// Export upload middleware for use in routes
export { upload };

export default app;
