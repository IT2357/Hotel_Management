import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    // Get booking data from sessionStorage (stored before PayHere redirect)
    const pendingBooking = sessionStorage.getItem('pendingPaymentBooking');
    if (pendingBooking) {
      try {
        setBookingData(JSON.parse(pendingBooking));
        // Clear the stored data
        sessionStorage.removeItem('pendingPaymentBooking');
      } catch (error) {
        console.error('Failed to parse booking data:', error);
      }
    }

    // Log PayHere return parameters for debugging
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');
    const statusCode = searchParams.get('status_code');
    const md5sig = searchParams.get('md5sig');

    console.log('PayHere Return Parameters:', {
      payment_id: paymentId,
      order_id: orderId,
      status_code: statusCode,
      md5sig: md5sig
    });
  }, [searchParams]);

  const handleViewBooking = () => {
    if (bookingData?.bookingId) {
      navigate(`/bookings/${bookingData.bookingId}`);
    } else {
      navigate('/my-bookings');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with animated success icon */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-green-100 text-lg">
              Your booking has been confirmed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Payment Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Payment Details
              </h2>
              <div className="space-y-3">
                {searchParams.get('order_id') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-semibold text-gray-900">
                      {searchParams.get('order_id')}
                    </span>
                  </div>
                )}
                {searchParams.get('payment_id') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-semibold text-gray-900">
                      {searchParams.get('payment_id')}
                    </span>
                  </div>
                )}
                {bookingData?.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-gray-900">
                      LKR {bookingData.amount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            {bookingData && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Booking Information
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
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    What's Next?
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>A confirmation email has been sent to your email address</li>
                      <li>You can view your booking details in "My Bookings"</li>
                      <li>Please arrive at the hotel by the check-in time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleViewBooking}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                View Booking Details
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleGoHome}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>Need help? Contact us at support@yourhotel.com</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
