// Credentials to test:
// Admin: admin.lk@example.com / Admin!123
// Manager: manager.colombo@example.com / Manager!123
// Staff: random @example.lk with password Staff!123
// Guests: random @example.lk with password Guest!123


import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';

import { seedUsers } from './seedUsers.js';
import { seedRooms } from './seedRooms.js';
import { seedCategories } from './seedCategories.js';
import { seedMenuItems } from './seedMenuItems.js';
import { seedMenus } from './seedMenus.js';
import { seedFoods } from './seedFoods.js';
import { seedFoodOrders } from './seedFoodOrders.js';
import { seedFoodReviews } from './seedFoodReviews.js';
import { seedFoodTaskQueue } from './seedFoodTaskQueue.js';
import { seedBookings } from './seedBookings.js';
import { seedInvoices } from './seedInvoices.js';
import { seedRefunds } from './seedRefunds.js';
import { seedInvitations } from './seedInvitations.js';

const run = async () => {
  await connectDB();

  // Seed order: users (no clean), then independent refs, then dependents
  const users = await seedUsers();
  console.log(`Users ensured: admins=${users.admins.length}, managers=${users.managers.length}, staff=${users.staff.length}, guests=${users.guests.length}`);

  const rooms = await seedRooms(30);
  console.log(`Rooms: ${rooms.length}`);

  const categories = await seedCategories(30);
  console.log(`Categories: ${categories.length}`);

  const menuItems = await seedMenuItems(30);
  console.log(`MenuItems: ${menuItems.length}`);

  const menus = await seedMenus(30);
  console.log(`Menus: ${menus.length}`);

  const foods = await seedFoods(30);
  console.log(`Foods: ${foods.length}`);

  const foodOrders = await seedFoodOrders(30);
  console.log(`FoodOrders: ${foodOrders.length}`);

  const foodReviews = await seedFoodReviews(30);
  console.log(`FoodReviews: ${foodReviews.length}`);

  const bookings = await seedBookings(30);
  console.log(`Bookings: ${bookings.length}`);

  const invoices = await seedInvoices(30);
  console.log(`Invoices: ${invoices.length}`);

  const refunds = await seedRefunds(30);
  console.log(`RefundRequests: ${refunds.length}`);

  const tasks = await seedFoodTaskQueue(30);
  console.log(`FoodTaskQueue: ${tasks.length}`);

  const invitations = await seedInvitations(30);
  console.log(`Invitations: ${invitations.length}`);

  await mongoose.connection.close();
  console.log('✅ Seeding done.');
};

run().catch(err => { console.error('Seed error', err); mongoose.connection.close(); process.exit(1); });
