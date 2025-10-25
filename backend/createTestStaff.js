import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { User } from './models/User.js';

const createTestStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const testStaff = [
      {
        name: 'John Smith',
        email: 'john.staff@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Housekeeping',
        position: 'Room Attendant',
        isActive: true,
        emailVerified: true,
        isApproved: true,
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.staff@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Kitchen',
        position: 'Chef',
        isActive: true,
        emailVerified: true,
        isApproved: true,
      },
      {
        name: 'Mike Williams',
        email: 'mike.staff@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Maintenance',
        position: 'Technician',
        isActive: true,
        emailVerified: true,
        isApproved: true,
      },
      {
        name: 'Emily Brown',
        email: 'emily.staff@hotel.com',
        password: hashedPassword,
        role: 'staff',
        department: 'Service',
        position: 'Front Desk Agent',
        isActive: true,
        emailVerified: true,
        isApproved: true,
      },
    ];

    console.log('\n🔨 Creating test staff members...\n');

    for (const staffData of testStaff) {
      // Check if already exists
      const existing = await User.findOne({ email: staffData.email });
      if (existing) {
        console.log(`⏭️  Skipped: ${staffData.name} (${staffData.email}) - already exists`);
      } else {
        await User.create(staffData);
        console.log(`✅ Created: ${staffData.name} - ${staffData.department}`);
      }
    }

    console.log('\n✅ Done! Test staff members created.');
    console.log('\n📝 Login credentials for all:');
    console.log('   Password: password123');
    console.log('\n🔄 Refresh the messaging page to see them!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestStaff();
