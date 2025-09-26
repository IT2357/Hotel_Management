import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import ModernCart from '../components/food/Cart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { CheckCircle, ArrowLeft, ShoppingCart, Search, Filter, Plus, Minus, Trash2, ChefHat, Clock, Star, Leaf, Flame, MapPin, Phone, Mail, Loader2, AlertCircle } from 'lucide-react';
import Checkout from '../components/food/Checkout';
import foodService from '../services/foodService';
import { CartProvider, useCart } from '../context/CartContext';

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
  const { addToCart, getItemCount } = useCart();
  const navigate = useNavigate();

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await foodService.getMenuItems({
          isAvailable: true // Only show available items for guests
        });
        setMenuItems(response.data || []);
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

  // Use real data if available, otherwise show empty state
  const displayMenuItems = menuItems;

  const categories = ['all', ...new Set(displayMenuItems.map(item => item.category))];

  const filteredItems = displayMenuItems.filter(item => {
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center"
          >
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Order Placed Successfully!</h1>
              <p className="text-gray-300">Thank you for your order. We'll start preparing it right away.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 text-left border border-white/10">
              <h3 className="font-semibold mb-4 text-white">Order Details:</h3>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-white">Order ID:</strong> {completedOrder.orderId}</p>
                <p><strong className="text-white">Total:</strong> ${completedOrder.total.toFixed(2)}</p>
                <p><strong className="text-white">Type:</strong> {completedOrder.isTakeaway ? 'Takeaway' : 'Dine-in'}</p>
                <p><strong className="text-white">Items:</strong> {completedOrder.items.length}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleBackToMenu}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Culinary Excellence</h1>
                <p className="text-gray-400 text-sm">Premium Dining Experience</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">123 Culinary Street</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/cart')}
                className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <ShoppingCart className="w-6 h-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {getItemCount()}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search delicious dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span className="text-gray-300 text-lg">Loading delicious dishes...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Menu Items Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
                    className="group relative bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                        }}
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {item.isPopular && (
                          <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full font-medium">
                            ⭐ Popular
                          </span>
                        )}
                        <div className="flex gap-1">
                          {item.isVeg && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                              🥬 Veg
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                              🌶️ Spicy
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating - Mock for now */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-white text-xs font-medium">4.{Math.floor(Math.random() * 5) + 5}</span>
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-3 left-3">
                        <span className="text-2xl font-bold text-white">
                          ${parseFloat(item.price).toFixed(2)}
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
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                          {item.name}
                        </h3>
                      </div>

                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Ingredients */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.ingredients || []).slice(0, 3).map((ingredient, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
                              {ingredient}
                            </span>
                          ))}
                          {(item.ingredients || []).length > 3 && (
                            <span className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
                              +{(item.ingredients || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddToCart(item)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Cart
                      </motion.button>
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
          >
            <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-red-300 mb-2">
              Failed to load menu
            </h3>
            <p className="text-red-400 mb-6">
              {error}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ChefHat className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'No dishes found' : 'Menu is empty'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or category filter'
                : 'The menu will be updated soon with delicious dishes'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Modern Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Your Cart
            </DialogTitle>
          </DialogHeader>
          <ModernCart onCheckout={handleCheckout} onClose={handleCloseCart} />
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-800 to-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Checkout</DialogTitle>
          </DialogHeader>
          <Checkout
            onClose={() => setShowCheckout(false)}
            onOrderComplete={handleOrderComplete}
          />
        </DialogContent>
      </Dialog>
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