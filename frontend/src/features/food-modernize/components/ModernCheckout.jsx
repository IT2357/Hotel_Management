import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  X,
  ChefHat,
  ShoppingBag,
  Calendar,
  Users,
  ArrowLeft,
  ArrowRight,
  Shield,
  Truck,
  Star,
  Heart,
  Package,
  IndianRupee
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import FoodInput from '../../../components/food/FoodInput';
import FoodLabel from '../../../components/food/FoodLabel';
import FoodSelect from '../../../components/food/FoodSelect';
import FoodTextarea from '../../../components/food/FoodTextarea';
import { useCart } from '../../../context/CartContext';

const ModernCheckout = ({ onClose, onOrderComplete }) => {
  const { items, getTotal, getSubtotal, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    // Guest details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Order details
    orderType: 'dine-in', // 'dine-in' or 'takeaway'
    tableNumber: '',
    pickupTime: '',
    specialInstructions: '',
    
    // Payment
    paymentMethod: 'cash', // 'cash', 'card', 'bank', 'cod'
    
    // Delivery (for COD)
    deliveryAddress: '',
    deliveryInstructions: '',
    
    // Group order
    isGroupOrder: false,
    groupName: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Review, 2: Details, 3: Payment

  // Calculate totals
  const subtotal = getSubtotal();
  const lkrAdjustment = subtotal * 0.05; // -5% LKR adjustment
  const finalTotal = subtotal - lkrAdjustment;
  const tax = finalTotal * 0.1; // 10% tax
  const serviceFee = finalTotal * 0.05; // 5% service fee
  const grandTotal = finalTotal + tax + serviceFee;

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Order type specific validation
    if (formData.orderType === 'dine-in' && !formData.tableNumber) {
      newErrors.tableNumber = 'Table number is required for dine-in orders';
    }

    if (formData.orderType === 'takeaway' && !formData.pickupTime) {
      newErrors.pickupTime = 'Pickup time is required for takeaway orders';
    }

    // Payment method specific validation
    if (formData.paymentMethod === 'cod' && !formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required for cash on delivery';
    }

    // Group order validation
    if (formData.isGroupOrder && !formData.groupName.trim()) {
      newErrors.groupName = 'Group name is required for group orders';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data for the API
      const orderData = {
        items: items.map(item => ({
          foodId: item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          category: item.category
        })),
        subtotal: subtotal,
        tax: tax,
        deliveryFee: 0, // For dine-in orders
        totalPrice: grandTotal,
        currency: 'LKR',
        orderType: formData.orderType,
        isTakeaway: formData.orderType === 'takeaway',
        customerDetails: {
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          deliveryAddress: formData.orderType === 'dine-in' ? `Table ${formData.tableNumber}` : formData.deliveryAddress
        },
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        scheduledTime: formData.pickupTime ? new Date(Date.now() + parseInt(formData.pickupTime) * 60000) : undefined,
        isGroupOrder: formData.isGroupOrder,
        groupName: formData.groupName
      };

      // In a real implementation, we would call the API to create the order
      console.log('Order data:', orderData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear cart
      clearCart();

      // Call success callback
      onOrderComplete({
        _id: `order-${Date.now()}`,
        ...orderData
      });

    } catch (error) {
      console.error('Order submission error:', error);
      setErrors({ submit: error.message || 'Failed to place order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Steps navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Review Your Order</h2>
            
            {/* Order Items */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                        <div className="w-6 h-6 bg-orange-200 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-gray-800">
                      LKR {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800 font-medium">LKR {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-green-600">
                <span>LKR Adjustment (-5%)</span>
                <span>-LKR {lkrAdjustment.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="text-gray-800 font-medium">LKR {tax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee (5%)</span>
                <span className="text-gray-800 font-medium">LKR {serviceFee.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-800">Total</span>
                  <span className="text-orange-500">LKR {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Group Order Toggle */}
            <div className="bg-purple-50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isGroupOrder}
                  onChange={(e) => handleInputChange('isGroupOrder', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <h3 className="font-bold text-gray-800">Group Order</h3>
                  <p className="text-sm text-gray-600">Split the bill with friends</p>
                </div>
              </label>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
            
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FoodInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  error={errors.firstName}
                  required
                />
                
                <FoodInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  error={errors.lastName}
                  required
                />
              </div>
              
              <FoodInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                required
                icon={Mail}
              />
              
              <FoodInput
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={errors.phone}
                required
                icon={Phone}
              />
            </div>
            
            {/* Order Type */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Order Type</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('orderType', 'dine-in')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.orderType === 'dine-in'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ChefHat className="w-6 h-6 text-orange-500" />
                    <span className="font-semibold">Dine-In</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('orderType', 'takeaway')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.orderType === 'takeaway'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-orange-500" />
                    <span className="font-semibold">Takeaway</span>
                  </div>
                </button>
              </div>
              
              {formData.orderType === 'dine-in' && (
                <FoodInput
                  label="Table Number"
                  value={formData.tableNumber}
                  onChange={(e) => handleInputChange('tableNumber', e.target.value)}
                  error={errors.tableNumber}
                  required
                  icon={MapPin}
                />
              )}
              
              {formData.orderType === 'takeaway' && (
                <div className="space-y-4">
                  <FoodSelect
                    label="Pickup Time"
                    value={formData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    error={errors.pickupTime}
                    required
                    options={[
                      { value: '', label: 'Select pickup time' },
                      { value: '15', label: '15 minutes' },
                      { value: '30', label: '30 minutes' },
                      { value: '45', label: '45 minutes' },
                      { value: '60', label: '1 hour' }
                    ]}
                    icon={Clock}
                  />
                </div>
              )}
            </div>
            
            {/* Special Instructions */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Special Instructions</h3>
              <FoodTextarea
                placeholder="Any special requests or dietary restrictions?"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Group Order Details */}
            {formData.isGroupOrder && (
              <div className="space-y-4 bg-purple-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Group Order Details
                </h3>
                
                <FoodInput
                  label="Group Name"
                  value={formData.groupName}
                  onChange={(e) => handleInputChange('groupName', e.target.value)}
                  error={errors.groupName}
                  required
                />
                
                <p className="text-sm text-purple-700">
                  Your friends can join this group order using the invite link. 
                  You'll be the group leader and responsible for the final payment.
                </p>
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Payment Method</h2>
            
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total</span>
                <span className="text-xl font-bold text-orange-500">LKR {grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Select Payment Method</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'cash', name: 'Cash', icon: IndianRupee, description: 'Pay at the counter' },
                  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Pay with card' },
                  { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when delivered' }
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === method.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={formData.paymentMethod === method.id}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="w-5 h-5 text-orange-500"
                    />
                    <method.icon className="w-6 h-6 text-orange-500" />
                    <div>
                      <div className="font-semibold">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Delivery Address (for COD) */}
            {formData.paymentMethod === 'cod' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Delivery Address</h3>
                <FoodTextarea
                  placeholder="Enter your full delivery address"
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  error={errors.deliveryAddress}
                  required
                  rows={3}
                />
                
                <FoodTextarea
                  label="Delivery Instructions"
                  placeholder="Any special delivery instructions?"
                  value={formData.deliveryInstructions}
                  onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                  rows={2}
                />
              </div>
            )}
            
            {/* Terms and Conditions */}
            <div className="bg-blue-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>. 
                    By placing this order, I confirm that the details provided are correct.
                  </p>
                </div>
              </label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === step
                    ? 'bg-orange-500 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step
                )}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-600">
                {step === 1 && 'Review'}
                {step === 2 && 'Details'}
                {step === 3 && 'Payment'}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit}>
        {renderStep()}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <FoodButton
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </FoodButton>
          
          {currentStep < 3 ? (
            <FoodButton
              type="button"
              onClick={nextStep}
              className="px-6 py-3"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </FoodButton>
          ) : (
            <FoodButton
              type="submit"
              loading={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Place Order
            </FoodButton>
          )}
        </div>
      </form>
      
      {/* Error Message */}
      {errors.submit && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{errors.submit}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCheckout;