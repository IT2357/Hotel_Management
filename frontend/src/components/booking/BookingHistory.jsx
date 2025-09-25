// Placeholder for import React, { useState, useEffect } from 'react';
import Card from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { Calendar, MapPin, Users, Eye, Download, Filter, Search } from 'lucide-react';

export default function BookingHistory({ userId, onBookingSelect }) {
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetchBookingHistory();
  }, [userId]);

  const fetchBookingHistory = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock booking history data
      const mockHistory = [
        {
          id: 1,
          bookingNumber: "BK2025001",
          roomTitle: "Deluxe Ocean View Suite",
          roomNumber: "501",
          checkIn: "2025-02-15",
          checkOut: "2025-02-18",
          guests: 2,
          totalPrice: 45000,
          status: "Confirmed",
          createdAt: "2025-01-20",
          image: "/api/placeholder/300/200",
          paymentStatus: "Paid",
          rating: 5,
          reviewStatus: "reviewed"
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
          status: "Pending Approval",
          createdAt: "2025-01-25",
          image: "/api/placeholder/300/200",
          paymentStatus: "Pending",
          rating: null,
          reviewStatus: "not-reviewed"
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
          status: "Completed",
          createdAt: "2024-11-15",
          image: "/api/placeholder/300/200",
          paymentStatus: "Paid",
          rating: 5,
          reviewStatus: "reviewed"
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
          status: "Completed",
          createdAt: "2024-07-20",
          image: "/api/placeholder/300/200",
          paymentStatus: "Paid",
          rating: 4,
          reviewStatus: "reviewed"
        },
        {
          id: 5,
          bookingNumber: "BK2024003",
          roomTitle: "Deluxe Ocean View Suite",
          roomNumber: "502",
          checkIn: "2024-06-15",
          checkOut: "2024-06-17",
          guests: 2,
          totalPrice: 30000,
          status: "Completed",
          createdAt: "2024-05-20",
          image: "/api/placeholder/300/200",
          paymentStatus: "Paid",
          rating: 5,
          reviewStatus: "reviewed"
        }
      ];

      setBookings(mockHistory);
    } catch (error) {
      console.error('Error fetching booking history:', error);
    } finally {
      setLoading(false);
    }
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
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'On Hold': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Refunded': 'bg-blue-100 text-blue-800',
      'Failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' ||
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const canReview = (booking) => {
    return booking.status === 'Completed' &&
           booking.reviewStatus === 'not-reviewed' &&
           new Date(booking.checkOut) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Booking History
          </h2>
          <p className="text-gray-600">
            View all your past and upcoming reservations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Bookings</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="On Hold">On Hold</option>
            <option value="Approved - Payment Pending">Approved (Pay at Hotel)</option>
            <option value="Approved - Payment Processing">Approved (Payment Processing)</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {bookings.length}
          </div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b =>
              b.status === 'Confirmed' ||
              b.status === 'Approved - Payment Pending' ||
              b.status === 'Approved - Payment Processing' ||
              b.status === 'Completed'
            ).length}
          </div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(bookings.filter(b => typeof b.totalPrice === 'number' && !isNaN(b.totalPrice)).reduce((sum, b) => sum + b.totalPrice, 0))}
          </div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => canReview(b)).length}
          </div>
          <div className="text-sm text-gray-600">To Review</div>
        </Card>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filter !== 'all'
              ? "No bookings match your current filters."
              : "You haven't made any bookings yet."
            }
          </p>
          {(!searchTerm && filter === 'all') && (
            <Button onClick={() => window.location.href = '/booking'}>
              Make Your First Booking
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition duration-300">
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
                        Booking #{booking.bookingNumber} • Room {booking.roomNumber}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Check-in</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.checkIn)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Check-out</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.checkOut)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Guests</p>
                        <p className="text-sm text-gray-600">{booking.guests}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Nights</p>
                        <p className="text-sm text-gray-600">{getNights(booking.checkIn, booking.checkOut)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Paid</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatPrice(booking.totalPrice)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBookingSelect && onBookingSelect(booking)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>

                      {booking.status === 'Completed' && booking.paymentStatus === 'Paid' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      )}

                      {canReview(booking) && (
                        <Button variant="outline" size="sm">
                          Write Review
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Rating Display */}
                  {booking.rating && (
                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 ${
                              i < booking.rating ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {booking.rating}.0 rating given
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}