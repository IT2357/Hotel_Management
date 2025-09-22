import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BookingContext } from '../../context/BookingContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Alert from '../../components/common/Alert';

export default function AdminBookingsPage() {
  const { user } = useContext(AuthContext);
  const {
    bookings,
    stats,
    loading,
    error,
    filters,
    pagination,
    fetchBookings,
    fetchBookingStats,
    updateBookingStatus,
    updateFilters,
    clearError
  } = useContext(BookingContext);

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [holdUntil, setHoldUntil] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const [alert, setAlert] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchBookings();
    fetchBookingStats();
  }, [filters]);

  const handleStatusChange = async (bookingId, newStatus, reason = '') => {
    setActionLoading(true);
    setError(null);
    try {
      const data = {};

      switch (newStatus) {
        case 'Confirmed':
          if (approvalNotes.trim()) {
            data.approvalNotes = approvalNotes;
          }
          break;
        case 'Rejected':
          if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            setActionLoading(false);
            return;
          }
          data.reason = rejectionReason;
          break;
        case 'On Hold':
          if (!holdUntil) {
            alert('Please select a hold until date');
            setActionLoading(false);
            return;
          }
          data.holdUntil = holdUntil;
          data.reason = approvalNotes || 'Put on hold for review';
          break;
      }

      await updateBookingStatus(bookingId, newStatus, data);
      setShowActionModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      setHoldUntil('');
      setApprovalNotes('');
    } catch (error) {
      console.error('Failed to update booking status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (booking, action) => {
    setSelectedBooking(booking);
    setActionType(action);
    setShowActionModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const getPaymentMethodInfo = (paymentMethod) => {
    const methods = {
      card: { label: 'Credit/Debit Card', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      bank: { label: 'Bank Transfer', color: 'bg-purple-100 text-purple-800', icon: '🏦' },
      cash: { label: 'Pay at Hotel', color: 'bg-green-100 text-green-800', icon: '💵' }
    };
    return methods[paymentMethod] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  const getPaymentMethodBadge = (paymentMethod) => {
    const info = getPaymentMethodInfo(paymentMethod);
    return (
      <Badge className={info.color}>
        <span className="mr-1">{info.icon}</span>
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">Booking Management</h1>
          <p className="text-gray-600 mt-1">Manage hotel reservations and bookings</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card title="Total Bookings" className="p-6">
            <div className="text-3xl font-bold text-indigo-600">{stats.totalBookings || 0}</div>
            <p className="text-gray-600">All bookings</p>
          </Card>
          <Card title="Pending Approval" className="p-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals || 0}</div>
            <p className="text-gray-600">Require review</p>
          </Card>
          <Card title="Confirmed" className="p-6">
            <div className="text-3xl font-bold text-green-600">{stats.confirmed || 0}</div>
            <p className="text-gray-600">Ready for check-in</p>
          </Card>
          <Card title="Revenue" className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.totalRevenue || 0)}
            </div>
            <p className="text-gray-600">Total bookings value</p>
          </Card>
      {/* Alert Messages */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
            />
            <Select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="On Hold">On Hold</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => updateFilters({ dateFrom: e.target.value, page: 1 })}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => updateFilters({ dateTo: e.target.value, page: 1 })}
            />
            <Button onClick={fetchBookings}>
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{booking.bookingNumber}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{booking.userId?.name}</div>
                          <div className="text-sm text-gray-500">{booking.userId?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{booking.roomId?.title}</div>
                          <div className="text-sm text-gray-500">Room {booking.roomId?.roomNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</div>
                          <div>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(booking.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(booking.totalPrice || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          {booking.status === 'Pending Approval' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionModal(booking, 'approve')}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => openActionModal(booking, 'reject')}
                                disabled={actionLoading}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openActionModal(booking, 'hold')}
                                disabled={actionLoading}
                              >
                                Hold
                              </Button>
                            </>
                          )}
                          {booking.status === 'On Hold' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionModal(booking, 'approve')}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => openActionModal(booking, 'reject')}
                                disabled={actionLoading}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => updateFilters({...filters, page})}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card title="Total Bookings" className="p-6">
            <div className="text-3xl font-bold text-indigo-600">{bookings.length}</div>
            <p className="text-gray-600">This month</p>
          </Card>
          <Card title="Confirmed" className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'Confirmed').length}
            </div>
            <p className="text-gray-600">Ready for check-in</p>
          </Card>
          <Card title="Pending" className="p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'Pending Approval').length}
            </div>
            <p className="text-gray-600">Awaiting confirmation</p>
          </Card>
          <Card title="Revenue" className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0))}
            </div>
            <p className="text-gray-600">Total bookings value</p>
          </Card>
        </div>
      </main>

      {/* Enhanced Action Modal */}
      {showActionModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'approve' ? 'Approve Booking' :
               actionType === 'reject' ? 'Reject Booking' :
               actionType === 'hold' ? 'Put Booking on Hold' : 'Booking Action'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium">{selectedBooking.bookingNumber}</h4>
              <p className="text-sm text-gray-600">
                Guest: {selectedBooking.userId?.name}
              </p>
              <p className="text-sm text-gray-600">
                Room: {selectedBooking.roomId?.title}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Amount: {formatCurrency(selectedBooking.totalPrice || 0)}
              </p>
            </div>

            {/* Approval Notes */}
            {actionType === 'approve' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes for this approval..."
                />
              </div>
            )}

            {/* Rejection Reason */}
            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}

            {/* Hold Until Date */}
            {actionType === 'hold' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hold Until Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={holdUntil}
                  onChange={(e) => setHoldUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2"
                  rows="2"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Reason for putting on hold..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedBooking(null);
                  setRejectionReason('');
                  setHoldUntil('');
                  setApprovalNotes('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusChange(
                  selectedBooking._id,
                  actionType === 'approve' ? 'Confirmed' :
                  actionType === 'reject' ? 'Rejected' : 'On Hold'
                )}
                disabled={actionLoading ||
                  (actionType === 'reject' && !rejectionReason.trim()) ||
                  (actionType === 'hold' && !holdUntil)
                }
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {actionLoading ? 'Processing...' :
                 actionType === 'approve' ? 'Approve Booking' :
                 actionType === 'reject' ? 'Reject Booking' : 'Put on Hold'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}