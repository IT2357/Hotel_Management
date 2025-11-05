import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Food from '../models/Food.js';
import FoodReview from '../models/FoodReview.js';
import { User } from '../models/User.js';
import { pick, randomInt } from './utils.js';

export const seedFoodReviews = async (count = 30) => {
  await connectDB();
  await FoodReview.deleteMany({});
  const foods = await Food.find({}).lean();
  const users = await User.find({ role: 'guest' }).lean();
  if (foods.length === 0) throw new Error('Seed Foods first');

  const sentiments = ["Positive","Neutral","Negative"];
  const docs = [];
  for (let i = 0; i < count; i++) {
    const f = pick(foods);
    const u = pick(users);
    docs.push({
      foodId: f._id,
      userId: u?._id,
      rating: randomInt(1,5),
      comment: pick(['Very tasty','Average','Too spicy','Authentic taste','Loved it','Okay']),
      sentimentLabel: pick(sentiments),
      isVisible: true,
      flagged: false,
      images: [],
    });
  }
  const created = await FoodReview.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedFoodReviews.js')) {
  seedFoodReviews().then(() => { console.log('✅ FoodReviews seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
