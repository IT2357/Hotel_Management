// 📁 backend/utils/timeUtils.js
import TimeSlots from '../models/TimeSlots.js';

/**
 * Get current meal type based on server time
 * @returns {string|null} - 'Breakfast', 'Lunch', 'Dinner', 'Snacks', or 'All' if no time slots configured
 */
export const getCurrentMeal = async () => {
  try {
    // Get current time in Colombo timezone (UTC+5:30)
    const now = new Date();
    const colomboTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for Colombo
    const currentTime = colomboTime.toTimeString().slice(0, 5); // HH:MM format

    console.log('🕐 Current UTC time:', now.toTimeString().slice(0, 5));
    console.log('🕐 Current Colombo time:', currentTime);

    // Get all time slots
    const timeSlots = await TimeSlots.find();

    // If no time slots are configured, return 'All' to show all available items
    if (!timeSlots || timeSlots.length === 0) {
      return 'All';
    }

    for (const slot of timeSlots) {
      const start = slot.start;
      const end = slot.end;

      console.log(`🍽️ Checking ${slot.meal}: ${start} - ${end}, current: ${currentTime}`);

      if (currentTime >= start && currentTime <= end) {
        console.log(`✅ Current meal: ${slot.meal}`);
        return slot.meal;
      }
    }

    console.log('📋 No specific meal time, returning All');
    return 'All'; // Show all available items when no specific meal time
  } catch (error) {
    console.error('Error getting current meal:', error);
    return 'All'; // Fallback to show all items on error
  }
};

/**
 * Get availability filter based on current meal
 * @param {string} currentMeal - Current meal type
 * @returns {object} MongoDB filter object
 */
export const getAvailabilityFilter = (currentMeal) => {
  if (!currentMeal) {
    return { isAvailable: false }; // No items available if no current meal
  }

  // If 'All' is returned (no time slots configured), show all available items
  if (currentMeal === 'All') {
    return { isAvailable: true };
  }

  const mealFieldMap = {
    'Breakfast': 'isBreakfast',
    'Lunch': 'isLunch',
    'Dinner': 'isDinner',
    'Snacks': 'isSnacks'
  };

  const field = mealFieldMap[currentMeal];
  if (field) {
    return {
      isAvailable: true,
      [field]: true
    };
  }

  return { isAvailable: false };
};