import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Food from '../models/Food.js';
import { sriFoods, pick, randomInt, imageFor } from './utils.js';

export const seedFoods = async (count = 30) => {
  await connectDB();
  await Food.deleteMany({});
  const categories = ["Breakfast","Lunch","Dinner","Snacks","Beverage","Dessert"];
  const docs = [];
  for (let i = 0; i < count; i++) {
    const base = pick(sriFoods);
    docs.push({
      name: `${base.name} Classic ${i+1}`,
      category: pick(categories),
      description: `Authentic ${base.name} in Sri Lanka`,
      imageUrl: imageFor('sri lanka food'),
      price: randomInt(300, 5000),
      currency: 'LKR',
      preparationTimeMinutes: randomInt(5, 30),
      ingredients: ['Coconut','Onion','Chili'],
      allergens: pick([['nuts'],['milk'],['seafood'],[]]),
      dietaryTags: pick([['vegan'],['vegetarian'],['halal'],[]]),
      seasonal: pick([true,false]),
      isAvailable: true,
    });
  }
  const created = await Food.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedFoods.js')) {
  seedFoods().then(() => { console.log('✅ Foods seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
