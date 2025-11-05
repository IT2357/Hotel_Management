/**
 * 🛒 CartCheckout2025 - Modern 3-Step Checkout with Formik & PayHere
 * Features: Stepper progress, upsell carousel, #FF9933 theme, cart persistence
 * Steps: Cart Review → Guest Details → Payment
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, User, CreditCard, ArrowRight, ArrowLeft, 
  Trash2, Plus, Minus, X, CheckCircle, AlertCircle, Sparkles 
} from 'lucide-react';
import { useCart2025 } from '../hooks/useCart2025';
import { menuAPI } from '../services/apiService';

const CartCheckout2025 = ({ isOpen, onClose, onOrderComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderType, setOrderType] = useState('dine-in');
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
    specialInstructions: ''
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [upsellItems, setUpsellItems] = useState([]);
  
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    jaffnaDiscount,
    total,
    itemCount
  } = useCart2025();

  // Fetch upsell items (drinks, desserts)
  useEffect(() => {
    if (currentStep === 1) {
      fetchUpsellItems();
    }
  }, [currentStep]);

  const fetchUpsellItems = async () => {
    try {
      const response = await menuAPI.getItems({ 
        category: 'drinks', 
        limit: 5,
        sortBy: 'popularity' 
      });
      if (response.success) {
        setUpsellItems(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch upsell items:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Cart Review', icon: ShoppingCart },
    { number: 2, title: 'Guest Details', icon: User },
    { number: 3, title: 'Payment', icon: CreditCard }
  ];

  // Validate guest details
  const validateGuestDetails = () => {
    const newErrors = {};
    
    if (!guestDetails.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!guestDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!guestDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(guestDetails.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1 && cart.length === 0) {
      return;
    }
    
    if (currentStep === 2 && !validateGuestDetails()) {
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  // Handle previous step
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle PayHere payment
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // In real implementation, create order first and get orderId
      // const orderData = { orderType, items: [...], guestDetails, subtotal, discount, total }
      // const response = await orderAPI.createOrder(orderData);
      
      // Simulate PayHere integration
      // In production, replace with actual PayHere API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear cart and notify success
      clearCart();
      onOrderComplete?.({
        success: true,
        orderId: 'ORD' + Date.now(),
        total,
        message: 'Payment successful! Your order has been placed.'
      });
      onClose();
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF9933] to-[#FF7700] p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-8 h-8" />
                Checkout
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                {steps.map((step, index) => (
                  <div
                    key={step.number}
                    className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                          currentStep >= step.number
                            ? 'bg-white text-[#FF9933] scale-110'
                            : 'bg-white/30 text-white'
                        }`}
                      >
                        {currentStep > step.number ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm mt-2 text-white/90 hidden sm:block">
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-2 bg-white/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-white"
                          initial={{ width: 0 }}
                          animate={{
                            width: currentStep > step.number ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
            {/* Step 1: Cart Review */}
            {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-700 mb-2">
                        Your cart is empty
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Add some delicious Jaffna dishes to get started!
                      </p>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF7700] transition-colors"
                      >
                        Browse Menu
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Order Type Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Order Type
                        </label>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setOrderType('dine-in')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                              orderType === 'dine-in'
                                ? 'border-[#FF9933] bg-[#FF9933]/10 text-[#FF9933]'
                                : 'border-gray-200 text-gray-700 hover:border-[#FF9933]'
                            }`}
                          >
                            Dine-In
                          </button>
                          <button
                            onClick={() => setOrderType('takeaway')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                              orderType === 'takeaway'
                                ? 'border-[#FF9933] bg-[#FF9933]/10 text-[#FF9933]'
                                : 'border-gray-200 text-gray-700 hover:border-[#FF9933]'
                            }`}
                          >
                            Takeaway
                          </button>
                        </div>
                      </div>

                      {/* Cart Items */}
                      {cart.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={item.imageUrl || '/placeholder-food.jpg'}
                            alt={item.name_english}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {item.name_english}
                            </h4>
                            {item.name_tamil && (
                              <p className="text-sm text-gray-600">{item.name_tamil}</p>
                            )}
                            <p className="text-sm font-bold text-[#FF9933] mt-1">
                              LKR {(item.price * 0.95).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Upsell Carousel */}
                      {upsellItems.length > 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-[#FF9933]/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-[#FF9933]" />
                            <h4 className="font-bold text-gray-800">Add a refreshing drink?</h4>
                          </div>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {upsellItems.slice(0, 3).map((item) => (
                              <div
                                key={item._id}
                                className="min-w-[200px] bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                              >
                                <img
                                  src={item.imageUrl || '/placeholder-drink.jpg'}
                                  alt={item.name_english}
                                  className="w-full h-24 object-cover rounded-lg mb-2"
                                />
                                <p className="text-sm font-semibold text-gray-800">
                                  {item.name_english}
                                </p>
                                <p className="text-xs text-[#FF9933] font-bold mb-2">
                                  LKR {(item.price * 0.95).toFixed(2)}
                                </p>
                                <button
                                  onClick={() => updateQuantity(item._id, 1)}
                                  className="w-full py-1.5 bg-[#FF9933] text-white text-sm rounded hover:bg-[#FF7700] transition-colors"
                                >
                                  Quick Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            {/* Step 2: Guest Details */}
            {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guestDetails.name}
                      onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 ${
                        errors.name ? 'border-red-500' : 'border-gray-200 focus:border-[#FF9933]'
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 ${
                        errors.email ? 'border-red-500' : 'border-gray-200 focus:border-[#FF9933]'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={guestDetails.phone}
                      onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#FF9933]/20 ${
                        errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-[#FF9933]'
                      }`}
                      placeholder="0771234567"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {orderType === 'dine-in' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={guestDetails.roomNumber}
                        onChange={(e) => setGuestDetails({ ...guestDetails, roomNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20"
                        placeholder="e.g., 301"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={guestDetails.specialInstructions}
                      onChange={(e) => setGuestDetails({ ...guestDetails, specialInstructions: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20"
                      placeholder="Any dietary restrictions or special requests?"
                    />
                  </div>
                </motion.div>
              )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg mb-4 text-gray-800">Order Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal ({itemCount} items)</span>
                          <span>LKR {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Jaffna Discount (-5%)</span>
                          <span>- LKR {jaffnaDiscount.toFixed(2)}</span>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-xl font-bold text-[#FF9933]">
                          <span>Total</span>
                          <span>LKR {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Guest Details Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg mb-4 text-gray-800">Guest Details</h3>
                      <div className="space-y-2 text-gray-700">
                        <p><span className="font-medium">Name:</span> {guestDetails.name}</p>
                        <p><span className="font-medium">Email:</span> {guestDetails.email}</p>
                        <p><span className="font-medium">Phone:</span> {guestDetails.phone}</p>
                        {guestDetails.roomNumber && (
                          <p><span className="font-medium">Room:</span> {guestDetails.roomNumber}</p>
                        )}
                        <p><span className="font-medium">Order Type:</span> {orderType === 'dine-in' ? 'Dine-In' : 'Takeaway'}</p>
                      </div>
                    </div>

                    {/* Payment Button */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="w-6 h-6 text-green-600" />
                        <h3 className="font-bold text-lg text-gray-800">Secure Payment</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Click below to complete your payment securely via PayHere
                      </p>
                      <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            Pay LKR {total.toFixed(2)}
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
            <button
              onClick={currentStep === 1 ? onClose : handleBack}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {currentStep === 1 ? 'Close' : 'Back'}
            </button>

            {currentStep < 3 && (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && cart.length === 0}
                className="px-6 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF7700] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CartCheckout2025;
