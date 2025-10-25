import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Loader2
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodInput from './FoodInput';
import FoodLabel from './FoodLabel';
import FoodSelect from './FoodSelect';
import FoodTextarea from './FoodTextarea';
import OrderConfirmation from './OrderConfirmation';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import foodService from '../../services/foodService';
import { validateField, guestInfoValidation, validateForm as validateFormUtil } from '../../utils/validation';

const Checkout = ({ onClose, onOrderComplete }) => {
  const { items, getTotal, clearCart, getItemCount } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [fieldValidation, setFieldValidation] = useState({});
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

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

    // Load applied offer from localStorage
    const savedOffer = localStorage.getItem('appliedOffer');
    if (savedOffer) {
      try {
        setAppliedOffer(JSON.parse(savedOffer));
      } catch (error) {
        console.error('Error loading applied offer:', error);
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
    
    // Real-time validation for guest info fields
    if (['firstName', 'lastName', 'email', 'phone'].includes(field)) {
      const error = validateField(field, value, guestInfoValidation);
      setFieldValidation(prev => ({
        ...prev,
        [field]: error
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouchedFields(prev => new Set([...prev, field]));
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

    // Cart validation
    if (items.length === 0) {
      newErrors.cart = 'Your cart is empty. Please add items before checkout.';
    }

    setErrors(newErrors);
    
    // Log validation results for debugging
    if (Object.keys(newErrors).length > 0) {
      console.error('❌ Validation failed:', newErrors);
      toast.error('Please fix the form errors before submitting', {
        description: Object.values(newErrors)[0]
      });
    } else {
      console.log('✅ Validation passed');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // React Query mutation for submitting order
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await foodService.createOrder(orderData);
      return response.data;
    },
    onSuccess: (data) => {
      // Clear cart and form data
      clearCart();
      localStorage.removeItem('jaffna_checkout_form');
      localStorage.removeItem('appliedOffer'); // Clear applied offer
      
      // Invalidate related queries
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      
      // Show success message
      toast.success('Order placed successfully!');
      
      // Set completed order and show confirmation modal
      setCompletedOrder(data);
      setShowOrderConfirmation(true);
      
      // Call success callback if provided
      if (onOrderComplete) {
        onOrderComplete(data);
      }
    },
    onError: (error) => {
      console.error('Order submission error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
      setErrors({ submit: 'Failed to place order. Please try again.' });
    }
  });

  // Redirect to PayHere payment gateway
  const redirectToPayHere = (payHereData) => {
    try {
      console.log('🔄 Redirecting to PayHere with data:', payHereData);
      
      // Validate PayHere data
      if (!payHereData || !payHereData.merchant_id) {
        throw new Error('Invalid PayHere configuration');
      }
      
      // Create a form to submit to PayHere
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = import.meta.env.VITE_PAYMENT_GATEWAY_URL 
        ? `${import.meta.env.VITE_PAYMENT_GATEWAY_URL}/pay/checkout`
        : 'https://sandbox.payhere.lk/pay/checkout';
      
      console.log('📍 PayHere URL:', form.action);
      
      // Add all PayHere form fields
      Object.keys(payHereData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payHereData[key];
        form.appendChild(input);
        console.log(`  ${key}: ${payHereData[key]}`);
      });
      
      // Add form to page and submit
      document.body.appendChild(form);
      console.log('✅ Submitting PayHere form...');
      form.submit();
      
      // Close checkout modal after redirect
      setTimeout(() => {
        document.body.removeChild(form);
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ PayHere redirect error:', error);
      toast.error('Failed to redirect to payment gateway. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle PayHere payment callback
  const handlePayHereCallback = async (paymentData) => {
    try {
      // This would be called by PayHere return URL
      console.log('PayHere payment callback:', paymentData);
      
      // Verify payment status with backend
      const verification = await foodService.verifyPayment(
        paymentData.orderId, 
        paymentData.paymentId
      );
      
      if (verification.success && verification.data.paymentStatus === 'Paid') {
        toast.success('Payment successful!');
        
        // Navigate to order tracking page
        navigate('/my-orders');
        
        // Clear cart and close checkout
        clearCart();
        onClose();
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('PayHere callback error:', error);
      toast.error('Payment processing failed. Please contact support.');
    }
  };

  // Handle form submission with React Query
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submitted, validating...');
    console.log('📝 Form data:', formData);
    
    if (!validateForm()) {
      console.error('❌ Validation failed, staying on page');
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }
    
    console.log('✅ Validation passed, processing order...');
    setIsProcessing(true);

    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate offer discount if applied
      let offerDiscount = 0;
      if (appliedOffer) {
        if (appliedOffer.type === 'percentage') {
          offerDiscount = subtotal * (appliedOffer.discountValue / 100);
        } else if (appliedOffer.type === 'fixed_amount') {
          offerDiscount = Math.min(appliedOffer.discountValue, subtotal);
        }
      }
      
      const tax = subtotal * 0.1; // 10% tax
      const deliveryFee = 0; // No delivery feature (only dine-in and takeaway)
      const totalPrice = subtotal - offerDiscount + tax + deliveryFee;

      // Create order object with FoodOrder schema - matching backend expectations
      const order = {
        items: items.map(item => ({
          foodId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        })),
        customerDetails: {
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone
        },
        guest: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        orderType: formData.orderType,
        tableNumber: formData.tableNumber || null,
        pickupTime: formData.pickupTime ? parseInt(formData.pickupTime, 10) : null,
        specialInstructions: formData.specialInstructions,
        paymentMethod: formData.paymentMethod === 'cash' ? 'cash' : formData.paymentMethod === 'card' ? 'card' : 'cash',
        currency: 'LKR',
        deliveryAddress: formData.deliveryAddress || null,
        deliveryInstructions: formData.deliveryInstructions || null,
        subtotal: subtotal,
        tax: tax,
        deliveryFee: deliveryFee, // Backend requires this field (0 for non-delivery orders)
        totalPrice: totalPrice, // Total with discount applied
        total: totalPrice,
        discount: offerDiscount, // Discount amount
        appliedOffer: appliedOffer ? {
          offerId: appliedOffer._id,
          code: appliedOffer.code,
          type: appliedOffer.type,
          value: appliedOffer.discountValue,
          discountAmount: offerDiscount
        } : null,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('📦 Order object created:', order);
      
      // Save guest email to localStorage for order tracking
      localStorage.setItem('guestOrderEmail', formData.email);
      
      // Handle different payment methods
      if (formData.paymentMethod === 'card') {
        // For card payments, redirect to PayHere
        console.log('💳 Processing card payment...');
        toast.info('Redirecting to secure payment gateway...');
        
        // Create order first to get order ID
        const orderResponse = await submitOrderMutation.mutateAsync(order);
        
        if (orderResponse.data && orderResponse.data.paymentResult?.payHereData) {
          // Redirect to PayHere with payment data
          const payHereData = orderResponse.data.paymentResult.payHereData;
          console.log('💳 PayHere data received:', payHereData);
          redirectToPayHere(payHereData);
          
          // Store order ID for tracking payment
          localStorage.setItem('pendingPaymentOrderId', orderResponse.data.data._id);
        } else {
          throw new Error('Failed to initialize payment. PayHere data not received.');
        }
      } else {
        // For other payment methods, submit order directly
        console.log('💰 Processing order with payment method:', formData.paymentMethod);
        submitOrderMutation.mutate(order);
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Checkout failed. Please try again.';
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsProcessing(false);
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
    <div className="w-full h-full sm:max-w-6xl mx-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:min-h-0 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4 border-b sm:border-b-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">Checkout</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">Complete your order in just a few steps</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl sm:rounded-2xl transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Progress Bar - Compact on mobile */}
      <div className="mb-6 sm:mb-12">
        {/* Mobile Progress (Simple dots) */}
        <div className="flex sm:hidden items-center justify-center gap-2 mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  step.number < currentStep
                    ? 'bg-green-500 w-2.5'
                    : step.number === currentStep
                    ? 'bg-indigo-600 w-8'
                    : 'bg-gray-300 dark:bg-gray-600 w-2.5'
                }`}
              />
            </React.Fragment>
          ))}
        </div>
        
        {/* Desktop Progress (Full) */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : step.number === currentStep
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="text-center mt-2 sm:mt-3">
                    <div className={`text-xs sm:text-sm font-semibold ${
                      step.number <= currentStep ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden lg:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 sm:h-1 mx-2 sm:mx-4 transition-colors duration-300 ${
                      step.number < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Step Title */}
        <div className="sm:hidden text-center mt-3">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">{steps[currentStep - 1]?.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{steps[currentStep - 1]?.description}</p>
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
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Guest Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Please provide your contact details for order confirmation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FoodLabel htmlFor="firstName">First Name *</FoodLabel>
                <FoodInput
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleFieldBlur('firstName')}
                  placeholder="Enter your first name"
                  className={errors.firstName || (fieldValidation.firstName && touchedFields.has('firstName')) ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {(errors.firstName || (fieldValidation.firstName && touchedFields.has('firstName'))) && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName || fieldValidation.firstName}
                  </p>
                )}
                {!fieldValidation.firstName && touchedFields.has('firstName') && formData.firstName && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Looks good!
                  </p>
                )}
              </div>

              <div>
                <FoodLabel htmlFor="lastName">Last Name *</FoodLabel>
                <FoodInput
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleFieldBlur('lastName')}
                  placeholder="Enter your last name"
                  className={errors.lastName || (fieldValidation.lastName && touchedFields.has('lastName')) ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {(errors.lastName || (fieldValidation.lastName && touchedFields.has('lastName'))) && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName || fieldValidation.lastName}
                  </p>
                )}
                {!fieldValidation.lastName && touchedFields.has('lastName') && formData.lastName && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Looks good!
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
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="your.email@example.com"
                  className={errors.email || (fieldValidation.email && touchedFields.has('email')) ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {(errors.email || (fieldValidation.email && touchedFields.has('email'))) && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email || fieldValidation.email}
                  </p>
                )}
                {!fieldValidation.email && touchedFields.has('email') && formData.email && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Valid email!
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
                  onBlur={() => handleFieldBlur('phone')}
                  placeholder="+94 77 123 4567"
                  className={errors.phone || (fieldValidation.phone && touchedFields.has('phone')) ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {(errors.phone || (fieldValidation.phone && touchedFields.has('phone'))) && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone || fieldValidation.phone}
                  </p>
                )}
                {!fieldValidation.phone && touchedFields.has('phone') && formData.phone && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Valid phone number!
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
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Type</h2>
              <p className="text-gray-600">Choose how you'd like to receive your order</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dine-in Option */}
              <div
                className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.orderType === 'dine-in'
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleInputChange('orderType', 'dine-in')}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    formData.orderType === 'dine-in' ? 'bg-indigo-500' : 'bg-gray-100'
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
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleInputChange('orderType', 'takeaway')}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    formData.orderType === 'takeaway' ? 'bg-indigo-500' : 'bg-gray-100'
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
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Payment Method</h2>
              <p className="text-gray-600">Choose how you'd like to pay</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { value: 'cash', label: 'Pay at Restaurant', icon: '💵', description: 'Pay when you arrive', color: 'bg-green-50 border-green-200' },
                { value: 'card', label: 'Credit/Debit Card', icon: '💳', description: 'Pay online now (PayHere)', color: 'bg-purple-50 border-purple-200' }
              ].map((method) => (
                <div
                  key={method.value}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    formData.paymentMethod === method.value
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : `border-gray-200 hover:border-indigo-300 ${method.color}`
                  }`}
                  onClick={() => handleInputChange('paymentMethod', method.value)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-2xl sm:text-3xl">{method.icon}</span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-800">{method.label}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Card Payment Info */}
            {formData.paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 sm:mt-8 p-4 sm:p-6 bg-purple-50 rounded-xl sm:rounded-2xl border border-purple-200"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-2">Secure Payment via PayHere</h4>
                    <p className="text-xs sm:text-sm text-gray-600">You'll be redirected to PayHere's secure payment gateway to complete your purchase.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hidden div to maintain layout structure */}
            {false && formData.paymentMethod === 'never' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-8 bg-blue-50 rounded-2xl border border-blue-200"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  Placeholder
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
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-indigo-600" />
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
                  <span className="text-gray-800 font-semibold">
                    LKR {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                
                {/* Show applied offer discount */}
                {appliedOffer && (
                  <div className="flex justify-between text-lg">
                    <span className="text-green-600 flex items-center gap-2">
                      <Star className="w-4 h-4" fill="currentColor" />
                      Offer Discount ({appliedOffer.type === 'percentage' ? `${appliedOffer.discountValue}%` : `LKR ${appliedOffer.discountValue}`})
                    </span>
                    <span className="text-green-600 font-semibold">
                      - LKR {(appliedOffer.type === 'percentage' 
                        ? (items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (appliedOffer.discountValue / 100))
                        : Math.min(appliedOffer.discountValue, items.reduce((sum, item) => sum + (item.price * item.quantity), 0))
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="text-gray-800 font-semibold">
                    LKR {(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-800 font-semibold">
                    LKR 0.00
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-3 mt-3">
                  <span className="text-gray-800">Total</span>
                  <span className="text-indigo-600">
                    LKR {(() => {
                      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      let discount = 0;
                      if (appliedOffer) {
                        if (appliedOffer.type === 'percentage') {
                          discount = subtotal * (appliedOffer.discountValue / 100);
                        } else if (appliedOffer.type === 'fixed_amount') {
                          discount = Math.min(appliedOffer.discountValue, subtotal);
                        }
                      }
                      const tax = subtotal * 0.1;
                      return (subtotal - discount + tax).toFixed(2);
                    })()}
                  </span>
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
                  <div><strong>Payment:</strong> {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                    formData.paymentMethod === 'card' ? 'Credit/Debit Card' :
                    formData.paymentMethod === 'bank' ? 'Bank Transfer' : 'Pay at Restaurant'}</div>
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

        {/* Navigation Buttons - Mobile responsive */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200 sticky bottom-0 bg-white dark:bg-gray-800 pb-4 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0">
          <FoodButton
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            variant="outline"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base order-2 sm:order-1"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </FoodButton>

          {currentStep < 4 ? (
            <FoodButton
              type="button"
              onClick={() => {
                // Validate current step before proceeding
                if (currentStep === 1) {
                  const guestErrors = {};
                  if (!formData.firstName.trim()) guestErrors.firstName = 'First name is required';
                  if (!formData.lastName.trim()) guestErrors.lastName = 'Last name is required';
                  if (!formData.email.trim()) guestErrors.email = 'Email is required';
                  if (!formData.phone.trim()) guestErrors.phone = 'Phone number is required';
                  if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
                    guestErrors.email = 'Please enter a valid email address';
                  }
                  if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
                    guestErrors.phone = 'Please enter a valid phone number';
                  }
                  
                  if (Object.keys(guestErrors).length > 0) {
                    setErrors(guestErrors);
                    return;
                  }
                }
                
                if (currentStep === 2) {
                  const orderErrors = {};
                  if (formData.orderType === 'dine-in' && !formData.tableNumber) {
                    orderErrors.tableNumber = 'Table number is required for dine-in orders';
                  }
                  if (formData.orderType === 'takeaway' && !formData.pickupTime) {
                    orderErrors.pickupTime = 'Pickup time is required for takeaway orders';
                  }
                  
                  if (Object.keys(orderErrors).length > 0) {
                    setErrors(orderErrors);
                    return;
                  }
                }
                
                setCurrentStep(currentStep + 1);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all order-1 sm:order-2"
            >
              Next
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline" />
            </FoodButton>
          ) : (
            <FoodButton
              type="submit"
              disabled={isProcessing || submitOrderMutation.isLoading}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg disabled:opacity-50 shadow-lg hover:shadow-xl transition-all order-1 sm:order-2"
            >
              {isProcessing || submitOrderMutation.isLoading ? (
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="text-sm sm:text-base">{formData.paymentMethod === 'card' ? 'Processing...' : 'Placing Order...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{formData.paymentMethod === 'card' ? 'Pay Now' : 'Place Order'}</span>
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
        
        {errors.cart && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              <span className="font-semibold">{errors.cart}</span>
            </div>
          </motion.div>
        )}
      </form>

      {/* Order Confirmation Modal */}
      <OrderConfirmation
        order={completedOrder}
        show={showOrderConfirmation}
        onClose={() => {
          setShowOrderConfirmation(false);
          onClose();
        }}
      />
    </div>
  );
};

export default Checkout;