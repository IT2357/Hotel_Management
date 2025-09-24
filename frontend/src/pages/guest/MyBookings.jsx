import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Calendar, MapPin, Users, CreditCard, Eye, Download, Star, Clock } from 'lucide-react';
import bookingService from '../../services/bookingService';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getUserBookings({
        page: 1,
        limit: 50 // Get more bookings to show comprehensive history
      });

      if (response.success && response.data) {
        // Handle both direct bookings array and wrapped response
        const bookingsData = response.data.bookings || response.data;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } else {
        // Fallback to mock data if API doesn't return expected format
        setBookings(getMockBookings());
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setError('Please log in to view your bookings. Using sample data for demonstration.');
      } else {
        setError('Failed to load bookings. Please try again.');
      }

      // Fallback to mock data on error
      setBookings(getMockBookings());
    } finally {
      setLoading(false);
    }
  };

  const getMockBookings = () => {
    return [
      {
        id: 1,
        bookingNumber: "BK2025001",
        roomTitle: "Deluxe Ocean View Suite",
        roomNumber: "501",
        checkIn: "2025-02-15",
        checkOut: "2025-02-18",
        guests: 2,
        totalPrice: 45000,
        status: "Accepted",
        paymentStatus: "completed",
        paymentMethod: "card",
        specialRequests: "Late check-out if possible"
      },
      {
        id: 2,
        bookingNumber: "BK2025002",
        roomTitle: "Executive Business Room",
        roomNumber: "301",
        checkIn: "2025-03-10",
        checkOut: "2025-03-12",
        guests: 1,
        totalPrice: 17000,
        status: "On Hold",
        paymentStatus: "pending",
        paymentMethod: "cash",
        specialRequests: "High floor preferred"
      },
      {
        id: 3,
        bookingNumber: "BK2024008",
        roomTitle: "Garden Villa",
        roomNumber: "GV1",
        checkIn: "2024-12-20",
        checkOut: "2024-12-25",
        guests: 4,
        totalPrice: 110000,
        status: "Accepted",
        paymentStatus: "completed",
        paymentMethod: "card",
        specialRequests: "Anniversary celebration setup"
      },
      {
        id: 4,
        bookingNumber: "BK2024005",
        roomTitle: "Standard Room",
        roomNumber: "201",
        checkIn: "2024-08-10",
        checkOut: "2024-08-12",
        guests: 2,
        totalPrice: 16000,
        status: "Cancelled",
        paymentStatus: "Failed",
        paymentMethod: "cash",
        specialRequests: "Quiet room requested"
      }
    ];
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId, 'Cancelled by user');
      // Update local state
      setBookings(prev => prev.map(booking =>
        booking._id === bookingId || booking.id === bookingId
          ? { ...booking, status: 'Cancelled', paymentStatus: 'Failed' }
          : booking
      ));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleViewDetails = (bookingId) => {
    // Navigate to booking details page
    window.location.href = `/booking/details/${bookingId}`;
  };

  const getStatusColor = (status) => {
    // Handle consolidated status values
    if (status === 'Approved - Payment Pending') return 'bg-green-100 text-green-800';
    if (status === 'Approved - Payment Processing') return 'bg-blue-100 text-blue-800';
    if (status === 'Confirmed') return 'bg-green-100 text-green-800';
    if (status === 'Completed') return 'bg-blue-100 text-blue-800';
    if (status === 'Pending Approval') return 'bg-yellow-100 text-yellow-800';
    if (status === 'On Hold') return 'bg-orange-100 text-orange-800';
    if (status === 'Rejected') return 'bg-red-100 text-red-800';
    if (status === 'Cancelled') return 'bg-red-100 text-red-800';
    if (status === 'No Show') return 'bg-gray-100 text-gray-800';

    // Legacy support
    const colors = {
      'Accepted': 'bg-green-100 text-green-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayText = (status) => {
    // Handle consolidated status values with user-friendly display text
    if (status === 'Approved - Payment Pending') return 'Approved (Pay at Hotel)';
    if (status === 'Approved - Payment Processing') return 'Approved (Payment Processing)';
    if (status === 'Confirmed') return 'Confirmed';
    if (status === 'Completed') return 'Completed';
    if (status === 'Pending Approval') return 'Pending Approval';
    if (status === 'On Hold') return 'On Hold';
    if (status === 'Rejected') return 'Rejected';
    if (status === 'Cancelled') return 'Cancelled';
    if (status === 'No Show') return 'No Show';

    // Legacy support
    const displayText = {
      'Accepted': 'Confirmed',
      'Pending Approval': 'Pending Approval',
      'On Hold': 'On Hold',
      'Rejected': 'Rejected',
      'Cancelled': 'Cancelled',
      'Completed': 'Completed',
      'Confirmed': 'Confirmed'
    };
    return displayText[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    // Legacy function - payment status is now part of consolidated status
    return 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'LKR 0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600">
            View and manage all your reservations
          </p>
          <div className="mt-4">
            <Button
              onClick={fetchBookings}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="text-blue-800">{error}</p>
                {error.includes('log in') && (
                  <div className="mt-3">
                    <Button onClick={() => window.location.href = '/login'}>
                      Sign In to View Your Bookings
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'Pending Approval', label: 'Pending Approval' },
            { key: 'On Hold', label: 'On Hold' },
            { key: 'Approved - Payment Pending', label: 'Approved (Pay at Hotel)' },
            { key: 'Approved - Payment Processing', label: 'Approved (Payment Processing)' },
            { key: 'Confirmed', label: 'Confirmed' },
            { key: 'Completed', label: 'Completed' },
            { key: 'Cancelled', label: 'Cancelled' }
          ].map((status) => (
            <Button
              key={status.key}
              variant={filter === status.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status.key)}
            >
              {status.label}
            </Button>
          ))}
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No {filter === 'all' ? '' : filter.toLowerCase()} Bookings
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings yet."
                : `No ${filter.toLowerCase()} bookings found.`
              }
            </p>
            {filter === 'all' && (
              <Button onClick={() => window.location.href = '/booking'}>
                Make Your First Booking
              </Button>
            )}
          </Card>
        ) : (
          /* Bookings List */
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="md:flex">
                  {/* Image */}
                  <div className="md:w-1/4">
                    <img
                      src={booking.image}
                      alt={booking.roomTitle}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6 md:w-3/4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                          {booking.roomTitle}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Booking #{booking.bookingNumber}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusDisplayText(booking.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div key={`checkin-${booking.id}`} className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Check-in</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.checkIn)}</p>
                        </div>
                      </div>

                      <div key={`checkout-${booking.id}`} className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Check-out</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.checkOut)}</p>
                        </div>
                      </div>

                      <div key={`guests-${booking.id}`} className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Guests</p>
                          <p className="text-sm text-gray-600">{booking.guests || booking.guestCount?.adults || 1}</p>
                        </div>
                      </div>

                      <div key={`room-${booking.id}`} className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Room</p>
                          <p className="text-sm text-gray-600">{booking.roomNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-4">
                        <div key={`total-${booking.id}`}>
                          <p className="text-sm text-gray-600">
                            {booking.status === 'Completed' || booking.status === 'Confirmed'
                              ? 'Total Paid'
                              : booking.paymentMethod === 'cash' && (booking.status === 'Approved - Payment Pending' || booking.status === 'Pending Approval')
                                ? 'Amount Due (Pay at Hotel)'
                                : 'Total Amount'}
                          </p>
                          <p className="text-lg font-semibold text-gray-800">
                            {formatPrice(booking.costBreakdown?.total || booking.totalPrice)}
                          </p>
                        </div>
                        <div key={`nights-${booking.id}`}>
                          <p className="text-sm text-gray-600">Nights</p>
                          <p className="text-sm font-medium text-gray-800">
                            {booking.costBreakdown?.nights || getNights(booking.checkIn, booking.checkOut)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          key={`view-${booking.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(booking.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {(booking.status === 'Confirmed' || booking.status === 'Completed') && (
                          <Button key={`receipt-${booking.id}`} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Receipt
                          </Button>
                        )}
                        {booking.status === 'Pending Approval' ||
                         booking.status === 'On Hold' ||
                         booking.status === 'Approved - Payment Pending' ? (
                          <Button
                            key={`cancel-${booking.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          Special Requests:
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.specialRequests}
                        </p>
                      </div>
                    )}

                    {booking.status === 'Pending Approval' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            Your booking is pending approval from our team. We'll notify you once it's confirmed.
                          </p>
                        </div>
                      </div>
                    )}

                    {booking.status === 'On Hold' && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <p className="text-sm text-orange-800">
                            Your booking is currently on hold. Please check back later or contact our team for updates.
                          </p>
                        </div>
                      </div>
                    )}

                    {booking.status === 'Approved - Payment Processing' && (
                      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <p className="text-sm text-indigo-800">
                            Your booking is approved and payment is being processed. We'll notify you once payment is confirmed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {[
          {
            key: 'confirmed-stat',
            value: bookings.filter(b => b.status === 'Confirmed').length,
            label: 'Confirmed',
            color: 'text-indigo-600'
          },
          {
            key: 'paid-stat',
            value: bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length,
            label: 'Paid',
            color: 'text-green-600'
          },
          {
            key: 'completed-stat',
            value: bookings.filter(b => b.status === 'Completed').length,
            label: 'Completed',
            color: 'text-blue-600'
          },
          {
            key: 'total-spent-stat',
            value: formatPrice(
              bookings
                .filter(b => typeof b.totalPrice === 'number' && !isNaN(b.totalPrice))
                .reduce((sum, b) => sum + b.totalPrice, 0)
            ),
            label: 'Total Spent',
            color: 'text-purple-600'
          }
        ].map((stat) => (
          <Card key={stat.key} className="p-6 text-center">
            <div className={`text-2xl font-bold ${stat.color} mb-2`}>
              {stat.value}
            </div>
            <div className="text-gray-600">{stat.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}