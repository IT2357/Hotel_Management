// 📁 backend/scripts/seedAdminPermissions.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminProfile from '../models/profiles/AdminProfile.js';
import { User } from '../models/User.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management';

// All available modules and actions
const ALL_PERMISSIONS = [
  {
    module: "invitations",
    actions: ["create", "read", "update", "delete", "approve", "reject", "export", "manage"],
  },
  {
    module: "notification",
    actions: ["create", "read", "update", "delete", "export", "manage"],
  },
  {
    module: "users",
    actions: ["create", "read", "update", "delete", "approve", "reject", "export", "manage"],
  },
  {
    module: "rooms",
    actions: ["create", "read", "update", "delete", "manage"],
  },
  {
    module: "bookings",
    actions: ["create", "read", "update", "delete", "approve", "reject", "export", "manage"],
  },
  {
    module: "inventory",
    actions: ["create", "read", "update", "delete", "manage"],
  },
  {
    module: "staff",
    actions: ["create", "read", "update", "delete", "manage"],
  },
  {
    module: "finance",
    actions: ["create", "read", "update", "delete", "approve", "reject", "export", "manage"],
  },
  {
    module: "reports",
    actions: ["create", "read", "update", "delete", "export", "manage"],
  },
  {
    module: "system",
    actions: ["create", "read", "update", "delete", "manage"],
  },
];

async function seedAdminPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users`);

    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating a default admin user...');

      // Create default admin if none exists
      const defaultAdmin = new User({
        name: 'System Administrator',
        email: 'admin@hotel.com',
        password: 'admin123',
        phone: '+94 11 123 4567',
        role: 'admin',
        isApproved: true,
        approvedAt: new Date(),
        tokenVersion: 0,
        authProviders: []
      });

      await defaultAdmin.save();
      adminUsers.push(defaultAdmin);
      console.log('✅ Default admin user created');
    }

    // Update permissions for each admin
    for (const adminUser of adminUsers) {
      console.log(`\n🔄 Updating permissions for admin: ${adminUser.email}`);

      // Find or create admin profile
      let adminProfile = await AdminProfile.findOne({ userId: adminUser._id });

      if (!adminProfile) {
        console.log('  📝 Creating new admin profile...');
        adminProfile = new AdminProfile({
          userId: adminUser._id,
          permissions: ALL_PERMISSIONS,
          accessLevel: 'Full'
        });
      } else {
        console.log('  📝 Updating existing admin profile...');
        adminProfile.permissions = ALL_PERMISSIONS;
        adminProfile.accessLevel = 'Full';
      }

      await adminProfile.save();
      console.log(`  ✅ Admin ${adminUser.email} now has full permissions`);
    }

    console.log('\n🎉 All admin users have been granted full permissions!');
    console.log('\n📋 Granted Permissions:');
    ALL_PERMISSIONS.forEach(perm => {
      console.log(`  • ${perm.module}: ${perm.actions.join(', ')}`);
    });

    console.log('\n🚀 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding admin permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding script
seedAdminPermissions();
