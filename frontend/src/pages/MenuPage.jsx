import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/shared/SharedNavbar';
import FoodButton from '../components/food/FoodButton';
import FoodCard from '../components/food/FoodCard';
import EnhancedFoodCard from '../components/food/EnhancedFoodCard';
import OfferBanner from '../components/food/OfferBanner';
import FoodBadge from '../components/food/FoodBadge';
import { 
  Search, ChefHat, Clock, Star, Loader2, AlertCircle,
  Plus, ShoppingCart, Award, Eye, Filter, X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import foodService from '../services/foodService';
import offerService from '../services/offerService';
import { toast } from 'sonner';

// Get API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin);

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [isApplyingOffer, setIsApplyingOffer] = useState(false);
  const { addToCart, getItemCount } = useCart();
  const navigate = useNavigate();

  // Fetch menu items and categories
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both menu items and categories
        const [itemsResponse, categoriesResponse] = await Promise.all([
          foodService.getMenuItems({ isAvailable: true }),
          foodService.getCategories()
        ]);

        // Handle items response (check for pagination format)
        let items = [];
        if (itemsResponse.data && itemsResponse.data.items) {
          // Paginated response format
          items = itemsResponse.data.items;
        } else if (Array.isArray(itemsResponse.data)) {
          // Direct array format
          items = itemsResponse.data;
        } else {
          items = [];
        }

        // Add proper image URLs
        const itemsWithImages = items.map(item => ({
          ...item,
          imageUrl: item.imageUrl || 
                    (item.imageId ? `${API_BASE_URL}/api/menu/image/${item.imageId}` : null) ||
                    (item.image && item.image.startsWith('http') ? item.image : null) ||
                    `${API_BASE_URL}${item.image}` ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
        }));

        setMenuItems(itemsWithImages);
        setCategories(categoriesResponse.data?.data || categoriesResponse.data || []);

        // Fetch active offers
        try {
          const offersResponse = await offerService.getPersonalizedOffers();
          if (offersResponse.success && offersResponse.data && offersResponse.data.length > 0) {
            setActiveOffer(offersResponse.data[0]);
          }
        } catch (offerError) {
          console.log('ℹ️ No active offers available');
        }
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu items');
        setMenuItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Filter menu items based on search, category, and dietary preferences
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ingredients?.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const itemCategoryId = typeof item.category === 'object' ? item.category._id : item.category;
      const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory;

      // Dietary filter
      let matchesDietary = true;
      if (selectedDietary !== 'all') {
        switch (selectedDietary) {
          case 'veg':
            matchesDietary = item.isVeg === true;
            break;
          case 'non-veg':
            matchesDietary = item.isVeg === false;
            break;
          case 'spicy':
            matchesDietary = item.isSpicy === true;
            break;
          case 'halal':
            matchesDietary = item.dietaryTags?.includes('Halal');
            break;
          default:
            matchesDietary = true;
        }
      }

      return matchesSearch && matchesCategory && matchesDietary;
    });
  }, [menuItems, searchTerm, selectedCategory, selectedDietary]);

  // Handle add to cart with visual feedback
  const handleAddToCart = (item) => {
    addToCart(item);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right duration-300';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <span class="font-medium">${item.name} added to cart!</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  // Handle view cart
  const handleViewCart = () => {
    navigate('/food-ordering');
  };

  // Handle claim/apply offer
  const handleApplyOffer = async (offer) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="menu-page">
      <SharedNavbar showBackButton={true} backPath="/" />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
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
                <Eye className="w-6 h-6" />
                <span className="text-lg font-semibold">100% Halal</span>
              </div>
            </div>

            {/* View Cart Button */}
            {getItemCount() > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block"
              >
                <FoodButton
                  onClick={handleViewCart}
                  className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  View Cart ({getItemCount()})
                </FoodButton>
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
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(selectedCategory !== 'all' || selectedDietary !== 'all') && (
                  <FoodBadge variant="primary" size="sm">Active</FoodBadge>
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
                {categories.map((cat) => (
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
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <FoodButton
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedDietary('all');
                          setSearchTerm('');
                          setShowFilters(false);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear All Filters
                      </FoodButton>
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
          {/* Offer Banner */}
          {activeOffer && (
            <OfferBanner 
              offer={activeOffer} 
              onApply={handleApplyOffer} 
              isLoading={isApplyingOffer} 
            />
          )}

          {/* Results Count */}
          {!loading && !error && (
            <div className="mb-6">
              <p className="text-gray-600 text-center">
                Showing <span className="font-semibold text-orange-500">{filteredItems.length}</span> 
                {' '}of {menuItems.length} dishes
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-20" data-testid="loading-state">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                <p className="text-gray-600 text-lg font-medium">Loading authentic Jaffna dishes...</p>
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
              <p className="text-red-500 mb-6">{error}</p>
              <FoodButton
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Try Again
              </FoodButton>
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
                    data-testid="menu-item"
                  >
                    <EnhancedFoodCard
                      item={item}
                      onAddToCart={handleAddToCart}
                      showDiscount={true}
                    />
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
                Try adjusting your search or filter preferences
              </p>
              <FoodButton
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedDietary('all');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Clear All Filters
              </FoodButton>
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
          onClick={handleViewCart}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300 flex items-center justify-center"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {getItemCount()}
          </span>
        </motion.button>
      )}
    </div>
  );
};

export default MenuPage;
