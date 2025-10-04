import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/database.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running", timestamp: new Date().toISOString() });
});

// Basic API routes
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// Connect to database and start server
connectDB().then(() => {
  console.log("✅ Database connected successfully");
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
  });
}).catch((error) => {
  console.error("❌ Database connection failed:", error);
  // Start server anyway for basic functionality
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (without database)`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
});

// Import routes
import foodMenuRoutes from './routes/food/menuRoutes.js';

// API routes
app.use('/api/menu', foodMenuRoutes);

// Import more routes
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/roomRoutes.js';

// More API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
