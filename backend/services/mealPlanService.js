// 📁 backend/services/mealPlanService.js
import FoodOrder from '../models/FoodOrder.js';
import Room from '../models/Room.js';
import { addDays, format, setHours, setMinutes, differenceInDays } from 'date-fns';

/**
 * Meal time configurations
 */
const MEAL_TIMES = {
  breakfast: { start: 7, end: 9, displayName: 'Breakfast' },
  lunch: { start: 12, end: 14, displayName: 'Lunch' },
  dinner: { start: 19, end: 21, displayName: 'Dinner' }
};

/**
 * Get meal types based on food plan
 * @param {String} foodPlan - "Breakfast", "Half Board", "Full Board", "À la carte"
 * @returns {Array<String>} Array of meal types
 */
export const getMealTypesForPlan = (foodPlan) => {
  switch (foodPlan) {
    case 'Breakfast':
      return ['breakfast'];
    case 'Half Board':
      return ['breakfast', 'dinner'];
    case 'Full Board':
      return ['breakfast', 'lunch', 'dinner'];
    case 'À la carte':
      return ['breakfast', 'lunch', 'dinner']; // All available but guest chooses
    default:
      return [];
  }
};

/**
 * Generate meal time slots based on check-in/check-out dates
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date  
 * @param {String} foodPlan - "Breakfast", "Half Board", "Full Board"
 * @returns {Array} Array of meal slots with dates and times
 */
export const generateMealSlots = (checkIn, checkOut, foodPlan) => {
  const slots = [];
  const mealTypes = getMealTypesForPlan(foodPlan);
  
  if (mealTypes.length === 0) {
    return slots;
  }

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const nights = differenceInDays(endDate, startDate);
  
  // Generate slots for each day
  for (let dayIndex = 0; dayIndex < nights; dayIndex++) {
    const currentDate = addDays(startDate, dayIndex);
    
    // Generate slots for each meal type
    mealTypes.forEach(mealType => {
      const mealConfig = MEAL_TIMES[mealType];
      const scheduledTime = setMinutes(setHours(currentDate, mealConfig.start), 30); // Default to 7:30 AM, 12:30 PM, 7:30 PM
      
      slots.push({
        day: dayIndex + 1,
        date: currentDate,
        mealType: mealType,
        scheduledTime: scheduledTime,
        displayName: `Day ${dayIndex + 1} - ${mealConfig.displayName}`,
        timeWindow: `${mealConfig.start}:00 - ${mealConfig.end}:00`
      });
    });
  }
  
  return slots;
};

/**
 * Create FoodOrders from booking meal plan
 * @param {Object} booking - Booking document (populated with roomId and userId)
 * @returns {Promise<Array>} Created food orders
 */
export const createMealPlanOrders = async (booking) => {
  try {
    const { selectedMeals, roomId, userId, bookingNumber, foodPlan } = booking;
    
    if (!selectedMeals || selectedMeals.length === 0) {
      console.log('No selected meals found for booking:', bookingNumber);
      return [];
    }

    // Get room details for room number
    let room;
    if (typeof roomId === 'object' && roomId._id) {
      room = roomId; // Already populated
    } else {
      room = await Room.findById(roomId);
    }

    if (!room) {
      console.error('Room not found for booking:', bookingNumber);
      return [];
    }

    const orders = [];
    
    // Create a FoodOrder for each meal
    for (const meal of selectedMeals) {
      // Skip if meal doesn't have items (legacy format or incomplete data)
      if (!meal.items || meal.items.length === 0) {
        console.log('Skipping meal without items:', meal);
        continue;
      }

      // Calculate total price from items
      const calculatedTotal = meal.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      const orderData = {
        // Booking relation
        bookingId: booking._id,
        roomNumber: room.roomNumber || room.title || 'N/A',
        userId: userId || booking.userId,
        
        // Order details
        items: meal.items.map(item => ({
          foodId: item.foodId,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        totalPrice: meal.totalCost || calculatedTotal,
        subtotal: meal.totalCost || calculatedTotal,
        tax: 0, // Can be calculated if needed
        serviceCharge: 0,
        deliveryFee: 0,
        currency: 'LKR',
        
        // Meal plan specific
        mealType: meal.mealType,
        scheduledDate: meal.date,
        scheduledTime: meal.scheduledTime,
        orderSource: 'meal-plan',
        isPartOfMealPlan: true,
        mealPlanType: foodPlan,
        
        // Order type
        orderType: 'delivery', // Room delivery
        deliveryLocation: `Room ${room.roomNumber || room.title}`,
        
        // Status - scheduled for future, pending if today
        status: new Date(meal.date) > new Date() ? 'scheduled' : 'pending',
        kitchenStatus: 'pending',
        
        // Customer details
        customerDetails: {
          name: userId?.name || booking.metadata?.customerName || 'Guest',
          email: userId?.email || '',
          phone: userId?.phone || ''
        },
        
        // Notes
        notes: `🏨 Meal Plan Order - ${bookingNumber} - Day ${meal.day} ${meal.mealType}`,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        const order = await FoodOrder.create(orderData);
        orders.push(order);
        console.log(`✅ Created meal plan order: ${order._id} for ${meal.mealType} on ${format(meal.date, 'MMM dd')}`);
      } catch (error) {
        console.error(`❌ Error creating meal plan order for ${meal.mealType}:`, error.message);
      }
    }
    
    console.log(`🍽️ Created ${orders.length} meal plan orders for booking ${bookingNumber}`);
    return orders;
  } catch (error) {
    console.error('Error in createMealPlanOrders:', error);
    throw error;
  }
};

/**
 * Update or cancel meal plan orders when booking is modified
 * @param {String} bookingId - Booking ID
 * @param {Array} newMeals - Updated meal selection
 * @returns {Promise<Object>} Result with created, updated, and cancelled counts
 */
export const updateMealPlanOrders = async (bookingId, newMeals) => {
  try {
    // Get existing orders
    const existingOrders = await FoodOrder.find({ 
      bookingId,
      isPartOfMealPlan: true 
    });

    // Cancel orders that are no longer in the meal plan
    const cancelled = [];
    for (const order of existingOrders) {
      const stillExists = newMeals.some(meal => 
        meal.mealType === order.mealType &&
        format(new Date(meal.date), 'yyyy-MM-dd') === format(new Date(order.scheduledDate), 'yyyy-MM-dd')
      );

      if (!stillExists && order.status !== 'delivered' && order.status !== 'cancelled') {
        order.status = 'cancelled';
        order.notes += ' [CANCELLED - Meal plan modified]';
        await order.save();
        cancelled.push(order._id);
      }
    }

    console.log(`📝 Updated meal plan orders for booking ${bookingId}: ${cancelled.length} cancelled`);
    return {
      cancelled: cancelled.length
    };
  } catch (error) {
    console.error('Error updating meal plan orders:', error);
    throw error;
  }
};

/**
 * Cancel all meal plan orders for a booking
 * @param {String} bookingId - Booking ID
 * @returns {Promise<Number>} Number of cancelled orders
 */
export const cancelMealPlanOrders = async (bookingId) => {
  try {
    const result = await FoodOrder.updateMany(
      { 
        bookingId,
        isPartOfMealPlan: true,
        status: { $nin: ['delivered', 'cancelled'] }
      },
      {
        $set: {
          status: 'cancelled',
          kitchenStatus: 'cancelled',
          $push: {
            taskHistory: {
              status: 'cancelled',
              note: 'Booking cancelled',
              updatedAt: new Date()
            }
          }
        }
      }
    );

    console.log(`❌ Cancelled ${result.modifiedCount} meal plan orders for booking ${bookingId}`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error cancelling meal plan orders:', error);
    throw error;
  }
};

/**
 * Activate scheduled orders for today
 * Should be run daily via cron job
 * @returns {Promise<Number>} Number of activated orders
 */
export const activateScheduledOrders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await FoodOrder.updateMany(
      {
        status: 'scheduled',
        scheduledDate: { $gte: today, $lt: tomorrow }
      },
      {
        $set: { status: 'pending' }
      }
    );

    console.log(`🔔 Activated ${result.modifiedCount} scheduled meal plan orders for today`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error activating scheduled orders:', error);
    throw error;
  }
};

export default {
  getMealTypesForPlan,
  generateMealSlots,
  createMealPlanOrders,
  updateMealPlanOrders,
  cancelMealPlanOrders,
  activateScheduledOrders,
  MEAL_TIMES
};

