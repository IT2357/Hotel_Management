import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../../components/shared/SharedNavbar';
import FoodButton from '../../components/food/FoodButton';
import Cart from '../../components/food/Cart';
import Checkout from '../../components/food/Checkout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/food/FoodDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  CheckCircle, 
  ShoppingCart, 
  Search, 
  Plus, 
  ChefHat, 
  Clock, 
  Star, 
  Leaf, 
  Flame, 
  Loader2, 
  AlertCircle,
  X,
  Heart,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  LayoutGrid
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import foodService from '../../services/foodService';
import offerService from '../../services/offerService';

// API Base URL for image paths
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EnhancedGuestMenuPage = () => {
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [activeOffer, setActiveOffer] = useState(null);
  
  const { addToCart, getItemCount } = useCart();
  const navigate = useNavigate();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch menu items and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [itemsResponse, categoriesResponse] = await Promise.all([
          foodService.getMenuItems({ isAvailable: true }),
          foodService.getCategories()
        ]);
        
        const items = itemsResponse.data?.data || itemsResponse.data || [];
        const cats = categoriesResponse.data?.data || categoriesResponse.data || [];
        
        setMenuItems(items);
        setCategories(cats);
        
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

  // Filter menu items
  const filteredItems = useMemo(() => {
    if (!menuItems.length) return [];
    
    return menuItems.filter(item => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !searchLower || 
                           item.name.toLowerCase().includes(searchLower) ||
                           item.description?.toLowerCase().includes(searchLower);
      
      const itemCategoryId = (item.category && typeof item.category === 'object' && item.category !== null && item.category?._id) 
        ? item.category._id 
        : item.category;
      const matchesCategory = selectedCategory === 'all' || (itemCategoryId && itemCategoryId === selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, debouncedSearchTerm, selectedCategory]);

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
  }, [addToCart]);

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleOrderComplete = (order) => {
    setCompletedOrder(order);
    setOrderComplete(true);
    setShowCheckout(false);
  };

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

  // Enhanced Food Card Component
  const EnhancedFoodCard = ({ item }) => {
    const originalPrice = parseFloat(item.price || 0);
    const discountedPrice = (originalPrice * 0.95).toFixed(2);
    const isFavorite = favorites.has(item._id);

    // Build proper image URL
    const getImageUrl = () => {
      if (item.imageUrl) {
        if (item.imageUrl.startsWith('http')) return item.imageUrl;
        if (item.imageUrl.startsWith('/')) {
          // Convert old /api/menu/image/ paths to new /api/images/ format
          const normalizedPath = item.imageUrl.replace('/api/menu/image/', '/api/images/');
          return `${API_BASE_URL}${normalizedPath}`;
        }
        return item.imageUrl;
      }
      if (item.image) {
        if (item.image.startsWith('http')) return item.image;
        if (item.image.startsWith('/api/')) {
          // Convert old /api/menu/image/ paths to new /api/images/ format
          const normalizedPath = item.image.replace('/api/menu/image/', '/api/images/');
          return `${API_BASE_URL}${normalizedPath}`;
        }
        if (!item.image.startsWith('/')) return `${API_BASE_URL}/api/images/${item.image}`;
        return `${API_BASE_URL}${item.image}`;
      }
      return null;
    };

    const imageSrc = getImageUrl();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -8 }}
        className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
      >
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                console.error('Image load error:', imageSrc);
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.placeholder-icon')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`placeholder-icon w-full h-full flex items-center justify-center absolute inset-0 ${imageSrc ? 'hidden' : ''}`}>
            <ChefHat className="w-20 h-20 text-orange-300" />
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {item.isPopular && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
              >
                <Star className="w-3 h-3 fill-white" />
                Popular
              </motion.div>
            )}
            {item.isVeg && (
              <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                <Leaf className="w-3 h-3" />
                Veg
              </div>
            )}
            {item.isSpicy && (
              <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                <Flame className="w-3 h-3" />
                Spicy
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item._id);
            }}
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 shadow-lg group/fav"
          >
            <Heart 
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorite 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-600 group-hover/fav:text-red-500'
              }`} 
            />
          </button>

          {/* Discount Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              5% OFF
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">
            {item.name_english || item.nameEnglish || item.name}
          </h3>
          
          {/* Tamil Name */}
          {(item.name_tamil || item.nameTamil) && (
            <p className="text-sm text-gray-600 mb-3 font-medium">
              {item.name_tamil || item.nameTamil}
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {item.description_english || item.descriptionEnglish || item.description || 'Delicious dish prepared with authentic flavors'}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            {(item.preparationTime || item.cookingTime) && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{item.preparationTime || item.cookingTime} min</span>
              </div>
            )}
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-600">
                  LKR {discountedPrice}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  LKR {originalPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-green-600 font-medium mt-1">
                Save LKR {(originalPrice - discountedPrice).toFixed(2)}
              </p>
            </div>

            <FoodButton
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={item.isAvailable === false}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </FoodButton>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <SharedNavbar showBackButton={true} backPath="/" />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-900 text-xl font-medium">Loading delicious menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <SharedNavbar showBackButton={true} backPath="/" />
      
      {/* Hero Section */}
      <div className="relative pt-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            >
              <Award className="w-4 h-4" />
              Authentic Jaffna Cuisine
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Discover Our
              </span>
              <br />
              <span className="text-gray-900">Delicious Menu</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Experience the rich flavors of traditional Jaffna dishes with our modern twist. 
              Every meal is crafted with love and authentic spices.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search for your favorite dish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 bg-white shadow-xl text-lg transition-all duration-300"
                />
              </div>
            </motion.div>

            {/* Cart Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              <FoodButton
                onClick={() => setShowCart(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 relative"
              >
                <ShoppingCart className="w-6 h-6 mr-2 inline" />
                View Cart
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-sm rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg animate-bounce">
                    {getItemCount()}
                  </span>
                )}
              </FoodButton>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-y border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              All Items ({menuItems.length})
            </motion.button>
            {categories.map((category) => (
              <motion.button
                key={category._id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category._id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category._id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Results Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {filteredItems.length} Delicious Dishes
          </h2>
          <p className="text-gray-600">
            {selectedCategory === 'all' ? 'Explore our complete menu' : `${categories.find(c => c._id === selectedCategory)?.name} dishes`}
          </p>
        </motion.div>

        {/* Grid */}
        {error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h3>
            <p className="text-gray-600 mb-8">{error}</p>
            <FoodButton
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold"
            >
              Try Again
            </FoodButton>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-24 h-24 text-indigo-300 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No dishes found</h3>
            <p className="text-gray-600 mb-8">
              {searchTerm ? 'Try adjusting your search terms' : 'No menu items available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <EnhancedFoodCard key={item._id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cart Dialog - Full screen on mobile, large modal on desktop */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[95vh] p-0 sm:p-6 m-0 sm:m-4 sm:rounded-2xl overflow-y-auto">
          <div className="p-4 sm:p-0">
            <DialogHeader className="sr-only sm:not-sr-only">
              <DialogTitle className="text-xl sm:text-2xl">Your Cart</DialogTitle>
            </DialogHeader>
            <Cart onCheckout={handleCheckout} onClose={() => setShowCart(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog - Full screen on mobile, extra large modal on desktop */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[95vh] p-0 sm:p-6 m-0 sm:m-4 sm:rounded-2xl overflow-y-auto">
          <div className="h-full sm:h-auto">
            <DialogHeader className="sr-only sm:not-sr-only px-4 sm:px-0 pt-4 sm:pt-0">
              <DialogTitle className="text-xl sm:text-2xl">Checkout</DialogTitle>
            </DialogHeader>
            <Checkout
              onClose={() => setShowCheckout(false)}
              onOrderComplete={handleOrderComplete}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Complete Dialog */}
      {orderComplete && completedOrder && (
        <Dialog open={orderComplete} onOpenChange={setOrderComplete}>
          <DialogContent className="max-w-md text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            <DialogTitle className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </DialogTitle>
            <p className="text-gray-600 mb-2">
              Order ID: <span className="font-semibold">#{completedOrder._id?.substring(0, 8)}</span>
            </p>
            <p className="text-gray-600 mb-8">
              We'll notify you when your order is ready for pickup or delivery.
            </p>
            <FoodButton 
              onClick={() => {
                setOrderComplete(false);
                setCompletedOrder(null);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold w-full"
            >
              Continue Browsing
            </FoodButton>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedGuestMenuPage;

