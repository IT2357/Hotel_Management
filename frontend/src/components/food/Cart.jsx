import React, { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';
import { useCart } from '../../context/CartContext';

const Cart = ({ onCheckout, onClose }) => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotal, getItemCount } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lkrAdjustment = subtotal * 0.05; // -5% LKR adjustment
  const finalTotal = subtotal - lkrAdjustment;
  const tax = finalTotal * 0.1; // 10% tax
  const serviceFee = finalTotal * 0.05; // 5% service fee
  const grandTotal = finalTotal + tax + serviceFee;

  // Handle checkout
  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsLoading(true);
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 1000));
      onCheckout();
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const upsellSuggestions = getUpsellSuggestions();

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <ShoppingCart className="w-12 h-12 text-orange-500" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h3>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Add some delicious Jaffna dishes to get started! Our authentic cuisine awaits you.
        </p>
        <FoodButton
          onClick={onClose}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg"
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
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
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
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-8 text-center font-bold text-gray-800 text-lg">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors"
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
      {upsellSuggestions.length > 0 && (
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
            {upsellSuggestions.map((suggestion, index) => (
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
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
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
              <span className="text-orange-500">LKR {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <FoodButton
          onClick={clearCart}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 py-4 rounded-2xl font-semibold"
        >
          Clear Cart
        </FoodButton>
        <FoodButton
          onClick={handleCheckout}
          disabled={isLoading || items.length === 0}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Proceed to Checkout
            </div>
          )}
        </FoodButton>
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
    </div>
  );
};

export default Cart;