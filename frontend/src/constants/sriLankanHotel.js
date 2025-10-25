// Hotel Management Constants
// For VALDOR Hotel - Luxury Accommodation & Fine Dining

export const HOTEL_BRANDING = {
  name: "VALDOR Hotel",
  tagline: "Luxury Accommodation & Fine Dining",
  description: "Experience the perfect blend of luxury hospitality and fine dining in beautiful Sri Lanka",
  location: {
    city: "Colombo",
    address: "Marine Drive, Colombo 03, Sri Lanka",
    coordinates: { lat: 6.9271, lng: 79.8612 },
  },
  contact: {
    phone: "+94 11 222 3456",
    email: "reservations@valdor.lk",
    website: "www.valdor.lk"
  }
};

export const SRI_LANKAN_CURRENCY = {
  code: 'LKR',
  symbol: 'Rs.',
  name: 'Sri Lankan Rupee',
  subunit: 'cents',
  format: {
    decimal: 2,
    thousand: ',',
    precision: 0, // No decimal places for rupees
    format: '%s %v' // Symbol then value
  }
};

export const PRICE_RANGES = {
  // Sri Lankan Rupee price ranges for hotel rooms
  budget: { min: 5000, max: 15000, label: 'Budget Rooms' },
  standard: { min: 15000, max: 30000, label: 'Standard Rooms' },
  deluxe: { min: 30000, max: 50000, label: 'Deluxe Rooms' },
  luxury: { min: 50000, max: 100000, label: 'Luxury Suites' },
  presidential: { min: 100000, max: 200000, label: 'Presidential Suites' }
};

export const ROOM_TYPES = {
  STANDARD: {
    name: 'Standard Room',
    description: 'Comfortable accommodation with modern amenities',
    basePrice: 18000,
    gradient: 'from-blue-500 to-indigo-500',
    backgroundGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200'
  },
  DELUXE: {
    name: 'Deluxe Room',
    description: 'Spacious rooms with enhanced amenities and elegant decor',
    basePrice: 35000,
    gradient: 'from-purple-500 to-pink-500',
    backgroundGradient: 'from-purple-50 to-pink-100',
    borderColor: 'border-purple-200'
  },
  SUITE: {
    name: 'Executive Suite',
    description: 'Premium suites with luxury amenities and sophisticated design',
    basePrice: 65000,
    gradient: 'from-red-500 to-orange-500',
    backgroundGradient: 'from-red-50 to-orange-100',
    borderColor: 'border-red-200'
  },
  PRESIDENTIAL: {
    name: 'Presidential Suite',
    description: 'Luxurious presidential suite with exclusive amenities and panoramic views',
    basePrice: 125000,
    gradient: 'from-yellow-500 to-amber-500',
    backgroundGradient: 'from-yellow-50 to-amber-100',
    borderColor: 'border-yellow-200'
  }
};

export const SRI_LANKAN_AMENITIES = [
  { 
    id: 'AC', 
    label: 'Air Conditioning', 
    icon: 'Snowflake',
    essential: true 
  },
  { 
    id: 'WiFi', 
    label: 'Free WiFi', 
    icon: 'Wifi',
    essential: true 
  },
  { 
    id: 'Parking', 
    label: 'Free Parking', 
    icon: 'Car',
    essential: true 
  },
  { 
    id: 'Restaurant', 
    label: 'Fine Dining Restaurant', 
    icon: 'Utensils',
    featured: true 
  },
  { 
    id: 'Spa', 
    label: 'Wellness Spa', 
    icon: 'Flower',
    premium: true 
  },
  { 
    id: 'Pool', 
    label: 'Swimming Pool', 
    icon: 'Waves',
    premium: true 
  },
  { 
    id: 'Balcony', 
    label: 'Private Balcony', 
    icon: 'Building',
    standard: true 
  },
  { 
    id: 'MiniBar', 
    label: 'Mini Bar', 
    icon: 'Coffee',
    premium: true 
  },
  { 
    id: 'RoomService', 
    label: '24/7 Room Service', 
    icon: 'Bell',
    standard: true 
  },
  { 
    id: 'CulturalTours', 
    label: 'City Cultural Tours', 
    icon: 'Map',
    unique: true 
  },
  { 
    id: 'FishingTrips', 
    label: 'Fishing Experience', 
    icon: 'Fish',
    unique: true 
  },
  { 
    id: 'TempleVisits', 
    label: 'Temple & Heritage Tours', 
    icon: 'Landmark',
    cultural: true 
  }
];

export const BED_TYPES = {
  SINGLE: { name: 'Single Bed', capacity: 1 },
  TWIN: { name: 'Twin Beds', capacity: 2 },
  DOUBLE: { name: 'Double Bed', capacity: 2 },
  QUEEN: { name: 'Queen Bed', capacity: 2 },
  KING: { name: 'King Bed', capacity: 2 }
};

export const VIEW_TYPES = {
  OCEAN: { 
    name: 'Ocean View', 
    description: 'Stunning views of the Indian Ocean'
  },
  CITY: { 
    name: 'City View', 
    description: 'Panoramic views of Colombo city and skyline'
  },
  GARDEN: { 
    name: 'Garden View', 
    description: 'Serene views of landscaped gardens'
  },
  POOL: { 
    name: 'Pool View', 
    description: 'Views of the resort swimming pool area'
  },
  COURTYARD: { 
    name: 'Courtyard View', 
    description: 'Private courtyard with tropical landscaping'
  }
};

export const MEAL_PLANS = {
  ROOM_ONLY: {
    name: 'Room Only',
    description: 'Accommodation only'
  },
  BREAKFAST: {
    name: 'Breakfast Included',
    description: 'Continental breakfast included'
  },
  HALF_BOARD: {
    name: 'Half Board',
    description: 'Breakfast and dinner included'
  },
  FULL_BOARD: {
    name: 'Full Board',
    description: 'All meals included'
  },
  ALL_INCLUSIVE: {
    name: 'All Inclusive',
    description: 'All meals, snacks, and beverages included'
  }
};

export const GUEST_REVIEWS_ENGLISH = [
  {
    name: 'Sarah Johnson',
    location: 'Colombo',
    rating: 5,
    review: 'Excellent service and beautiful rooms. The staff was very accommodating!',
    date: '2024-10-15'
  },
  {
    name: 'Michael Smith',
    location: 'Kandy',
    rating: 5,
    review: 'Beautiful hotel with modern amenities. The restaurant food was exceptional!',
    date: '2024-10-10'
  },
  {
    name: 'Emily Davis',
    location: 'Galle',
    rating: 4,
    review: 'Loved the ocean view and the spa facilities. Highly recommended!',
    date: '2024-10-05'
  }
];

export const SEASONAL_PRICING = {
  LOW_SEASON: {
    name: 'Low Season',
    months: ['May', 'June', 'September', 'October'],
    discount: 0.15, // 15% discount
    description: 'Off-peak season with special rates'
  },
  HIGH_SEASON: {
    name: 'High Season',
    months: ['December', 'January', 'February', 'March'],
    surcharge: 0.25, // 25% surcharge
    description: 'Peak tourist season'
  },
  FESTIVAL_SEASON: {
    name: 'Festival Season',
    events: ['New Year', 'Christmas', 'Easter'],
    surcharge: 0.35, // 35% surcharge
    description: 'Major holidays and celebrations'
  }
};

export const LOCATION_DATA = {
  city: 'Colombo',
  province: 'Western Province',
  country: 'Sri Lanka',
  timezone: 'Asia/Colombo',
  currency: SRI_LANKAN_CURRENCY,
  languages: ['English', 'Sinhala', 'Tamil'],
  nearbyAttractions: [
    {
      name: 'Galle Face Green',
      distance: '2 km',
      type: 'Recreation Area'
    },
    {
      name: 'National Museum',
      distance: '1.5 km',
      type: 'Cultural Site'
    },
    {
      name: 'Independence Square',
      distance: '1 km',
      type: 'Historical Site'
    },
    {
      name: 'Mount Lavinia Beach',
      distance: '15 km',
      type: 'Beach'
    }
  ]
};

export default {
  HOTEL_BRANDING,
  SRI_LANKAN_CURRENCY,
  PRICE_RANGES,
  ROOM_TYPES,
  SRI_LANKAN_AMENITIES,
  BED_TYPES,
  VIEW_TYPES,
  MEAL_PLANS,
  GUEST_REVIEWS_ENGLISH,
  SEASONAL_PRICING,
  LOCATION_DATA
};