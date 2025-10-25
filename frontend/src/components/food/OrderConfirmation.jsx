import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  X, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag,
  ChefHat,
  Package,
  ArrowRight,
  Download,
  Share2,
  MessageCircle
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';
import { useNavigate } from 'react-router-dom';

const OrderConfirmation = ({ order, onClose, show }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [autoRedirect, setAutoRedirect] = useState(true);

  // Trigger confetti animation on mount (optional - gracefully handles if not installed)
  useEffect(() => {
    if (show && order) {
      // Try to use confetti if available (optional dependency)
      try {
        // Dynamic import to handle optional dependency
        import('canvas-confetti').then((confettiModule) => {
          const confetti = confettiModule.default;
          
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

          function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
          }

          const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            confetti(Object.assign({}, defaults, {
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
          }, 250);

          return () => clearInterval(interval);
        }).catch(() => {
          // Confetti not installed - that's okay, modal still works fine
          console.log('Confetti animation not available (optional dependency)');
        });
      } catch (error) {
        // Silently fail if confetti is not available
        console.log('Confetti animation not available');
      }
    }
  }, [show, order]);

  // Auto redirect countdown
  useEffect(() => {
    if (show && autoRedirect && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && autoRedirect) {
      navigate(`/my-orders`);
    }
  }, [countdown, autoRedirect, show, navigate]);

  if (!show || !order) return null;

  const estimatedTime = order.orderType === 'takeaway' 
    ? order.pickupTime || 30 
    : order.orderType === 'dine-in' 
      ? 15 
      : 20;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              setAutoRedirect(false);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Success Header */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative z-10"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Order Placed Successfully!</h2>
              <p className="text-green-100 text-lg">
                Thank you for your order. We're preparing your delicious meal!
              </p>
            </motion.div>
          </div>

          {/* Order Details */}
          <div className="px-8 py-6 space-y-6">
            {/* Order Number & Status */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{order._id?.slice(-8).toUpperCase() || 'PENDING'}
                </p>
              </div>
              <FoodBadge variant="success" size="lg">
                <Clock className="w-4 h-4 mr-1" />
                ~{estimatedTime} mins
              </FoodBadge>
            </div>

            {/* Order Type & Details */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                {order.orderType === 'dine-in' ? (
                  <MapPin className="w-5 h-5 text-orange-600 mt-0.5" />
                ) : (
                  <Package className="w-5 h-5 text-orange-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">
                    {order.orderType === 'dine-in' ? 'Dine-In' : 'Takeaway'} Order
                  </p>
                  {order.orderType === 'dine-in' && order.tableNumber && (
                    <p className="text-gray-600">Table {order.tableNumber}</p>
                  )}
                  {order.orderType === 'takeaway' && (
                    <p className="text-gray-600">
                      Ready for pickup in {order.pickupTime || estimatedTime} minutes
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 pt-4 border-t border-orange-100">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{order.customerDetails?.customerEmail || order.guest?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{order.customerDetails?.customerPhone || order.guest?.phone}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Your Order ({order.items?.length || 0} items)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      LKR {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>LKR {order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-LKR {order.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>LKR {order.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-200">
                <span>Total</span>
                <span>LKR {order.totalPrice?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Special Instructions</p>
                <p className="text-sm text-blue-700">{order.specialInstructions}</p>
              </div>
            )}

            {/* Payment Method */}
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                💳
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {order.paymentMethod || 'Cash'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <FoodButton
                onClick={() => {
                  setAutoRedirect(false);
                  navigate(`/my-orders`);
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl font-semibold shadow-lg"
              >
                <ChefHat className="w-5 h-5 mr-2" />
                Track Your Order
                <ArrowRight className="w-5 h-5 ml-2" />
              </FoodButton>

              <div className="grid grid-cols-2 gap-3">
                <FoodButton
                  onClick={() => {
                    setAutoRedirect(false);
                    navigate('/menu');
                    onClose();
                  }}
                  variant="outline"
                  className="py-3"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Order More
                </FoodButton>
                <FoodButton
                  onClick={() => {
                    // Share order details
                    if (navigator.share) {
                      navigator.share({
                        title: 'My Order',
                        text: `Order #${order._id?.slice(-8).toUpperCase()} - LKR ${order.totalPrice?.toFixed(2)}`,
                      });
                    }
                  }}
                  variant="outline"
                  className="py-3"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </FoodButton>
              </div>
            </div>

            {/* Auto Redirect Notice */}
            {autoRedirect && countdown > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-3"
              >
                <p className="text-sm text-gray-500">
                  Redirecting to order tracking in {countdown}s...
                  <button
                    onClick={() => setAutoRedirect(false)}
                    className="ml-2 text-orange-500 hover:text-orange-600 font-medium underline"
                  >
                    Cancel
                  </button>
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderConfirmation;

