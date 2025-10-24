import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/shared/SharedNavbar';
import FoodButton from '../components/food/FoodButton';
import FoodCard from '../components/food/FoodCard';
import { SwiggyCart as Cart } from '../features/food-modernize/components';
import FoodBadge from '../components/food/FoodBadge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../components/food/FoodDialog';
import { 
  CheckCircle, ArrowLeft, ShoppingCart, Search, Filter, Plus, Minus, Trash2, 
  ChefHat, Clock, Star, Leaf, Flame, MapPin, Phone, Mail, Loader2, AlertCircle,
  Heart, Share2, Eye, Award, Users, Truck, Shield, Zap
} from 'lucide-react';
import Checkout from '../components/food/Checkout';
import OrderConfirmationPage from './OrderConfirmationPage';
import { useCart, CartProvider } from '../context/CartContext';
import foodService from '../services/foodService';

// Get API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : (window.location.origin.includes('localhost') ? 'http://localhost:5002' : window.location.origin);

const ModernFoodOrderingPageContent = () => {
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const { addToCart, getItemCount, items } = useCart();
  const navigate = useNavigate();

  // Debugging: Log cart state changes
  useEffect(() => {
    console.log('Cart items changed:', items);
    console.log('Cart item count:', getItemCount());
  }, [items, getItemCount]);

  // Debugging: Log showCart state changes
  useEffect(() => {
    console.log('showCart state changed:', showCart);
  }, [showCart]);

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await foodService.getMenuItems({
          isAvailable: true
        });
        
        // Handle response format (could be direct array or paginated)
        let items = [];
        if (response.data && response.data.items) {
          // Paginated response format
          items = response.data.items;
        } else if (Array.isArray(response.data)) {
          // Direct array format
          items = response.data;
        }

        // Add proper image URLs
        const itemsWithImages = items.map(item => ({
          ...item,
          imageUrl: item.imageUrl || 
                    (item.imageId ? `${API_BASE_URL}/api/menu/image/${item.imageId}` : null) ||
                    (item.image && item.image.startsWith('http') ? item.image : null) ||
                    (item.image && item.image.startsWith('/api/') ? `${API_BASE_URL}${item.image}` : null) ||
                    item.image ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
        }));

        setMenuItems(itemsWithImages);
        
        // Set featured items (first 6 items or items marked as popular)
        const featured = itemsWithImages.filter(item => item.isPopular).slice(0, 6);
        if (featured.length < 6) {
          const additional = itemsWithImages.slice(0, 6 - featured.length);
          setFeaturedItems([...featured, ...additional]);
        } else {
          setFeaturedItems(featured);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu items');
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Create unique categories list
  const categoryMap = new Map();
  menuItems.forEach(item => {
    if (item.category) {
      const catId = typeof item.category === 'object' ? item.category._id : item.category;
      const catName = typeof item.category === 'object' ? item.category.name : item.category;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, catName);
      }
    }
  });
  const categories = ['all', ...Array.from(categoryMap.keys())];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const itemCategoryId = typeof item.category === 'object' ? item.category._id : item.category;
    const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (item) => {
    addToCart(item);
    // Show success feedback
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right duration-300';
    notification.innerHTML = `
      <CheckCircle className="w-5 h-5" />
      <span class="font-medium">${item.name} added to cart!</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleOrderComplete = (order) => {
    setCompletedOrder(order);
    setShowCheckout(false);
    setOrderComplete(true);
  };

  const handleBackToMenu = () => {
    setOrderComplete(false);
    setCompletedOrder(null);
  };

  const handleCloseCart = () => {
    setShowCart(false);
  };

  if (orderComplete && completedOrder) {
    return (
      <OrderConfirmationPage
        order={completedOrder}
        onBackToMenu={handleBackToMenu}
        onContinueShopping={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 sm:pb-0" data-testid="food-ordering-page">
      <SharedNavbar showBackButton={true} backPath="/" />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10">
      <motion.div
            initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Authentic Jaffna Cuisine
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Experience the rich flavors of Northern Sri Lanka with our traditional recipes passed down through generations
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6" />
                <span className="text-lg font-semibold">50+ Years</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-lg font-semibold">10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6" />
                <span className="text-lg font-semibold">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-lg font-semibold">100% Halal</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <FoodButton
                onClick={() => setShowCart(true)}
                className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                View Cart ({getItemCount()})
              </FoodButton>
              <FoodButton
                onClick={() => document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-orange-500 px-8 py-4 text-lg font-semibold rounded-2xl"
              >
                <Eye className="w-5 h-5 mr-2" />
                Browse Menu
              </FoodButton>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/15 rounded-full"></div>
      </section>

        {/* Search and Filter Section */}
      <section className="bg-gray-50 py-8 sticky top-16 z-40">
        <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
        >
            <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
              <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                  placeholder="Search for your favorite Jaffna dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm"
                  data-testid="search-input"
              />
            </div>

            {/* Category Filter */}
              <div className="flex flex-wrap gap-2" data-testid="category-filter">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                        ? 'bg-orange-500 text-white shadow-lg hover:bg-orange-600'
                        : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : (categoryMap.get(category) || category)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
        </div>
      </section>

      {/* Featured Items Section */}
      {featuredItems.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Featured Dishes</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our most popular and highly recommended Jaffna specialties
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item, index) => (
                <motion.div
                  key={item._id || item.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <FoodBadge variant="popular" size="sm">
                        ⭐ Featured
                      </FoodBadge>
                      {item.isVeg && (
                        <FoodBadge variant="success" size="sm">
                          🥬 Vegetarian
                        </FoodBadge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="absolute bottom-4 left-4">
                      <span className="text-2xl font-bold text-white bg-orange-500 px-3 py-1 rounded-lg">
                        LKR {parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Heart className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Share2 className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">4.{Math.floor(Math.random() * 5) + 5}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{item.cookingTime || 15} min</span>
                      </div>
                      <FoodButton
                        onClick={() => handleAddToCart(item)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Cart
                      </FoodButton>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full Menu Section */}
      <section id="menu-section" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Complete Menu</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our full collection of authentic Jaffna dishes
            </p>
          </motion.div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-6" data-testid="loading-skeleton">
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <span className="text-gray-600 text-lg font-medium">Loading delicious Jaffna dishes...</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                    <div className="h-56 bg-gray-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <>
            {/* Menu Items Grid */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
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
                    transition={{ delay: index * 0.05 }}
                      className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                      data-testid="menu-item"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={item.imageUrl || item.image}
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
                          <FoodBadge variant="popular" size="sm">
                            ⭐ Popular
                          </FoodBadge>
                        )}
                        <div className="flex gap-1">
                          {item.isVeg && (
                            <FoodBadge variant="success" size="sm">
                              🥬 Veg
                            </FoodBadge>
                          )}
                          {item.isSpicy && (
                            <FoodBadge variant="spicy" size="sm">
                              🌶️ Spicy
                            </FoodBadge>
                          )}
                        </div>
                      </div>

                        {/* Rating */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-white text-xs font-medium">4.{Math.floor(Math.random() * 5) + 5}</span>
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-3 left-3">
                          <span className="text-xl font-bold text-white bg-orange-500 px-2 py-1 rounded-lg">
                            LKR {parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>

                      {/* Cooking Time */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-white text-xs">{item.cookingTime || 15} min</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-500 transition-colors">
                          {item.name}
                        </h3>
                      </div>

                        <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {/* Ingredients */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.ingredients || []).slice(0, 3).map((ingredient, idx) => (
                            <FoodBadge key={idx} variant="default" size="sm">
                              {ingredient}
                            </FoodBadge>
                          ))}
                          {(item.ingredients || []).length > 3 && (
                            <FoodBadge variant="default" size="sm">
                              +{(item.ingredients || []).length - 3} more
                            </FoodBadge>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <FoodButton
                        onClick={() => handleAddToCart(item)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                          data-testid="add-to-cart"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </FoodButton>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
              data-testid="error-message"
          >
              <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Failed to load menu
            </h3>
              <p className="text-red-500 mb-6">
              {error}
            </p>
            <FoodButton
              onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Try Again
            </FoodButton>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
              data-testid="empty-menu"
            >
              <ChefHat className="w-20 h-20 text-orange-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm || selectedCategory !== 'all' ? 'No Jaffna dishes found' : 'Menu is empty'}
            </h3>
              <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or category filter'
                  : 'The menu will be updated soon with delicious Jaffna dishes'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <FoodButton
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Clear Filters
              </FoodButton>
            )}
          </motion.div>
        )}
      </div>
      </section>

      {/* Floating Cart Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300"
      >
        <ShoppingCart className="w-6 h-6" />
        {getItemCount() > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {getItemCount()}
          </span>
        )}
      </motion.button>

      {/* Modern Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl" data-testid="cart-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Your Cart
            </DialogTitle>
          </DialogHeader>
          <Cart onCheckout={handleCheckout} onClose={handleCloseCart} />
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="checkout-dialog">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <Checkout
            onClose={() => setShowCheckout(false)}
            onOrderComplete={handleOrderComplete}
          />
        </DialogContent>
      </Dialog>

      {/* Order Complete Dialog */}
      {orderComplete && completedOrder && (
        <Dialog open={orderComplete} onOpenChange={setOrderComplete}>
          <DialogContent className="max-w-md text-center" data-testid="order-complete">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <DialogTitle className="text-3xl font-bold text-gray-800 mb-3">Order Placed!</DialogTitle>
            <p className="text-gray-600 mb-4">Your order <span className="font-semibold">#{completedOrder._id?.substring(0, 8)}</span> has been successfully placed.</p>
            <p className="text-gray-600 mb-6">We'll notify you when it's ready.</p>
            <FoodButton onClick={handleBackToMenu} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold">
              Back to Menu
            </FoodButton>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg sm:hidden z-40">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setShowCart(true)}
            className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Cart</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <Filter className="w-6 h-6" />
            <span className="text-xs mt-1">Filter</span>
          </button>
          
          <button
            onClick={() => setSearchTerm('')}
            className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <Search className="w-6 h-6" />
            <span className="text-xs mt-1">Search</span>
          </button>
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ChefHat className="w-6 h-6" />
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const FoodOrderingPage = () => {
  return (
    <CartProvider>
      <ModernFoodOrderingPageContent />
    </CartProvider>
  );
};

export default FoodOrderingPage;