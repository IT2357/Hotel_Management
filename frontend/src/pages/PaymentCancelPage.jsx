import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowRight, Home, RefreshCw } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={20} />
            Back to Home
          </Link>

          {/* VALDORA Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              V
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
          </div>

          <div></div> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        {/* Cancel Icon */}
        <div style={{ marginBottom: '2rem' }}>
          <XCircle size={80} color="#EF4444" style={{ margin: '0 auto' }} />
        </div>

        {/* Cancel Message */}
        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '1rem', fontWeight: 'bold' }}>
          Payment Cancelled
        </h1>

        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
          Your payment was cancelled. No charges have been made to your account.
          You can try again or continue browsing our menu.
        </p>

        {/* Information Box */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '3rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '1rem' }}>
            Don't worry!
          </h3>
          <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '30px', height: '30px', backgroundColor: '#6B7280', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                ✓
              </div>
              <span>Your cart items are saved for 24 hours</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '30px', height: '30px', backgroundColor: '#6B7280', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                ✓
              </div>
              <span>You can resume your order anytime</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '30px', height: '30px', backgroundColor: '#6B7280', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                ✓
              </div>
              <span>Our menu is always available for you</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/cart"
            style={{
              background: '#C41E3A',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem'
            }}
          >
            <RefreshCw size={16} />
            Resume Order
          </Link>

          <Link
            to="/menu"
            style={{
              background: '#6B7280',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem'
            }}
          >
            Browse Menu
            <ArrowRight size={16} />
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