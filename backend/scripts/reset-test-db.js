// 📁 backend/scripts/reset-test-db.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import 'dotenv/config';

let mongoServer;

/**
 * Reset test database for testing
 */
async function resetTestDatabase() {
  try {
    console.log('🧹 Resetting test database...');

    // Close existing connections
    if (mongoose.connection.readyState > 0) {
      await mongoose.connection.close();
    }

    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    console.log('🚀 Starting in-memory MongoDB server...');

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to test database');

    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    console.log('🧽 Cleared all collections');

    // Close connection
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test database reset complete');

  } catch (error) {
    console.error('❌ Error resetting test database:', error);
    process.exit(1);
  }
}

// Alternative: Reset production/development DB (use with caution)
async function resetProductionDatabase() {
  try {
    console.log('⚠️  Resetting production database...');

    // Use production/development DB URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to production database');

    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    console.log('🧽 Cleared all collections from production database');

    await mongoose.connection.close();

    console.log('✅ Production database reset complete');

  } catch (error) {
    console.error('❌ Error resetting production database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'production') {
    resetProductionDatabase();
  } else {
    resetTestDatabase();
  }
}

export { resetTestDatabase, resetProductionDatabase };
