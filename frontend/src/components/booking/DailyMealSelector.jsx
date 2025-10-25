import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { format, addDays, differenceInDays } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MealItemPicker from './MealItemPicker';

/**
 * Component for selecting meals per day and meal type during booking
 * Allows guests to choose specific menu items for each meal slot
 */
const DailyMealSelector = ({ 
  checkIn, 
  checkOut, 
  foodPlan, 
  onMealsSelected, 
  onClose 
}) => {
  const [selectedMeals, setSelectedMeals] = useState({});
  const [expandedDay, setExpandedDay] = useState(1);
  const [showItemPicker, setShowItemPicker] = useState(null);
  const [days, setDays] = useState([]);

  // Log when component mounts
  useEffect(() => {
    console.log('🍽️ DailyMealSelector component mounted!');
    return () => console.log('🍽️ DailyMealSelector component unmounted');
  }, []);

  // Debug: Log when showItemPicker changes
  useEffect(() => {
    console.log('🔍 showItemPicker state changed to:', showItemPicker);
  }, [showItemPicker]);

  // Meal time configurations
  const MEAL_CONFIGS = {
    breakfast: { 
      icon: '🌅', 
      label: 'Breakfast', 
      time: '7:00 - 9:00 AM',
      defaultTime: 8 
    },
    lunch: { 
      icon: '🍽️', 
      label: 'Lunch', 
      time: '12:00 - 2:00 PM',
      defaultTime: 13 
    },
    dinner: { 
      icon: '🌙', 
      label: 'Dinner', 
      time: '7:00 - 9:00 PM',
      defaultTime: 20 
    }
  };

  // Calculate days and initialize state
  useEffect(() => {
    console.log('🍽️ DailyMealSelector mounted/updated with:', { checkIn, checkOut, foodPlan });
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const nightCount = differenceInDays(end, start);
      
      const dayList = [];
      for (let i = 0; i < nightCount; i++) {
        const currentDate = addDays(start, i);
        dayList.push({
          dayNumber: i + 1,
          date: currentDate,
          dateString: format(currentDate, 'MMM dd, yyyy')
        });
      }
      
      console.log('📅 Generated day list:', dayList);
      setDays(dayList);
    }
  }, [checkIn, checkOut, foodPlan]);

  // Get meal types based on food plan
  const getMealTypes = () => {
    switch (foodPlan) {
      case 'Breakfast':
        return ['breakfast'];
      case 'Half Board':
        return ['breakfast', 'dinner'];
      case 'Full Board':
        return ['breakfast', 'lunch', 'dinner'];
      case 'À la carte':
        return ['breakfast', 'lunch', 'dinner'];
      default:
        return [];
    }
  };

  const mealTypes = getMealTypes();

  // Handle meal selection
  const handleMealItemsSelected = (day, mealType, items) => {
    const mealConfig = MEAL_CONFIGS[mealType];
    const dayData = days.find(d => d.dayNumber === day);
    
    if (!dayData) return;

    // Calculate scheduled time for this meal
    const scheduledTime = new Date(dayData.date);
    scheduledTime.setHours(mealConfig.defaultTime, 30, 0, 0);

    // Calculate total cost
    const totalCost = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    const mealKey = `${day}-${mealType}`;
    setSelectedMeals(prev => ({
      ...prev,
      [mealKey]: {
        day: day,
        date: dayData.date,
        mealType: mealType,
        scheduledTime: scheduledTime,
        items: items,
        totalCost: totalCost
      }
    }));

    setShowItemPicker(null);
  };

  // Remove meal selection
  const handleRemoveMeal = (day, mealType) => {
    const mealKey = `${day}-${mealType}`;
    setSelectedMeals(prev => {
      const updated = { ...prev };
      delete updated[mealKey];
      return updated;
    });
  };

  // Calculate total cost
  const getTotalCost = () => {
    return Object.values(selectedMeals).reduce((sum, meal) => 
      sum + meal.totalCost, 0
    );
  };

  // Check if all required meals are selected
  const isComplete = () => {
    const requiredCount = days.length * mealTypes.length;
    return Object.keys(selectedMeals).length === requiredCount;
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!isComplete()) {
      alert('Please select items for all meal slots');
      return;
    }

    // Convert to array format expected by backend
    const mealsArray = Object.values(selectedMeals);
    onMealsSelected(mealsArray);
  };

  // Early return if no dates - show error message
  const noDates = !checkIn || !checkOut || days.length === 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ 
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      pointerEvents: 'auto'
    }}>
      {noDates ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <Calendar className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Dates Required</h3>
            <p className="text-gray-600 mb-4">
              Please select check-in and check-out dates before choosing meals.
            </p>
            <button
              onClick={onClose}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{ pointerEvents: 'auto' }}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Select Your Meals</h2>
              <p className="text-indigo-100">
                Choose menu items for each meal during your stay
              </p>
              <p className="text-sm text-indigo-200 mt-2">
                {foodPlan} Plan • {days.length} {days.length === 1 ? 'Night' : 'Nights'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Days List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {days.map(day => (
            <div
              key={day.dayNumber}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Day Header */}
              <button
                onClick={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
                className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      Day {day.dayNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      {day.dateString}
                    </div>
                  </div>
                </div>
                {expandedDay === day.dayNumber ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Meal Slots */}
              <AnimatePresence>
                {expandedDay === day.dayNumber && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {mealTypes.map(mealType => {
                        const mealKey = `${day.dayNumber}-${mealType}`;
                        const selectedMeal = selectedMeals[mealKey];
                        const config = MEAL_CONFIGS[mealType];

                        return (
                          <div
                            key={mealType}
                            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{config.icon}</span>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {config.label}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {config.time}
                                  </div>
                                </div>
                              </div>
                              {selectedMeal && (
                                <button
                                  onClick={() => handleRemoveMeal(day.dayNumber, mealType)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {selectedMeal ? (
                              <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
                                <div className="space-y-1">
                                  {selectedMeal.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-gray-700">
                                        {item.quantity}x {item.name}
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        LKR {(item.price * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-green-300 flex justify-between font-semibold">
                                  <span>Total:</span>
                                  <span className="text-green-700">
                                    LKR {selectedMeal.totalCost.toFixed(2)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setShowItemPicker({ day: day.dayNumber, mealType })}
                                  className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                  Change Items
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                data-testid="select-items-button"
                                data-day={day.dayNumber}
                                data-meal={mealType}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🖱️ Select Items button clicked for:', { day: day.dayNumber, mealType });
                                  console.log('🎯 Button element:', e.target);
                                  setShowItemPicker({ day: day.dayNumber, mealType });
                                }}
                                style={{ 
                                  pointerEvents: 'auto', 
                                  cursor: 'pointer',
                                  position: 'relative',
                                  zIndex: 10
                                }}
                                className="w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium py-2 px-4 rounded-lg transition"
                              >
                                Select Items
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">
                Selected: {Object.keys(selectedMeals).length} of {days.length * mealTypes.length} meals
              </div>
              {!isComplete() && (
                <div className="text-sm text-amber-600 mt-1">
                  ⚠️ Please select items for all meal slots
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Meal Cost</div>
              <div className="text-2xl font-bold text-indigo-600">
                LKR {getTotalCost().toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isComplete()}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
                isComplete()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm Meal Selection
            </button>
          </div>
        </div>
        </motion.div>
      )}

      {/* Item Picker Modal - Rendered via portal for highest z-index */}
      {showItemPicker && (
        <>
          {console.log('✅ Rendering MealItemPicker portal for:', showItemPicker)}
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <MealItemPicker
              mealType={showItemPicker.mealType}
              existingItems={selectedMeals[`${showItemPicker.day}-${showItemPicker.mealType}`]?.items || []}
              onItemsSelected={(items) => {
                console.log('✅ Items selected, calling handler');
                handleMealItemsSelected(showItemPicker.day, showItemPicker.mealType, items);
              }}
              onClose={() => {
                console.log('🚪 Closing item picker');
                setShowItemPicker(null);
              }}
            />,
            document.body
          )}
        </>
      )}
    </div>
  );
};

export default DailyMealSelector;

