// 📁 frontend/src/components/menu/ShoppingCartSidebar.jsx
import { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const ShoppingCartSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    cartSubtotal,
    tax,
    serviceCharge,
    cartTotal,
    updateQuantity,
    updateInstructions,
    removeFromCart
  } = useCart();

  const formatPrice = (price) => {
    return `Rs. ${price?.toLocaleString() || 0}`;
  };

  const handleCheckout = () => {
    if (cartCount > 0) {
      // Close sidebar and go to dedicated checkout page
      onClose?.();
      navigate('/checkout');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={20} />
            <h2 className="text-lg font-semibold">Your Order</h2>
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
              {cartCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartCount === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.portion.name} - {formatPrice(item.portion.price)}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-1">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="font-semibold text-amber-600">
                      {formatPrice(Number(item.portion.price || 0) * item.quantity)}
                    </div>
                  </div>

                  {/* Special Instructions Input */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Special instructions..."
                      value={item.specialInstructions}
                      onChange={(e) => updateInstructions(item.id, e.target.value)}
                      className="w-full text-xs p-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      maxLength={200}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {cartCount > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (12.5%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service Charge (10%)</span>
                <span>{formatPrice(serviceCharge)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-amber-600">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      {/* Modal removed: we now navigate to /checkout */}
    </>
  );
};

export default ShoppingCartSidebar;
