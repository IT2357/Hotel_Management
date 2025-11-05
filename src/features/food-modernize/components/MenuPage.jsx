import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { Search, ChefHat, Clock, Star, Loader2, AlertCircle, Plus, ShoppingCart, Award, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';
import foodService from '../../../../services/foodService';

// Get API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin);

const MenuPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { addToCart, getItemCount } = useCart();
  const navigate = useNavigate();

  // Debounce search term updates
  useEffect(() => {
    const debounced = debounce((value) => {
      setDebouncedSearchTerm(value);
    }, 300);
    
    debounced(searchTerm);
    
    return () => {
      debounced.cancel();
    };
  }, [searchTerm]);

  // Fetch menu items with React Query and debounced search
  const { data: menuItems = [], isLoading: loadingItems, error: itemsError, refetch } = useQuery({
    queryKey: ['menuItems', { isAvailable: true, search: debouncedSearchTerm, category: selectedCategory, dietary: selectedDietary }],
    queryFn: async () => {
      const params = { isAvailable: true };
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const response = await foodService.getMenuItems(params);
      
      // Handle items response (check for pagination format)
      let items = [];
      if (response.data && response.data.items) {
        // Paginated response format
        items = response.data.items;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        items = response.data;
      } else {
        items = [];
      }

      // Add proper image URLs and apply Jaffna pricing adjustment (-5%)
      const itemsWithImages = items.map(item => ({
        ...item,
        // Apply Jaffna pricing adjustment
        price: parseFloat((item.price * 0.95).toFixed(2)),
        originalPrice: item.price,
        imageUrl: item.imageUrl || 
                  (item.imageId ? `${API_BASE_URL}/api/menu/image/${item.imageId}` : null) ||
                  (item.image && item.image.startsWith('http') ? item.image : null) ||
                  `${API_BASE_URL}${item.image}` ||
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
      }));

      return itemsWithImages;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch categories with React Query
  const { data: categories = [], isLoading: loadingCategories, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await foodService.getCategories();
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });

  // Combine loading and error states
  const loading = loadingItems || loadingCategories;
  const error = itemsError || categoriesError;

  // Filter menu items based on dietary preferences (client-side filtering for additional filtering)
  const filteredItems = useMemo(() => {
    if (selectedDietary === 'all') return menuItems;
    
    return menuItems.filter(item => {
      switch (selectedDietary) {
        case 'veg':
          return item.isVeg === true;
        case 'non-veg':
          return item.isVeg === false;
        case 'spicy':
          return item.isSpicy === true;
        case 'halal':
          return item.dietaryTags?.includes('Halal');
        default:
          return true;
      }
    });
  }, [menuItems, selectedDietary]);

  // Handle add to cart with visual feedback
  const handleAddToCart = (item) => {
    addToCart(item);
    
    // Show cart modal after adding item
    setShowCart(true);
    
    // Also show success notification with enhanced design
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-right duration-300 border border-white/20 backdrop-blur-sm';
    notification.innerHTML = `
      <div class="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <div>
        <div class="font-bold text-lg">Added to Cart!</div>
        <div class="text-sm opacity-90">${item.name} has been added</div>
      </div>
      <button class="ml-2 text-white/80 hover:text-white">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;
    
    // Add close functionality to the notification
    notification.querySelector('button').addEventListener('click', () => {
      notification.remove();
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  };

  // Handle view cart
  const handleViewCart = () => {
    navigate('/food-ordering');
  };

  // Handle checkout from cart modal
  const handleCheckout = () => {
    setShowCart(false);
    // Navigate to the food ordering page which has the checkout functionality
    navigate('/food');
  };

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategory('all');
    setSelectedDietary('all');
    setShowFilters(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="menu-page">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="flex justify-center mb-4">
              <ChefHat className="w-16 h-16" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Authentic Jaffna Menu
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Discover traditional Northern Sri Lankan cuisine crafted with love and heritage
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6" />
                <span className="text-lg font-semibold">{menuItems.length}+ Dishes</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6" />
                <span className="text-lg font-semibold">Fresh Daily</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6" />
                <span className="text-lg font-semibold">Authentic Recipes</span>
              </div>
            </div>

            {/* View Cart Button */}
            {getItemCount() > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block"
              >
                <button
                  onClick={handleViewCart}
                  className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg transition-all duration-300 flex items-center"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  View Cart ({getItemCount()})
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="bg-white shadow-sm sticky top-16 z-40 border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for Jaffna dishes, ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  data-testid="menu-search"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {(selectedCategory !== 'all' || selectedDietary !== 'all') && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    1
                  </span>
                )}
              </button>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2" data-testid="category-filter">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat._id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
                {categories.length > 6 && (
                  <button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-orange-50">
                    +{categories.length - 6} more
                  </button>
                )}
              </div>
            </div>

            {/* Extended Filters (Collapsible) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dietary Preferences
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'All Items' },
                          { value: 'veg', label: '🥬 Vegetarian' },
                          { value: 'non-veg', label: '🍖 Non-Veg' },
                          { value: 'spicy', label: '🌶️ Spicy' },
                          { value: 'halal', label: '✨ Halal' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedDietary(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedDietary === option.value
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Menu Items Grid */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          {/* Results Count */}
          {!loading && !error && (
            <div className="mb-6">
              <p className="text-gray-600 text-center">
                Showing <span className="font-semibold text-orange-500">{filteredItems.length}</span> 
                {' '}of {menuItems.length} dishes
                {debouncedSearchTerm && (
                  <span className="ml-2">for "{debouncedSearchTerm}"</span>
                )}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-20" data-testid="loading-state">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                <p className="text-gray-600 text-lg font-medium">
                  {debouncedSearchTerm 
                    ? `Searching for "${debouncedSearchTerm}"...` 
                    : 'Loading authentic Jaffna dishes...'}
                </p>
              </div>
              
              {/* Loading Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                    <div className="h-56 bg-gray-200"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              data-testid="error-state"
            >
              <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Failed to load menu</h3>
              <p className="text-red-500 mb-6">{error.message || 'Failed to load menu items'}</p>
              <button
                onClick={() => refetch()}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Menu Items Grid */}
          {!loading && !error && filteredItems.length > 0 && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item._id || item.id}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.03 }}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
                    data-testid="menu-item"
                  >
                    {/* Item Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {item.isPopular && (
                          <span className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full">
                            ⭐ Popular
                          </span>
                        )}
                        {item.isVeg && (
                          <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">
                            🥬 Veg
                          </span>
                        )}
                        {item.isSpicy && (
                          <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full">
                            🌶️ Spicy
                          </span>
                        )}
                        {item.dietaryTags?.includes('Halal') && (
                          <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded-full">
                            ✨ Halal
                          </span>
                        )}
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-white bg-orange-500 px-3 py-1 rounded-lg shadow-lg">
                            LKR {item.price}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-sm text-gray-300 line-through">
                              LKR {item.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cooking Time */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-white" />
                        <span className="text-white text-xs">{item.cookingTime || 15} min</span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors">
                        {item.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {/* Ingredients Preview */}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1">
                          {item.ingredients.slice(0, 3).map((ingredient, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                            >
                              {ingredient}
                            </span>
                          ))}
                          {item.ingredients.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              +{item.ingredients.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                        data-testid="add-to-cart-btn"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredItems.length === 0 && menuItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              data-testid="empty-filtered"
            >
              <ChefHat className="w-20 h-20 text-orange-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No dishes found</h3>
              <p className="text-gray-600 mb-6">
                {debouncedSearchTerm 
                  ? `No dishes match "${debouncedSearchTerm}". Try different keywords.` 
                  : 'Try adjusting your filter preferences'}
              </p>
              <button
                onClick={clearFilters}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}

          {/* No Menu Items at All */}
          {!loading && !error && menuItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              data-testid="empty-menu"
            >
              <ChefHat className="w-20 h-20 text-orange-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Menu Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                Our authentic Jaffna dishes will be available shortly
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Floating Cart Button */}
      {getItemCount() > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white p-5 rounded-full shadow-2xl z-50 transition-all duration-300 flex items-center justify-center border-4 border-white shadow-orange-500/30"
        >
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            <motion.span 
              className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 30 }}
            >
              {getItemCount()}
            </motion.span>
            <motion.div
              className="absolute inset-0 rounded-full bg-white/30"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default MenuPage;