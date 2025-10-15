import React from 'react';
import { motion } from 'framer-motion';
import { FoodButton } from '../ui/food/FoodButton';
import { FoodBadge } from '../ui/food/FoodBadge';
import { Trash2, Plus, Minus, ShoppingBag, Clock, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const ModernCart = ({ onCheckout, onClose }) => {
  const { items, total, removeFromCart, updateQuantity, clearCart, isTakeaway, canUseTakeaway, toggleTakeaway } = useCart();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Your cart is empty</h3>
        <p className="text-gray-400 mb-6">Add some delicious items to get started!</p>
        <FoodButton
          onClick={onClose}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          Continue Shopping
        </FoodButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Your Cart</h3>
            <p className="text-gray-400 text-sm">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
        </div>
        <FoodButton
          onClick={clearCart}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </FoodButton>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
                <img
                  src={item.image || 'https://dummyimage.com/80x80/cccccc/000000&text=Dish'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg text-white line-clamp-1">{item.name}</h4>
                  <span className="font-bold text-lg text-orange-400 ml-2">
                    ${(item.price || 0).toFixed(2)}
                  </span>
                </div>

                {item.description && (
                  <p className="text-gray-400 text-sm line-clamp-1 mb-3">{item.description}</p>
                )}

                {/* Rating */}
                {item.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-gray-400 text-xs">{item.rating}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <FoodButton
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Minus className="w-3 h-3" />
                    </FoodButton>
                    <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                    <FoodButton
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Plus className="w-3 h-3" />
                    </FoodButton>
                  </div>

                  {/* Subtotal and Remove */}
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">
                      Subtotal: <span className="text-white font-semibold">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                    </span>
                    <FoodButton
                      onClick={() => handleRemoveItem(item.id)}
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </FoodButton>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold text-white">Total:</span>
            <span className="font-bold text-2xl text-orange-400">${total.toFixed(2)}</span>
          </div>

          {/* Takeaway Option - Only show for non-room guests */}
          {canUseTakeaway && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="takeaway"
                  checked={isTakeaway}
                  onChange={toggleTakeaway}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="takeaway" className="text-white font-medium">
                  Takeaway
                </label>
              </div>
              <FoodBadge
                variant={isTakeaway ? "primary" : "secondary"}
                className={isTakeaway
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white"
                  : "bg-white/10 text-gray-400"
                }
              >
                {isTakeaway ? 'Yes' : 'No'}
              </FoodBadge>
            </div>
          )}

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Estimated preparation time: 20-25 minutes</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <FoodButton
          onClick={onClose}
          variant="outline"
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          Continue Shopping
        </FoodButton>
        <FoodButton
          onClick={onCheckout}
          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-orange-500/25"
        >
          Proceed to Checkout
        </FoodButton>
      </div>
    </div>
  );
};

export default ModernCart;