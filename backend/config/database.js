// 📁 backend/config/database.js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log('🔍 Attempting to connect to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI);
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(
      `🔗 Connection State: ${
        conn.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`
    );

    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  Mongoose disconnected from MongoDB");
    });

    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed through app termination");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error closing MongoDB connection:", error);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.error("❌ Full error:", error);
    
    // Don't retry automatically, just throw the error
    throw error;
  }
};

export const checkDBConnection = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[state],
    isConnected: state === 1,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    port: mongoose.connection.port,
  };
};

export const closeDBConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed successfully");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
    throw error;
  }
};

export const dbHealthCheck = async () => {
  try {
    const dbStatus = checkDBConnection();

    if (!dbStatus.isConnected) {
      throw new Error("Database is not connected");
    }

    await mongoose.connection.db.admin().ping();

    return {
      status: "healthy",
      database: dbStatus.name,
      host: dbStatus.host,
      port: dbStatus.port,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};
