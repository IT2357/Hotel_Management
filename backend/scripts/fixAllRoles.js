import mongoose from 'mongoose';
import { User, Staff, Manager, Admin } from '../models/User.js';
import bcrypt from 'bcryptjs';
import '../config/database.js';

const fixAllRoles = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB\n');

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Fix staff users - delete and recreate with Staff discriminator
    const staffEmails = ['sarah@hotel.com', 'lisa@hotel.com', 'mike@hotel.com', 'david@hotel.com'];
    const staffData = [
      { name: 'Sarah Johnson', email: 'sarah@hotel.com', department: 'Front Office', position: 'Front Desk Supervisor' },
      { name: 'Lisa Wilson', email: 'lisa@hotel.com', department: 'Housekeeping', position: 'Housekeeping Supervisor' },
      { name: 'Mike Anderson', email: 'mike@hotel.com', department: 'Maintenance', position: 'Maintenance Manager' },
      { name: 'David Brown', email: 'david@hotel.com', department: 'Food & Beverage', position: 'Restaurant Manager' },
    ];

    // Delete existing users
    await User.deleteMany({ email: { $in: staffEmails } });
    console.log('🗑️  Deleted existing staff users\n');

    // Create new staff users using Staff discriminator
    for (const data of staffData) {
      const staff = new Staff({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'staff',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        authProviders: [],
        department: data.department,
        position: data.position
      });
      await staff.save();
      console.log(`✅ Created staff: ${data.email} (${data.department})`);
    }

    // Fix manager - delete and recreate with Manager discriminator
    await User.deleteOne({ email: 'manager@hotel.com' });
    const manager = new Manager({
      name: 'John Manager',
      email: 'manager@hotel.com',
      password: hashedPassword,
      role: 'manager',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      authProviders: []
    });
    await manager.save();
    console.log('\n✅ Created manager: manager@hotel.com');

    // Verify admin
    let admin = await User.findOne({ email: 'admin@hotel.com' });
    if (!admin) {
      const adminPassword = await bcrypt.hash('admin123', 12);
      admin = new Admin({
        name: 'Admin User',
        email: 'admin@hotel.com',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        isApproved: true,
        emailVerified: true,
        authProviders: []
      });
      await admin.save();
      console.log('✅ Created admin: admin@hotel.com');
    } else {
      console.log('✅ Admin exists: admin@hotel.com');
    }

    // Verify all roles
    console.log('\n\n📋 VERIFICATION:');
    console.log('═══════════════════════════════════════════════════════');
    
    const allUsers = await User.find({
      email: { $in: [...staffEmails, 'manager@hotel.com', 'admin@hotel.com'] }
    }).select('+password');

    for (const user of allUsers) {
      console.log(`\n${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: "${user.role}" ✓`);
      console.log(`   Type: ${user.constructor.modelName}`);
      console.log(`   Password: ${user.password ? '✓' : '✗'}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n🎉 ALL ROLES FIXED!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('══════════════════════════════════════════════════════');
    console.log('👨‍💼 MANAGER:');
    console.log('   Email: manager@hotel.com');
    console.log('   Password: password123');
    console.log('   Dashboard: /manager/dashboard');
    console.log('\n👷 STAFF (all use password123):');
    console.log('   sarah@hotel.com - Front Office');
    console.log('   lisa@hotel.com  - Housekeeping');
    console.log('   mike@hotel.com  - Maintenance');
    console.log('   david@hotel.com - Food & Beverage');
    console.log('   Dashboard: /staff/dashboard');
    console.log('\n👨‍💻 ADMIN:');
    console.log('   Email: admin@hotel.com');
    console.log('   Password: admin123');
    console.log('   Dashboard: /admin/dashboard');
    console.log('══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAllRoles();
