import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Create admin user
const createAdminUser = async () => {
  try {
    await connectDB();

    const adminUser = {
      name: 'Ahsan M',
      email: 'ahsanmohammed828@gmail.com',
      password: 'Admin123.',
      phone: '0725068682',
      role: 'admin',
      isVerified: true,
    };

    // Check if user already exists
    let user = await User.findOne({ email: adminUser.email });
    
    if (user) {
      console.log('User already exists. Updating to admin role...');
      user.role = 'admin';
      user.isVerified = true;
      user.password = await bcrypt.hash(adminUser.password, 10);
      await user.save();
      console.log('Admin user updated successfully');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash(adminUser.password, salt);
      
      // Create user
      user = new User(adminUser);
      await user.save();
      console.log('Admin user created successfully');
    }
    
    console.log('Admin user details:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

// Run the script
createAdminUser();
