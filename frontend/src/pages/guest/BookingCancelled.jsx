import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, RotateCcw } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const BookingCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('order_id');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          {/* Cancelled Icon and Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-orange-600 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600 text-lg">
              Your payment was cancelled and no charges were made.
            </p>
          </div>

          {/* Information */}
          {orderId && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-700">
                Booking Order ID: <span className="font-mono font-semibold">{orderId}</span>
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Your booking has been put on hold but no payment was processed. 
                You can complete the payment later from your bookings page.
              </p>
            </div>
          )}

          {/* What Happened */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">What Happened?</h3>
            <p className="text-gray-700 mb-4">
              You cancelled the payment process before it was completed. Don't worry, no charges were made to your account.
            </p>
            <h3 className="font-semibold text-gray-800 mb-3">What Can You Do?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Try booking again when you're ready</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>Check your bookings to see if there's a held booking you can complete</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>Contact our support team if you need assistance</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/rooms')}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/guest/my-bookings')}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
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

export default BookingCancelled;
