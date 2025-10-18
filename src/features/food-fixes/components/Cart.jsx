import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in'); // dine-in, takeaway
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' for English, 'ta' for Tamil
  const navigate = useNavigate();

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foodCart', JSON.stringify(cart));
  }, [cart]);

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId));
  };

  // Update item quantity in cart
  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate adjusted total (-5%)
  const adjustedTotal = cartTotal * 0.95;

  // Calculate tax (10%)
  const tax = adjustedTotal * 0.1;

  // Calculate final total
  const finalTotal = adjustedTotal + tax;

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(language === 'en' ? 'Your cart is empty!' : 'உங்கள் வண்டி காலியாக உள்ளது!');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      alert(language === 'en' ? 'Please enter your table number' : 'உங்கள் மேசை எண்ணை உள்ளிடவும்');
      return;
    }

    // Save order details to localStorage for checkout page
    const orderDetails = {
      items: cart,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      specialInstructions,
      subtotal: cartTotal,
      adjustedSubtotal: adjustedTotal,
      tax,
      total: finalTotal
    };

    localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
    navigate('/food/checkout');
  };

  // Clear cart
  const clearCart = () => {
    if (window.confirm(
      language === 'en' 
        ? 'Are you sure you want to clear your cart?' 
        : 'உங்கள் வண்டியை அழிக்க விரும்புகிறீர்களா?'
    )) {
      setCart([]);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" 
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-[#4A4A4A]">
              {language === 'en' ? 'Your Cart is Empty' : 'உங்கள் வண்டி காலியாக உள்ளது'}
            </h2>
            <p className="mt-2 text-gray-600">
              {language === 'en' 
                ? 'Looks like you haven\'t added anything to your cart yet.' 
                : 'நீங்கள் இன்னும் எதையும் உங்கள் வண்டியில் சேர்க்கவில்லை போல் தெரிகிறது.'}
            </p>
            <button
              onClick={() => navigate('/food/menu')}
              className="mt-6 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              {language === 'en' ? 'Browse Menu' : 'மெனுவை உலாவு'}
            </button>
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
            {language === 'en' ? 'Your Cart' : 'உங்கள் வண்டி'}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#4A4A4A]">
                    {language === 'en' ? 'Order Summary' : 'ஆர்டர் சுருக்கம்'}
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    {language === 'en' ? 'Clear Cart' : 'வண்டியை அழி'}
                  </button>
                </div>

                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item._id} className="flex items-center border-b pb-6 last:border-b-0">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={language === 'en' ? item.name.en : item.name.ta} 
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      )}
                      <div className="ml-4 flex-1">
                        <h3 className="font-bold text-[#4A4A4A]">
                          {language === 'en' ? item.name.en : item.name.ta}
                        </h3>
                        <p className="text-[#FF9933] font-semibold">
                          LKR {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-l-md text-gray-600 hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-12 h-8 flex items-center justify-center bg-gray-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-r-md text-gray-600 hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">
                  {language === 'en' ? 'Order Type' : 'ஆர்டர் வகை'}
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setOrderType('dine-in')}
                    className={`p-4 rounded-lg border-2 ${
                      orderType === 'dine-in'
                        ? 'border-[#FF9933] bg-[#FFF5E6]'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg 
                        className="w-6 h-6 text-[#FF9933]" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
                        />
                      </svg>
                      <span className="ml-2 font-medium">
                        {language === 'en' ? 'Dine In' : 'உணவருந்த'}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`p-4 rounded-lg border-2 ${
                      orderType === 'takeaway'
                        ? 'border-[#FF9933] bg-[#FFF5E6]'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg 
                        className="w-6 h-6 text-[#FF9933]" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" 
                        />
                      </svg>
                      <span className="ml-2 font-medium">
                        {language === 'en' ? 'Takeaway' : 'எடுத்துச் செல்'}
                      </span>
                    </div>
                  </button>
                </div>
                
                {orderType === 'dine-in' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                      {language === 'en' ? 'Table Number' : 'மேசை எண்'}
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder={language === 'en' ? "Enter table number" : "மேசை எண்ணை உள்ளிடவும்"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                    />
                  </div>
                )}
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                    {language === 'en' ? 'Special Instructions' : 'சிறப்பு அறிவுறுத்தல்கள்'}
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder={language === 'en' ? "Any special requests?" : "எந்த சிறப்பு கோரிக்கைகள்?"}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                  />
                </div>
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
                      LKR {cartTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-green-600">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Discount (5%)' : 'தள்ளுபடி (5%)'}
                    </span>
                    <span className="font-medium">
                      - LKR {(cartTotal * 0.05).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Adjusted Subtotal' : 'சரிசெய்யப்பட்ட கூட்டுத்தொகை'}
                    </span>
                    <span className="font-medium">
                      LKR {adjustedTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Tax (10%)' : 'வரி (10%)'}
                    </span>
                    <span className="font-medium">
                      LKR {tax.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                    <span>
                      {language === 'en' ? 'Total' : 'மொத்தம்'}
                    </span>
                    <span className="text-[#FF9933]">
                      LKR {finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="mt-8 w-full bg-[#FF9933] hover:bg-[#E68A2E] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                  {language === 'en' ? 'Proceed to Checkout' : 'பணம் செலுத்துவதற்குச் செல்'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;