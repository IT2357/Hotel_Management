// Placeholder for import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { CheckCircle, Calendar, MapPin, Users, CreditCard, Download, Share2, Mail } from 'lucide-react';

export default function BookingConfirmation({ bookingData, onClose }) {
  const navigate = useNavigate();

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Booking Not Found
          </h2>
          <p className="text-gray-600">
            Unable to retrieve booking details. Please try again.
          </p>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
  };

  const getNights = () => {
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status) => {
    // Handle consolidated status values
    if (status === 'Approved - Payment Pending') return 'bg-green-100 text-green-800';
    if (status === 'Approved - Payment Processing') return 'bg-blue-100 text-blue-800';
    if (status === 'Confirmed') return 'bg-green-100 text-green-800';
    if (status === 'Completed') return 'bg-blue-100 text-blue-800';
    if (status === 'Pending Approval') return 'bg-yellow-100 text-yellow-800';
    if (status === 'On Hold') return 'bg-blue-100 text-blue-800';
    if (status === 'Rejected') return 'bg-red-100 text-red-800';
    if (status === 'Cancelled') return 'bg-gray-100 text-gray-800';
    if (status === 'No Show') return 'bg-gray-100 text-gray-800';

    // Legacy support
    const colors = {
      'Confirmed': 'bg-green-100 text-green-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 text-lg">
            Your reservation has been successfully processed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Reference */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Booking Reference
                </h2>
                <Badge className={getStatusColor(bookingData.status)}>
                  {bookingData.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Booking Number</p>
                  <p className="text-lg font-semibold text-gray-800">
                    #{bookingData.bookingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmation Date</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatDate(bookingData.createdAt)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Stay Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Stay Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-800">{bookingData.roomTitle}</p>
                    <p className="text-sm text-gray-600">Room {bookingData.roomNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-800">Check-in</p>
                    <p className="text-sm text-gray-600">{formatDate(bookingData.checkIn)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-800">Check-out</p>
                    <p className="text-sm text-gray-600">{formatDate(bookingData.checkOut)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-800">Guests</p>
                    <p className="text-sm text-gray-600">{bookingData.guests} guest{bookingData.guests !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Special Requests */}
            {bookingData.specialRequests && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Special Requests
                </h2>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {bookingData.specialRequests}
                </p>
              </Card>
            )}

            {/* Hotel Policies */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Important Information
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Check-in & Check-out</h3>
                  <p className="text-sm text-gray-600">
                    Check-in: 2:00 PM • Check-out: 12:00 PM
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Cancellation Policy</h3>
                  <p className="text-sm text-gray-600">
                    Free cancellation up to 24 hours before check-in. Full charge applies after this period.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Contact Information</h3>
                  <p className="text-sm text-gray-600">
                    Phone: +1 (555) 123-4567 • Email: reservations@grandhotel.com
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Payment Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {getNights()} night{getNights() !== 1 ? 's' : ''} × LKR {bookingData.roomPrice?.toLocaleString()}
                  </span>
                  <span className="font-medium">
                    LKR {bookingData.subtotal?.toLocaleString()}
                  </span>
                </div>

                {bookingData.foodPlan && bookingData.foodPlan !== 'None' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {bookingData.foodPlan} × LKR {bookingData.foodPrice?.toLocaleString()}
                    </span>
                    <span className="font-medium">
                      LKR {bookingData.foodTotal?.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Paid</span>
                    <span>LKR {bookingData.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Badge className="bg-green-100 text-green-800 w-full justify-center py-2">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {bookingData.paymentMethod || 'Card'} - {bookingData.paymentStatus}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>

                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Booking
                </Button>

                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Confirmation
                </Button>
              </div>
            </Card>

            {/* What's Next */}
            <Card className="p-6 bg-indigo-50">
              <h3 className="font-semibold text-indigo-800 mb-3">
                What's Next?
              </h3>

              <div className="space-y-3 text-sm text-indigo-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span>You'll receive a confirmation email shortly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span>Check-in details will be sent 48 hours before arrival</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span>Contact us if you need to make changes</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/dashboard/my-bookings')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              View All Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/rooms')}
            >
              Book Another Room
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}