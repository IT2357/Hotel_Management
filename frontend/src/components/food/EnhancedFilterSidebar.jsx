import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';

const EnhancedFilterSidebar = ({ 
  show, 
  onClose, 
  filters, 
  onFilterChange, 
  onResetFilters,
  categories,
  menuItems
}) => {
  if (!show) return null;

  // Count items per category
  const getCategoryCount = (categoryId) => {
    return menuItems.filter(item => 
      (typeof item.category === 'object' ? item.category._id : item.category) === categoryId
    ).length;
  };

  // Dietary options with icons
  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
    { value: 'vegan', label: 'Vegan', icon: '🌿' },
    { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
    { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
    { value: 'halal', label: 'Halal', icon: '☪️' },
    { value: 'spicy', label: 'Spicy', icon: '🌶️' },
    { value: 'popular', label: 'Popular', icon: '⭐' }
  ];

  // Availability options
  const availabilityOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'available', label: 'Available Only' },
    { value: 'unavailable', label: 'Unavailable Only' }
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          show ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:transform-none lg:shadow-none lg:border-r lg:border-orange-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200">
          <h2 className="text-xl font-bold text-[#4A4A4A] flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#FF9933]" />
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-[#4A4A4A]" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-[#4A4A4A] mb-3">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => onFilterChange('category', 'all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  filters.category === 'all'
                    ? 'bg-[#FF9933] text-white'
                    : 'text-[#4A4A4A] hover:bg-orange-50'
                }`}
              >
                <span>All Categories</span>
                <span className="bg-orange-100 text-orange-800 rounded-full px-2 py-0.5 text-xs">
                  {menuItems.length}
                </span>
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => onFilterChange('category', category._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    filters.category === category._id
                      ? 'bg-[#FF9933] text-white'
                      : 'text-[#4A4A4A] hover:bg-orange-50'
                  }`}
                >
                  <span>
                    {category.icon} {category.name}
                  </span>
                  <span className="bg-orange-100 text-orange-800 rounded-full px-2 py-0.5 text-xs">
                    {getCategoryCount(category._id)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-[#4A4A4A] mb-3">Price Range</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-[#4A4A4A]/70">
                <span>LKR {filters.priceRange[0]}</span>
                <span>LKR {filters.priceRange[1]}</span>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={filters.priceRange[1]}
                  onChange={(e) => onFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={filters.priceRange[0]}
                  onChange={(e) => onFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Dietary Filters */}
          <div>
            <h3 className="font-semibold text-[#4A4A4A] mb-3">Dietary Options</h3>
            <div className="space-y-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    const newFilters = filters.dietaryFilters.includes(option.value)
                      ? filters.dietaryFilters.filter(f => f !== option.value)
                      : [...filters.dietaryFilters, option.value];
                    onFilterChange('dietaryFilters', newFilters);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.dietaryFilters.includes(option.value)
                      ? 'bg-[#FF9933] text-white'
                      : 'text-[#4A4A4A] hover:bg-orange-50'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.label}</span>
                  {filters.dietaryFilters.includes(option.value) && (
                    <FoodBadge variant="success" className="ml-auto text-xs">
                      Selected
                    </FoodBadge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-semibold text-[#4A4A4A] mb-3">Availability</h3>
            <div className="space-y-2">
              {availabilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange('availability', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.availability === option.value
                      ? 'bg-[#FF9933] text-white'
                      : 'text-[#4A4A4A] hover:bg-orange-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="font-semibold text-[#4A4A4A] mb-3">Sort By</h3>
            <div className="space-y-3">
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="cookingTime">Cooking Time</option>
                <option value="rating">Rating</option>
                <option value="popularity">Popularity</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterChange('sortOrder', 'asc')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.sortOrder === 'asc'
                      ? 'bg-[#FF9933] text-white'
                      : 'text-[#4A4A4A] hover:bg-orange-50'
                  }`}
                >
                  Ascending
                </button>
                <button
                  onClick={() => onFilterChange('sortOrder', 'desc')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.sortOrder === 'desc'
                      ? 'bg-[#FF9933] text-white'
                      : 'text-[#4A4A4A] hover:bg-orange-50'
                  }`}
                >
                  Descending
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-orange-100">
            <FoodButton
              onClick={onResetFilters}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Reset All Filters
            </FoodButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedFilterSidebar;