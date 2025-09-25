import mongoose from 'mongoose';
import { User } from '../models/User.js';
import '../config/database.js';

const updateStaffData = async () => {
  try {
    console.log('🔄 Updating existing staff with department and position data...');

    // Staff mapping with departments and positions
    const staffUpdates = [
      { email: 'sarah@hotel.com', name: 'Sarah Johnson', department: 'Front Office', position: 'Front Desk Supervisor', shift: 'morning' },
      { email: 'emma@hotel.com', name: 'Emma Davis', department: 'Front Office', position: 'Front Desk Agent', shift: 'evening' },
      { email: 'lisa@hotel.com', name: 'Lisa Wilson', department: 'Housekeeping', position: 'Housekeeping Supervisor', shift: 'morning' },
      { email: 'maria@hotel.com', name: 'Maria Rodriguez', department: 'Housekeeping', position: 'Room Attendant', shift: 'morning' },
      { email: 'carlos@hotel.com', name: 'Carlos Martinez', department: 'Housekeeping', position: 'Room Attendant', shift: 'afternoon' },
      { email: 'mike@hotel.com', name: 'Mike Anderson', department: 'Maintenance', position: 'Maintenance Manager', shift: 'morning' },
      { email: 'robert@hotel.com', name: 'Robert Taylor', department: 'Maintenance', position: 'Technician', shift: 'afternoon' },
      { email: 'tom@hotel.com', name: 'Tom Jackson', department: 'Maintenance', position: 'Assistant Technician', shift: 'evening' },
      { email: 'david@hotel.com', name: 'David Brown', department: 'Food & Beverage', position: 'Restaurant Manager', shift: 'morning' },
      { email: 'julia@hotel.com', name: 'Julia White', department: 'Food & Beverage', position: 'Server', shift: 'afternoon' },
      { email: 'alex@hotel.com', name: 'Alex Green', department: 'Food & Beverage', position: 'Chef', shift: 'morning' },
      { email: 'sophie@hotel.com', name: 'Sophie Clark', department: 'Food & Beverage', position: 'Bartender', shift: 'evening' },
      { email: 'james@hotel.com', name: 'James Lewis', department: 'Security', position: 'Security Supervisor', shift: 'night' },
      { email: 'daniel@hotel.com', name: 'Daniel Miller', department: 'Security', position: 'Security Guard', shift: 'evening' },
      { email: 'nina@hotel.com', name: 'Nina Thompson', department: 'Spa & Wellness', position: 'Spa Manager', shift: 'morning' },
      { email: 'kevin@hotel.com', name: 'Kevin Adams', department: 'Spa & Wellness', position: 'Massage Therapist', shift: 'afternoon' }
    ];

    for (const staffData of staffUpdates) {
      await User.updateOne(
        { email: staffData.email },
        { 
          $set: { 
            name: staffData.name,
            department: staffData.department, 
            position: staffData.position, 
            shift: staffData.shift,
            status: 'active'
          } 
        }
      );
      console.log(`✅ Updated ${staffData.name} - ${staffData.department}`);
    }

    console.log('🎉 All staff data updated successfully!');
    
    // Verify the updates
    const staffCount = await User.countDocuments({ role: 'staff' });
    console.log(`📊 Total staff members: ${staffCount}`);

    const staffWithDepartments = await User.countDocuments({ 
      role: 'staff', 
      department: { $exists: true, $ne: null } 
    });
    console.log(`📊 Staff with department data: ${staffWithDepartments}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating staff data:', error);
    process.exit(1);
  }
};

updateStaffData();