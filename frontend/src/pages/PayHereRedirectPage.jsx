import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CreditCard } from 'lucide-react';

export default function PayHereRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      const status = searchParams.get('status');
      const orderId = searchParams.get('order_id');

      if (status === 'success') {
        navigate(`/food/order/success?order_id=${orderId || 'VAL' + Date.now()}`);
      } else {
        navigate('/food/order/cancel');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
        {/* Processing Icon */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <CreditCard size={80} color="#C41E3A" />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <Loader2 size={40} color="#FFD700" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          </div>
        </div>

        {/* Processing Message */}
        <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '1rem', fontWeight: 'bold' }}>
          Processing Payment
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
          Please wait while we process your payment with PayHere...
        </p>

        {/* Loading Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: '#e0e0e0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(45deg, #C41E3A, #FFD700)',
              borderRadius: '2px',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>

        {/* VALDORA Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
            V
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '1rem' }}>
          Authentic Jaffna Tamil Cuisine
        </p>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes loading {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}
      </style>
    </div>
  );
}