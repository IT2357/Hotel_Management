import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

/**
 * Component for selecting menu items for a specific meal
 * Allows guests to browse menu and add items to their meal
 */
const MealItemPicker = ({ 
  mealType, 
  existingItems = [], 
  onItemsSelected, 
  onClose 
}) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState({});

  // Log when component mounts
  useEffect(() => {
    console.log('🍕 MealItemPicker component mounted for meal type:', mealType);
    return () => console.log('🍕 MealItemPicker component unmounted');
  }, []);

  // Initialize cart with existing items
  useEffect(() => {
    const initialCart = {};
    existingItems.forEach(item => {
      initialCart[item.foodId || item._id] = {
        ...item,
        quantity: item.quantity || 1
      };
    });
    setCart(initialCart);
  }, [existingItems]);

  // Fetch menu items
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Debug: Log menu items when they change
  useEffect(() => {
    console.log('📋 Menu items updated. Total count:', menuItems.length);
    if (menuItems.length > 0) {
      console.log('First item sample:', menuItems[0]);
    }
  }, [menuItems]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      console.log('🍕 Fetching menu items from /food/items?isAvailable=true');
      const response = await api.get('/food/items?isAvailable=true');
      console.log('📦 Raw response:', response);
      console.log('📦 Response data:', response.data);
      
      // Handle different response structures
      let items = [];
      if (response.data?.data?.items) {
        // Paginated response: { success: true, data: { items: [...], pagination: {...} } }
        items = response.data.data.items;
        console.log('✅ Found items in response.data.data.items:', items.length);
      } else if (response.data?.data) {
        // Direct data: { success: true, data: [...] }
        items = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        console.log('✅ Found items in response.data.data:', items.length);
      } else if (Array.isArray(response.data)) {
        // Direct array: [...]
        items = response.data;
        console.log('✅ Found items in response.data:', items.length);
      } else {
        console.warn('⚠️ Unexpected response structure:', response.data);
      }
      
      // If no items found with filter, try without filter
      if (items.length === 0) {
        console.log('⚠️ No items found with isAvailable=true, trying without filter...');
        const fallbackResponse = await api.get('/food/items');
        console.log('📦 Fallback response:', fallbackResponse.data);
        
        if (fallbackResponse.data?.data?.items) {
          items = fallbackResponse.data.data.items;
        } else if (fallbackResponse.data?.data) {
          items = Array.isArray(fallbackResponse.data.data) ? fallbackResponse.data.data : [fallbackResponse.data.data];
        } else if (Array.isArray(fallbackResponse.data)) {
          items = fallbackResponse.data;
        }
        console.log('✅ Fallback found items:', items.length);
      }
      
      console.log('🍽️ Setting menu items:', items);
      setMenuItems(items);
    } catch (error) {
      console.error('❌ Error fetching menu:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories - handle both string and object formats
  const categories = ['all', ...new Set(
    menuItems.map(item => {
      // Handle populated category object or string
      if (typeof item.category === 'object' && item.category !== null) {
        return item.category.name || item.category._id;
      }
      return item.category;
    }).filter(Boolean)
  )];

  // Filter items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle category as object or string
    const itemCategory = typeof item.category === 'object' && item.category !== null 
      ? item.category.name || item.category._id 
      : item.category;
    
    const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add/update item in cart
  const handleAddToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item._id]: {
        foodId: item._id,
        _id: item._id,
        name: item.name,
        price: item.price,
        description: item.description,
        quantity: (prev[item._id]?.quantity || 0) + 1
      }
    }));
  };

  // Update quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      }));
    }
  };

  // Calculate total
  const getTotal = () => {
    return Object.values(cart).reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
  };

  // Handle confirm
  const handleConfirm = () => {
    const items = Object.values(cart);
    if (items.length === 0) {
      alert('Please select at least one item');
      return;
    }
    onItemsSelected(items);
  };

  const getMealTypeLabel = () => {
    const labels = {
      breakfast: '🌅 Breakfast',
      lunch: '🍽️ Lunch',
      dinner: '🌙 Dinner'
    };
    return labels[mealType] || mealType;
  };

  console.log('🎨 MealItemPicker rendering. Menu items count:', menuItems.length, 'Loading:', loading);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Select Menu Items</h2>
              <p className="text-purple-100">{getMealTypeLabel()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-purple-200 border border-purple-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white border border-purple-400 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {categories.map((cat, index) => {
                // Ensure we have a valid key - use index if cat is complex
                const categoryValue = typeof cat === 'string' ? cat : String(cat);
                const categoryLabel = cat === 'all' ? 'All Categories' : categoryValue;
                
                return (
                  <option key={`${categoryValue}-${index}`} value={categoryValue} className="text-gray-900">
                    {categoryLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold">No menu items found</p>
                <p className="text-sm mt-2">
                  {menuItems.length === 0 
                    ? 'No items available in the menu. Please contact admin to add menu items.'
                    : 'Try adjusting your search or filter'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map(item => {
                  const inCart = cart[item._id];
                  
                  return (
                    <div
                      key={item._id}
                      className={`border rounded-lg overflow-hidden transition ${
                        inCart
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      {/* ✅ Enhanced Food Image Display */}
                      <div className="relative">
                        <img
                          src={item.imageUrl || item.image || '/api/placeholder/400/300'}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E🍽️ ' + encodeURIComponent(item.name) + '%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {inCart && (
                          <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                            {inCart.quantity}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-purple-600 text-lg">
                            LKR {item.price.toFixed(2)}
                          </span>
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-purple-300 p-1">
                              <button
                                onClick={() => handleUpdateQuantity(item._id, inCart.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-purple-100 rounded transition"
                              >
                                <Minus className="w-4 h-4 text-purple-600" />
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item._id, inCart.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-purple-100 rounded transition"
                              >
                                <Plus className="w-4 h-4 text-purple-600" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">
                Selected Items ({Object.keys(cart).length})
              </h3>
            </div>

            {Object.keys(cart).length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No items selected yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(cart).map(item => (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          LKR {item.price.toFixed(2)} each
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, 0)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-gray-50 rounded border border-gray-200 p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold text-gray-900">
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {Object.keys(cart).length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700 font-medium">Total:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    LKR {getTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Confirm Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MealItemPicker;

