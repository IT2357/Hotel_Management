import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Room from '../models/Room.js';
import { imageFor, pick, randomInt } from './utils.js';

export const seedRooms = async (count = 30) => {
  await connectDB();
  await Room.deleteMany({});
  const types = ["Standard","Deluxe","Suite","Executive","Presidential","Family","Accessible","Connecting"];
  const bedTypes = ["Single","Double","Queen","King","Twin","Bunk"];
  const views = ["City","Garden","Pool","Ocean","Mountain","None"];
  const amenities = ["WiFi","TV","AC","Minibar","Safe","Hairdryer","CoffeeMaker","Iron","Desk","Balcony","PoolView","OceanView","RoomService","DailyCleaning","Bathrobes","Slippers","Jacuzzi","Private Pool"];

  const docs = [];
  for (let i = 0; i < count; i++) {
    const type = pick(types);
    const bedType = pick(bedTypes);
    const floor = randomInt(0, 10);
    const basePrice = randomInt(8000, 45000);
    const roomNumber = `${String.fromCharCode(65 + (i % 6))}-${randomInt(100, 999)}`;
    docs.push({
      title: `${type} Room ${roomNumber}`,
      description: `${type} room with ${bedType} bed and ${pick(views)} view in Sri Lanka`,
      images: [
        { url: imageFor('hotel room'), isPrimary: true, caption: `${type} primary` },
        { url: imageFor('bathroom'), isPrimary: false, caption: 'Bathroom' }
      ],
      roomNumber,
      status: pick(["Available","Booked","Maintenance","Cleaning","OutOfService"]),
      occupancy: { adults: randomInt(1, 4), children: randomInt(0, 2) },
      availability: [
        { startDate: new Date(), endDate: new Date(Date.now() + 15*86400000), isAvailable: true },
        { startDate: new Date(Date.now() + 16*86400000), endDate: new Date(Date.now() + 30*86400000), isAvailable: true }
      ],
      amenities: Array.from(new Set(Array.from({ length: randomInt(5, 10)}, () => pick(amenities)))),
      size: randomInt(18, 120),
      type,
      bedType,
      view: pick(views),
      floor,
      basePrice,
      seasonalPricing: [
        { name: 'Peak', startDate: new Date(Date.now()+60*86400000), endDate: new Date(Date.now()+120*86400000), price: Math.round(basePrice*1.3), isActive: true },
        { name: 'Off-peak', startDate: new Date(Date.now()+150*86400000), endDate: new Date(Date.now()+180*86400000), price: Math.round(basePrice*0.8), isActive: true }
      ],
      cancellationPolicy: pick(["Flexible","Moderate","Strict","NonRefundable"]),
      discounts: [
        { name: 'Early Bird', discountType: 'Percentage', value: 10 },
      ],
      packages: [
        { name: 'Honeymoon', price: 15000, description: 'Decor, cake, candlelight dinner', inclusions: ['Decor','Cake','Dinner'], isActive: true }
      ],
      rating: pick(["Excellent","Good","Average","Poor"]),
      reviewSummary: { averageRating: randomInt(3,5), cleanliness: randomInt(3,5), comfort: randomInt(3,5), location: randomInt(3,5), amenities: randomInt(3,5), service: randomInt(3,5), totalReviews: randomInt(0,200) },
      metadata: { lastBooked: new Date(), lastCleaned: new Date(), views: randomInt(0, 5000), bookingsCount: randomInt(0, 100), averageStayDuration: randomInt(1,7) }
    });
  }
  const created = await Room.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedRooms.js')) {
  seedRooms().then(() => { console.log('✅ Rooms seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
