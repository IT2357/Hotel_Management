import React from 'react';
import { X } from 'lucide-react';

const FilterSidebar = ({ show, onClose, filters, onFilterChange }) => {
  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          show ? 'translate-x-0' : 'translate-x-full'
        } lg:relative lg:transform-none lg:shadow-none lg:border-r lg:border-gray-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* Dietary Preferences */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Dietary Preferences</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isVeg}
                  onChange={(e) => onFilterChange('isVeg', e.target.checked)}
                  className="w-5 h-5 text-[#FF9933] rounded focus:ring-[#FF9933]"
                />
                <span className="text-gray-700">Vegetarian</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isSpicy}
                  onChange={(e) => onFilterChange('isSpicy', e.target.checked)}
                  className="w-5 h-5 text-[#FF9933] rounded focus:ring-[#FF9933]"
                />
                <span className="text-gray-700">Spicy</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isPopular}
                  onChange={(e) => onFilterChange('isPopular', e.target.checked)}
                  className="w-5 h-5 text-[#FF9933] rounded focus:ring-[#FF9933]"
                />
                <span className="text-gray-700">Popular Dishes</span>
              </label>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Price Range</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="priceRange"
                  className="w-5 h-5 text-[#FF9933] focus:ring-[#FF9933]"
                />
                <span className="text-gray-700">Under LKR 500</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="priceRange"
                  className="w-5 h-5 text-[#FF9933] focus:ring-[#FF9933]"
                />
                <span className="text-gray-700">LKR 500 - 1000</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="priceRange"
                  className="w-5 h-5 text-[#FF9933] focus:ring-[#FF9933]"
                />
                <span className="text-gray-700">Over LKR 1000</span>
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              onFilterChange('isVeg', false);
              onFilterChange('isSpicy', false);
              onFilterChange('isPopular', false);
            }}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
