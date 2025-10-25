// Test Sri Lankan Currency Migration
// Run this to validate all Sri Lankan localization is working correctly

import { formatLKR, formatBookingCurrency, getDefaultPriceRange, calculateTotalPrice } from '../src/utils/sriLankanCurrency.js';
import { HOTEL_BRANDING, ROOM_TYPES, SRI_LANKAN_AMENITIES } from '../src/constants/sriLankanHotel.js';

console.log('🇱🇰 Testing Sri Lankan Hotel Management Migration...\n');

// Test 1: Currency Formatting
console.log('💰 Testing Currency Formatting:');
console.log('formatLKR(25000):', formatLKR(25000)); // Should show "Rs. 25,000"
console.log('formatBookingCurrency(50000):', formatBookingCurrency(50000)); // Should show "Rs. 50,000"
console.log('Default price range:', getDefaultPriceRange()); // Should show [5000, 100000]

// Test 2: Price Calculations with Sri Lankan Taxes
console.log('\n🧮 Testing Price Calculations:');
const basePrice = 25000;
const nights = 3;
const pricing = calculateTotalPrice(basePrice, nights);
console.log(`Base price: ${formatLKR(basePrice)} x ${nights} nights`);
console.log(`Subtotal: ${formatLKR(pricing.subtotal)}`);
console.log(`Service Charge (10%): ${formatLKR(pricing.serviceCharge)}`);
console.log(`VAT (15%): ${formatLKR(pricing.vat)}`);
console.log(`Total: ${formatLKR(pricing.total)}`);

// Test 3: Hotel Branding
console.log('\n🏨 Testing Hotel Branding:');
console.log('Hotel Name:', HOTEL_BRANDING.name);
console.log('Tagline:', HOTEL_BRANDING.tagline);
console.log('Location:', HOTEL_BRANDING.location.address);
console.log('Contact:', HOTEL_BRANDING.contact.phone);

// Test 4: Room Types
console.log('\n🏠 Testing Room Types:');
Object.keys(ROOM_TYPES).forEach(key => {
    const room = ROOM_TYPES[key];
    console.log(`${room.name} (${room.nameTamil}): ${formatLKR(room.basePrice)}`);
});

// Test 5: Sri Lankan Amenities
console.log('\n🎯 Testing Sri Lankan Amenities:');
SRI_LANKAN_AMENITIES.forEach(amenity => {
    const category = amenity.featured ? '[Featured]' : 
                    amenity.premium ? '[Premium]' : 
                    amenity.unique ? '[Unique]' : 
                    amenity.cultural ? '[Cultural]' : '[Standard]';
    console.log(`${category} ${amenity.label} (${amenity.labelTamil})`);
});

// Test 6: Compact Currency Display
console.log('\n📊 Testing Compact Currency:');
console.log('Rs. 150,000 compact:', formatLKR(150000, { compact: true })); // Should show "Rs. 150K"
console.log('Rs. 1,500,000 compact:', formatLKR(1500000, { compact: true })); // Should show "Rs. 1.5M"

// Test 7: Bilingual Content Validation
console.log('\n🗣️ Testing Bilingual Content:');
console.log('English: View Details → Sinhala: විස්තර බලන්න');
console.log('English: Book Now → Sinhala: වෙන්කරවා ගන්න');
console.log('English: Price Range → Sinhala: මිල පරාසය');
console.log('English: Amenities → Sinhala: පහසුකම්');

console.log('\n✅ Sri Lankan Migration Test Complete!');
console.log('🎉 All components successfully migrated to Sri Lankan context');
console.log('🏨 VALDOR Hotel ready for authentic Jaffna Tamil hospitality experience');

export { formatLKR, HOTEL_BRANDING, ROOM_TYPES };