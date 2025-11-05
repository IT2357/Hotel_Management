import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Menu from '../models/Menu.js';

export const seedMenus = async (count = 30) => {
  await connectDB();
  await Menu.deleteMany({});
  const docs = [];
  for (let i = 0; i < count; i++) {
    const categories = [
      { name: 'Sri Lankan', items: [ { name: 'Rice & Curry', price: 1200, description: 'Rice with curries' }, { name: 'Kottu', price: 1500 } ] },
      { name: 'Beverage', items: [ { name: 'Milk Tea', price: 300 }, { name: 'Faluda', price: 800 } ] },
    ];
    docs.push({
      source: { type: 'image', value: 'https://example.com/menu.jpg' },
      categories,
      rawText: 'Sample OCR text',
      title: 'Extracted Menu',
      extractionMethod: 'tesseract',
      processingStatus: 'completed',
      confidence: 85,
    });
  }
  const created = await Menu.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedMenus.js')) {
  seedMenus().then(() => { console.log('✅ Menus seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
