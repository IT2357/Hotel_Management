import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users,
  ChefHat,
  Leaf,
  Flame,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const RestaurantMenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState({
    foodType: 'all',
    spiceLevel: 'all',
    priceRange: 'all',
    dietary: 'all'
  });
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const heroVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  useEffect(() => {
    fetchMenuData();
    loadCartFromStorage();
    loadFavoritesFromStorage();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesRes = await api.get('/api/menu/categories');
      setCategories(categoriesRes.data.data);
      
      // Fetch menu items
      const itemsRes = await api.get('/api/menu/items', {
        params: {
          limit: 50,
          sortBy: 'displayOrder',
          sortOrder: 'asc'
        }
      });
      setMenuItems(itemsRes.data.data);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('restaurantCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const loadFavoritesFromStorage = () => {
    const savedFavorites = localStorage.getItem('restaurantFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  };

  const saveCartToStorage = (cart) => {
    localStorage.setItem('restaurantCart', JSON.stringify(cart));
  };

  const saveFavoritesToStorage = (favs) => {
    localStorage.setItem('restaurantFavorites', JSON.stringify(Array.from(favs)));
  };

  const addToCart = (item) => {
    const existingItem = cartItems.find(cartItem => cartItem._id === item._id);
    let updatedCart;

    if (existingItem) {
      updatedCart = cartItems.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...cartItems, { ...item, quantity: 1 }];
    }

    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
    toast.success(`${item.name} added to cart!`);
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item._id !== itemId);
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const toggleFavorite = (itemId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(itemId);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };

  const filteredItems = menuItems.filter(item => {
    // Category filter
    if (selectedCategory !== 'all' && item.category?._id !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Food type filter
    if (filterBy.foodType !== 'all' && item.foodType !== filterBy.foodType) {
      return false;
    }

    // Spice level filter
    if (filterBy.spiceLevel !== 'all' && item.spiceLevel !== filterBy.spiceLevel) {
      return false;
    }

    // Dietary filter
    if (filterBy.dietary !== 'all' && !item.dietaryTags?.includes(filterBy.dietary)) {
      return false;
    }

    // Price range filter
    const price = item.displayPrice || item.basePrice;
    if (filterBy.priceRange === 'budget' && price > 1500) return false;
    if (filterBy.priceRange === 'mid' && (price < 1500 || price > 3000)) return false;
    if (filterBy.priceRange === 'premium' && price < 3000) return false;

    return true;
  });

  const cartTotal = cartItems.reduce((total, item) => 
    total + (item.displayPrice || item.basePrice) * item.quantity, 0
  );

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const getFoodTypeIcon = (foodType) => {
    switch (foodType) {
      case 'veg': case 'vegan': return <Leaf className="w-4 h-4 text-green-600" />;
      case 'non-veg': return <ChefHat className="w-4 h-4 text-red-600" />;
      case 'seafood': return <span className="text-blue-600">🐟</span>;
      default: return null;
    }
  };

  const getSpiceLevelIcon = (spiceLevel) => {
    const flames = {
      'None': 0,
      'Mild': 1,
      'Medium': 2,
      'Hot': 3,
      'Extra Hot': 4
    };
    
    return Array.from({ length: flames[spiceLevel] || 0 }, (_, i) => (
      <Flame key={i} className="w-3 h-3 text-red-500" />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading our delicious menu...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <motion.section 
        className="relative py-16 px-4 sm:px-6 lg:px-8 text-center"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Culture Colombo
            <span className="block text-3xl md:text-4xl text-amber-600 mt-2">Restaurant</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Experience the authentic flavors of Sri Lanka with our carefully crafted dishes, 
            prepared with fresh ingredients and traditional spices.
          </motion.p>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Search and Filters */}
        <motion.div 
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-amber-50 shadow-sm'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category._id
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-amber-50 shadow-sm'
                }`}
              >
                {category.name} {category.itemCount && `(${category.itemCount})`}
              </button>
            ))}
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <select
              value={filterBy.foodType}
              onChange={(e) => setFilterBy({...filterBy, foodType: e.target.value})}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="veg">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="seafood">Seafood</option>
            </select>

            <select
              value={filterBy.spiceLevel}
              onChange={(e) => setFilterBy({...filterBy, spiceLevel: e.target.value})}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">All Spice Levels</option>
              <option value="None">No Spice</option>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Hot">Hot</option>
              <option value="Extra Hot">Extra Hot</option>
            </select>

            <select
              value={filterBy.priceRange}
              onChange={(e) => setFilterBy({...filterBy, priceRange: e.target.value})}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">All Prices</option>
              <option value="budget">Budget (&lt; Rs. 1,500)</option>
              <option value="mid">Mid-range (Rs. 1,500 - 3,000)</option>
              <option value="premium">Premium (&gt; Rs. 3,000)</option>
            </select>

            <select
              value={filterBy.dietary}
              onChange={(e) => setFilterBy({...filterBy, dietary: e.target.value})}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">All Dietary</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-Free</option>
              <option value="halal">Halal</option>
              <option value="keto">Keto</option>
            </select>
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div 
          className="mb-6 text-center text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          Showing {filteredItems.length} delicious dish{filteredItems.length !== 1 ? 'es' : ''}
        </motion.div>

        {/* Menu Items Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item._id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                layout
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              >
                {/* Item Image */}
                <div className="relative h-48 overflow-hidden">
                  {item.primaryImage?.url ? (
                    <img
                      src={item.primaryImage.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                      <ChefHat className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item._id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  >
                    <Heart 
                      className={`w-5 h-5 ${favorites.has(item._id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                    />
                  </button>

                  {/* Special Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {item.isSignatureDish && (
                      <span className="px-2 py-1 bg-amber-600 text-white text-xs font-medium rounded-full">
                        Signature
                      </span>
                    )}
                    {item.isChefSpecial && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                        Chef's Special
                      </span>
                    )}
                    {item.isNewItem && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>

                {/* Item Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-1">
                      {getFoodTypeIcon(item.foodType)}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                  {/* Tags and Info */}
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500">{item.preparationTime || 15} mins</span>
                      <div className="flex items-center gap-1 ml-2">
                        {getSpiceLevelIcon(item.spiceLevel)}
                      </div>
                    </div>
                    
                    {item.cuisineType && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {item.cuisineType}
                      </span>
                    )}
                  </div>

                  {/* Dietary Tags */}
                  {item.dietaryTags && item.dietaryTags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {item.dietaryTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          {tag}
                        </span>
                      ))}
                      {item.dietaryTags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{item.dietaryTags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-amber-600">
                      Rs. {(item.displayPrice || item.basePrice)?.toLocaleString()}
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>

                  {/* Reviews */}
                  {item.reviews && item.reviews.totalReviews > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{item.reviews.averageRating.toFixed(1)}</span>
                      </div>
                      <span>({item.reviews.totalReviews} reviews)</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredItems.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-lg text-gray-600">No dishes found matching your criteria.</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
          </motion.div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <motion.button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-colors z-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          </div>
        </motion.button>
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Your Order ({cartItemCount} items)</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {item.primaryImage?.url ? (
                        <img
                          src={item.primaryImage.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600">Rs. {(item.displayPrice || item.basePrice)?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-amber-600">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>
                <button className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors">
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantMenuPage;