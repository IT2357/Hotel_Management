import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import adminService from '../../services/adminService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../common/Alert';

const PaymentForm = ({
  bookingData,
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = 'LKR'
}) => {
  const [paymentProvider, setPaymentProvider] = useState('payhere');
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch payment settings
    const fetchPaymentSettings = async () => {
      try {
        const response = await adminService.getAdminSettings();
        const settings = response.data;
        setPaymentSettings(settings.paymentGateway);
        setPaymentProvider(settings.paymentGateway?.provider || 'payhere');
      } catch (error) {
        console.error('Failed to fetch payment settings:', error);
      }
    };

    fetchPaymentSettings();
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setAlert(null);

    try {
      // Validate payment configuration
      if (!paymentSettings) {
        throw new Error('Payment settings not loaded');
      }

      // Create order ID
      const orderId = `HOTEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare payment data
      const paymentData = {
        orderId,
        amount: parseFloat(amount),
        currency,
        customerName: bookingData.guestName,
        customerEmail: bookingData.guestEmail,
        customerPhone: bookingData.guestPhone,
        items: [{
          name: `Hotel Booking - ${bookingData.roomType}`,
          quantity: 1,
          unit_price: parseFloat(amount)
        }],
        userId: bookingData.userId,
        bookingId: bookingData.bookingId,
      };

      // Initiate payment
      const response = await paymentService.initiatePayment(paymentData);
      const { paymentSession } = response.data;

      // Submit to PayHere
      await paymentService.submitPayHerePayment(paymentSession);

    } catch (error) {
      console.error('Payment initiation failed:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Payment initiation failed'
      });
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayHerePayment = async () => {
    setLoading(true);
    setAlert(null);

    try {
      // Validate PayHere configuration
      if (!paymentSettings?.publicKey || !paymentSettings?.secretKey) {
        throw new Error('PayHere payment gateway is not properly configured');
      }

      // Create order ID
      const orderId = `HOTEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare payment data for PayHere
      const paymentData = {
        orderId,
        amount: parseFloat(amount),
        currency,
        customerName: bookingData.guestName,
        customerEmail: bookingData.guestEmail,
        customerPhone: bookingData.guestPhone,
        items: [{
          name: `Hotel Booking - ${bookingData.roomType}`,
          quantity: 1,
          unit_price: parseFloat(amount)
        }],
        userId: bookingData.userId,
        bookingId: bookingData.bookingId,
      };

      // Initiate PayHere payment
      const response = await paymentService.initiatePayment(paymentData);
      const { paymentSession } = response.data;

      // Submit to PayHere
      await paymentService.submitPayHerePayment(paymentSession);

    } catch (error) {
      console.error('PayHere payment failed:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || error.message || 'PayHere payment failed'
      });
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Payment
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Amount: <span className="font-semibold text-indigo-600">
              {currency} {parseFloat(amount).toFixed(2)}
            </span>
          </p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              {paymentProvider === 'payhere' && (
                <div className="flex items-center p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">🇱🇰</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">PayHere</p>
                    <p className="text-xs text-gray-500">Sri Lankan Payment Gateway</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Recommended
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Room Type:</span>
                <span>{bookingData.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in:</span>
                <span>{bookingData.checkIn}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out:</span>
                <span>{bookingData.checkOut}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>{currency} {parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={paymentProvider === 'payhere' ? handlePayHerePayment : handlePayment}
            disabled={loading || !paymentSettings}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">💳</span>
                Pay {currency} {parseFloat(amount).toFixed(2)}
              </div>
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500">
            🔒 Your payment information is secure and encrypted
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaymentForm;
