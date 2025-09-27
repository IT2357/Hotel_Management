// 📁 backend/simple-server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Connect to database on startup
let dbConnected = false;
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  dbConnected = true;
}).catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
});

// Simple User schema for testing
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isApproved: Boolean,
  isActive: Boolean,
  emailVerified: Boolean,
  tokenVersion: Number,
  authProviders: [String]
});

const User = mongoose.model('User', userSchema);

// Simple health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: dbConnected ? "connected" : "disconnected"
  });
});

// Simple login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    
    if (!dbConnected) {
      return res.status(500).json({
        success: false,
        message: "Database connection unavailable. Please try again later."
      });
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        isApproved: user.isApproved,
        tokenVersion: user.tokenVersion || 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    console.log('✅ Login successful for:', email);
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isApproved: user.isApproved,
        emailVerified: user.emailVerified,
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
});
