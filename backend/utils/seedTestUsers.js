import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import GuestProfile from '../models/profiles/GuestProfile.js';
import StaffProfile from '../models/profiles/StaffProfile.js';
import ManagerProfile from '../models/profiles/ManagerProfile.js';
import AdminProfile from '../models/profiles/AdminProfile.js';

const seedTestUsers = async () => {
  console.log('🌱 Seeding test users...');

  const testUsers = [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true,
      emailVerified: true,
      isActive: true
    },
    {
      name: 'Guest User',
      email: 'guest@test.com',
      password: 'guest123',
      role: 'guest',
      isApproved: true,
      emailVerified: true,
      isActive: true
    },
    {
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'manager123',
      role: 'manager',
      isApproved: true,
      emailVerified: true,
      isActive: true
    },
    {
      name: 'Staff User',
      email: 'staff@test.com',
      password: 'staff123',
      role: 'staff',
      isApproved: true,
      emailVerified: true,
      isActive: true
    }
  ];

  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        approvedBy: userData.role === 'admin' ? null : await getAdminUserId(),
        approvedAt: userData.isApproved ? new Date() : null,
        tokenVersion: 0
      });

      // Create role-specific profile
      await createRoleProfile(user._id, userData.role);

      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('🎉 All test users seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
  }
};

const getAdminUserId = async () => {
  const adminUser = await User.findOne({ role: 'admin' });
  return adminUser ? adminUser._id : null;
};

const createRoleProfile = async (userId, role) => {
  try {
    switch (role) {
      case 'guest':
        await GuestProfile.create({
          userId,
          preferences: { preferredLanguage: 'en' }
        });
        break;
      case 'staff':
        await StaffProfile.create({
          userId,
          isActive: true,
          department: 'Service',
          position: 'Staff Member'
        });
        break;
      case 'manager':
        await ManagerProfile.create({
          userId,
          isActive: true,
          department: 'Management',
          position: 'Manager'
        });
        break;
      case 'admin':
        await AdminProfile.create({
          userId,
          isActive: true,
          permissions: ['all']
        });
        break;
    }
  } catch (error) {
    console.error(`Error creating profile for ${role}:`, error);
  }
};

export default seedTestUsers;
