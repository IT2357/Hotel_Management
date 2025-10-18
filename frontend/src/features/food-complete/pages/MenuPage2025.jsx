/**
 * 🍽️ MenuPage 2025 - Mobile-First Jaffna Restaurant
 * Features: #FF9933 theme, bilingual Tamil/English, debounced search, dietary filters
 * Real-world ready: Loading states, error handling, responsive grid, upsells
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Star, ChefHat, Leaf, Flame, Award } from 'lucide-react';
import { menuAPI, categoryAPI } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';
import MenuItemCard from '../components/MenuItemCard';
import FilterSidebar from '../components/FilterSidebar';
import LoadingSkeleton from '../components/LoadingSkeleton';

const MenuPage2025 = () => {
  // State
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dietaryFilters, setDietaryFilters] = useState({
    isVeg: false,
    isSpicy: false,
    isPopular: false
  });
  const [mealTime, setMealTime] = useState('');
  const [sortBy, setSortBy] = useState('sortOrder');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // UI State
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search for performance
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch menu items
  const fetchMenuItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 12,
        sortBy,
        sortOrder: 'asc'
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.category = selectedCategory;
      if (dietaryFilters.isVeg) params.isVeg = true;
      if (dietaryFilters.isSpicy) params.isSpicy = true;
      if (dietaryFilters.isPopular) params.isPopular = true;
      if (mealTime) params.mealTime = mealTime;

      const response = await menuAPI.getItems(params);
      
      if (response.success) {
        setMenuItems(response.data.items);
        setTotalItems(response.data.pagination.total);
        setHasMore(response.data.pagination.hasMore);
      }
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, dietaryFilters, mealTime, sortBy, page]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setDietaryFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPage(1); // Reset to first page
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setDietaryFilters({ isVeg: false, isSpicy: false, isPopular: false });
    setMealTime('');
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (dietaryFilters.isVeg) count++;
    if (dietaryFilters.isSpicy) count++;
    if (dietaryFilters.isPopular) count++;
    if (mealTime) count++;
    return count;
  }, [selectedCategory, dietaryFilters, mealTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#FF9933] to-[#FF7700] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 flex items-center gap-3">
                <ChefHat className="w-10 h-10 sm:w-12 sm:h-12" />
                Jaffna Authentic Menu
              </h1>
              <p className="text-white/90 text-sm sm:text-base">
                தமிழ் உணவு | Traditional Sri Lankan Cuisine | {totalItems} Dishes
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Award className="w-5 h-5" />
              <span>5% Jaffna Discount Applied</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search & Filter Bar */}
        <div className="mb-6 sm:mb-8">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search dishes... (e.g., Crab Curry, நண்டு கறி)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20 transition-all text-base sm:text-lg"
            />
          </div>

          {/* Filter Pills - Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-[#FF9933] text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF9933]'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm sm:text-base">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-[#FF9933] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Quick Filters */}
            <button
              onClick={() => handleFilterChange('isVeg', !dietaryFilters.isVeg)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                dietaryFilters.isVeg
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500'
              }`}
            >
              <Leaf className="w-4 h-4" />
              Veg
            </button>

            <button
              onClick={() => handleFilterChange('isSpicy', !dietaryFilters.isSpicy)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                dietaryFilters.isSpicy
                  ? 'bg-red-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500'
              }`}
            >
              <Flame className="w-4 h-4" />
              Spicy
            </button>

            <button
              onClick={() => handleFilterChange('isPopular', !dietaryFilters.isPopular)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                dietaryFilters.isPopular
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-500'
              }`}
            >
              <Star className="w-4 h-4" />
              Popular
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="ml-auto text-sm text-gray-600 hover:text-[#FF9933] underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryChange(category._id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category._id
                      ? 'bg-[#FF9933] text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF9933]'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm sm:text-base">
            {loading ? 'Loading...' : `${totalItems} dishes found`}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF9933] text-sm"
          >
            <option value="sortOrder">Recommended</option>
            <option value="price">Price: Low to High</option>
            <option value="name_english">Name: A-Z</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchMenuItems}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Menu Grid */}
        {!loading && !error && menuItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item._id} item={item} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && menuItems.length === 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No dishes found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF7700] transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="px-8 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF7700] transition-colors font-medium text-lg shadow-lg"
            >
              Load More Dishes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage2025;
