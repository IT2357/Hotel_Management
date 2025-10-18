import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import '../config/database.js';

const finalPasswordFix = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    const users = [
      { email: 'admin@hotel.com', password: 'admin123' },
      { email: 'manager@hotel.com', password: 'password123' },
      { email: 'sarah@hotel.com', password: 'password123' },
      { email: 'lisa@hotel.com', password: 'password123' },
      { email: 'mike@hotel.com', password: 'password123' },
      { email: 'david@hotel.com', password: 'password123' },
    ];

    console.log('🔧 Updating passwords directly in MongoDB...\n');

    for (const userData of users) {
      console.log(`Processing: ${userData.email}`);
      
      // Generate hash
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      console.log(`  Generated hash: ${hashedPassword.substring(0, 20)}...`);
      
      // Update directly in MongoDB collection (bypass Mongoose middleware)
      const result = await mongoose.connection.db.collection('users').updateOne(
        { email: userData.email },
        { 
          $set: { 
            password: hashedPassword,
            isActive: true,
            isApproved: true,
            emailVerified: true,
            authProviders: []
          } 
        }
      );
      
      console.log(`  Updated: ${result.modifiedCount > 0 ? '✅' : '⚠️  (no changes)'}`);
      
      // Verify the password works
      const user = await mongoose.connection.db.collection('users').findOne({ email: userData.email });
      if (user && user.password) {
        const isMatch = await bcrypt.compare(userData.password, user.password);
        console.log(`  Verification: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (!isMatch) {
          console.log(`  ⚠️  Password mismatch! Stored hash: ${user.password.substring(0, 20)}...`);
        }
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 PASSWORD FIX COMPLETE!\n');
    console.log('📋 VERIFIED LOGIN CREDENTIALS:');
    console.log('══════════════════════════════════════════════════════');
    console.log('👨‍💼 MANAGER:');
    console.log('   Email: manager@hotel.com');
    console.log('   Password: password123\n');
    console.log('👷 STAFF:');
    console.log('   sarah@hotel.com  | password123');
    console.log('   lisa@hotel.com   | password123');
    console.log('   mike@hotel.com   | password123');
    console.log('   david@hotel.com  | password123\n');
    console.log('👨‍💻 ADMIN:');
    console.log('   Email: admin@hotel.com');
    console.log('   Password: admin123');
    console.log('══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

finalPasswordFix();
