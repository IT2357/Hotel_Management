import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { sriFoods, pick, randomInt, imageFor } from './utils.js';

export const seedMenuItems = async (count = 30) => {
  await connectDB();
  await MenuItem.deleteMany({});
  const categories = await Category.find({}).lean();
  if (categories.length === 0) throw new Error('No categories found. Seed categories first.');

  const docs = [];
  for (let i = 0; i < count; i++) {
    const base = pick(sriFoods);
    const category = pick(categories);
    const name = `${base.name} ${i+1}`;
    docs.push({
      name,
      name_tamil: base.tamil,
      name_english: base.name,
      description: `Authentic ${base.name} from ${pick(['Colombo','Jaffna','Kandy','Galle'])}`,
      description_tamil: `${base.tamil} ஸ்பெஷல்` ,
      description_english: `Sri Lankan ${base.name}`,
      price: randomInt(500, 4500),
      currency: 'LKR',
      category: category._id,
      image: imageFor('sri lanka food', 600, 400),
      isAvailable: true,
      isVeg: pick([true,false]),
      isSpicy: pick([true,false]),
      isPopular: pick([true,false]),
      isBreakfast: pick([true,false]),
      isLunch: pick([true,false]),
      isDinner: pick([true,false]),
      isSnacks: pick([true,false]),
      ingredients: ['Onion','Chili','Curry Leaves','Coconut'],
      nutritionalInfo: { calories: randomInt(200, 900) },
      cookingTime: randomInt(10, 35),
      dietaryTags: pick([['vegan'],['vegetarian'],['halal'],['gluten-free'],[]]),
      culturalOrigin: pick(['jaffna','colombo','kandy','galle']),
      allergens: pick([['nuts'],['milk'],['seafood'],[]]),
      aiConfidence: randomInt(60, 100),
    });
  }
  const created = await MenuItem.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedMenuItems.js')) {
  seedMenuItems().then(() => { console.log('✅ MenuItems seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
