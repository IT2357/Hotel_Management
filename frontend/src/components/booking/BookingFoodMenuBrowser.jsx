import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Search,
  ChefHat,
  Star,
  Leaf,
  Flame,
  Clock,
  Check
} from 'lucide-react';
import foodService from '../../services/foodService';
import FoodButton from '../food/FoodButton';
import FoodBadge from '../food/FoodBadge';

const BookingFoodMenuBrowser = ({ isOpen, onClose, onSelectItems, initialSelectedItems = [] }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);

  useEffect(() => {
    if (isOpen) {
      fetchMenuData();
    }
  }, [isOpen]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, categoriesResponse] = await Promise.all([
        foodService.getMenuItems({ isAvailable: true }),
        foodService.getCategories()
      ]);

      const items = itemsResponse.data?.data || itemsResponse.data || [];
      const cats = categoriesResponse.data?.data || categoriesResponse.data || [];

      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const itemCategoryId = (item.category && typeof item.category === 'object') 
      ? item.category._id 
      : item.category;
    const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find(si => si.foodId === item._id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(si => 
        si.foodId === item._id ? { ...si, quantity: si.quantity + 1 } : si
      ));
    } else {
      setSelectedItems([...selectedItems, {
        foodId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      }]);
    }
  };

  const handleRemoveItem = (foodId) => {
    const existingItem = selectedItems.find(si => si.foodId === foodId);
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(selectedItems.map(si => 
        si.foodId === foodId ? { ...si, quantity: si.quantity - 1 } : si
      ));
    } else {
      setSelectedItems(selectedItems.filter(si => si.foodId !== foodId));
    }
  };

  const getItemQuantity = (foodId) => {
    return selectedItems.find(si => si.foodId === foodId)?.quantity || 0;
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleConfirm = () => {
    onSelectItems(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Browse Food Menu</h2>
                <p className="text-white/80 text-sm">Add items to your booking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b bg-gray-50 overflow-x-auto">
          <div className="flex gap-2 p-4 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat._id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ChefHat className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const quantity = getItemQuantity(item._id);
                return (
                  <motion.div
                    key={item._id}
                    layout
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h3>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.isVegetarian && (
                            <FoodBadge variant="success" className="text-xs">
                              <Leaf className="w-3 h-3 mr-1" /> Veg
                            </FoodBadge>
                          )}
                          {item.spiceLevel && (
                            <FoodBadge variant="warning" className="text-xs">
                              <Flame className="w-3 h-3 mr-1" /> {item.spiceLevel}
                            </FoodBadge>
                          )}
                          {item.prepTime && (
                            <FoodBadge variant="default" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" /> {item.prepTime}m
                            </FoodBadge>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}

                        {/* Price and Actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-orange-600">
                            LKR {item.price.toLocaleString()}
                          </span>

                          {quantity === 0 ? (
                            <FoodButton
                              onClick={() => handleAddItem(item)}
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </FoodButton>
                          ) : (
                            <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-1">
                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-semibold text-orange-600">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleAddItem(item)}
                                className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedItems.length > 0 && (
          <div className="border-t bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  LKR {getTotalPrice().toLocaleString()}
                </p>
              </div>
              <FoodButton
                onClick={handleConfirm}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirm Selection
              </FoodButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BookingFoodMenuBrowser;

