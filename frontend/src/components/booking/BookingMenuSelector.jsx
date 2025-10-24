import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/rooms/ui/dialog";
import { Button } from "@/components/rooms/ui/button";
import { 
  Search, ChefHat, X, Plus, Minus, ShoppingCart, Check, Filter
} from 'lucide-react';
import EnhancedFoodCard from '../food/EnhancedFoodCard';
import foodService from '../../services/foodService';
import { toast } from 'sonner';

// Get API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin);

// Plan type to time slot mapping (using actual schema fields)
const PLAN_TIMESLOT_MAP = {
  'Breakfast': { timeslots: ['isBreakfast'], description: 'Breakfast items only' },
  'Half Board': { timeslots: ['isBreakfast', 'isDinner'], description: 'Breakfast & Dinner' },
  'Full Board': { timeslots: ['isBreakfast', 'isLunch', 'isDinner'], description: 'All meals' },
  'A la carte': { timeslots: [], description: 'Choose any items' } // No filter - show all
};

const BookingMenuSelector = ({ 
  isOpen = true,
  planType = 'Breakfast', 
  nights = 1, 
  guests = 1, 
  initialItems = [],
  onItemsSelected,
  onClose 
}) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState(initialItems);

  // Fetch menu items and categories
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        
        const [itemsResponse, categoriesResponse] = await Promise.all([
          foodService.getMenuItems({ isAvailable: true }),
          foodService.getCategories()
        ]);

        // Handle items response
        let items = [];
        if (itemsResponse.data && itemsResponse.data.items) {
          items = itemsResponse.data.items;
        } else if (Array.isArray(itemsResponse.data)) {
          items = itemsResponse.data;
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
      } catch (err) {
        console.error('Error fetching menu data:', err);
        toast.error('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMenuData();
    }
  }, [isOpen]);

  // Filter menu items based on plan type using time slots
  const filteredItems = useMemo(() => {
    const planConfig = PLAN_TIMESLOT_MAP[planType] || { timeslots: [] };
    const allowedTimeslots = planConfig.timeslots;
    
    return menuItems.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Time slot filter based on plan type
      let matchesTimeslot = true;
      if (allowedTimeslots.length > 0) {
        // Item must be available in at least one of the allowed time slots
        matchesTimeslot = allowedTimeslots.some(timeslot => item[timeslot] === true);
      }
      // If no time slots specified (A la carte), show all items

      // Selected category filter
      const itemCategoryId = item.category && typeof item.category === 'object' ? item.category._id : item.category;
      const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategory;

      return matchesSearch && matchesTimeslot && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory, planType]);

  // Get categories that have items available in the current plan's time slots
  const availableCategories = useMemo(() => {
    const planConfig = PLAN_TIMESLOT_MAP[planType] || { timeslots: [] };
    const allowedTimeslots = planConfig.timeslots;
    
    if (allowedTimeslots.length === 0) {
      return categories; // Show all categories for A la carte
    }
    
    // Find categories that have at least one item available in the allowed time slots
    const categoriesWithItems = new Set();
    menuItems.forEach(item => {
      const hasTimeslot = allowedTimeslots.some(timeslot => item[timeslot] === true);
      if (hasTimeslot && item.category) {
        const catId = typeof item.category === 'object' ? item.category._id : item.category;
        categoriesWithItems.add(catId);
      }
    });
    
    return categories.filter(cat => categoriesWithItems.has(cat._id));
  }, [categories, planType, menuItems]);

  // Handle add item
  const handleAddItem = (item) => {
    const existingItem = selectedItems.find(i => i._id === item._id);
    
    if (existingItem) {
      // Increase quantity
      setSelectedItems(selectedItems.map(i => 
        i._id === item._id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      // Add new item with quantity 1
      setSelectedItems([...selectedItems, { 
        ...item, 
        quantity: 1,
        price: item.price || 0
      }]);
    }
    
    toast.success(`${item.name} added!`, {
      duration: 1500,
      icon: '✅'
    });
  };

  // Handle remove item
  const handleRemoveItem = (itemId) => {
    const existingItem = selectedItems.find(i => i._id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      // Decrease quantity
      setSelectedItems(selectedItems.map(i => 
        i._id === itemId 
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    } else {
      // Remove item completely
      setSelectedItems(selectedItems.filter(i => i._id !== itemId));
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    const totalPerNight = itemsTotal;
    const totalAllNights = itemsTotal * nights * guests;
    
    return { itemsTotal, totalPerNight, totalAllNights };
  };

  const { itemsTotal, totalPerNight, totalAllNights } = calculateTotals();

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    
    onItemsSelected(selectedItems);
    toast.success('Food items added to your booking!', {
      icon: '🎉',
      duration: 2000
    });
    onClose();
  };

  // Get item quantity in selection
  const getItemQuantity = (itemId) => {
    const item = selectedItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] p-0 overflow-hidden"
        style={{ width: '95vw' }}
      >
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-indigo-600" />
                Select Your {planType} Items
              </DialogTitle>
              <p className="text-sm text-indigo-600 font-medium mt-1">
                📅 {PLAN_TIMESLOT_MAP[planType]?.description || 'Select your items'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {nights} night{nights > 1 ? 's' : ''} • {guests} guest{guests > 1 ? 's' : ''}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(95vh-180px)]">
          {/* Menu Items Section */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {availableCategories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category._id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No items found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item._id);
                  return (
                    <div key={item._id} className="relative">
                      <EnhancedFoodCard
                        item={item}
                        onAddToCart={() => handleAddItem(item)}
                      />
                      {quantity > 0 && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full px-3 py-1 text-sm font-bold shadow-lg flex items-center gap-2">
                          <button 
                            onClick={() => handleRemoveItem(item._id)}
                            className="hover:bg-indigo-700 rounded-full p-0.5"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span>{quantity}</span>
                          <button 
                            onClick={() => handleAddItem(item)}
                            className="hover:bg-indigo-700 rounded-full p-0.5"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Items Cart Section */}
          <div className="w-96 border-l bg-gray-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Selected Items
                </h3>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm font-bold">
                  {selectedItems.length}
                </span>
              </div>
            </div>

            <div className="p-4">
              {selectedItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items selected</p>
                  <p className="text-gray-400 text-sm mt-1">Start adding items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div 
                      key={item._id}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">LKR {item.price.toLocaleString()} each</p>
                        </div>
                        <button
                          onClick={() => setSelectedItems(selectedItems.filter(i => i._id !== item._id))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleAddItem(item)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-semibold text-sm text-indigo-600">
                          LKR {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            {selectedItems.length > 0 && (
              <div className="border-t bg-white p-4 space-y-3 sticky bottom-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Total:</span>
                    <span className="font-medium">LKR {itemsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per Night ({guests} guest{guests > 1 ? 's' : ''}):</span>
                    <span className="font-medium">LKR {totalPerNight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Total ({nights} night{nights > 1 ? 's' : ''}):</span>
                    <span className="text-green-600">LKR {totalAllNights.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  disabled={selectedItems.length === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Selection ({selectedItems.length} items)
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingMenuSelector;

