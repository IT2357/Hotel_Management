import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Category from '../models/Category.js';

export const seedCategories = async (count = 30) => {
  await connectDB();
  await Category.deleteMany({});
  const base = [
    'Breakfast','Lunch','Dinner','Snacks','Beverage','Dessert','Sri Lankan','Jaffna Specials','Seafood','Vegetarian','Vegan','Spicy','Mild','Kids','BBQ','Rice & Curry','Hoppers','Street Food','Tea & Coffee','Bakery','Grill','Kottu','Rotti','Noodles','Soups','Salads','Juices','Shakes','Ice Cream','Cakes'
  ];
  const docs = base.slice(0, count).map((name, i) => ({
    name,
    description: `${name} items and specials in Sri Lanka`,
    color: `#${(Math.floor(Math.random()*0xffffff)).toString(16).padStart(6,'0')}`,
    icon: '🍽️',
    sortOrder: i,
    isActive: true,
  }));
  const created = await Category.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedCategories.js')) {
  seedCategories().then(() => { console.log('✅ Categories seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
