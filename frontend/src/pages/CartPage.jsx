import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, User, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useCart } from '../context/CartContext';

function CartPage() {
  const { user, logout } = useAuth();
  const { items: cartItems, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10; // 10% tax
  const deliveryFee = 200; // LKR 200 delivery fee
  const grandTotal = subtotal + tax + deliveryFee;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333', backgroundColor: '#f9f9f9' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/menu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
              <ArrowLeft size={20} />
              Back to Menu
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
                <LogOut size={16} />
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
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Cart Items */}
          <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#333' }}>Your Cart</h1>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <ShoppingCart size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: '#666', marginBottom: '1rem' }}>Your cart is empty</h2>
                <p style={{ color: '#999', marginBottom: '2rem' }}>Add some delicious Jaffna Tamil dishes to get started!</p>
                <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div>
                {cartItems.map((item) => {
                  console.log('Cart item:', item); // Debug log
                  console.log('Cart item image:', item.image); // Debug log
                  console.log('Cart item imageUrl:', item.imageUrl); // Debug log
                  return (
                    <div key={item.id} style={{
                      display: 'flex',
                      gap: '1rem',
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '15px',
                      marginBottom: '1rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      alignItems: 'center'
                    }}>
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.name}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }}
                      />

                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                          {item.name}
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {item.description}
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>
                          LKR {item.price}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1px solid #ddd',
                              borderRadius: '50%',
                              backgroundColor: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Minus size={16} />
                          </button>
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1px solid #ddd',
                              borderRadius: '50%',
                              backgroundColor: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '0.5rem'
                          }}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#C41E3A' }}>
                        LKR {item.price * item.quantity}
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <Link to="/menu" style={{ background: '#6B7280', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div style={{ flex: '1 1 35%', minWidth: '300px' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '15px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Subtotal ({cartItems.length} items)</span>
                <span>LKR {subtotal}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Tax (10%)</span>
                <span>LKR {tax.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span>Delivery Fee</span>
                <span>LKR {deliveryFee}</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '1.5rem' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>
                  LKR {grandTotal.toFixed(0)}
                </span>
              </div>

              <Link
                to="/checkout"
                style={{
                  background: cartItems.length > 0 ? '#C41E3A' : '#ccc',
                  color: 'white',
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  width: '100%',
                  textAlign: 'center',
                  display: 'block',
                  cursor: cartItems.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Proceed to Checkout
              </Link>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  Free delivery on orders above LKR 3000
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
}

export default CartPage;