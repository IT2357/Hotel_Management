import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CheckoutPage = () => {
  const [orderType, setOrderType] = useState('dine-in');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    tableNumber: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sample cart items (in real app, this would come from cart context)
  const cartItems = [
    {
      id: 1,
      name: 'Jaffna Crab Curry',
      price: 2850,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1626776877761-72e2a7c6d95c?w=100'
    },
    {
      id: 2,
      name: 'VALDORA Special Mutton Curry',
      price: 2250,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1609167830220-7164aa3607c8?w=100'
    }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const serviceCharge = subtotal * 0.10;
  const deliveryFee = orderType === 'delivery' ? 500 : 0;
  const total = subtotal + tax + serviceCharge + deliveryFee;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePlaceOrder = () => {
    // Generate order details
    const orderId = `VAL${Date.now().toString().slice(-8)}`;
    const orderData = {
      orderId,
      orderType,
      customerInfo,
      paymentMethod,
      items: cartItems,
      subtotal,
      tax,
      serviceCharge,
      deliveryFee,
      total,
      orderDate: new Date().toISOString(),
      estimatedTime: orderType === 'dine-in' ? '30 minutes' : orderType === 'takeaway' ? '20 minutes' : '45 minutes'
    };

    setOrderDetails(orderData);
    setOrderPlaced(true);
  };

  if (orderPlaced && orderDetails) {
    return (
      <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333' }}>
        {/* Header */}
        <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                V
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
            </div>
          </div>
        </header>

        {/* Order Confirmation */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <CheckCircle size={80} color="#22C55E" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2.5rem', color: '#22C55E', marginBottom: '1rem' }}>Order Placed Successfully!</h1>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              Thank you for choosing VALDORA! Your authentic Jaffna Tamil cuisine is being prepared with love.
            </p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>
              Order Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <p style={{ margin: '0.5rem 0', color: '#666' }}><strong>Order ID:</strong> {orderDetails.orderId}</p>
                <p style={{ margin: '0.5rem 0', color: '#666' }}><strong>Order Type:</strong> {orderDetails.orderType === 'dine-in' ? 'Dine-in' : orderDetails.orderType === 'takeaway' ? 'Take Away' : 'Delivery'}</p>
                <p style={{ margin: '0.5rem 0', color: '#666' }}><strong>Estimated Time:</strong> {orderDetails.estimatedTime}</p>
              </div>
              <div>
                <p style={{ margin: '0.5rem 0', color: '#666' }}><strong>Customer:</strong> {orderDetails.customerInfo.name}</p>
                <p style={{ margin: '0.5rem 0', color: '#666' }}><strong>Phone:</strong> {orderDetails.customerInfo.phone}</p>
                <p style={{ margin: '0.5rem 0', color: '#666' }}><strong>Payment:</strong> {orderDetails.paymentMethod}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Order Items:</h3>
              {orderDetails.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span>LKR {item.price * item.quantity}</span>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span style={{ color: '#C41E3A' }}>LKR {orderDetails.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/menu" style={{ background: '#6B7280', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Order More Food
            </Link>
            <Link to="/dashboard/my-orders" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Track Order
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ background: '#C41E3A', color: 'white', padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C41E3A', fontWeight: 'bold', fontSize: '1.2rem' }}>
                V
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>VALDORA</span>
            </div>
            <p>&copy; 2024 VALDORA Restaurant. All rights reserved. Authentic Jaffna Tamil Cuisine.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
              <ArrowLeft size={20} />
              Back to Cart
            </Link>
          </div>

          {/* VALDORA Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              V
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user ? (
              <button onClick={handleLogout} style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                Sign Out
              </button>
            ) : (
              <Link to="/login" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Order Form */}
          <div style={{ flex: 2 }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#333' }}>Checkout</h1>

            {/* Order Type Selection */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>
                Order Type
              </h2>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setOrderType('dine-in')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: orderType === 'dine-in' ? '2px solid #C41E3A' : '2px solid #ddd',
                    borderRadius: '10px',
                    backgroundColor: orderType === 'dine-in' ? '#C41E3A' : 'white',
                    color: orderType === 'dine-in' ? 'white' : '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🍽️ Dine-in
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: orderType === 'takeaway' ? '2px solid #C41E3A' : '2px solid #ddd',
                    borderRadius: '10px',
                    backgroundColor: orderType === 'takeaway' ? '#C41E3A' : 'white',
                    color: orderType === 'takeaway' ? 'white' : '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🛍️ Take Away
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: orderType === 'delivery' ? '2px solid #C41E3A' : '2px solid #ddd',
                    borderRadius: '10px',
                    backgroundColor: orderType === 'delivery' ? '#C41E3A' : 'white',
                    color: orderType === 'delivery' ? 'white' : '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Truck size={16} />
                  Delivery
                </button>
              </div>

              {orderType !== 'delivery' && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.tableNumber}
                    onChange={(e) => setCustomerInfo({...customerInfo, tableNumber: e.target.value})}
                    placeholder="Enter table number"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>
                Customer Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Enter your full name"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="+94 XX XXX XXXX"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Delivery Address *
                  </label>
                  <textarea
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    placeholder="Enter complete delivery address"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>
                Payment Method
              </h2>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: paymentMethod === 'cash' ? '2px solid #C41E3A' : '2px solid #ddd',
                    borderRadius: '10px',
                    backgroundColor: paymentMethod === 'cash' ? '#C41E3A' : 'white',
                    color: paymentMethod === 'cash' ? 'white' : '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  💵 Cash on Delivery
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: paymentMethod === 'card' ? '2px solid #C41E3A' : '2px solid #ddd',
                    borderRadius: '10px',
                    backgroundColor: paymentMethod === 'card' ? '#C41E3A' : 'white',
                    color: paymentMethod === 'card' ? 'white' : '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CreditCard size={16} />
                  Card Payment
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '5px', textAlign: 'center' }}>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>
                    You will be redirected to our secure payment gateway to complete your payment.
                  </p>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              style={{
                width: '100%',
                backgroundColor: '#C41E3A',
                color: 'white',
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Place Order - LKR {total.toFixed(0)}
            </button>
          </div>

          {/* Order Summary */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>
                Order Summary
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Items:</h3>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>{item.name}</span>
                      <span style={{ color: '#666', marginLeft: '0.5rem' }}>x{item.quantity}</span>
                    </div>
                    <span>LKR {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '1rem' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span>LKR {subtotal}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Tax (15%)</span>
                <span>LKR {tax.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Service Charge (10%)</span>
                <span>LKR {serviceCharge.toFixed(0)}</span>
              </div>

              {deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span>Delivery Fee</span>
                  <span>LKR {deliveryFee}</span>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '1rem' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span>Total</span>
                <span style={{ color: '#C41E3A' }}>LKR {total.toFixed(0)}</span>
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  {orderType === 'dine-in' ? 'Dine-in orders will be ready in 30 minutes' : orderType === 'takeaway' ? 'Take away orders will be ready in 20 minutes' : 'Delivery in 45 minutes'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#C41E3A', color: 'white', padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: '#FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C41E3A', fontWeight: 'bold', fontSize: '1.2rem' }}>
              V
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>VALDORA</span>
          </div>
          <p>&copy; 2024 VALDORA Restaurant. All rights reserved. Authentic Jaffna Tamil Cuisine.</p>
        </div>
      </footer>
    </div>
  );
};

export default CheckoutPage;
