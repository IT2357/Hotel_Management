import mongoose from 'mongoose';
import MenuItem from './models/MenuItem.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixSlugData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');

    // Find all items with null or undefined slugs
    const itemsWithNullSlug = await MenuItem.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });
    console.log(`📊 Found ${itemsWithNullSlug.length} items with null/undefined slugs`);

    if (itemsWithNullSlug.length === 0) {
      console.log('✅ No items need slug fixes');
      await mongoose.connection.close();
      return;
    }

    // Update each item to trigger the pre-save middleware
    let updatedCount = 0;
    for (const item of itemsWithNullSlug) {
      try {
        // Save the item to trigger the pre-save middleware
        await item.save();
        updatedCount++;
        console.log(`✅ Updated slug for: "${item.name}" -> "${item.slug}"`);
      } catch (error) {
        console.error(`❌ Error updating item "${item.name}":`, error.message);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount}/${itemsWithNullSlug.length} items`);

    await mongoose.connection.close();
    console.log('✅ Slug fix completed!');

  } catch (error) {
    console.error('❌ Error fixing slug data:', error.message);
    process.exit(1);
  }
};

// Run the fix
fixSlugData();