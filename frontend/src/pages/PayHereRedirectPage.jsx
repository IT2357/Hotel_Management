import React, { useEffect } from 'react';

const PayHereRedirectPage = () => {
  useEffect(() => {
    // Get payment data from sessionStorage
    const paymentData = sessionStorage.getItem('payhere_payment');

    if (paymentData) {
      const { gatewayUrl, paymentParams } = JSON.parse(paymentData);

      // Clear the sessionStorage
      sessionStorage.removeItem('payhere_payment');

      // Create a form and submit it to PayHere
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = gatewayUrl;
      form.style.display = 'none';

      // Add payment parameters as hidden inputs
      Object.keys(paymentParams).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentParams[key];
        form.appendChild(input);
      });

      // Add form to body and submit
      document.body.appendChild(form);
      form.submit();
    } else {
      // No payment data found, redirect to checkout
      window.location.href = '/checkout';
    }
  }, []);

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
        <h2>Redirecting to Payment Gateway...</h2>
        <p>Please wait while we redirect you to PayHere for secure payment.</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PayHereRedirectPage;