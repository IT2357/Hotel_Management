import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Home, FileText } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import bookingService from '../../services/bookingService';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [error, setError] = useState(null);

  // Extract PayHere callback parameters
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const statusCode = searchParams.get('status_code');
  const md5sig = searchParams.get('md5sig');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        if (!orderId) {
          throw new Error('No booking order ID found');
        }

        // Fetch booking details by booking number
        const response = await bookingService.getUserBookings();
        const booking = response.data.find(b => b.bookingNumber === orderId);

        if (booking) {
          setBookingDetails(booking);
        } else {
          throw new Error('Booking not found');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Wait a moment for webhook to process
    const timer = setTimeout(fetchBookingDetails, 2000);
    return () => clearTimeout(timer);
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              <h2 className="text-xl font-semibold text-gray-700">Processing your payment...</h2>
              <p className="text-gray-500 text-center">
                Please wait while we confirm your booking. This may take a few moments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600">Error</h2>
              <p className="text-gray-600 text-center">{error}</p>
              <div className="flex gap-4 mt-6">
                <Button onClick={() => navigate('/guest/my-bookings')} variant="outline">
                  View My Bookings
                </Button>
                <Button onClick={() => navigate('/')}>
                  Go to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-8">
          {/* Success Icon and Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 text-lg">
              Your booking has been confirmed and payment has been processed successfully.
            </p>
          </div>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Booking Number</p>
                  <p className="font-mono font-semibold text-indigo-600">{bookingDetails.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-green-600">{bookingDetails.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-in Date</p>
                  <p className="font-semibold">{new Date(bookingDetails.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out Date</p>
                  <p className="font-semibold">{new Date(bookingDetails.checkOut).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Room</p>
                  <p className="font-semibold">{bookingDetails.roomTitle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg">LKR {bookingDetails.totalPrice?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          {paymentId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Payment Information</h3>
                  <p className="text-sm text-yellow-700">
                    Payment ID: <span className="font-mono">{paymentId}</span>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your booking is awaiting admin approval. You will receive an email notification once approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">📋 What Happens Next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Our team will review your booking within 2-4 hours</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>You'll receive an email confirmation once your booking is approved</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>Your room will be reserved until check-in</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</span>
                <span>A confirmation email with all details has been sent to your email</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/guest/my-bookings')}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View My Bookings
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSuccess;
