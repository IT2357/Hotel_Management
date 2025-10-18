import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../../components/shared/SharedNavbar';
import FoodButton from '../../components/food/FoodButton';
import FoodCard, { FoodCardContent, FoodCardHeader, FoodCardTitle } from '../../components/food/FoodCard';
import Cart from '../../components/food/Cart';
import FoodBadge from '../../components/food/FoodBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/food/FoodDialog';
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
  Eye
} from 'lucide-react';
import Checkout from '../../components/food/Checkout';
import { useCart } from '../../context/CartContext';
import foodService from '../../services/foodService';

const GuestMenuPage = () => {
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [viewedItems, setViewedItems] = useState(new Set());
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const { addToCart, getItemCount } = useCart();
  const navigate = useNavigate();

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
  }, []);

  // Filter and sort menu items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = menuItems.filter(item => {
      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
                             (typeof item.category === 'object' ? item.category._id : item.category) === selectedCategory;
      
      // Price filter
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      
      // Dietary filters
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
      
      return matchesSearch && matchesCategory && matchesPrice && matchesDietary && matchesAvailability;
    });

    // Sort items
    filtered.sort((a, b) => {
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
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [menuItems, searchTerm, selectedCategory, priceRange, dietaryFilters, availabilityFilter, sortBy, sortOrder]);

  // Handle add to cart
  const handleAddToCart = (item) => {
    addToCart(item);
    setViewedItems(prev => new Set([...prev, item._id]));
  };

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

  // Handle dietary filter toggle
  const toggleDietaryFilter = (filter) => {
    setDietaryFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange([0, 10000]);
    setDietaryFilters([]);
    setAvailabilityFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <SharedNavbar showBackButton={true} backPath="/" />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#FF9933] mx-auto mb-4" />
            <p className="text-[#4A4A4A] text-lg">Loading delicious menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Navigation */}
      <SharedNavbar showBackButton={true} backPath="/" />
      
      <div className="pt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#FF9933] to-[#FFFFFF] backdrop-blur-sm border-b border-[#FF9933]/30 sticky top-16 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#4A4A4A] mb-2">Our Delicious Menu</h1>
                <p className="text-[#4A4A4A]/70">Discover authentic Jaffna cuisine with modern flavors</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A4A4A]/50 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search dishes, ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-[#FF9933]/30 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent bg-white/80 backdrop-blur-sm"
                    data-testid="search-input"
                  />
                </div>
                
                {/* Filter Toggle */}
                <FoodButton
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933]/10"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </FoodButton>
                
                {/* Cart Button */}
                <FoodButton
                  onClick={() => setShowCart(true)}
                  className="bg-[#FF9933] hover:bg-[#CC7A29] text-white relative"
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
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <div className={`hidden lg:block w-80 ${showFilters ? 'lg:block' : ''}`}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6 sticky top-32"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#4A4A4A]">Filters</h3>
                  <FoodButton
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-[#FF9933] hover:bg-[#FF9933]/10"
                  >
                    Reset
                  </FoodButton>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#4A4A4A] mb-3">Categories</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-[#FF9933] text-white'
                          : 'text-[#4A4A4A] hover:bg-orange-50'
                      }`}
                    >
                      All Categories ({menuItems.length})
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category._id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category._id
                            ? 'bg-[#FF9933] text-white'
                            : 'text-[#4A4A4A] hover:bg-orange-50'
                        }`}
                      >
                        {category.icon} {category.name} ({menuItems.filter(item => 
                          (typeof item.category === 'object' ? item.category._id : item.category) === category._id
                        ).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#4A4A4A] mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-[#4A4A4A]/70">
                      <span>LKR {priceRange[0]}</span>
                      <span>LKR {priceRange[1]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Dietary Filters */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#4A4A4A] mb-3">Dietary Options</h4>
                  <div className="space-y-2">
                    {dietaryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleDietaryFilter(option.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          dietaryFilters.includes(option.value)
                            ? 'bg-[#FF9933] text-white'
                            : 'text-[#4A4A4A] hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-lg">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#4A4A4A] mb-3">Availability</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Items' },
                      { value: 'available', label: 'Available Only' },
                      { value: 'unavailable', label: 'Unavailable Only' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAvailabilityFilter(option.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          availabilityFilter === option.value
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
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#4A4A4A] mb-3">Sort By</h4>
                  <div className="space-y-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
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
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          sortOrder === 'asc'
                            ? 'bg-[#FF9933] text-white'
                            : 'text-[#4A4A4A] hover:bg-orange-50'
                        }`}
                      >
                        Ascending
                      </button>
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          sortOrder === 'desc'
                            ? 'bg-[#FF9933] text-white'
                            : 'text-[#4A4A4A] hover:bg-orange-50'
                        }`}
                      >
                        Descending
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Filters Overlay */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                  onClick={() => setShowFilters(false)}
                >
                  <motion.div
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    className="w-80 h-full bg-white p-6 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-[#4A4A4A]">Filters</h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Same filter content as desktop sidebar */}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#4A4A4A]">
                    {filteredAndSortedItems.length} dishes found
                  </h2>
                  {searchTerm && (
                    <p className="text-[#4A4A4A]/70 text-sm">
                      Results for "{searchTerm}"
                    </p>
                  )}
                </div>
                <FoodButton
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933]/10"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </FoodButton>
              </div>

              {/* Menu Items Grid */}
              {error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#4A4A4A] mb-2">Error Loading Menu</h3>
                  <p className="text-[#4A4A4A]/70 mb-6">{error}</p>
                  <FoodButton
                    onClick={() => window.location.reload()}
                    className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
                  >
                    Try Again
                  </FoodButton>
                </div>
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="w-20 h-20 text-[#FF9933] mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-[#4A4A4A] mb-2">No dishes found</h3>
                  <p className="text-[#4A4A4A]/70 mb-6">
                    {searchTerm || selectedCategory !== 'all' || dietaryFilters.length > 0
                      ? 'Try adjusting your search or filter criteria'
                      : 'No menu items available at the moment'
                    }
                  </p>
                  {(searchTerm || selectedCategory !== 'all' || dietaryFilters.length > 0) && (
                    <FoodButton
                      onClick={resetFilters}
                      className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
                    >
                      Clear Filters
                    </FoodButton>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedItems.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                      data-testid="menu-item"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${item.image ? 'hidden' : ''} bg-gradient-to-br from-orange-100 to-orange-200`}>
                          <ChefHat className="w-16 h-16 text-[#FF9933]" />
                        </div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <FoodBadge
                            variant={item.isAvailable ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </FoodBadge>
                        </div>
                        
                        {/* Favorite Button */}
                        <button
                          onClick={() => toggleFavorite(item._id)}
                          className="absolute top-3 left-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              favorites.has(item._id) ? 'text-red-500 fill-current' : 'text-gray-400'
                            }`}
                          />
                        </button>
                        
                        {/* View Count */}
                        {viewedItems.has(item._id) && (
                          <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Viewed
                          </div>
                        )}
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
                        
                        {/* Add to Cart Button */}
                        <FoodButton
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.isAvailable}
                          className="w-full bg-[#FF9933] hover:bg-[#CC7A29] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                          data-testid="add-to-cart"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                        </FoodButton>
                      </FoodCardContent>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="cart-dialog">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <Cart onCheckout={handleCheckout} onClose={() => setShowCart(false)} />
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
            <DialogTitle className="text-3xl font-bold text-[#4A4A4A] mb-3">Order Placed!</DialogTitle>
            <p className="text-[#4A4A4A]/70 mb-4">Your order <span className="font-semibold">#{completedOrder._id?.substring(0, 8)}</span> has been successfully placed.</p>
            <p className="text-[#4A4A4A]/70 mb-6">We'll notify you when it's ready.</p>
            <FoodButton onClick={handleBackToMenu} className="bg-[#FF9933] hover:bg-[#CC7A29] text-white px-6 py-3 rounded-xl font-semibold">
              Back to Menu
            </FoodButton>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GuestMenuPage;
