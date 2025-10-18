import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const Checkout = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('payhere');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [currentStep, setCurrentStep] = useState(1); // 1: Customer Info, 2: Review, 3: Payment
  const navigate = useNavigate();

  // Load order details from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('orderDetails');
    if (savedOrder) {
      setOrderDetails(JSON.parse(savedOrder));
    } else {
      navigate('/food/cart');
    }
  }, [navigate]);

  // Handle customer info change
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Final step - place order
    setLoading(true);
    setError(null);
    
    try {
      // Prepare order data
      const orderData = {
        items: orderDetails.items.map(item => ({
          foodId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        orderType: orderDetails.orderType,
        customerDetails: {
          ...customerInfo,
          specialInstructions: orderDetails.specialInstructions
        },
        subtotal: orderDetails.subtotal,
        tax: orderDetails.tax,
        totalPrice: orderDetails.total,
        ...(orderDetails.orderType === 'dine-in' && { tableNumber: orderDetails.tableNumber })
      };
      
      // Place order
      const res = await api.post('/food/orders', orderData);
      
      if (res.data.success) {
        // Clear cart and order details
        localStorage.removeItem('foodCart');
        localStorage.removeItem('orderDetails');
        
        // Redirect to order confirmation page
        navigate('/food/order-confirmation', { 
          state: { 
            orderId: res.data.data._id,
            order: res.data.data
          } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {language === 'en' ? 'Loading order details...' : 'ஆர்டர் விவரங்களை ஏற்றுகிறது...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#4A4A4A]">
            {language === 'en' ? 'Checkout' : 'பணம் செலுத்து'}
          </h1>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded ${language === 'en' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1 rounded ${language === 'ta' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-[#FF9933] -z-10 transition-all duration-500"
              style={{ width: `${(currentStep - 1) * 50}%` }}
            ></div>
            
            {[1, 2, 3].map(step => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step 
                    ? 'bg-[#FF9933] text-white' 
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {step}
                </div>
                <span className="mt-2 text-sm font-medium text-[#4A4A4A]">
                  {step === 1 && (language === 'en' ? 'Info' : 'தகவல்')}
                  {step === 2 && (language === 'en' ? 'Review' : 'மதிப்பாய்வு')}
                  {step === 3 && (language === 'en' ? 'Payment' : 'பணம்')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  {currentStep === 1 && (
                    <div>
                      <h2 className="text-2xl font-bold text-[#4A4A4A] mb-6">
                        {language === 'en' ? 'Customer Information' : 'வாடிக்கையாளர் தகவல்'}
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                            {language === 'en' ? 'Full Name' : 'முழு பெயர்'} *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={customerInfo.name}
                            onChange={handleCustomerInfoChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                            placeholder={language === 'en' ? "Enter your full name" : "உங்கள் முழு பெயரை உள்ளிடவும்"}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                            {language === 'en' ? 'Email Address' : 'மின்னஞ்சல் முகவரி'} *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={customerInfo.email}
                            onChange={handleCustomerInfoChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                            placeholder={language === 'en' ? "Enter your email" : "உங்கள் மின்னஞ்சலை உள்ளிடவும்"}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                            {language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'} *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={customerInfo.phone}
                            onChange={handleCustomerInfoChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                            placeholder={language === 'en' ? "Enter your phone number" : "உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்"}
                          />
                        </div>
                        
                        {orderDetails.orderType === 'takeaway' && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                              {language === 'en' ? 'Delivery Address' : 'விநியோக முகவரி'} *
                            </label>
                            <textarea
                              name="address"
                              value={customerInfo.address}
                              onChange={handleCustomerInfoChange}
                              required={orderDetails.orderType === 'takeaway'}
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                              placeholder={language === 'en' ? "Enter your delivery address" : "உங்கள் விநியோக முகவரியை உள்ளிடவும்"}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div>
                      <h2 className="text-2xl font-bold text-[#4A4A4A] mb-6">
                        {language === 'en' ? 'Order Review' : 'ஆர்டர் மதிப்பாய்வு'}
                      </h2>
                      
                      <div className="border rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-lg mb-4">
                          {language === 'en' ? 'Order Items' : 'ஆர்டர் பொருட்கள்'}
                        </h3>
                        
                        <div className="space-y-4">
                          {orderDetails.items.map(item => (
                            <div key={item._id} className="flex justify-between items-center border-b pb-4 last:border-b-0 last:pb-0">
                              <div>
                                <h4 className="font-medium">
                                  {language === 'en' ? item.name.en : item.name.ta}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {language === 'en' ? 'Quantity' : 'அளவு'}: {item.quantity}
                                </p>
                              </div>
                              <div className="font-medium">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-4">
                          {language === 'en' ? 'Order Details' : 'ஆர்டர் விவரங்கள்'}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              {language === 'en' ? 'Order Type' : 'ஆர்டர் வகை'}
                            </p>
                            <p className="font-medium">
                              {orderDetails.orderType === 'dine-in' 
                                ? (language === 'en' ? 'Dine In' : 'உணவருந்த') 
                                : (language === 'en' ? 'Takeaway' : 'எடுத்துச் செல்')}
                            </p>
                          </div>
                          
                          {orderDetails.orderType === 'dine-in' && (
                            <div>
                              <p className="text-sm text-gray-600">
                                {language === 'en' ? 'Table Number' : 'மேசை எண்'}
                              </p>
                              <p className="font-medium">
                                {orderDetails.tableNumber}
                              </p>
                            </div>
                          )}
                          
                          {orderDetails.specialInstructions && (
                            <div className="col-span-2">
                              <p className="text-sm text-gray-600">
                                {language === 'en' ? 'Special Instructions' : 'சிறப்பு அறிவுறுத்தல்கள்'}
                              </p>
                              <p className="font-medium">
                                {orderDetails.specialInstructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 3 && (
                    <div>
                      <h2 className="text-2xl font-bold text-[#4A4A4A] mb-6">
                        {language === 'en' ? 'Payment Method' : 'பணம் செலுத்தும் முறை'}
                      </h2>
                      
                      <div className="border rounded-lg p-6 mb-6">
                        <div className="flex items-center mb-4">
                          <input
                            type="radio"
                            id="payhere"
                            name="paymentMethod"
                            value="payhere"
                            checked={paymentMethod === 'payhere'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933]"
                          />
                          <label htmlFor="payhere" className="ml-3 block text-sm font-medium text-[#4A4A4A]">
                            {language === 'en' ? 'PayHere' : 'பேபியர்'}
                          </label>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">
                            {language === 'en' ? 'You will be redirected to PayHere to complete your payment securely.' : 'உங்கள் பணம் செலுத்தலை முடிக்க பேபியருக்கு நீங்கள் திருப்பி அனுப்பப்படுவீர்கள்.'}
                          </p>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold mr-2">
                              P
                            </div>
                            <span className="font-medium">PayHere</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              {language === 'en' ? 
                                'After completing your payment, you will receive an order confirmation email.' : 
                                'உங்கள் பணம் செலுத்தலை முடித்ததும், உங்களுக்கு ஒரு ஆர்டர் உறுதிப்பாட்டு மின்னஞ்சல் வரும்.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">{language === 'en' ? 'Error! ' : 'பிழை! '}</strong>
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : navigate('/food/cart')}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-[#4A4A4A] font-medium hover:bg-gray-50"
                    >
                      {currentStep === 1 
                        ? (language === 'en' ? 'Back to Cart' : 'வண்டிக்குத் திரும்பு') 
                        : (language === 'en' ? 'Previous' : 'முந்தையது')}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-medium rounded-lg transition-colors duration-300 flex items-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {language === 'en' ? 'Processing...' : 'செயலாக்கம்...'}
                        </>
                      ) : (
                        <>
                          {currentStep === 3 
                            ? (language === 'en' ? 'Place Order' : 'ஆர்டர் செய்') 
                            : (language === 'en' ? 'Continue' : 'தொடரவும்')}
                          {currentStep < 3 && (
                            <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#4A4A4A] mb-6">
                  {language === 'en' ? 'Order Summary' : 'ஆர்டர் சுருக்கம்'}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Subtotal' : 'கூட்டுத்தொகை'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(orderDetails.subtotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-green-600">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Discount (5%)' : 'தள்ளுபடி (5%)'}
                    </span>
                    <span className="font-medium">
                      - {formatCurrency(orderDetails.subtotal * 0.05)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Adjusted Subtotal' : 'சரிசெய்யப்பட்ட கூட்டுத்தொகை'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(orderDetails.adjustedSubtotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Tax (10%)' : 'வரி (10%)'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(orderDetails.tax)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                    <span>
                      {language === 'en' ? 'Total' : 'மொத்தம்'}
                    </span>
                    <span className="text-[#FF9933]">
                      {formatCurrency(orderDetails.total)}
                    </span>
                  </div>
                </div>
                
                {currentStep === 2 && (
                  <div className="mt-6 p-4 bg-[#FFF5E6] rounded-lg">
                    <h3 className="font-bold text-[#4A4A4A] mb-2">
                      {language === 'en' ? 'Ready to Place Order?' : 'ஆர்டர் செய்ய தயாரா?'})
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 
                        'Review your order details and click Continue to proceed to payment.' : 
                        'உங்கள் ஆர்டர் விவரங்களை மதிப்பாய்வு செய்து, பணம் செலுத்துவதற்குத் தொடரவும்.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;