import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ShoppingCart, User, Phone, Mail, MapPin, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { menuService } from '../../services/menuService';
import { paymentService } from '../../services/paymentService';

const CheckoutPage = () => {
  const { cart, clearCart, cartSubtotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [payhere, setPayhere] = useState(null); // { action, params }
  
  const [formData, setFormData] = useState({
    customerInfo: {
      name: '',
      phone: '',
      email: ''
    },
    orderType: 'dine-in',
    tableNumber: '',
    specialInstructions: '',
    // Align with backend enum values in `backend/models/Order.js`: 'Card', 'Cash', 'Mobile Wallet'
    paymentMethod: 'Card',
    // Specific provider if Mobile Wallet is selected (e.g., 'eZ Cash')
    paymentProvider: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cart.items && cart.items.length === 0) {
      navigate('/menu');
    }
    
    // Pre-fill form with authenticated user data
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        customerInfo: {
          name: user.fullName || user.name || '',
          phone: user.phone || '',
          email: user.email || ''
        }
      }));
    }
  }, [cart.items, navigate, isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name] || errors.submit) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        submit: ''
      }));
    }
  };

  // Create and submit a form to PayHere
  const submitPayHereForm = (payhereData) => {
    if (!payhereData?.action || !payhereData?.params) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payhereData.action;
    Object.entries(payhereData.params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value ?? '';
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    // Avoid leaving the form in DOM
    setTimeout(() => {
      try { document.body.removeChild(form); } catch {}
    }, 5000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerInfo.name.trim()) {
      newErrors['customerInfo.name'] = 'Name is required';
    }
    
    if (!formData.customerInfo.phone.trim()) {
      newErrors['customerInfo.phone'] = 'Phone number is required';
    }
    
    if (!isAuthenticated) {
      if (!formData.customerInfo.email.trim()) {
        newErrors['customerInfo.email'] = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.customerInfo.email)) {
        newErrors['customerInfo.email'] = 'Please enter a valid email address';
      }
    }
    
    if (formData.orderType === 'dine-in' && !formData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required for dine-in orders';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }
    if (formData.paymentMethod === 'Mobile Wallet' && !formData.paymentProvider) {
      newErrors.paymentMethod = 'Please select a mobile wallet provider (e.g., eZ Cash)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = cartSubtotal;
    const tax = Math.round(subtotal * 0.125 * 100) / 100; // 12.5%
    const serviceCharge = Math.round(subtotal * 0.10 * 100) / 100; // 10%
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;
    
    return { subtotal, tax, serviceCharge, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { subtotal, tax, serviceCharge, total } = calculateTotals();
      
      // Debug cart data
      console.log('Cart data:', cart);
      console.log('Cart items:', cart.items);
      
      if (!cart.items || cart.items.length === 0) {
        setErrors({ submit: 'Your cart is empty. Please add items before placing an order.' });
        setLoading(false);
        return;
      }
      
      // Transform cart items for API
      const items = cart.items.map(item => {
        console.log('Processing cart item:', item);
        return {
          // `menuService.createOrder` maps `menuItem` or `menuItemId` to backend
          menuItem: item.menuItem,
          name: item.name,
          quantity: item.quantity,
          price: item.portion.price,
          selectedPortion: item.portion?.name || null,
          specialInstructions: item.specialInstructions || null
        };
      });
      
      const orderData = {
        items,
        customerInfo: formData.customerInfo,
        orderType: formData.orderType,
        tableNumber: formData.orderType === 'dine-in' ? formData.tableNumber : null,
        specialInstructions: formData.specialInstructions || null,
        paymentMethod: formData.paymentMethod,
        paymentProvider: formData.paymentProvider || '',
        userId: isAuthenticated ? user?._id : null,
        // Include totals for backend-side verification
        subtotal,
        tax,
        serviceCharge,
        total
      };
      
      console.log('Sending order data:', orderData);

      // Online payments via PayHere
      if (formData.paymentMethod === 'Card' || formData.paymentMethod === 'Mobile Wallet') {
        const res = await paymentService.initPayHere(orderData);
        if (res?.success && res?.data?.payhere) {
          // Persist email for order tracking on return
          try {
            const emailToSave = isAuthenticated ? user?.email : formData.customerInfo.email;
            if (emailToSave) localStorage.setItem('customerEmail', emailToSave);
            // Persist minimal checkout state to restore after redirect
            localStorage.setItem('lastOrderNumber', res.data.order?.orderNumber || '');
          } catch {}
          setPayhere(res.data.payhere);
          // Auto-submit to PayHere
          submitPayHereForm(res.data.payhere);
          return;
        } else {
          throw new Error(res?.message || 'Failed to initiate payment');
        }
      }

      // Cash flow: place order immediately
      const result = await menuService.createOrder(orderData);

      if (result.success) {
        setOrderDetails(result.data);
        setOrderPlaced(true);
        // Store customer email for order tracking
        if (isAuthenticated) {
          localStorage.setItem('customerEmail', user.email);
        } else {
          localStorage.setItem('customerEmail', formData.customerInfo.email);
        }
        clearCart();
      }
    } catch (error) {
      console.error('Order submission error:', error);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid order data. Please check your information.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      // Show user-friendly error message
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced && orderDetails) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
            <p className="text-gray-400">Thank you for your order at VALDOR</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Order Number:</span>
                <span className="text-white font-semibold">{orderDetails.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order Type:</span>
                <span className="text-white capitalize">{orderDetails.orderType}</span>
              </div>
              {orderDetails.tableNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Table Number:</span>
                  <span className="text-white">{orderDetails.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 font-semibold">{orderDetails.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Time:</span>
                <span className="text-yellow-400">25-30 minutes</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-3">
                <span className="text-white font-semibold">Total Amount:</span>
                <span className="text-yellow-400 font-bold text-lg">LKR {orderDetails.total}</span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <button
              onClick={() => navigate('/my-orders')}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-500 transition duration-300 font-semibold mr-4"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-300 font-semibold"
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { subtotal, tax, serviceCharge, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/menu')}
              className="flex items-center text-yellow-400 hover:text-yellow-300 transition duration-300 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Menu
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Checkout</h1>
              <p className="text-gray-400">Complete your VALDOR order</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Order Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerInfo.name"
                      value={formData.customerInfo.name}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        errors['customerInfo.name'] ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors['customerInfo.name'] && (
                      <p className="text-red-400 text-sm mt-1">{errors['customerInfo.name']}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="customerInfo.phone"
                      value={formData.customerInfo.phone}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        errors['customerInfo.phone'] ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="+94 77 123 4567"
                    />
                    {errors['customerInfo.phone'] && (
                      <p className="text-red-400 text-sm mt-1">{errors['customerInfo.phone']}</p>
                    )}
                  </div>
                </div>
                
                {!isAuthenticated && (
                  <div className="mt-4">
                    <label className="block text-gray-400 text-sm mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="customerInfo.email"
                      value={formData.customerInfo.email}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        errors['customerInfo.email'] ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors['customerInfo.email'] && (
                      <p className="text-red-400 text-sm mt-1">{errors['customerInfo.email']}</p>
                    )}
                  </div>
                )}
                
                {isAuthenticated && (
                  <div className="mt-4">
                    <label className="block text-gray-400 text-sm mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address (From Account)
                    </label>
                    <div className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-300">
                      {user?.email}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Type */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Order Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, orderType: 'dine-in' }))}
                    className={`p-4 rounded-lg border-2 transition duration-300 ${
                      formData.orderType === 'dine-in'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                    }`}
                  >
                    <MapPin className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">Dine-in</div>
                    <div className="text-sm text-gray-400">Eat at restaurant</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, orderType: 'takeaway', tableNumber: '' }))}
                    className={`p-4 rounded-lg border-2 transition duration-300 ${
                      formData.orderType === 'takeaway'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-semibold">Takeaway</div>
                      <div className="text-sm opacity-75">Pick up your order</div>
                    </div>
                  </button>
                </div>
                
                {formData.orderType === 'dine-in' && (
                  <div className="mt-4">
                    <label className="block text-gray-400 text-sm mb-2">Table Number *</label>
                    <input
                      type="text"
                      name="tableNumber"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        errors.tableNumber ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="e.g., T-12"
                    />
                    {errors.tableNumber && (
                      <p className="text-red-400 text-sm mt-1">{errors.tableNumber}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Payment Method</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Cash', paymentProvider: '' }))}
                    className={`p-4 rounded-lg border-2 transition duration-300 ${
                      formData.paymentMethod === 'Cash'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💵</div>
                      <div className="font-semibold">Cash</div>
                      <div className="text-sm opacity-75">Pay with cash</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Card', paymentProvider: '' }))}
                    className={`p-4 rounded-lg border-2 transition duration-300 ${
                      formData.paymentMethod === 'Card'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <CreditCard className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-semibold">Card</div>
                      <div className="text-sm opacity-75">Pay with card</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Mobile Wallet' }))}
                    className={`p-4 rounded-lg border-2 transition duration-300 ${
                      formData.paymentMethod === 'Mobile Wallet'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📱</div>
                      <div className="font-semibold">Mobile Wallet</div>
                      <div className="text-sm opacity-75">FriMi, Genie, etc.</div>
                    </div>
                  </button>
                </div>
                {formData.paymentMethod === 'Mobile Wallet' && (
                  <div className="mt-4">
                    <label className="block text-gray-400 text-sm mb-2">Select Wallet Provider</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'eZ Cash', label: 'eZ Cash', emoji: '💠' },
                        { key: 'mCash', label: 'mCash', emoji: '💬' },
                        { key: 'FriMi', label: 'FriMi', emoji: '🟥' },
                        { key: 'Genie', label: 'Genie', emoji: '🟦' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentProvider: opt.key }))}
                          className={`p-3 rounded-lg border-2 text-sm transition duration-300 ${
                            formData.paymentProvider === opt.key
                              ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                              : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>{opt.emoji}</span>
                            <span className="font-semibold">{opt.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {errors.paymentMethod && (
                  <p className="text-red-400 text-sm mt-2">{errors.paymentMethod}</p>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Special Instructions (Optional)</label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Any special requests or dietary requirements..."
                />
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cart.items.length === 0}
                className="w-full bg-yellow-400 text-black py-4 rounded-lg hover:bg-yellow-500 transition duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Place Order - LKR {total}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{item.name}</h3>
                    {item.portion && (
                      <p className="text-gray-400 text-sm">Portion: {item.portion.name}</p>
                    )}
                    <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-yellow-400 font-semibold">
                    LKR {(item.portion.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>LKR {subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax (12.5%):</span>
                <span>LKR {tax}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Service Charge (10%):</span>
                <span>LKR {serviceCharge}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2">
                <span>Total:</span>
                <span className="text-yellow-400">LKR {total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
