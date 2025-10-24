import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../../components/shared/SharedNavbar';
import FoodButton from '../../components/food/FoodButton';
import FoodCard, { FoodCardContent, FoodCardHeader, FoodCardTitle } from '../../components/food/FoodCard';
import EnhancedFoodCard from '../../components/food/EnhancedFoodCard';
import Cart from '../../components/food/Cart';
import FoodBadge from '../../components/food/FoodBadge';
import OfferBanner from '../../components/food/OfferBanner';
import FoodCardSkeleton from '../../components/food/FoodCardSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/food/FoodDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  CheckCircle, 
  ArrowLeft, 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Trash2, 
  ChefHat, 
  Clock, 
  Star, 
  Leaf, 
  Flame, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  AlertCircle,
  X,
  SlidersHorizontal,
  Heart,
  Eye,
  Sparkles,
  DollarSign
} from 'lucide-react';
import Checkout from '../../components/food/Checkout';
import { useCart } from '../../context/CartContext';
import foodService from '../../services/foodService';
import offerService from '../../services/offerService';
import { toast } from 'sonner';

const GuestMenuPage = () => {
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [viewedItems, setViewedItems] = useState(new Set());
  const [activeOffer, setActiveOffer] = useState(null);
  const [isApplyingOffer, setIsApplyingOffer] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentTimeSlot, setCurrentTimeSlot] = useState('all');

  // Function to get current time slot
  const getCurrentTimeSlot = () => {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours >= 6 && hours < 11) return 'breakfast';
    if (hours >= 11 && hours < 16) return 'lunch';
    if (hours >= 16 && hours < 23) return 'dinner';
    return 'snacks';
  };

  // Set initial time slot based on current time
  useEffect(() => {
    setCurrentTimeSlot(getCurrentTimeSlot());
  }, []);
  
  const { addToCart, getItemCount } = useCart();
  const navigate = useNavigate();
  
  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isSearching, setIsSearching] = useState(false);
  
  // Show loading indicator when search term changes but debounced term hasn't updated yet
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Dietary options
  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
    { value: 'vegan', label: 'Vegan', icon: '🌿' },
    { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
    { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
    { value: 'halal', label: 'Halal', icon: '☪️' },
    { value: 'spicy', label: 'Spicy', icon: '🌶️' },
    { value: 'popular', label: 'Popular', icon: '⭐' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'cookingTime', label: 'Cooking Time' },
    { value: 'rating', label: 'Rating' },
    { value: 'popularity', label: 'Popularity' }
  ];

  // Fetch menu items, categories, and offers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [itemsResponse, categoriesResponse] = await Promise.all([
          foodService.getMenuItems({ isAvailable: true }),
          foodService.getCategories()
        ]);
        
        // Handle different response formats from API
        const items = itemsResponse.data?.data || itemsResponse.data || [];
        const cats = categoriesResponse.data?.data || categoriesResponse.data || [];
        
        console.log('📊 Menu Items Response:', { 
          count: items.length, 
          sample: items[0],
          hasCategory: items[0]?.category 
        });
        console.log('📁 Categories Response:', { 
          count: cats.length, 
          sample: cats[0] 
        });
        
        setMenuItems(items);
        setCategories(cats);
        
        // Fetch active offers (public - no auth required)
        try {
          const offersResponse = await offerService.getActiveOffers();
          if (offersResponse.success && offersResponse.data && offersResponse.data.length > 0) {
            setActiveOffer(offersResponse.data[0]); // Show first active offer
            console.log('🎁 Active Offer:', offersResponse.data[0]);
          }
        } catch (offerError) {
          // Offers are optional, don't break if they fail
          console.log('ℹ️ No active offers available', offerError);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load menu items');
        setMenuItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Optimized filter and sort menu items with debounced search
  const filteredAndSortedItems = useMemo(() => {
    if (!menuItems.length) return [];
    
    console.log('🔍 Applying filters:', { 
      selectedCategory, 
      priceRange, 
      dietaryFilters, 
      availabilityFilter,
      searchTerm: debouncedSearchTerm 
    });
    
    let filtered = menuItems.filter(item => {
      // Search filter with debounced term
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !searchLower || 
                           item.name.toLowerCase().includes(searchLower) ||
                           item.description?.toLowerCase().includes(searchLower) ||
                           item.ingredients?.some(ing => ing.toLowerCase().includes(searchLower));
      
      // Category filter - handle both object and string IDs
      const itemCategoryId = typeof item.category === 'object' && item.category?._id 
        ? item.category._id 
        : item.category;
      const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory;
      
      // Price filter
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      
      // Dietary filters - optimized with early return
      const matchesDietary = dietaryFilters.length === 0 || 
                            dietaryFilters.every(filter => {
                              switch (filter) {
                                case 'vegetarian': return item.isVeg;
                                case 'vegan': return item.isVegan;
                                case 'gluten-free': return item.dietaryTags?.includes('Gluten-Free');
                                case 'dairy-free': return item.dietaryTags?.includes('Dairy-Free');
                                case 'halal': return item.dietaryTags?.includes('Halal');
                                case 'spicy': return item.isSpicy;
                                case 'popular': return item.isPopular;
                                default: return false;
                              }
                            });
      
      // Availability filter
      const matchesAvailability = availabilityFilter === 'all' || 
                                 (availabilityFilter === 'available' && item.isAvailable) ||
                                 (availabilityFilter === 'unavailable' && !item.isAvailable);
      
      // Time slot filter - show items available for the selected time slot
      const matchesTimeSlot = currentTimeSlot === 'all' ||
                             (currentTimeSlot === 'breakfast' && item.isBreakfast) ||
                             (currentTimeSlot === 'lunch' && item.isLunch) ||
                             (currentTimeSlot === 'dinner' && item.isDinner) ||
                             (currentTimeSlot === 'snacks' && item.isSnacks);
      
      return matchesSearch && matchesCategory && matchesPrice && matchesDietary && matchesAvailability && matchesTimeSlot;
    });

    // Sort items with optimized comparison
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case 'cookingTime':
          aValue = a.cookingTime || 0;
          bValue = b.cookingTime || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'popularity':
          aValue = a.orderCount || 0;
          bValue = b.orderCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      return sortOrder === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [menuItems, debouncedSearchTerm, selectedCategory, priceRange, dietaryFilters, availabilityFilter, sortBy, sortOrder, currentTimeSlot]);

  // Handle add to cart - memoized to prevent unnecessary re-renders
  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    setViewedItems(prev => new Set([...prev, item._id]));
  }, [addToCart]);

  // Handle checkout
  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  // Handle order complete
  const handleOrderComplete = (order) => {
    setCompletedOrder(order);
    setOrderComplete(true);
    setShowCheckout(false);
  };

  // Handle back to menu
  const handleBackToMenu = () => {
    setOrderComplete(false);
    setCompletedOrder(null);
  };

  // Handle favorite toggle
  const toggleFavorite = (itemId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  // Handle dietary filter toggle - memoized
  const toggleDietaryFilter = useCallback((filter) => {
    setDietaryFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  // Reset filters - memoized
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange([0, 10000]);
    setDietaryFilters([]);
    setAvailabilityFilter('all');
    setCurrentTimeSlot(getCurrentTimeSlot()); // Reset to current time
    setSortBy('name');
    setSortOrder('asc');
  }, []);

  // Handle claim/apply offer
  const handleApplyOffer = useCallback(async (offer) => {
    setIsApplyingOffer(true);
    try {
      // Store offer in localStorage to be used during checkout
      localStorage.setItem('appliedOffer', JSON.stringify({
        _id: offer._id,
        code: offer.code,
        title: offer.title,
        description: offer.description,
        type: offer.type,
        discountValue: offer.discountValue,
        appliedAt: new Date().toISOString()
      }));
      
      console.log('✅ Offer claimed:', offer.title);
      
      // Show beautiful success toast notification
      toast.success('Offer Claimed Successfully! 🎉', {
        description: `${offer.title} - ${offer.type === 'percentage' ? `${offer.discountValue}% off` : `LKR ${offer.discountValue} off`} will be applied at checkout`,
        duration: 4000,
        icon: '🎁',
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
        },
      });
      
    } catch (error) {
      console.error('❌ Failed to claim offer:', error);
      toast.error('Failed to claim offer', {
        description: 'Please try again later',
        duration: 3000,
      });
    } finally {
      setIsApplyingOffer(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <SharedNavbar showBackButton={true} backPath="/" />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-900 text-lg">Loading delicious menu...</p>
            
            {/* Loading Skeletons */}
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="flex gap-8">
                <div className="hidden lg:block w-80 flex-shrink-0">
                  <div className="animate-pulse bg-white/60 rounded-2xl h-96" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <FoodCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <SharedNavbar showBackButton={true} backPath="/" />
      
      <div className="pt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 backdrop-blur-sm border-b border-indigo-300/30 sticky top-16 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Our Delicious Menu</h1>
                    <p className="text-white/90 text-sm">Discover authentic Jaffna cuisine with modern flavors</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                {/* Time Slot Selector */}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/30">
                  <Clock className="w-4 h-4 text-white" />
                  <select
                    value={currentTimeSlot}
                    onChange={(e) => setCurrentTimeSlot(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-indigo-600 text-white">All Day</option>
                    <option value="breakfast" className="bg-indigo-600 text-white">🍳 Breakfast (6-11 AM)</option>
                    <option value="lunch" className="bg-indigo-600 text-white">🍽️ Lunch (11 AM-4 PM)</option>
                    <option value="dinner" className="bg-indigo-600 text-white">🌙 Dinner (4-11 PM)</option>
                    <option value="snacks" className="bg-indigo-600 text-white">☕ Snacks & Late Night</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search dishes, ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent bg-white/20 backdrop-blur-sm text-white placeholder-white/70"
                    data-testid="search-input"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                {/* Filter Toggle Button - Desktop Only */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
                  className="hidden lg:flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all border border-white/30"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="font-medium">Filters</span>
                  {(selectedCategory !== 'all' || dietaryFilters.length > 0 || priceRange[1] < 10000 || currentTimeSlot !== 'all') && (
                    <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {(selectedCategory !== 'all' ? 1 : 0) + dietaryFilters.length + (priceRange[1] < 10000 ? 1 : 0) + (currentTimeSlot !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </motion.button>
                
                {/* Cart Button */}
                <FoodButton
                  onClick={() => setShowCart(true)}
                  className="bg-white hover:bg-white/90 text-indigo-600 relative"
                  data-testid="cart-button"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart
                  {getItemCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center" data-testid="cart-counter">
                      {getItemCount()}
                    </span>
                  )}
                </FoodButton>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Offer Banner */}
          {activeOffer && (
            <OfferBanner 
              offer={activeOffer} 
              onApply={handleApplyOffer}
              isLoading={isApplyingOffer}
            />
          )}

          <div className="flex gap-8">
            {/* Complete Filter Sidebar - Desktop */}
            <AnimatePresence>
              {showDesktopSidebar && (
              <motion.div
                  initial={{ x: -320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -320, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="hidden lg:block w-80 flex-shrink-0"
                >
                  <div className="sticky top-24 space-y-6">
                {/* Categories Section */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                    <h3 className="text-lg font-bold">Categories</h3>
                </div>
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ChefHat className="w-5 h-5" />
                      <span className="flex-1 text-left">All Items</span>
                      {selectedCategory === 'all' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </motion.button>

                    {categories.map((category) => {
                      const isSelected = selectedCategory === category._id;
                      return (
                        <motion.button
                        key={category._id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category._id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {category.icon && <span className="text-xl">{category.icon}</span>}
                          <span className="flex-1 text-left">{category.name}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range Section */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Price Range
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>LKR {priceRange[0]}</span>
                      <span>LKR {priceRange[1]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full h-2 bg-gradient-to-r from-indigo-200 to-indigo-500 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #e0e7ff 0%, #6366f1 ${(priceRange[1] / 10000) * 100}%, #e0e7ff ${(priceRange[1] / 10000) * 100}%, #e0e7ff 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Dietary Preferences Section */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Dietary Preferences
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {dietaryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleDietaryFilter(option.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                          dietaryFilters.includes(option.value)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span className="flex-1 text-left">{option.label}</span>
                        {dietaryFilters.includes(option.value) && (
                          <Star className="w-4 h-4 fill-current" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options Section */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      Sort By
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                          sortOrder === 'asc'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        ↑ Ascending
                      </button>
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                          sortOrder === 'desc'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        ↓ Descending
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(selectedCategory !== 'all' || dietaryFilters.length > 0 || priceRange[1] < 10000 || currentTimeSlot !== 'all') && (
                  <FoodButton
                    onClick={resetFilters}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                  >
                    Clear All Filters
                  </FoodButton>
                )}
                </div>
              </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Category Tabs */}
              <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-max">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    All Items
                  </motion.button>
                  {categories.map((cat) => (
                    <motion.button
                      key={cat._id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                        selectedCategory === cat._id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </motion.button>
                  ))}
                </div>
            </div>

              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filteredAndSortedItems.length} dishes found
                  </h2>
                  {searchTerm && (
                    <p className="text-gray-600 text-sm">
                      Results for "{searchTerm}"
                    </p>
                  )}
                </div>
              </div>

              {/* Menu Items Grid */}
              {error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Menu</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <FoodButton
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    Try Again
                  </FoodButton>
                </div>
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No dishes found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || selectedCategory !== 'all' || dietaryFilters.length > 0
                      ? 'Try adjusting your search or filter criteria'
                      : 'No menu items available at the moment'
                    }
                  </p>
                  {(searchTerm || selectedCategory !== 'all' || dietaryFilters.length > 0) && (
                    <FoodButton
                      onClick={resetFilters}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Clear Filters
                    </FoodButton>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {filteredAndSortedItems.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -8 }}
                      data-testid="menu-item"
                      className="group"
                    >
                      {/* Circular Plate Style Food Card */}
                      <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-center">
                        {/* Circular Image Container */}
                        <div className="relative w-full aspect-square mb-6">
                          {/* Circular Plate Background */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl"></div>
                          
                          {/* Food Image - Circular */}
                          <div className="absolute inset-0 rounded-full overflow-hidden border-8 border-white shadow-xl">
                            {item.image ? (
                              <img
                                src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`}
                                alt={item.name}
                                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                                style={{ objectFit: 'cover', objectPosition: 'center' }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/400?text=Food+Image';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                                <ChefHat className="w-20 h-20 text-indigo-300" />
                              </div>
                            )}
                          </div>

                          {/* Discount Badge - Top Left */}
                          {item.discount > 0 && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                              {item.discount}% OFF
                            </div>
                          )}

                          {/* Cart Button - Top Right (Black Circle like screenshot) */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.isAvailable}
                            className={`absolute top-2 right-2 p-3 rounded-full shadow-2xl transition-all ${
                              item.isAvailable
                                ? 'bg-gray-900 hover:bg-black text-white cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </motion.button>

                          {/* Out of Stock Badge */}
                          {item.isAvailable === false && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                              Out of Stock
                            </div>
                          )}
                        </div>

                        {/* Card Content - Simple & Clean */}
                        <div className="space-y-2">
                          {/* Food Name */}
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h3>

                          {/* Category */}
                          <p className="text-gray-600 text-sm">
                            {item.category?.name || 'Food'}
                          </p>

                          {/* Price */}
                          <div className="pt-2">
                            {item.discount > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-3xl font-bold text-gray-900">
                                  LKR {(item.price * (1 - item.discount / 100)).toFixed(0)}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  LKR {item.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-3xl font-bold text-gray-900">
                                LKR {item.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
            </div>

        {/* Mobile Filter Button - Only visible on mobile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden fixed bottom-24 right-6 z-30 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl"
        >
          <SlidersHorizontal className="w-6 h-6" />
          {(dietaryFilters.length > 0 || priceRange[1] < 10000 || selectedCategory !== 'all' || currentTimeSlot !== 'all') && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {(selectedCategory !== 'all' ? 1 : 0) + dietaryFilters.length + (priceRange[1] < 10000 ? 1 : 0) + (currentTimeSlot !== 'all' ? 1 : 0)}
            </span>
          )}
        </motion.button>
      </div>

      {/* Mobile Filter Drawer */}
            <AnimatePresence>
        {showMobileFilters && (
          <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
                  <motion.div
              initial={{ x: '100%' }}
                    animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto lg:hidden"
            >
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold">Filters</h2>
                      <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                  <X className="w-6 h-6" />
                      </button>
                    </div>

              <div className="p-6 space-y-6">
                    {/* Time Slot Filter */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Meal Time
                  </h3>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Day', icon: '🍽️' },
                      { value: 'breakfast', label: 'Breakfast (6-11 AM)', icon: '🍳' },
                      { value: 'lunch', label: 'Lunch (11 AM-4 PM)', icon: '🍽️' },
                      { value: 'dinner', label: 'Dinner (4-11 PM)', icon: '🌙' },
                      { value: 'snacks', label: 'Snacks & Late Night', icon: '☕' }
                    ].map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setCurrentTimeSlot(slot.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                          currentTimeSlot === slot.value
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-xl">{slot.icon}</span>
                        <span className="flex-1 text-left">{slot.label}</span>
                      </button>
                    ))}
                    </div>
                    </div>

                    {/* Categories */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Categories</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                            selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                      <ChefHat className="w-5 h-5" />
                      <span className="flex-1 text-left">All Items</span>
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category._id}
                            onClick={() => setSelectedCategory(category._id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                              selectedCategory === category._id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                        {category.icon && <span className="text-xl">{category.icon}</span>}
                        <span className="flex-1 text-left">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-500" />
                    Price Range
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>LKR {priceRange[0]}</span>
                          <span>LKR {priceRange[1]}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full h-2 bg-gradient-to-r from-indigo-200 to-indigo-500 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                {/* Dietary Preferences */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                    Dietary Preferences
                  </h3>
                      <div className="space-y-2">
                        {dietaryOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => toggleDietaryFilter(option.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                              dietaryFilters.includes(option.value)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span className="flex-1 text-left">{option.label}</span>
                        {dietaryFilters.includes(option.value) && (
                          <Star className="w-4 h-4 fill-current" />
                        )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                    Sort By
                  </h3>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white mb-3"
                        >
                          {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSortOrder('asc')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                              sortOrder === 'asc'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                      ↑ Ascending
                          </button>
                          <button
                            onClick={() => setSortOrder('desc')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                              sortOrder === 'desc'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                      ↓ Descending
                          </button>
                      </div>
                    </div>

                {/* Action Buttons */}
                <div className="flex gap-3 sticky bottom-0 bg-white pt-4 pb-2 border-t">
                  <button
                    onClick={() => {
                      resetFilters();
                      setShowMobileFilters(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
                    >
                      Apply Filters
                  </button>
                </div>
              </div>
                  </motion.div>
          </>
              )}
            </AnimatePresence>

      {/* Cart Dialog - Full Screen */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-y-auto"
            data-testid="cart-dialog"
          >
            <div className="min-h-screen">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-indigo-200 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowCart(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Menu</span>
                      </button>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Your Cart
                      </h1>
                </div>
                    <button
                      onClick={() => setShowCart(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Cart onCheckout={handleCheckout} onClose={() => setShowCart(false)} />
                </div>
                </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Dialog - Full Screen */}
      <AnimatePresence>
        {showCheckout && (
                    <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-y-auto"
            data-testid="checkout-dialog"
          >
            <div className="min-h-screen">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-indigo-200 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setShowCheckout(false);
                          setShowCart(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Cart</span>
                      </button>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Checkout
                      </h1>
                </div>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
          </div>
        </div>
      </div>

              {/* Content */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Checkout
            onClose={() => setShowCheckout(false)}
            onOrderComplete={handleOrderComplete}
          />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Complete Dialog */}
      {orderComplete && completedOrder && (
        <Dialog open={orderComplete} onOpenChange={setOrderComplete}>
          <DialogContent className="max-w-lg text-center bg-gradient-to-br from-indigo-50 to-purple-50" data-testid="order-complete">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6 relative z-10" />
            </div>
            <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Order Placed!</DialogTitle>
            <p className="text-gray-700 text-lg mb-2">Your order <span className="font-bold text-indigo-600">#{completedOrder._id?.substring(0, 8)}</span> has been successfully placed.</p>
            <p className="text-gray-600 mb-8">We'll notify you when it's ready for delivery.</p>
            <FoodButton onClick={handleBackToMenu} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
              Back to Menu
            </FoodButton>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GuestMenuPage;
