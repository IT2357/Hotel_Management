// 📁 backend/utils/timeUtils.js
import TimeSlots from '../models/TimeSlots.js';

/**
 * Get current meal type based on server time
 * @returns {string|null} - 'Breakfast', 'Lunch', 'Dinner', 'Snacks', or 'All' if no time slots configured
 */
export const getCurrentMeal = async () => {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Get all time slots
    const timeSlots = await TimeSlots.find();

    // If no time slots are configured, return 'All' to show all available items
    if (!timeSlots || timeSlots.length === 0) {
      return 'All';
    }

    for (const slot of timeSlots) {
      const start = slot.start;
      const end = slot.end;

      if (currentTime >= start && currentTime <= end) {
        return slot.meal;
      }
    }

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