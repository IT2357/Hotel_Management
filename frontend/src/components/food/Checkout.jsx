import React, { useState, useEffect } from 'react';
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
  Heart
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodInput from './FoodInput';
import FoodLabel from './FoodLabel';
import FoodSelect from './FoodSelect';
import FoodTextarea from './FoodTextarea';
import { useCart } from '../../context/CartContext';

const Checkout = ({ onClose, onOrderComplete }) => {
  const { items, getTotal, clearCart } = useCart();
  
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
    deliveryInstructions: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Load saved form data from localStorage
  useEffect(() => {
    const savedFormData = localStorage.getItem('jaffna_checkout_form');
    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData));
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem('jaffna_checkout_form', JSON.stringify(formData));
  }, [formData]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order object
      const order = {
        _id: `ORD-${Date.now()}`,
        items: items,
        guest: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        orderType: formData.orderType,
        tableNumber: formData.tableNumber || null,
        pickupTime: formData.pickupTime || null,
        specialInstructions: formData.specialInstructions,
        paymentMethod: formData.paymentMethod,
        deliveryAddress: formData.deliveryAddress || null,
        deliveryInstructions: formData.deliveryInstructions || null,
        total: getTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear form and cart
      localStorage.removeItem('jaffna_checkout_form');
        clearCart();

      // Call success callback
      onOrderComplete(order);

    } catch (error) {
      console.error('Order submission error:', error);
      setErrors({ submit: 'Failed to place order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Time slots for takeaway
  const timeSlots = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ];

  // Table numbers for dine-in
  const tableNumbers = Array.from({ length: 20 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Table ${i + 1}`
  }));

  const steps = [
    { number: 1, title: 'Guest Details', description: 'Your contact information', icon: User },
    { number: 2, title: 'Order Type', description: 'Dine-in or Takeaway', icon: ChefHat },
    { number: 3, title: 'Payment', description: 'Choose payment method', icon: CreditCard },
    { number: 4, title: 'Review', description: 'Confirm your order', icon: CheckCircle }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your order in just a few steps</p>
        </div>
        <button
          onClick={onClose}
          className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : step.number === currentStep
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-center mt-3">
                    <div className={`text-sm font-semibold ${
                      step.number <= currentStep ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-colors duration-300 ${
                      step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
              </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Guest Details */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Guest Information</h2>
              <p className="text-gray-600">Please provide your contact details for order confirmation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <FoodLabel htmlFor="firstName">First Name *</FoodLabel>
              <FoodInput
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName}
                  </p>
                )}
            </div>

            <div>
                <FoodLabel htmlFor="lastName">Last Name *</FoodLabel>
              <FoodInput
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName}
                  </p>
                )}
            </div>

              <div>
                <FoodLabel htmlFor="email">Email Address *</FoodLabel>
              <FoodInput
                  id="email"
                type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
            </div>

              <div>
                <FoodLabel htmlFor="phone">Phone Number *</FoodLabel>
                <FoodInput
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+94 77 123 4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Order Type */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Type</h2>
              <p className="text-gray-600">Choose how you'd like to receive your order</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dine-in Option */}
              <div
                className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.orderType === 'dine-in'
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                onClick={() => handleInputChange('orderType', 'dine-in')}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    formData.orderType === 'dine-in' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <ChefHat className={`w-8 h-8 ${
                      formData.orderType === 'dine-in' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Dine-in</h3>
                  <p className="text-gray-600 mb-4">Enjoy your meal at our restaurant</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>15-25 min prep time</span>
                  </div>
                </div>
              </div>

              {/* Takeaway Option */}
              <div
                className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.orderType === 'takeaway'
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                onClick={() => handleInputChange('orderType', 'takeaway')}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    formData.orderType === 'takeaway' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <ShoppingBag className={`w-8 h-8 ${
                      formData.orderType === 'takeaway' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Takeaway</h3>
                  <p className="text-gray-600 mb-4">Pick up your order to go</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Truck className="w-4 h-4" />
                    <span>Free pickup</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dine-in Table Selection */}
            {formData.orderType === 'dine-in' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <FoodLabel htmlFor="tableNumber">Table Number *</FoodLabel>
                <FoodSelect
                  id="tableNumber"
                  value={formData.tableNumber}
                  onChange={(e) => handleInputChange('tableNumber', e.target.value)}
                  className={errors.tableNumber ? 'border-red-500' : ''}
                >
                  <option value="">Select a table</option>
                  {tableNumbers.map(table => (
                    <option key={table.value} value={table.value}>
                      {table.label}
                    </option>
                  ))}
                </FoodSelect>
                {errors.tableNumber && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.tableNumber}
                  </p>
                )}
              </motion.div>
            )}

            {/* Takeaway Time Selection */}
            {formData.orderType === 'takeaway' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <FoodLabel htmlFor="pickupTime">Pickup Time *</FoodLabel>
                <FoodSelect
                  id="pickupTime"
                  value={formData.pickupTime}
                  onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  className={errors.pickupTime ? 'border-red-500' : ''}
                >
                  <option value="">Select pickup time</option>
                  {timeSlots.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </FoodSelect>
                {errors.pickupTime && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.pickupTime}
                  </p>
                )}
              </motion.div>
            )}

            {/* Special Instructions */}
            <div className="mt-8">
              <FoodLabel htmlFor="specialInstructions">Special Instructions (Optional)</FoodLabel>
              <FoodTextarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                rows={4}
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment Method */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Payment Method</h2>
              <p className="text-gray-600">Choose how you'd like to pay</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { value: 'cash', label: 'Pay at Restaurant', icon: '💵', description: 'Pay when you arrive', color: 'bg-green-50 border-green-200' },
                { value: 'cod', label: 'Cash on Delivery', icon: '🚚', description: 'Pay when food is delivered', color: 'bg-blue-50 border-blue-200' },
                { value: 'card', label: 'Credit/Debit Card', icon: '💳', description: 'Pay online now', color: 'bg-purple-50 border-purple-200' },
                { value: 'bank', label: 'Bank Transfer', icon: '🏦', description: 'Transfer to our account', color: 'bg-gray-50 border-gray-200' }
              ].map((method) => (
                <div
                  key={method.value}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    formData.paymentMethod === method.value
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : `border-gray-200 hover:border-orange-300 ${method.color}`
                  }`}
                  onClick={() => handleInputChange('paymentMethod', method.value)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{method.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{method.label}</h3>
                      <p className="text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

            {/* Delivery Address for COD */}
            {formData.paymentMethod === 'cod' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-8 bg-blue-50 rounded-2xl border border-blue-200"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  Delivery Address
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <FoodLabel htmlFor="deliveryAddress">Delivery Address *</FoodLabel>
                    <FoodTextarea
                      id="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      placeholder="Enter your complete delivery address..."
                      rows={4}
                      className={errors.deliveryAddress ? 'border-red-500' : ''}
                    />
                    {errors.deliveryAddress && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.deliveryAddress}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <FoodLabel htmlFor="deliveryInstructions">Delivery Instructions</FoodLabel>
                    <FoodTextarea
                      id="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                      placeholder="Any special delivery instructions..."
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 4: Review Order */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Review Your Order</h2>
              <p className="text-gray-600">Please confirm all details before placing your order</p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h3>
              
              {/* Items */}
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-4 bg-white rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        <div className="text-sm text-gray-600">x{item.quantity}</div>
                      </div>
                    </div>
                    <span className="font-bold text-gray-800 text-lg">
                      LKR {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800 font-semibold">LKR {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-orange-500">LKR {getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Guest Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Order Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Type:</strong> {formData.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</div>
                  {formData.orderType === 'dine-in' && (
                    <div><strong>Table:</strong> {formData.tableNumber}</div>
                  )}
                  {formData.orderType === 'takeaway' && (
                    <div><strong>Pickup:</strong> {formData.pickupTime} minutes</div>
                  )}
                  <div><strong>Payment:</strong> {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : formData.paymentMethod}</div>
                  {formData.paymentMethod === 'cod' && formData.deliveryAddress && (
                    <div><strong>Delivery Address:</strong> {formData.deliveryAddress}</div>
                  )}
                  {formData.specialInstructions && (
                    <div><strong>Instructions:</strong> {formData.specialInstructions}</div>
            )}
          </div>
              </div>
        </div>
          </motion.div>
      )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 border-t border-gray-200">
        <FoodButton
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          variant="outline"
            className="px-8 py-4 rounded-2xl font-semibold"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </FoodButton>

          {currentStep < 4 ? (
            <FoodButton
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
        </FoodButton>
          ) : (
        <FoodButton
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  Place Order
                </div>
              )}
        </FoodButton>
          )}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              <span className="font-semibold">{errors.submit}</span>
      </div>
          </motion.div>
        )}
      </form>
    </div>
  );
};

export default Checkout;