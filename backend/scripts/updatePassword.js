import mongoose from 'mongoose';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

const updatePassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');

    console.log('🔄 Updating password...');

    // Find the user
    const user = await User.findOne({ email: 'guestahsanmohammed@valdor.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password updated for user: guestahsanmohammed@valdor.com');

  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePassword();
}

export default updatePassword;