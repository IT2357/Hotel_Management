import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Users, 
  Share2,
  Copy,
  Check,
  Star,
  Truck,
  Shield,
  Zap,
  AlertCircle
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import FoodBadge from '../../../components/food/FoodBadge';
import { useCart } from '../../../context/CartContext';
import { toast } from 'sonner';

const SwiggyCart = ({ onCheckout, onClose }) => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
  const [showGroupInvite, setShowGroupInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [upsellItems, setUpsellItems] = useState([]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lkrAdjustment = subtotal * 0.05; // -5% LKR adjustment
  const finalTotal = subtotal - lkrAdjustment;
  const tax = finalTotal * 0.1; // 10% tax
  const serviceFee = finalTotal * 0.05; // 5% service fee
  const grandTotal = finalTotal + tax + serviceFee;

  // Upsell suggestions based on cart contents
  const getUpsellSuggestions = () => {
    const suggestions = [];
    
    // Check if cart has curry but no rice
    const hasCurry = items.some(item => 
      item.name.toLowerCase().includes('curry') || 
      item.category?.toLowerCase().includes('curry')
    );
    const hasRice = items.some(item => 
      item.name.toLowerCase().includes('rice') || 
      item.category?.toLowerCase().includes('rice')
    );
    
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
    const hasMainCourse = items.some(item => 
      item.category?.toLowerCase().includes('main') ||
      item.category?.toLowerCase().includes('curry')
    );
    const hasBeverage = items.some(item => 
      item.category?.toLowerCase().includes('beverage') ||
      item.category?.toLowerCase().includes('drink')
    );
    
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

  // Update upsell items when cart changes
  useEffect(() => {
    setUpsellItems(getUpsellSuggestions());
  }, [items]);

  // Generate group invite link
  const generateInviteLink = () => {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const link = `${window.location.origin}/group-order/${groupId}`;
    setInviteLink(link);
    setShowGroupInvite(true);
  };

  // Copy invite link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    
    onCheckout();
  };

  // Persist cart to localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('jaffna_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        // In a real implementation, we would sync with the backend
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jaffna_cart', JSON.stringify(items));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <ShoppingCart className="w-12 h-12 text-orange-500" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h3>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Add some delicious Jaffna dishes to get started!
        </p>
        <FoodButton
          onClick={onClose}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          Start Shopping
        </FoodButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-md">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Your Order</h3>
            <p className="text-gray-600">{getItemCount()} item{getItemCount() !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Group Order Button */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
        <button
          onClick={generateInviteLink}
          className="flex items-center gap-3 w-full text-left"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800">Group Order</h4>
            <p className="text-sm text-gray-600">Invite friends to order together</p>
          </div>
          <Share2 className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-md"
            >
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
                  <div className="w-full h-full flex items-center justify-center bg-orange-50">
                    <div className="w-8 h-8 bg-orange-200 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-lg truncate">{item.name}</h4>
                <p className="text-sm text-gray-600 truncate mb-2">{item.description}</p>
                <div className="flex items-center gap-2">
                  {item.isVeg && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      🥬 Veg
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      🌶️ Spicy
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shadow-sm"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-8 text-center font-bold text-gray-800 text-lg">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center transition-colors shadow-md"
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
                onClick={() => removeFromCart(item._id)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upsell Suggestions */}
      {upsellItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6"
        >
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500" />
            Complete Your Meal
          </h4>
          <div className="space-y-3">
            {upsellItems.map((suggestion, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-orange-100 hover:border-orange-200 transition-colors">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
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
                  <span className="font-bold text-orange-500 text-lg">LKR {suggestion.price}</span>
                  <FoodButton
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                    onClick={() => {
                      // In a real implementation, this would add the item to cart
                      toast.success(`${suggestion.name} added to cart`);
                    }}
                  >
                    Add
                  </FoodButton>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-gray-800 text-lg">Order Summary</h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-800 font-semibold">LKR {subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-green-600">
            <span>LKR Adjustment (-5%)</span>
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
              <span className="text-gradient bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                LKR {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
          <Clock className="w-5 h-5 text-blue-500" />
          <div>
            <div className="font-semibold">Prep Time</div>
            <div>15-25 min</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-green-50 p-4 rounded-xl">
          <Truck className="w-5 h-5 text-green-500" />
          <div>
            <div className="font-semibold">Delivery</div>
            <div>Free</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-purple-50 p-4 rounded-xl">
          <Shield className="w-5 h-5 text-purple-500" />
          <div>
            <div className="font-semibold">Quality</div>
            <div>100% Halal</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <FoodButton
          onClick={clearCart}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 py-4 rounded-2xl font-semibold shadow-sm"
        >
          Clear Cart
        </FoodButton>
        <FoodButton
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          Proceed to Checkout
        </FoodButton>
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
                  className="p-2 hover:bg-gray-100 rounded-full"
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors"
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

export default SwiggyCart;