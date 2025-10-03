// backend/controllers/utils/timeUtils.js
// Simple time utilities for menu filtering

export const getCurrentMeal = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snacks';
  if (hour >= 18 && hour < 22) return 'dinner';

  return 'snacks'; // Default fallback
};

export const getAvailabilityFilter = (currentMeal) => {
  const timeFilters = {
    breakfast: { isBreakfast: true },
    lunch: { isLunch: true },
    dinner: { isDinner: true },
    snacks: { isSnacks: true }
  };

  return timeFilters[currentMeal] || { isSnacks: true };
};