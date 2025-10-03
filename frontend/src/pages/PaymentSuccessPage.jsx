import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('processing');

  useEffect(() => {
    // Check PayHere payment status from URL parameters
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');

    if (status === '1' || status === '2') {
      // Status 1 = success, Status 2 = pending (treat as success for now)
      setPaymentStatus('success');
    } else {
      setPaymentStatus('failed');
    }
  }, [searchParams]);

  if (paymentStatus === 'processing') {
    return (
      <div style={{
        fontFamily: "'Rubik', sans-serif",
        margin: 0,
        padding: 0,
        lineHeight: '1.6',
        color: '#333',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #C41E3A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Processing Payment...</h2>
          <p>Please wait while we verify your payment.</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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

      {/* Payment Result */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          {paymentStatus === 'success' ? (
            <>
              <CheckCircle size={80} color="#22C55E" style={{ marginBottom: '1rem' }} />
              <h1 style={{ fontSize: '2.5rem', color: '#22C55E', marginBottom: '1rem' }}>Payment Successful!</h1>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                Thank you for your payment! Your order has been confirmed and is being prepared.
              </p>
            </>
          ) : (
            <>
              <XCircle size={80} color="#EF4444" style={{ marginBottom: '1rem' }} />
              <h1 style={{ fontSize: '2.5rem', color: '#EF4444', marginBottom: '1rem' }}>Payment Failed</h1>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                Your payment could not be processed. Please try again or contact support.
              </p>
            </>
          )}
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
};

export default PaymentSuccessPage;