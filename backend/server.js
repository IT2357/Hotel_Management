import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import passport from "passport";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

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

// GridFS setup
let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  // Init GridFS bucket
  gfs = new GridFSBucket(conn.db, {
    bucketName: 'menu.Images'
  });
  console.log('✅ GridFS bucket initialized: menu.Images');
});

// Configure GridFS storage for multer
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
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

const upload = multer({
  storage,
  limits: {
    fileSize: 10000000 // 10MB limit
  },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

import 'dotenv/config';
import './utils/passport.js';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import database configuration
import { connectDB, dbHealthCheck } from "./config/database.js";
// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/adminRoutes.js";
import foodRoutes from "./routes/food.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import menuExtractionRoutes from "./routes/menuExtractionRoutes.js";
import newMenuRoutes from "./routes/menu.js";
import foodMenuRoutes from "./routes/food/menuRoutes.js";
import "./eventListeners/notificationListeners.js";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
// Initialize Passport
app.use(passport.initialize()); 

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Security headers
app.use(securityHeaders);

// Security logging
app.use(securityLogger);

// Rate limiting
if (process.env.NODE_ENV === "production") {
  app.use("/api/", apiLimiter);
  app.use("/api/auth/", authLimiter);
  app.use("/api/uploadMenu/upload", uploadLimiter);
}

app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization
app.use(dataSanitization);
app.use(xssProtection);
app.use(preventParamPollution);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
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
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

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
app.use("/api/food", foodRoutes);
console.log('✅ DEBUG: Food routes registered at /api/food');
app.use("/api/food/menu", foodMenuRoutes);
console.log('✅ DEBUG: Food menu routes registered at /api/food/menu');
console.log('✅ DEBUG: Available food menu endpoints:');
console.log('✅ DEBUG: - GET /api/food/menu/items');
console.log('✅ DEBUG: - GET /api/food/menu/categories');
console.log('✅ DEBUG: - POST /api/food/menu/items (protected)');
console.log('✅ DEBUG: - PUT /api/food/menu/items/:id (protected)');
console.log('✅ DEBUG: - DELETE /api/food/menu/items/:id (protected)');
app.use("/api/notifications", notificationRoutes);
console.log('✅ DEBUG: Notification routes registered at /api/notifications');
app.use("/api/menu", menuRoutes);
console.log('✅ DEBUG: Menu extraction routes registered at /api/menu');
app.use("/api/uploadMenu", menuExtractionRoutes);
console.log('✅ DEBUG: Upload menu routes registered at /api/uploadMenu');
// Image upload route
app.post('/api/menu/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 File uploaded successfully:', req.file);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      fileId: req.file.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadDate: req.file.uploadDate
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

// Serve images from GridFS
app.get('/api/menu/image/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    // Check if file exists
    const files = await gfs.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = files[0];

    // Check if it's an image
    if (!file.contentType || !file.contentType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'File is not an image'
      });
    }

    // Set content type
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.metadata?.originalName || file.filename}"`);

    // Stream the file
    const readstream = gfs.openDownloadStream(fileId);
    readstream.pipe(res);

  } catch (error) {
    console.error('❌ Image serve error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving image',
      error: error.message
    });
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

export default app;
