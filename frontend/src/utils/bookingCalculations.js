/**
 * 📊 Unified Booking Cost Calculation Engine
 * Single source of truth for all booking-related calculations
 * Used by both GuestBookingFlow and IntegratedBookingFlow
 */

// Food plan pricing - NOW CALCULATED FROM SELECTED ITEMS
// Removed flat rates to support real menu item selection

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
 * @param {Array} params.selectedFoodItems - Array of selected menu items with quantities (default: [])
 * @returns {Object} Detailed cost breakdown
 */
export const calculateBookingCost = ({
  checkIn,
  checkOut,
  roomPrice,
  guests = 1,
  foodPlan = 'None',
  selectedFoodItems = []
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
      breakdown: [],
      selectedFoodItems: []
    };
  }
  
  // Validate inputs
  const validRoomPrice = Number(roomPrice) || 0;
  const validGuests = Number(guests) || 1;
  
  // Calculate base room cost
  const roomCost = validRoomPrice * nights;
  
  // Calculate food cost from selected items
  let foodCost = 0;
  if (foodPlan !== 'None' && selectedFoodItems.length > 0) {
    // Sum all item prices × quantities × nights × guests
    foodCost = selectedFoodItems.reduce((total, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 1;
      return total + (itemPrice * itemQuantity * nights * validGuests);
    }, 0);
  }
  
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
  
  // Add itemized food breakdown
  if (foodCost > 0 && selectedFoodItems.length > 0) {
    selectedFoodItems.forEach(item => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 1;
      const itemTotal = itemPrice * itemQuantity * nights * validGuests;
      
      breakdown.push({
        label: `${item.name} × ${itemQuantity} × ${nights} night${nights > 1 ? 's' : ''} × ${validGuests} guest${validGuests > 1 ? 's' : ''}`,
        amount: itemTotal,
        type: 'food',
        itemId: item._id
      });
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
    breakdown,
    selectedFoodItems
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
  selectedFoodItems = [],
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
    foodPlan,
    selectedFoodItems
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
    
    // Food details
    foodPlan,
    selectedFoodItems, // NEW: Include selected menu items
    selectedMeals,
    foodDetails: {     // NEW: Metadata for kitchen/restaurant
      planType: foodPlan,
      itemsCount: selectedFoodItems.length,
      totalFoodCost: costBreakdown.foodCost,
      itemsBreakdown: selectedFoodItems.map(item => ({
        itemId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPerNight: item.price * item.quantity,
        totalAllNights: item.price * item.quantity * costBreakdown.nights * guests
      }))
    },
    specialRequests,
    paymentMethod,
    
    // Metadata
    source,
    metadata: {
      bookingSource: source,
      timestamp: new Date().toISOString(),
      version: '2.1',
      calculationEngine: 'unified',
      foodSelectionEnabled: true
    }
  };
};

export default {
  TAX_RATE,
  SERVICE_CHARGE_RATE,
  calculateNights,
  calculateBookingCost,
  formatBookingCurrency,
  validateBookingDates,
  createBookingPayload
};
