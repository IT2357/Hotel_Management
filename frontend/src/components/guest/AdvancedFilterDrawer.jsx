import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  SlidersHorizontal, 
  Filter,
  Leaf,
  Flame,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Check
} from 'lucide-react';
import FoodButton from '../food/FoodButton';

const AdvancedFilterDrawer = ({ 
  isOpen, 
  onClose, 
  filters,
  onApplyFilters,
  onClearFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handlePriceChange = (values) => {
    setLocalFilters(prev => ({ ...prev, priceRange: values }));
  };

  const toggleDietaryFilter = (filter) => {
    setLocalFilters(prev => ({
      ...prev,
      dietaryFilters: prev.dietaryFilters.includes(filter)
        ? prev.dietaryFilters.filter(f => f !== filter)
        : [...prev.dietaryFilters, filter]
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      priceRange: [0, 10000],
      dietaryFilters: [],
      availabilityFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      spiceLevel: 'all'
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: 'green' },
    { value: 'vegan', label: 'Vegan', icon: Leaf, color: 'emerald' },
    { value: 'gluten-free', label: 'Gluten Free', icon: Check, color: 'blue' },
    { value: 'spicy', label: 'Spicy', icon: Flame, color: 'red' },
  ];

  const spiceLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'mild', label: 'Mild' },
    { value: 'medium', label: 'Medium' },
    { value: 'hot', label: 'Hot' },
    { value: 'extra-hot', label: 'Extra Hot' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'rating', label: 'Rating' },
    { value: 'popular', label: 'Popularity' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Advanced Filters</h2>
                <p className="text-white/80 text-sm">Refine your search</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Price Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <DollarSign className="w-4 h-4 text-orange-500" />
              Price Range
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">LKR {localFilters.priceRange[0]}</span>
                <span className="text-gray-600">LKR {localFilters.priceRange[1]}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => handlePriceChange([0, parseInt(e.target.value)])}
                  className="w-full h-2 bg-gradient-to-r from-orange-200 to-orange-500 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #fed7aa 0%, #f97316 ${(localFilters.priceRange[1] / 10000) * 100}%, #fed7aa ${(localFilters.priceRange[1] / 10000) * 100}%, #fed7aa 100%)`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Leaf className="w-4 h-4 text-green-500" />
              Dietary Preferences
            </label>
            <div className="grid grid-cols-2 gap-3">
              {dietaryOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = localFilters.dietaryFilters.includes(option.value);
                return (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleDietaryFilter(option.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl font-medium transition-all ${
                      isSelected
                        ? `bg-${option.color}-500 text-white shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Flame className="w-4 h-4 text-red-500" />
              Spice Level
            </label>
            <div className="flex flex-wrap gap-2">
              {spiceLevels.map((level) => (
                <motion.button
                  key={level.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLocalFilters(prev => ({ ...prev, spiceLevel: level.value }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    localFilters.spiceLevel === level.value
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              Availability
            </label>
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocalFilters(prev => ({ ...prev, availabilityFilter: 'all' }))}
                className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                  localFilters.availabilityFilter === 'all'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Items
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocalFilters(prev => ({ ...prev, availabilityFilter: 'available' }))}
                className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                  localFilters.availabilityFilter === 'available'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Available Now
              </motion.button>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-3">
              {sortOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLocalFilters(prev => ({ ...prev, sortBy: option.value }))}
                  className={`p-3 rounded-xl font-medium transition-all ${
                    localFilters.sortBy === option.value
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
            
            {/* Sort Order */}
            <div className="flex gap-3 mt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all ${
                  localFilters.sortOrder === 'asc'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Ascending ↑
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all ${
                  localFilters.sortOrder === 'desc'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Descending ↓
              </motion.button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t flex gap-3 flex-shrink-0">
          <FoodButton
            onClick={handleClear}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Clear All
          </FoodButton>
          <FoodButton
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </FoodButton>
        </div>
      </motion.div>
    </>
  );
};

export default AdvancedFilterDrawer;

