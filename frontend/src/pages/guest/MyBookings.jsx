
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Calendar, MapPin, Users, CreditCard, Eye, Download, Star, Clock, ArrowLeft } from 'lucide-react';
import bookingService from '../../services/bookingService';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundBooking, setRefundBooking] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const REFUND_WINDOW_DAYS = 180; // Keep in sync with server config

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
        // No fallback to mock data - show empty state
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setError('Please log in to view your bookings.');
      } else {
        setError('Failed to load bookings. Please try again.');
      }

      // Show empty state instead of mock data
      setBookings([]);
    } finally {
      setLoading(false);
    }
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

  const isRefundEligible = (booking) => {
    if (!booking) return false;
    if (!['Confirmed','Completed','Cancelled'].includes(booking.status)) return false;
    // Basic time-window gating using createdAt; backend enforces final check
    const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
    const baseDate = createdAt || new Date(booking.checkIn || Date.now());
    const now = new Date();
    const daysSince = Math.floor((now - baseDate) / (1000*60*60*24));
    return daysSince <= REFUND_WINDOW_DAYS;
  };

  const openRefundModal = (booking) => {
    setRefundBooking(booking);
    setRefundReason('');
    setRefundModalOpen(true);
  };

  const submitRefundRequest = async () => {
    if (!refundBooking) return;
    try {
      const res = await bookingService.requestRefund(refundBooking._id || refundBooking.id, refundReason || 'Refund requested by guest');
      alert(res.message || 'Refund request submitted');
      setRefundModalOpen(false);
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Unable to submit refund request';
      alert(msg);
    }
  };

  const getStatusColor = (status) => {
    // Handle consolidated status values with UserManagementPage color scheme
    if (status === 'Approved - Payment Pending') return 'bg-orange-50 text-orange-800 border-orange-200';
    if (status === 'Approved - Payment Processing') return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
    if (status === 'Confirmed') return 'bg-green-50 text-green-800 border-green-200';
    if (status === 'Completed') return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
    if (status === 'Pending Approval') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (status === 'On Hold') return 'bg-orange-50 text-orange-800 border-orange-200';
    if (status === 'Rejected') return 'bg-red-50 text-red-800 border-red-200';
    if (status === 'Cancelled') return 'bg-red-50 text-red-800 border-red-200';
    if (status === 'No Show') return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';

    // Legacy support with updated colors
    const colors = {
      'Accepted': 'bg-green-50 text-green-800 border-green-200',
      'Confirmed': 'bg-green-50 text-green-800 border-green-200',
      'Pending Approval': 'bg-yellow-50 text-yellow-800 border-yellow-200',
      'On Hold': 'bg-orange-50 text-orange-800 border-orange-200',
      'Rejected': 'bg-red-50 text-red-800 border-red-200',
      'Cancelled': 'bg-red-50 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with Back Button */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => navigate('/guest/dashboard')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:border-indigo-500 hover:text-indigo-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
          </div>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">
              My Bookings
            </h1>
            <p className="text-indigo-100">
              View and manage all your reservations
            </p>
          </div>
          <div className="mt-6">
            <Button
              onClick={fetchBookings}
              variant="outline"
              size="sm"
              disabled={loading}
              className="hover:border-indigo-500 hover:text-indigo-600"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="text-gray-800">{error}</p>
                {error.includes('log in') && (
                  <div className="mt-3">
                    <Button 
                      onClick={() => window.location.href = '/login'}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
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
              className={
                filter === status.key 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
                  : "hover:border-indigo-500 hover:text-indigo-600"
              }
            >
              {status.label}
            </Button>
          ))}
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
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
              <Button 
                onClick={() => window.location.href = '/booking'}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Make Your First Booking
              </Button>
            )}
          </Card>
        ) : (
          /* Bookings List */
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking._id || booking.id} className="overflow-hidden h-72 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white rounded-xl">
                <div className="md:flex h-full">
                  {/* Image */}
                  <div className="md:w-1/3 h-36 md:h-72 relative overflow-hidden">
                    <img
                      src={booking.roomId?.images?.[0]?.url || booking.room?.images?.[0]?.url || `https://source.unsplash.com/600x400?hotel,room,${booking.roomTitle?.replace(/\s+/g, ',')}`}
                      alt={booking.roomTitle || booking.roomId?.title || 'Hotel Room'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="p-3 md:w-2/3 flex flex-col bg-gradient-to-br from-white to-gray-50 h-full md:h-72 overflow-y-auto">
                    <div className="flex-1 min-h-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                            {booking.roomTitle}
                          </h3>
                          <p className="text-gray-600 text-xs font-medium">
                            Booking #{booking.bookingNumber}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <Badge className={`${getStatusColor(booking.status)} text-xs px-2 py-0.5 font-semibold shadow-md`}>
                            {getStatusDisplayText(booking.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div key={`checkin-${booking._id || booking.id}`} className="flex items-center space-x-1 min-w-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-1.5 rounded border border-blue-100">
                          <Calendar className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800">Check-in</p>
                            <p className="text-xs text-gray-600 truncate">{formatDate(booking.checkIn)}</p>
                          </div>
                        </div>

                        <div key={`checkout-${booking._id || booking.id}`} className="flex items-center space-x-1 min-w-0 bg-gradient-to-r from-purple-50 to-pink-50 p-1.5 rounded border border-purple-100">
                          <Calendar className="h-2.5 w-2.5 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800">Check-out</p>
                            <p className="text-xs text-gray-600 truncate">{formatDate(booking.checkOut)}</p>
                          </div>
                        </div>

                        <div key={`guests-${booking._id || booking.id}`} className="flex items-center space-x-1 min-w-0 bg-gradient-to-r from-emerald-50 to-green-50 p-1.5 rounded border border-emerald-100">
                          <Users className="h-2.5 w-2.5 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800">Guests</p>
                            <p className="text-xs text-gray-600">{booking.guests || booking.guestCount?.adults || 1}</p>
                          </div>
                        </div>

                        <div key={`room-${booking._id || booking.id}`} className="flex items-center space-x-1 min-w-0 bg-gradient-to-r from-orange-50 to-amber-50 p-1.5 rounded border border-orange-100">
                          <MapPin className="h-2.5 w-2.5 text-orange-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800">Room</p>
                            <p className="text-xs text-gray-600 truncate">{booking.roomNumber || booking?.roomId?.roomNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section - Price & Actions */}
                    <div className="mt-auto bg-gradient-to-r from-gray-50 to-white p-2 rounded border-t border-gray-200">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div key={`total-${booking._id || booking.id}`} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-1.5 rounded shadow-md">
                            <p className="text-xs font-medium">
                              {booking.status === 'Completed' || booking.status === 'Confirmed'
                                ? 'Total Paid'
                                : booking.paymentMethod === 'cash' && (booking.status === 'Approved - Payment Pending' || booking.status === 'Pending Approval')
                                  ? 'Pay at Hotel'
                                  : 'Total Amount'}
                            </p>
                            <p className="text-xs font-bold">
                              {formatPrice(
                                (booking?.costBreakdown?.total ?? booking?.totalPrice ?? 0)
                              )}
                            </p>
                          </div>
                          <div key={`nights-${booking._id || booking.id}`} className="bg-white px-2 py-1.5 rounded border border-gray-200 shadow-sm">
                            <p className="text-xs font-medium text-gray-600">Nights</p>
                            <p className="text-xs font-semibold text-gray-800">
                              {booking.costBreakdown?.nights || getNights(booking.checkIn, booking.checkOut)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
                          {(booking.status === 'Confirmed' || booking.status === 'Completed') && (
                            <Button 
                              key={`receipt-${booking._id || booking.id}`} 
                              variant="default" 
                              size="sm"
                              onClick={() => window.location.href = '/guest/receipts'}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 text-xs px-2 py-1 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                          )}
                          {isRefundEligible(booking) && (
                            <Button
                              key={`refund-${booking._id || booking.id}`}
                              variant="default"
                              size="sm"
                              onClick={() => openRefundModal(booking)}
                              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 text-xs px-2 py-1 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Refund
                            </Button>
                          )}
                          {booking.status === 'Pending Approval' ||
                           booking.status === 'On Hold' ? (
                            <Button
                              key={`cancel-${booking._id || booking.id}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking._id || booking.id)}
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 text-xs px-2 py-1 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      
                      {/* Special Requests & Status Messages */}
                      <div className="space-y-1 mt-1">
                        {booking.specialRequests && (
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 p-1.5 rounded text-xs shadow-sm">
                            <p className="font-medium text-gray-800 mb-0.5">Special Requests:</p>
                            <p className="text-gray-700 line-clamp-1 truncate">{booking.specialRequests}</p>
                          </div>
                        )}

                        {(booking.status === 'Pending Approval' || booking.status === 'On Hold' || booking.status === 'Approved - Payment Processing') && (
                          <div className="p-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded text-xs shadow-sm">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-2.5 w-2.5 text-amber-600" />
                              <p className="text-amber-800 font-medium truncate">
                                {booking.status === 'Pending Approval' && 'Awaiting approval'}
                                {booking.status === 'On Hold' && 'Booking on hold'}
                                {booking.status === 'Approved - Payment Processing' && 'Payment processing'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            {
              key: 'confirmed-stat',
              value: bookings.filter(b => b.status === 'Confirmed').length,
              label: 'Confirmed',
              gradient: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
              iconBg: 'bg-green-500'
            },
            {
              key: 'paid-stat',
              value: bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length,
              label: 'Paid',
              gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200',
              iconBg: 'bg-emerald-500'
            },
            {
              key: 'completed-stat',
              value: bookings.filter(b => b.status === 'Completed').length,
              label: 'Completed',
              gradient: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
              iconBg: 'bg-blue-500'
            },
            {
              key: 'total-spent-stat',
              value: formatPrice(
                bookings
                  .filter(b => typeof b.totalPrice === 'number' && !isNaN(b.totalPrice))
                  .reduce((sum, b) => sum + b.totalPrice, 0)
              ),
              label: 'Total Spent',
              gradient: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
              iconBg: 'bg-purple-500'
            }
          ].map((stat) => (
            <Card key={stat.key} className={`p-6 text-center ${stat.gradient}`}>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
    <Modal
      isOpen={refundModalOpen}
      onClose={() => setRefundModalOpen(false)}
      title="Request Refund"
    >
      <div className="space-y-4 p-4">
        <p className="text-sm text-gray-700">Please provide a reason for your refund request.</p>
        <Textarea
          rows={4}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          placeholder="Describe your reason (e.g., emergency, duplicate booking, etc.)"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRefundModalOpen(false)}>Cancel</Button>
          <Button onClick={submitRefundRequest}>Submit</Button>
        </div>
      </div>
    </Modal>
    </>
  );
}