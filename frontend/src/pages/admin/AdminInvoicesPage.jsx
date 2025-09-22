// 📁 frontend/src/pages/admin/AdminInvoicesPage.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/common/Alert';

export default function AdminInvoicesPage() {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [alert, setAlert] = useState(null);

  // Fetch invoices from API
  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/invoices/admin/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setInvoices(data.data.invoices);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/invoices/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
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

  const handleStatusChange = async (invoiceId, newStatus, reason = '') => {
    try {
      const endpoint = `/api/invoices/admin/${invoiceId}/status`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      const data = await response.json();
      if (data.success) {
        fetchInvoices(); // Refresh the list
        setSelectedInvoice(null);
      } else {
        alert(data.message || 'Failed to update invoice status');
      }
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      alert('Failed to update invoice status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    return (
      <Badge className={getStatusColor(status)}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Manage invoices and payment tracking</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
              <h3 className="text-lg font-bold">📄 Total Invoices</h3>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {stats.totalInvoices || 0}
              </div>
              <p className="text-gray-600 text-sm">All invoices</p>
            </div>
          </Card>

          <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
              <h3 className="text-lg font-bold">💰 Paid</h3>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.paid || 0}
              </div>
              <p className="text-gray-600 text-sm">Fully paid</p>
            </div>
          </Card>

          <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-white">
              <h3 className="text-lg font-bold">⏳ Pending</h3>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {stats.pending || 0}
              </div>
              <p className="text-gray-600 text-sm">Awaiting payment</p>
            </div>
          </Card>

          <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
              <h3 className="text-lg font-bold">💵 Revenue</h3>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatCurrency(stats.totalRevenue || 0)}
              </div>
              <p className="text-gray-600 text-sm">Total collected</p>
            </div>
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
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
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
            <Button onClick={fetchInvoices}>
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Invoices List */}
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
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
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
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.userId?.name}</div>
                          <div className="text-sm text-gray-500">{invoice.userId?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.bookingId?.bookingNumber}</div>
                          <div className="text-sm text-gray-500">
                            {invoice.bookingId?.roomId?.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</div>
                          <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(invoice.bookingId?.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          {invoice.status === 'Draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(invoice._id, 'Sent')}
                            >
                              Send
                            </Button>
                          )}
                          {invoice.status === 'Sent' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(invoice._id, 'Paid')}
                              >
                                Mark Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(invoice._id, 'Overdue')}
                              >
                                Overdue
                              </Button>
                            </>
                          )}
                          {invoice.status === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(invoice._id, 'Paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            Edit
                          </Button>
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
            <div className="flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setFilters({...filters, page})}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pagination.currentPage
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card title="Total Invoices" className="p-6">
            <div className="text-3xl font-bold text-indigo-600">{invoices.length}</div>
            <p className="text-gray-600">This month</p>
          </Card>
          <Card title="Paid" className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {invoices.filter(i => i.status === 'Paid').length}
            </div>
            <p className="text-gray-600">Fully paid</p>
          </Card>
          <Card title="Pending" className="p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {invoices.filter(i => i.status === 'Pending' || i.status === 'Sent').length}
            </div>
            <p className="text-gray-600">Awaiting payment</p>
          </Card>
          <Card title="Revenue" className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0))}
            </div>
            <p className="text-gray-600">Collected this month</p>
          </Card>
        </div>
      </main>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Invoice Number</h4>
                  <p>{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Status</h4>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Customer Details</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Name:</strong> {selectedInvoice.userId?.name}</p>
                  <p><strong>Email:</strong> {selectedInvoice.userId?.email}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Booking Information</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Booking:</strong> {selectedInvoice.bookingId?.bookingNumber}</p>
                  <p><strong>Room:</strong> {selectedInvoice.bookingId?.roomId?.title}</p>
                  <p><strong>Check-in:</strong> {new Date(selectedInvoice.bookingId?.checkIn).toLocaleDateString()}</p>
                  <p><strong>Check-out:</strong> {new Date(selectedInvoice.bookingId?.checkOut).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Invoice Details</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Issue Date:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                  <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  <p><strong>Total Amount:</strong> {formatCurrency(selectedInvoice.totalAmount || 0)}</p>
                </div>
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Items</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    {selectedInvoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between py-1">
                        <span>{item.description}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              {selectedInvoice.status === 'Draft' && (
                <Button
                  onClick={() => handleStatusChange(selectedInvoice._id, 'Sent')}
                >
                  Send Invoice
                </Button>
              )}
              {selectedInvoice.status === 'Sent' && (
                <Button
                  onClick={() => handleStatusChange(selectedInvoice._id, 'Paid')}
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
