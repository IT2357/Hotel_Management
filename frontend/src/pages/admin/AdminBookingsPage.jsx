import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';

export default function AdminBookingsPage() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({});

  // Mock data - replace with actual API call
  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual booking service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBookings = [
        {
          _id: '1',
          bookingNumber: 'BK-2024-001',
          guest: { name: 'John Doe', email: 'john@example.com' },
          room: { number: '101', type: 'Deluxe' },
          checkIn: '2024-03-15',
          checkOut: '2024-03-18',
          status: 'confirmed',
          totalAmount: 450.00,
          createdAt: '2024-03-01'
        },
        {
          _id: '2',
          bookingNumber: 'BK-2024-002',
          guest: { name: 'Jane Smith', email: 'jane@example.com' },
          room: { number: '205', type: 'Suite' },
          checkIn: '2024-03-20',
          checkOut: '2024-03-23',
          status: 'pending',
          totalAmount: 750.00,
          createdAt: '2024-03-02'
        }
      ];
      
      setBookings(mockBookings);
      setPagination({
        page: 1,
        limit: 20,
        total: mockBookings.length,
        pages: 1
      });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      // Mock API call - replace with actual booking service
      console.log(`Updating booking ${bookingId} status to ${newStatus}`);
      await fetchBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
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
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value, page: 1})}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value, page: 1})}
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
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
                          <div className="font-medium text-gray-900">{booking.guest.name}</div>
                          <div className="text-sm text-gray-500">{booking.guest.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">Room {booking.room.number}</div>
                          <div className="text-sm text-gray-500">{booking.room.type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</div>
                          <div>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${booking.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(booking._id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleStatusChange(booking._id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(booking._id, 'completed')}
                            >
                              Mark Complete
                            </Button>
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
        {pagination.pages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setFilters({...filters, page})}
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
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <p className="text-gray-600">Ready for check-in</p>
          </Card>
          <Card title="Pending" className="p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <p className="text-gray-600">Awaiting confirmation</p>
          </Card>
          <Card title="Revenue" className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              ${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(0)}
            </div>
            <p className="text-gray-600">Total bookings value</p>
          </Card>
        </div>
      </main>
    </div>
  );
}