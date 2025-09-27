import mongoose from 'mongoose';
import MenuItem from './models/MenuItem.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testSlugGeneration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing slug generation logic...');

    // Test data
    const testItems = [
      {
        name: 'Test Item 1',
        description: 'First test item',
        price: 10.99,
        category: 'Test Category',
        isAvailable: true,
        isVeg: true,
        isSpicy: false,
        ingredients: ['test ingredient 1'],
        cookingTime: 15
      },
      {
        name: 'Test Item 2',
        description: 'Second test item',
        price: 12.99,
        category: 'Test Category',
        isAvailable: true,
        isVeg: false,
        isSpicy: true,
        ingredients: ['test ingredient 2'],
        cookingTime: 20
      }
    ];

    // Test slug generation logic (same as in controller)
    const itemsWithSlugs = testItems.map(item => {
      if (!item.slug) {
        // Generate slug from name
        item.slug = item.name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .trim()
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

        // If slug is empty after cleaning, generate a fallback
        if (!item.slug) {
          item.slug = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      }
      return item;
    });

    console.log('✅ Slug generation successful!');
    console.log('📊 Generated slugs:');

    itemsWithSlugs.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} -> "${item.slug}"`);
    });

    // Test actual database insertion with generated slugs
    console.log('🧪 Testing database insertion with slugs...');
    const savedItems = await MenuItem.insertMany(itemsWithSlugs);

    console.log('✅ Database insertion successful!');
    console.log(`📊 Created ${savedItems.length} items in database:`);

    savedItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (slug: ${item.slug})`);
    });

    // Clean up test data
    await MenuItem.deleteMany({ category: 'Test Category' });
    console.log('🧹 Cleaned up test data');

    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.writeErrors) {
      console.error('Write errors:', error.writeErrors);
    }
    process.exit(1);
  }
};

// Run the test
testSlugGeneration();