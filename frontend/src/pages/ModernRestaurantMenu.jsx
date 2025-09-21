// 📁 frontend/src/pages/ModernRestaurantMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Heart, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Star,
  Clock,
  Flame,
  Leaf,
  Fish,
  Coffee,
  ChefHat,
  Award,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const ModernRestaurantMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dietary: [],
    spiceLevel: '',
    priceRange: [0, 100]
  });
  
  const { addToCart, cartItems = [] } = useCart();
  const menuRef = useRef(null);

  useEffect(() => {
    fetchMenuData();
    loadFavorites();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        api.get('/food/menu/items'),
        api.get('/food/menu/categories')
      ]);
      
      setMenuItems(itemsRes.data.data.items || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      // Set fallback data
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('menuFavorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  };

  const toggleFavorite = (itemId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('menuFavorites', JSON.stringify([...newFavorites]));
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
      (item.category && (item.category._id === selectedCategory || item.category.slug === selectedCategory));
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDietary = filters.dietary.length === 0 || 
      filters.dietary.some(diet => item.dietaryTags?.includes(diet));
    
    const matchesSpice = !filters.spiceLevel || item.spiceLevel === filters.spiceLevel;
    
    const matchesPrice = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];
    
    return matchesCategory && matchesSearch && matchesDietary && matchesSpice && matchesPrice;
  });

  const getDietaryIcon = (tag) => {
    switch (tag) {
      case 'vegetarian': return <Leaf className="w-4 h-4 text-green-500" />;
      case 'vegan': return <Leaf className="w-4 h-4 text-green-600" />;
      case 'halal': return <Award className="w-4 h-4 text-blue-500" />;
      case 'gluten-free': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'seafood': return <Fish className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const getSpiceIcon = (level) => {
    const flames = {
      'mild': 1,
      'medium': 2,
      'hot': 3,
      'very-hot': 4
    };
    
    return (
      <div className="flex">
        {[...Array(4)].map((_, i) => (
          <Flame 
            key={i} 
            className={`w-3 h-3 ${i < flames[level] ? 'text-red-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 py-20"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-6 text-center text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <ChefHat className="w-16 h-16 mx-auto mb-4" />
          </motion.div>
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
          >
            Culinary Excellence
          </motion.h1>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl mb-8 text-purple-100"
          >
            Discover extraordinary flavors crafted with passion
          </motion.p>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <Coffee className="w-8 h-8 text-white/30" />
        </div>
        <div className="absolute bottom-20 right-10 animate-pulse">
          <Star className="w-6 h-6 text-yellow-300/50" />
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search delicious dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category._id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                {category.name} ({category.itemCount || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-800 border-b border-purple-500/20 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dietary Filters */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Dietary Preferences</h3>
                  <div className="space-y-2">
                    {['vegetarian', 'vegan', 'halal', 'gluten-free', 'seafood'].map((diet) => (
                      <label key={diet} className="flex items-center gap-2 text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.dietary.includes(diet)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                dietary: [...prev.dietary, diet]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                dietary: prev.dietary.filter(d => d !== diet)
                              }));
                            }
                          }}
                          className="rounded border-gray-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="flex items-center gap-1">
                          {getDietaryIcon(diet)}
                          {diet.charAt(0).toUpperCase() + diet.slice(1).replace('-', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Spice Level */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Spice Level</h3>
                  <div className="space-y-2">
                    {['mild', 'medium', 'hot', 'very-hot'].map((level) => (
                      <label key={level} className="flex items-center gap-2 text-gray-300">
                        <input
                          type="radio"
                          name="spiceLevel"
                          checked={filters.spiceLevel === level}
                          onChange={() => setFilters(prev => ({ ...prev, spiceLevel: level }))}
                          className="border-gray-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="flex items-center gap-2">
                          {getSpiceIcon(level)}
                          {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Price Range</h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [0, parseInt(e.target.value)]
                      }))}
                      className="w-full accent-purple-600"
                    />
                    <div className="text-gray-300 text-sm">
                      Up to ${filters.priceRange[1]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Items Grid */}
      <div className="container mx-auto px-6 py-8">
        <motion.div 
          ref={menuRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image || "https://dummyimage.com/400x300/cccccc/000000&text=Delicious+Dish"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item._id)}
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full transition-colors hover:bg-black/70"
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        favorites.has(item._id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-white'
                      }`} 
                    />
                  </button>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {item.isFeatured && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                        Featured
                      </span>
                    )}
                    {item.isPopular && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-2xl font-bold text-white">
                      ${item.price}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {item.dietaryTags?.map((tag, idx) => (
                        <span key={idx} className="text-xs">
                          {getDietaryIcon(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.cookingTime || 15} min
                    </div>
                    {item.spiceLevel && (
                      <div className="flex items-center gap-1">
                        {getSpiceIcon(item.spiceLevel)}
                      </div>
                    )}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(item)}
                    disabled={!item.isAvailable}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      item.isAvailable
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {item.isAvailable ? (
                      <span className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add to Cart
                      </span>
                    ) : (
                      'Unavailable'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {/* Empty State */}
        {filteredItems?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No dishes found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </div>
      
      {/* Floating Cart Button */}
      {cartItems?.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all">
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ModernRestaurantMenu;
