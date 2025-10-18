import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  ChefHat, 
  Star, 
  Plus, 
  Minus, 
  ShoppingCart,
  CheckCircle,
  Search,
  Filter,
  MapPin,
  Calendar
} from 'lucide-react';
import FoodButton from '../../components/food/FoodButton';
import FoodCard, { FoodCardContent, FoodCardHeader, FoodCardTitle } from '../../components/food/FoodCard';
import FoodBadge from '../../components/food/FoodBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/food/FoodDialog';
import { useCart } from '../../context/CartContext';
import foodService from '../../services/foodService';

const BookingFoodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, removeFromCart, getItemCount, getTotal, clearCart } = useCart();
  
  // Get booking data from location state
  const bookingData = location.state?.bookingData || {};
  const selectedMealTimes = location.state?.selectedMealTimes || [];
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMealTime, setSelectedMealTime] = useState(selectedMealTimes[0] || 'breakfast');
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState({});

  // Meal time configurations
  const mealTimes = [
    { 
      value: 'breakfast', 
      label: 'Breakfast', 
      time: '6:00 AM - 11:00 AM',
      icon: '🌅',
      color: 'from-yellow-400 to-orange-500'
    },
    { 
      value: 'lunch', 
      label: 'Lunch', 
      time: '12:00 PM - 3:00 PM',
      icon: '☀️',
      color: 'from-orange-400 to-red-500'
    },
    { 
      value: 'dinner', 
      label: 'Dinner', 
      time: '6:00 PM - 10:00 PM',
      icon: '🌙',
      color: 'from-purple-400 to-indigo-500'
    },
    { 
      value: 'snacks', 
      label: 'Snacks', 
      time: 'All Day',
      icon: '🍿',
      color: 'from-green-400 to-teal-500'
    }
  ];

  // Fetch menu items and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [itemsResponse, categoriesResponse] = await Promise.all([
          foodService.getMenuItems({ 
            isAvailable: true,
            mealTime: selectedMealTime
          }),
          foodService.getCategories()
        ]);
        
        setMenuItems(itemsResponse.data || []);
        setCategories(categoriesResponse.data || []);
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
  }, [selectedMealTime]);

  // Filter menu items
  const filteredItems = React.useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
                             (typeof item.category === 'object' ? item.category._id : item.category) === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  // Handle add to cart
  const handleAddToCart = (item) => {
    const cartKey = `${selectedMealTime}-${item._id}`;
    const currentQuantity = cartItems[cartKey] || 0;
    
    setCartItems(prev => ({
      ...prev,
      [cartKey]: currentQuantity + 1
    }));
    
    addToCart({
      ...item,
      mealTime: selectedMealTime,
      cartKey
    });
  };

  // Handle remove from cart
  const handleRemoveFromCart = (item) => {
    const cartKey = `${selectedMealTime}-${item._id}`;
    const currentQuantity = cartItems[cartKey] || 0;
    
    if (currentQuantity > 1) {
      setCartItems(prev => ({
        ...prev,
        [cartKey]: currentQuantity - 1
      }));
    } else {
      setCartItems(prev => {
        const newCart = { ...prev };
        delete newCart[cartKey];
        return newCart;
      });
    }
    
    removeFromCart(cartKey);
  };

  // Get cart count for specific meal time
  const getMealTimeCartCount = (mealTime) => {
    return Object.keys(cartItems).filter(key => key.startsWith(`${mealTime}-`))
      .reduce((total, key) => total + cartItems[key], 0);
  };

  // Handle proceed to booking
  const handleProceedToBooking = () => {
    const foodSelections = Object.keys(cartItems).map(key => {
      const [mealTime, itemId] = key.split('-');
      const item = menuItems.find(i => i._id === itemId);
      return {
        mealTime,
        itemId,
        item,
        quantity: cartItems[key]
      };
    });

    navigate('/guest-booking-flow', {
      state: {
        ...bookingData,
        foodSelections,
        foodTotal: getTotal()
      }
    });
  };

  // Handle back to booking
  const handleBackToBooking = () => {
    navigate('/guest-booking-flow', {
      state: {
        ...bookingData,
        step: 3 // Go back to booking details step
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
            <p className="text-[#4A4A4A] text-lg">Loading delicious menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FoodButton
                variant="ghost"
                onClick={handleBackToBooking}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </FoodButton>
              <div>
                <h1 className="text-2xl font-bold text-[#4A4A4A]">Select Your Meals</h1>
                <p className="text-[#4A4A4A]/70 text-sm">Choose your preferred meals for your stay</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <FoodButton
                onClick={() => setShowCart(true)}
                className="bg-[#FF9933] hover:bg-[#CC7A29] text-white relative"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </FoodButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-[#FF9933] to-[#CC7A29] text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Check-in</h3>
                    <p className="text-sm opacity-90">
                      {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString() : 'Not selected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Check-out</h3>
                    <p className="text-sm opacity-90">
                      {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString() : 'Not selected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Room</h3>
                    <p className="text-sm opacity-90">
                      {bookingData.roomTitle || 'Not selected'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Meal Time Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-[#4A4A4A] mb-4">Select Meal Time</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mealTimes.map((meal) => (
              <button
                key={meal.value}
                onClick={() => setSelectedMealTime(meal.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMealTime === meal.value
                    ? 'border-[#FF9933] bg-[#FF9933]/5'
                    : 'border-gray-200 hover:border-[#FF9933]/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{meal.icon}</div>
                  <h3 className="font-semibold text-[#4A4A4A]">{meal.label}</h3>
                  <p className="text-sm text-[#4A4A4A]/70">{meal.time}</p>
                  {getMealTimeCartCount(meal.value) > 0 && (
                    <div className="mt-2">
                      <FoodBadge variant="success" className="text-xs">
                        {getMealTimeCartCount(meal.value)} items
                      </FoodBadge>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A4A4A]/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Menu Items */}
        {error ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#4A4A4A] mb-2">Error Loading Menu</h3>
            <p className="text-[#4A4A4A]/70 mb-6">{error}</p>
            <FoodButton
              onClick={() => window.location.reload()}
              className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
            >
              Try Again
            </FoodButton>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-20 h-20 text-[#FF9933] mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-[#4A4A4A] mb-2">No dishes available</h3>
            <p className="text-[#4A4A4A]/70 mb-6">
              No dishes available for {mealTimes.find(m => m.value === selectedMealTime)?.label} at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const cartKey = `${selectedMealTime}-${item._id}`;
              const quantity = cartItems[cartKey] || 0;
              
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                        <ChefHat className="w-16 h-16 text-[#FF9933]" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <FoodBadge
                        variant={item.isAvailable ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </FoodBadge>
                    </div>
                  </div>

                  {/* Content */}
                  <FoodCardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-[#4A4A4A] line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-xl font-bold text-[#FF9933]">
                        LKR {parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-[#4A4A4A]/70 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.isVeg && <FoodBadge variant="outline" className="text-xs">🌱 Veg</FoodBadge>}
                      {item.isSpicy && <FoodBadge variant="outline" className="text-xs">🌶️ Spicy</FoodBadge>}
                      {item.isPopular && <FoodBadge variant="outline" className="text-xs">⭐ Popular</FoodBadge>}
                      {item.cookingTime && (
                        <FoodBadge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.cookingTime}min
                        </FoodBadge>
                      )}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      {quantity > 0 ? (
                        <div className="flex items-center gap-3">
                          <FoodButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item)}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </FoodButton>
                          <span className="text-lg font-semibold text-[#4A4A4A] min-w-[2rem] text-center">
                            {quantity}
                          </span>
                          <FoodButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </FoodButton>
                        </div>
                      ) : (
                        <FoodButton
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.isAvailable}
                          className="bg-[#FF9933] hover:bg-[#CC7A29] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                        </FoodButton>
                      )}
                    </div>
                  </FoodCardContent>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Proceed Button */}
        {getItemCount() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <FoodButton
              onClick={handleProceedToBooking}
              className="bg-[#FF9933] hover:bg-[#CC7A29] text-white px-8 py-4 text-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Proceed to Booking (LKR {getTotal().toFixed(2)})
            </FoodButton>
          </motion.div>
        )}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Food Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.keys(cartItems).map(key => {
              const [mealTime, itemId] = key.split('-');
              const item = menuItems.find(i => i._id === itemId);
              const quantity = cartItems[key];
              
              if (!item) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#4A4A4A]">{item.name}</h4>
                    <p className="text-sm text-[#4A4A4A]/70">
                      {mealTimes.find(m => m.value === mealTime)?.label} • Qty: {quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#FF9933]">
                      LKR {(parseFloat(item.price) * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(cartItems).length === 0 && (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-[#4A4A4A]/70">Your cart is empty</p>
              </div>
            )}
            
            {Object.keys(cartItems).length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#4A4A4A]">Total:</span>
                  <span className="text-xl font-bold text-[#FF9933]">LKR {getTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingFoodSelection;
