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
 * @param {Array} params.selectedFoodItems - Array of selected menu items (old structure, for backward compatibility)
 * @param {Array} params.selectedMeals - Array of day-by-day meals with totalCost (new structure from DailyMealSelector)
 * @returns {Object} Detailed cost breakdown
 */
export const calculateBookingCost = ({
  checkIn,
  checkOut,
  roomPrice,
  guests = 1,
  foodPlan = 'None',
  selectedFoodItems = [],
  selectedMeals = [] // NEW: Day-by-day meal structure
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
      selectedFoodItems: [],
      selectedMeals: []
    };
  }
  
  // Validate inputs
  const validRoomPrice = Number(roomPrice) || 0;
  const validGuests = Number(guests) || 1;
  
  // Calculate base room cost
  const roomCost = validRoomPrice * nights;
  
  // Calculate food cost
  let foodCost = 0;
  
  // ✅ UNIFIED CALCULATION: Day-by-day meal structure (from DailyMealSelector)
  // This matches the backend calculation logic exactly
  if (selectedMeals && selectedMeals.length > 0) {
    // Each meal represents one meal slot (e.g., Day 1 Breakfast, Day 1 Dinner)
    // Structure: { day, date, mealType, items: [{ foodId, name, price, quantity }], totalCost }
    foodCost = selectedMeals.reduce((total, meal) => {
      // Use totalCost if available (preferred)
      let mealCost = Number(meal.totalCost) || 0;
      
      // Fallback: Calculate from items if totalCost is missing
      if (!mealCost && meal.items && meal.items.length > 0) {
        mealCost = meal.items.reduce((sum, item) => {
          return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1));
        }, 0);
      }
      
      return total + mealCost;
    }, 0);
    
    console.log('💰 Frontend: Day-by-day meal calculation:', {
      mealsCount: selectedMeals.length,
      totalMealCost: foodCost,
      mealsDetails: selectedMeals.map(m => ({
        day: m.day,
        mealType: m.mealType,
        itemsCount: m.items?.length || 0,
        totalCost: m.totalCost || 'calculated from items',
        items: m.items?.map(item => `${item.name} x${item.quantity} @${item.price}`)
      }))
    });
  } 
  // OLD: Fallback to old structure for backward compatibility (shouldn't be used with new flow)
  else if (foodPlan !== 'None' && selectedFoodItems.length > 0) {
    console.warn('⚠️ Using LEGACY meal calculation - this should not happen with DailyMealSelector!');
    // OLD LOGIC: Sum all item prices × quantities × nights × guests
    foodCost = selectedFoodItems.reduce((total, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 1;
      return total + (itemPrice * itemQuantity * nights * validGuests);
    }, 0);
    
    console.log('💰 Legacy meal calculation:', {
      itemsCount: selectedFoodItems.length,
      totalMealCost: foodCost
    });
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
  
  // Add food breakdown based on structure
  if (foodCost > 0) {
    if (selectedMeals && selectedMeals.length > 0) {
      // NEW: Day-by-day breakdown
      selectedMeals.forEach((meal, index) => {
        const mealLabel = meal.mealType ? 
          `Day ${meal.day} - ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}` :
          `Meal ${index + 1}`;
        
        breakdown.push({
          label: mealLabel,
          amount: meal.totalCost,
          type: 'food',
          day: meal.day,
          mealType: meal.mealType
        });
      });
    } else if (selectedFoodItems.length > 0) {
      // OLD: Itemized food breakdown
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
    selectedFoodItems,
    selectedMeals
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
 * Create standardized booking payload for backend submission
 * IMPORTANT: The backend will recalculate costs but we pass calculated values for validation
 * 
 * @param {Object} params - Booking parameters
 * @returns {Object} Standardized booking payload matching backend expectations
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
  selectedMeals = [], // Day-by-day meal structure from DailyMealSelector
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
    selectedFoodItems,
    selectedMeals
  });

  // Ensure each meal has totalCost calculated before sending to backend
  const mealsWithTotalCost = selectedMeals.map(meal => {
    const totalCost = meal.totalCost || (meal.items?.reduce((sum, item) => 
      sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0) || 0);
    
    return {
      ...meal,
      totalCost, // Ensure this is always present
      items: meal.items?.map(item => ({
        ...item,
        foodId: item.foodId || item._id, // Ensure foodId is present
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
      })) || []
    };
  });

  const payload = {
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
    
    // Costs - Backend will recalculate but we send for validation
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
    
    // Food details - CRITICAL: Backend uses this to calculate meal costs
    foodPlan,
    selectedFoodItems, // OLD: Kept for backward compatibility
    selectedMeals: mealsWithTotalCost, // NEW: Day-by-day meal structure with validated totalCost
    foodDetails: {     // Metadata for kitchen/restaurant
      planType: foodPlan,
      itemsCount: mealsWithTotalCost.length || selectedFoodItems.length,
      totalFoodCost: costBreakdown.foodCost,
      mealsBreakdown: mealsWithTotalCost.map(meal => ({
        day: meal.day,
        date: meal.date,
        mealType: meal.mealType,
        scheduledTime: meal.scheduledTime,
        items: meal.items,
        totalCost: meal.totalCost
      })),
      // OLD: Keep for backward compatibility
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
      version: '2.2',
      calculationEngine: 'unified',
      foodSelectionEnabled: true,
      mealsValidated: true
    }
  };

  // Verification log
  console.log('📦 Creating booking payload:', {
    roomTitle,
    nights: payload.nights,
    foodPlan: payload.foodPlan,
    mealsCount: mealsWithTotalCost.length,
    totalMealCost: costBreakdown.foodCost,
    totalAmount: payload.totalAmount,
    mealsStructure: mealsWithTotalCost.length > 0 ? mealsWithTotalCost[0] : 'none'
  });

  return payload;
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
