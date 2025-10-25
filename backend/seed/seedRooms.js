import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/database.js';
import Room from '../models/Room.js';
import { pick, randomInt } from './utils.js';

// Working image URLs from free stock image sites
const getWorkingImageUrl = (category, width = 800, height = 600) => {
  const imageUrls = {
    'hotel_room': [
      `https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/6585757/pexels-photo-6585757.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/6580370/pexels-photo-6580370.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`
    ],
    'bathroom': [
      `https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`
    ],
    'suite': [
      `https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1648771/pexels-photo-1648771.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/2725675/pexels-photo-2725675.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`
    ],
    'balcony': [
      `https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`,
      `https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`
    ]
  };
  
  const categoryImages = imageUrls[category] || imageUrls['hotel_room'];
  return pick(categoryImages);
};

export const seedRooms = async (count = 30) => {
  await connectDB();
  await Room.deleteMany({});
  
  // Arrays must match exactly with the Room model enum values
  const types = ["Standard","Deluxe","Suite","Executive","Presidential","Family","Accessible","Connecting"];
  const bedTypes = ["Single","Double","Queen","King","Twin","Bunk"];
  const views = ["City","Garden","Pool","Ocean","Mountain","None"];
  const statuses = ["Available","Booked","Maintenance","Cleaning","OutOfService"];
  const cancellationPolicies = ["Flexible","Moderate","Strict","NonRefundable"];
  const ratings = ["Excellent","Good","Average","Poor"];
  
  // Valid amenities exactly matching the Room model enum
  const validAmenities = [
    "WiFi","TV","AC","Minibar","Safe","Hairdryer","CoffeeMaker","Iron",
    "Desk","Balcony","PoolView","OceanView","RoomService","DailyCleaning",
    "Bathrobes","Slippers","Jacuzzi","Private Pool"
  ];

  const docs = [];
  for (let i = 0; i < count; i++) {
    const type = pick(types);
    const bedType = pick(bedTypes);
    const view = pick(views);
    const floor = randomInt(1, 15); // Valid floor range (min: -2, max: 100 but realistic 1-15)
    const basePrice = randomInt(5000, 50000); // Realistic price range for Sri Lanka
    const roomNumber = `${String.fromCharCode(65 + (i % 6))}${randomInt(100, 999)}`; // Format: A100, B234, etc. (no dash for validation)
    
    // Generate proper working image URLs
    const primaryImageCategory = type.toLowerCase().includes('suite') ? 'suite' : 'hotel_room';
    const images = [
      { 
        url: getWorkingImageUrl(primaryImageCategory), 
        isPrimary: true, 
        caption: `${type} Room - Main View` 
      },
      { 
        url: getWorkingImageUrl('bathroom'), 
        isPrimary: false, 
        caption: 'Private Bathroom' 
      }
    ];
    
    // Add balcony image if room has balcony amenity
    const selectedAmenities = Array.from(new Set(
      Array.from({ length: randomInt(3, 8) }, () => pick(validAmenities))
    ));
    
    if (selectedAmenities.includes('Balcony')) {
      images.push({
        url: getWorkingImageUrl('balcony'),
        isPrimary: false,
        caption: 'Private Balcony'
      });
    }

    const startDate1 = new Date();
    const endDate1 = new Date(Date.now() + 30 * 86400000); // 30 days from now
    const startDate2 = new Date(Date.now() + 31 * 86400000); // 31 days from now  
    const endDate2 = new Date(Date.now() + 60 * 86400000); // 60 days from now

    const seasonalStartDate = new Date(Date.now() + 90 * 86400000);
    const seasonalEndDate = new Date(Date.now() + 120 * 86400000);
    const offSeasonStartDate = new Date(Date.now() + 150 * 86400000);
    const offSeasonEndDate = new Date(Date.now() + 180 * 86400000);

    docs.push({
      title: `${type} Room ${roomNumber}`,
      description: `Luxurious ${type.toLowerCase()} room featuring ${bedType.toLowerCase()} bed accommodation with stunning ${view.toLowerCase()} view. Located on floor ${floor} of our premium hotel in Sri Lanka. This elegantly designed room offers modern amenities and comfortable furnishings for an unforgettable stay.`,
      images,
      roomNumber,
      status: pick(statuses),
      occupancy: { 
        adults: randomInt(1, type === 'Family' ? 6 : 4), 
        children: randomInt(0, type === 'Family' ? 4 : 2) 
      },
      availability: [
        { 
          startDate: startDate1, 
          endDate: endDate1, 
          isAvailable: true 
        },
        { 
          startDate: startDate2, 
          endDate: endDate2, 
          isAvailable: randomInt(0, 1) === 1 
        }
      ],
      amenities: selectedAmenities,
      size: randomInt(25, type === 'Presidential' ? 150 : type === 'Suite' ? 80 : 45), // Realistic room sizes
      type,
      bedType,
      view,
      floor,
      basePrice,
      seasonalPricing: [
        { 
          name: 'Peak Season', 
          startDate: seasonalStartDate, 
          endDate: seasonalEndDate, 
          price: Math.round(basePrice * 1.4), 
          isActive: true 
        },
        { 
          name: 'Off Peak', 
          startDate: offSeasonStartDate, 
          endDate: offSeasonEndDate, 
          price: Math.round(basePrice * 0.7), 
          isActive: true 
        }
      ],
      cancellationPolicy: pick(cancellationPolicies),
      discounts: [
        { 
          name: 'Early Bird Special', 
          description: '10% off for bookings made 30 days in advance',
          discountType: 'Percentage', 
          value: 10,
          isActive: true
        },
      ],
      packages: [
        { 
          name: type === 'Presidential' ? 'VIP Experience' : type.includes('Suite') ? 'Luxury Package' : 'Romance Package', 
          price: randomInt(8000, 25000), 
          description: type === 'Presidential' 
            ? 'Exclusive VIP treatment with personal butler, luxury amenities and premium dining' 
            : type.includes('Suite') 
            ? 'Premium luxury package with spa services, fine dining and exclusive amenities'
            : 'Romantic getaway package with room decoration, champagne and candlelight dinner', 
          inclusions: type === 'Presidential' 
            ? ['Personal Butler', 'Luxury Amenities', 'Premium Dining', 'Airport Transfer']
            : type.includes('Suite')
            ? ['Spa Services', 'Fine Dining', 'Premium Amenities', 'Late Checkout']
            : ['Room Decoration', 'Champagne', 'Candlelight Dinner', 'Late Checkout'], 
          isActive: true 
        }
      ],
      rating: pick(ratings),
      reviewSummary: { 
        averageRating: randomInt(35, 50) / 10, // 3.5 to 5.0
        cleanliness: randomInt(35, 50) / 10, 
        comfort: randomInt(35, 50) / 10, 
        location: randomInt(35, 50) / 10, 
        amenities: randomInt(35, 50) / 10, 
        service: randomInt(35, 50) / 10, 
        totalReviews: randomInt(5, 250) 
      },
      metadata: { 
        lastBooked: new Date(Date.now() - randomInt(1, 30) * 86400000), // Random date in last 30 days
        lastCleaned: new Date(Date.now() - randomInt(0, 2) * 86400000), // Last 2 days
        views: randomInt(50, 5000), 
        bookingsCount: randomInt(10, 150), 
        averageStayDuration: randomInt(1, 7) 
      }
    });
  }
  
  const created = await Room.insertMany(docs);
  return created;
};

if (process.argv[1] && process.argv[1].endsWith('seedRooms.js')) {
  seedRooms().then(() => { console.log('✅ Rooms seeded'); mongoose.connection.close(); }).catch(e => { console.error(e); mongoose.connection.close(); process.exit(1); });
}
