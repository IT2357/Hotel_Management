import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    // Get booking data from sessionStorage
    const pendingBooking = sessionStorage.getItem('pendingPaymentBooking');
    if (pendingBooking) {
      try {
        setBookingData(JSON.parse(pendingBooking));
        // Don't clear it yet - user might want to retry
      } catch (error) {
        console.error('Failed to parse booking data:', error);
      }
    }

    // Log PayHere cancel parameters for debugging
    const orderId = searchParams.get('order_id');
    console.log('PayHere Cancel Parameters:', {
      order_id: orderId
    });
  }, [searchParams]);

  const handleRetryPayment = () => {
    // Navigate back to booking flow
    navigate('/book');
  };

  const handleGoHome = () => {
    // Clear stored booking data
    sessionStorage.removeItem('pendingPaymentBooking');
    navigate('/');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Cancel Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with cancel icon */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Cancelled
            </h1>
            <p className="text-red-100 text-lg">
              Your payment was not completed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Cancel Message */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                What Happened?
              </h2>
              <p className="text-gray-600 mb-4">
                You cancelled the payment process or closed the payment window. 
                Your booking has not been confirmed and no charges were made to your account.
              </p>
              {searchParams.get('order_id') && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-semibold text-gray-900">
                      {searchParams.get('order_id')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Information */}
            {bookingData && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Your Booking Details
                </h2>
                <div className="space-y-3">
                  {bookingData.roomName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Room:</span>
                      <span className="font-semibold text-gray-900">
                        {bookingData.roomName}
                      </span>
                    </div>
                  )}
                  {bookingData.checkIn && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(bookingData.checkIn).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {bookingData.checkOut && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(bookingData.checkOut).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {bookingData.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">
                        LKR {bookingData.amount}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  This booking is still available. You can retry the payment to confirm your reservation.
                </p>
              </div>
            )}

            {/* Help Section */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Common Reasons for Cancellation
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Clicked "Cancel" or "Back" button on payment page</li>
                      <li>Closed the payment window or browser tab</li>
                      <li>Payment timeout due to inactivity</li>
                      <li>Network connection issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRetryPayment}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Payment
              </button>
              <button
                onClick={handleContactSupport}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Contact Support
              </button>
            </div>

            <button
              onClick={handleGoHome}
              className="w-full mt-4 bg-white text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 border border-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>Need help? Contact us at support@yourhotel.com or call +94 XXX XXX XXX</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
