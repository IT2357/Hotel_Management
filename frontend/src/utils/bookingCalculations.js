/**
 * 📊 Unified Booking Cost Calculation Engine
 * Single source of truth for all booking-related calculations
 * Used by both GuestBookingFlow and IntegratedBookingFlow
 */

// Food plan pricing per person per night (in LKR)
export const FOOD_PLAN_PRICING = {
  'None': 0,
  'Breakfast': 1500,
  'Half Board': 3500,
  'Full Board': 5500,
  'A la carte': 2500
};

// Tax and service charge rates
export const TAX_RATE = 0.12;           // 12% tax
export const SERVICE_CHARGE_RATE = 0.10; // 10% service charge

/**
 * Calculate the number of nights between two dates
 * @param {string|Date} checkIn - Check-in date
 * @param {string|Date} checkOut - Check-out date
 * @returns {number} Number of nights
 */
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates provided to calculateNights');
      return 0;
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error('Error calculating nights:', error);
    return 0;
  }
};

/**
 * Calculate complete booking cost breakdown
 * @param {Object} params - Calculation parameters
 * @param {string|Date} params.checkIn - Check-in date
 * @param {string|Date} params.checkOut - Check-out date
 * @param {number} params.roomPrice - Room price per night
 * @param {number} params.guests - Number of guests (default: 1)
 * @param {string} params.foodPlan - Food plan type (default: 'None')
 * @returns {Object} Detailed cost breakdown
 */
export const calculateBookingCost = ({
  checkIn,
  checkOut,
  roomPrice,
  guests = 1,
  foodPlan = 'None'
}) => {
  const nights = calculateNights(checkIn, checkOut);
  
  // Return zero costs if no nights
  if (nights === 0) {
    return {
      nights: 0,
      roomCost: 0,
      foodCost: 0,
      subtotal: 0,
      taxes: 0,
      serviceCharge: 0,
      total: 0,
      breakdown: []
    };
  }
  
  // Validate inputs
  const validRoomPrice = Number(roomPrice) || 0;
  const validGuests = Number(guests) || 1;
  
  // Calculate base room cost
  const roomCost = validRoomPrice * nights;
  
  // Calculate food plan cost (per person per night)
  const foodPricePerPersonPerNight = FOOD_PLAN_PRICING[foodPlan] || 0;
  const foodCost = nights * validGuests * foodPricePerPersonPerNight;
  
  // Calculate subtotal (before taxes and charges)
  const subtotal = roomCost + foodCost;
  
  // Calculate taxes and service charges on subtotal
  const taxes = subtotal * TAX_RATE;
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  
  // Calculate grand total
  const total = subtotal + taxes + serviceCharge;
  
  // Build detailed breakdown for display
  const breakdown = [
    {
      label: `Room × ${nights} night${nights > 1 ? 's' : ''}`,
      amount: roomCost,
      type: 'room'
    }
  ];
  
  if (foodCost > 0) {
    breakdown.push({
      label: `${foodPlan} × ${nights} night${nights > 1 ? 's' : ''} × ${validGuests} guest${validGuests > 1 ? 's' : ''}`,
      amount: foodCost,
      type: 'food'
    });
  }
  
  breakdown.push(
    {
      label: `Taxes (${TAX_RATE * 100}%)`,
      amount: taxes,
      type: 'tax'
    },
    {
      label: `Service Charge (${SERVICE_CHARGE_RATE * 100}%)`,
      amount: serviceCharge,
      type: 'service'
    }
  );
  
  return {
    nights,
    roomCost,
    foodCost,
    subtotal,
    taxes,
    serviceCharge,
    total,
    breakdown
  };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'LKR')
 * @returns {string} Formatted currency string
 */
export const formatBookingCurrency = (amount, currency = 'LKR') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
};

/**
 * Validate booking dates
 * @param {string|Date} checkIn - Check-in date
 * @param {string|Date} checkOut - Check-out date
 * @returns {Object} Validation result
 */
export const validateBookingDates = (checkIn, checkOut) => {
  const errors = [];
  
  if (!checkIn) {
    errors.push('Check-in date is required');
  }
  
  if (!checkOut) {
    errors.push('Check-out date is required');
  }
  
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      errors.push('Check-in date cannot be in the past');
    }
    
    if (end <= start) {
      errors.push('Check-out date must be after check-in date');
    }
    
    const nights = calculateNights(checkIn, checkOut);
    if (nights > 365) {
      errors.push('Booking cannot exceed 365 nights');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Create standardized booking payload
 * @param {Object} params - Booking parameters
 * @returns {Object} Standardized booking payload
 */
export const createBookingPayload = ({
  roomId,
  roomPrice,
  roomTitle,
  checkIn,
  checkOut,
  guests,
  foodPlan = 'None',
  selectedMeals = [],
  specialRequests = '',
  paymentMethod = 'cash',
  source = 'web'
}) => {
  const costBreakdown = calculateBookingCost({
    checkIn,
    checkOut,
    roomPrice,
    guests,
    foodPlan
  });

  return {
    // Room details
    roomId,
    roomTitle,
    roomBasePrice: roomPrice,
    
    // Dates and guests
    checkIn: new Date(checkIn).toISOString(),
    checkOut: new Date(checkOut).toISOString(),
    guests,
    guestCount: {
      adults: guests,
      children: 0
    },
    
    // Costs
    totalAmount: costBreakdown.total,
    nights: costBreakdown.nights,
    costBreakdown: {
      roomCost: costBreakdown.roomCost,
      foodCost: costBreakdown.foodCost,
      taxes: costBreakdown.taxes,
      serviceCharge: costBreakdown.serviceCharge,
      subtotal: costBreakdown.subtotal,
      total: costBreakdown.total
    },
    
    // Additional details
    foodPlan,
    selectedMeals,
    specialRequests,
    paymentMethod,
    
    // Metadata
    source,
    metadata: {
      bookingSource: source,
      timestamp: new Date().toISOString(),
      version: '2.0',
      calculationEngine: 'unified'
    }
  };
};

export default {
  FOOD_PLAN_PRICING,
  TAX_RATE,
  SERVICE_CHARGE_RATE,
  calculateNights,
  calculateBookingCost,
  formatBookingCurrency,
  validateBookingDates,
  createBookingPayload
};
