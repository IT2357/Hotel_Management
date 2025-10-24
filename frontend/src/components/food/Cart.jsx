import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Clock, 
  Star,
  ChefHat,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  Truck,
  Shield,
  Zap,
  ArrowRight,
  Users,
  Copy,
  Check
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import foodService from '../../services/foodService';

const Cart = ({ onCheckout, onClose }) => {
  const { items, getTotal, getItemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [showGroupInvite, setShowGroupInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Helper function to safely get category name
  const getCategoryName = (category) => {
    if (!category) return '';
    if (typeof category === 'string') return category.toLowerCase();
    if (typeof category === 'object' && category.name) return category.name.toLowerCase();
    return '';
  };

  // Mutation for syncing cart with backend
  const syncCartMutation = useMutation({
    mutationFn: async (cartItems) => {
      // In a real implementation, this would sync with the backend
      // For now, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, items: cartItems };
    },
    onSuccess: () => {
      toast.success('Cart synced with server');
    },
    onError: (error) => {
      toast.error('Failed to sync cart: ' + error.message);
    }
  });

  // Optimistic update mutations for cart operations
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      // Sync with backend
      await syncCartMutation.mutateAsync(items);
      return { itemId, quantity };
    },
    onMutate: async ({ itemId, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['cart']);
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart']) || items;
      
      // Optimistically update to the new value
      queryClient.setQueryData(['cart'], old => 
        old.map(item => 
          item._id === itemId ? { ...item, quantity } : item
        )
      );
      
      // Return a context object with the snapshotted value
      return { previousCart };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value
      queryClient.setQueryData(['cart'], context.previousCart);
      toast.error('Failed to update cart item');
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['cart']);
    }
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId) => {
      // Sync with backend
      const updatedItems = items.filter(item => item._id !== itemId);
      await syncCartMutation.mutateAsync(updatedItems);
      return itemId;
    },
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['cart']);
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart']) || items;
      
      // Optimistically update to the new value
      queryClient.setQueryData(['cart'], old => 
        old.filter(item => item._id !== itemId)
      );
      
      // Return a context object with the snapshotted value
      return { previousCart };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value
      queryClient.setQueryData(['cart'], context.previousCart);
      toast.error('Failed to remove item from cart');
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['cart']);
    }
  });

  // Calculate totals with Jaffna discount
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lkrAdjustment = subtotal * 0.05; // -5% LKR adjustment for Jaffna
  const finalTotal = subtotal - lkrAdjustment;
  const tax = finalTotal * 0.1; // 10% tax
  const serviceFee = finalTotal * 0.05; // 5% service fee
  const grandTotal = finalTotal + tax + serviceFee;

  // Handle checkout with validation
  const handleCheckout = async () => {
    // Validation: Check if cart has items
    if (items.length === 0) {
      toast.error('Your cart is empty. Add some items to proceed.');
      return;
    }

    // Validation: Check minimum order value (example: LKR 500)
    if (grandTotal < 500) {
      toast.error('Minimum order value is LKR 500. Please add more items.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Sync cart with backend before checkout
      await syncCartMutation.mutateAsync(items);
      
      // Proceed to checkout
      onCheckout?.();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quantity update with optimistic update
  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    updateQuantityMutation.mutate({ itemId, quantity });
    // Also update local context for immediate UI update
    updateQuantity(itemId, quantity);
  };

  // Handle remove from cart with optimistic update
  const handleRemoveFromCart = (itemId) => {
    removeFromCartMutation.mutate(itemId);
    // Also update local context for immediate UI update
    removeFromCart(itemId);
  };

  // Upsell suggestions based on cart contents
  const getUpsellSuggestions = () => {
    const suggestions = [];
    
    // Check if cart has curry but no rice
    const hasCurry = items.some(item => {
      const itemName = item.name.toLowerCase();
      const categoryName = getCategoryName(item.category);
      return itemName.includes('curry') || categoryName.includes('curry');
    });
    
    const hasRice = items.some(item => {
      const itemName = item.name.toLowerCase();
      const categoryName = getCategoryName(item.category);
      return itemName.includes('rice') || categoryName.includes('rice');
    });
    
    if (hasCurry && !hasRice) {
      suggestions.push({
        name: 'Basmati Rice',
        price: 150,
        description: 'Perfect with your curry selection',
        reason: 'Complete your meal',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200'
      });
    }
    
    // Check if cart has main course but no beverage
    const hasMainCourse = items.some(item => {
      const categoryName = getCategoryName(item.category);
      return categoryName.includes('main') || categoryName.includes('curry');
    });
    
    const hasBeverage = items.some(item => {
      const categoryName = getCategoryName(item.category);
      return categoryName.includes('beverage') || categoryName.includes('drink');
    });
    
    if (hasMainCourse && !hasBeverage) {
      suggestions.push({
        name: 'Fresh Lime Juice',
        price: 80,
        description: 'Refreshing drink to complement your meal',
        reason: 'Add a beverage',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200'
      });
    }
    
    return suggestions.slice(0, 2); // Max 2 suggestions
  };

  const upsellSuggestions = getUpsellSuggestions();

  // Generate group invite link
  const generateInviteLink = () => {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const link = `${window.location.origin}/group-order/${groupId}`;
    setInviteLink(link);
    setShowGroupInvite(true);
    toast.success('Group order link generated!');
  };

  // Copy invite link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('jaffna_cart', JSON.stringify(items));
      console.log('💾 Cart saved to localStorage:', items.length, 'items');
    } else {
      localStorage.removeItem('jaffna_cart');
    }
  }, [items]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('jaffna_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        console.log('📥 Cart loaded from localStorage:', cartData.length, 'items');
        // Note: Cart context should handle the restoration
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('jaffna_cart');
      }
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
        >
          <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
        </motion.div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Your cart is empty</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm mx-auto px-4">
          Add some delicious Jaffna dishes to get started! Our authentic cuisine awaits you.
        </p>
        <FoodButton
          onClick={onClose}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
            Start Shopping
          </div>
        </FoodButton>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cart Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800">Your Order</h3>
            <p className="text-sm sm:text-base text-gray-600">{getItemCount()} item{getItemCount() !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 sm:p-3 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
        </button>
      </div>

      {/* Group Order Button */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-100">
        <button
          onClick={generateInviteLink}
          className="flex items-center gap-2 sm:gap-3 w-full text-left hover:bg-white/50 rounded-lg sm:rounded-xl p-2 transition-colors"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 text-sm sm:text-base">Group Order</h4>
            <p className="text-xs sm:text-sm text-gray-600 truncate">Invite friends to order together</p>
          </div>
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
            >
              {/* Mobile Layout (< 640px) */}
              <div className="sm:hidden">
                <div className="flex gap-3 p-3">
                  {/* Item Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image || item.imageUrl ? (
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-gray-800 text-base line-clamp-2">{item.name}</h4>
                      <button
                        onClick={() => handleRemoveFromCart(item._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        disabled={removeFromCartMutation.isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      {item.isVeg && <FoodBadge variant="success" size="sm">🌱</FoodBadge>}
                      {item.isSpicy && <FoodBadge variant="spicy" size="sm">🌶️</FoodBadge>}
                      {item.isPopular && <FoodBadge variant="popular" size="sm">⭐</FoodBadge>}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      LKR {item.price.toFixed(2)} each
                    </div>
                  </div>
                </div>

                {/* Bottom section with quantity and total */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1 bg-gray-50">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-200"
                      disabled={updateQuantityMutation.isLoading}
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <span className="w-10 text-center font-bold text-gray-800 text-base">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                      disabled={updateQuantityMutation.isLoading}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Total Price */}
                  <div className="font-bold text-indigo-600 text-lg">
                    LKR {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Desktop Layout (≥ 640px) */}
              <div className="hidden sm:flex items-center gap-4 p-4">
                {/* Item Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.image || item.imageUrl ? (
                    <img
                      src={item.image || item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-lg truncate">{item.name}</h4>
                  <p className="text-sm text-gray-600 truncate mb-2">{item.description}</p>
                  <div className="flex items-center gap-2">
                    {item.isVeg && <FoodBadge variant="success" size="sm">🌱 Veg</FoodBadge>}
                    {item.isSpicy && <FoodBadge variant="spicy" size="sm">🌶️ Spicy</FoodBadge>}
                    {item.isPopular && <FoodBadge variant="popular" size="sm">⭐ Popular</FoodBadge>}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    disabled={updateQuantityMutation.isLoading}
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-800 text-lg">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                    disabled={updateQuantityMutation.isLoading}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="font-bold text-gray-800 text-lg">
                    LKR {(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    LKR {item.price.toFixed(2)} each
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFromCart(item._id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                  disabled={removeFromCartMutation.isLoading}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upsell Suggestions */}
      {upsellSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 sm:p-6"
        >
          <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            Complete Your Meal
          </h4>
          <div className="space-y-3">
            {upsellSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-white rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors overflow-hidden">
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={suggestion.image}
                        alt={suggestion.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{suggestion.name}</div>
                      <div className="text-xs text-gray-600 line-clamp-1">{suggestion.description}</div>
                      <div className="font-bold text-indigo-600 text-sm mt-1">LKR {suggestion.price}</div>
                    </div>
                    <FoodButton
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
                      onClick={() => {
                        // In a real implementation, this would add the item to cart
                        toast.success(`${suggestion.name} added to cart`);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </FoodButton>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center gap-4 p-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={suggestion.image}
                      alt={suggestion.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{suggestion.name}</div>
                    <div className="text-sm text-gray-600">{suggestion.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-600 text-lg">LKR {suggestion.price}</span>
                    <FoodButton
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                      onClick={() => {
                        // In a real implementation, this would add the item to cart
                        toast.success(`${suggestion.name} added to cart`);
                      }}
                    >
                      Add
                    </FoodButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h4 className="font-bold text-gray-800 text-base sm:text-lg">Order Summary</h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-800 font-semibold">LKR {subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-green-600">
            <span>Jaffna Discount (-5%)</span>
            <span>-LKR {lkrAdjustment.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (10%)</span>
            <span className="text-gray-800 font-semibold">LKR {tax.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee (5%)</span>
            <span className="text-gray-800 font-semibold">LKR {serviceFee.toFixed(2)}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between font-bold text-xl">
              <span className="text-gray-800">Total</span>
              <span className="text-indigo-600">LKR {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <FoodButton
          onClick={() => {
            // Clear cart in context
            clearCart();
            // Also invalidate queries
            queryClient.invalidateQueries(['cart']);
          }}
          variant="outline"
          className="w-full sm:flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base"
        >
          <div className="flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            Clear Cart
          </div>
        </FoodButton>
        <FoodButton
          onClick={handleCheckout}
          disabled={isLoading || items.length === 0}
          className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm sm:text-base">Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Proceed to Checkout</span>
              <span className="sm:hidden">Checkout</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
        </FoodButton>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
          <div className="text-center sm:text-left">
            <div className="font-semibold text-xs sm:text-sm">Prep Time</div>
            <div className="text-xs sm:text-sm">15-25 min</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 bg-green-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
          <div className="text-center sm:text-left">
            <div className="font-semibold text-xs sm:text-sm">Delivery</div>
            <div className="text-xs sm:text-sm">Free</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 bg-purple-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
          <div className="text-center sm:text-left">
            <div className="font-semibold text-xs sm:text-sm">Quality</div>
            <div className="text-xs sm:text-sm">100% Halal</div>
          </div>
        </div>
      </div>

      {/* Group Invite Modal */}
      <AnimatePresence>
        {showGroupInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGroupInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Group Order Invite</h3>
                <button
                  onClick={() => setShowGroupInvite(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Share this link with your friends to start a group order
              </p>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Everyone can add items to the shared cart. 
                  The order will be placed when the group leader checks out.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;