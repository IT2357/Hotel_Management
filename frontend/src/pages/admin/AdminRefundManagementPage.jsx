// 📁 frontend/src/pages/admin/AdminRefundManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import adminService from '../../services/adminService';
import Button  from '../../components/ui/Button';
import Badge  from '../../components/ui/Badge';
import Card  from '../../components/ui/Card';
import Modal  from '../../components/ui/Modal';
import Input  from '../../components/ui/Input';
import Textarea  from '../../components/ui/Textarea';
import Spinner  from '../../components/ui/Spinner';
import StatsCard from '../../components/ui/StatsCard';

const AdminRefundManagementPage = () => {
  // State management
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [originalPaymentId, setOriginalPaymentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    processed: 0,
    denied: 0
  });

  // Load refunds on component mount
  useEffect(() => {
    loadRefunds();
  }, []);

  // Filter refunds based on search and status
  useEffect(() => {
    filterRefunds();
  }, [refunds, searchTerm, statusFilter]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingRefunds();
      setRefunds(response.data.data || []);
      calculateStats(response.data.data || []);
    } catch (error) {
      console.error('Failed to load refunds:', error);
      alert('Failed to load refunds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (refundData) => {
    const stats = refundData.reduce((acc, refund) => {
      acc.total++;
      acc[refund.status] = (acc[refund.status] || 0) + 1;
      return acc;
    }, { total: 0, pending: 0, approved: 0, processed: 0, denied: 0 });
    
    setStats(stats);
  };

  const filterRefunds = () => {
    let filtered = refunds;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(refund =>
        refund.bookingId?.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.guestId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.guestId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(refund => refund.status === statusFilter);
    }

    setFilteredRefunds(filtered);
  };

  const handleAction = async (refund, action) => {
    setSelectedRefund(refund);
    setActionType(action);
    setActionReason('');
    setActionMessage('');
    setOriginalPaymentId('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRefund) return;

    try {
      setProcessing(true);
      let response;

      switch (actionType) {
        case 'approve':
          response = await adminService.approveRefund(selectedRefund._id);
          break;
        case 'deny':
          if (!actionReason.trim()) {
            alert('Please provide a reason for denial');
            return;
          }
          response = await adminService.denyRefund(selectedRefund._id, actionReason);
          break;
        case 'request-info':
          if (!actionMessage.trim()) {
            alert('Please provide a message for requesting information');
            return;
          }
          response = await adminService.requestMoreInfo(selectedRefund._id, actionMessage);
          break;
        case 'process':
          if (!originalPaymentId.trim()) {
            alert('Please provide the original payment ID');
            return;
          }
          response = await adminService.processRefund(selectedRefund._id, originalPaymentId);
          break;
        default:
          throw new Error('Invalid action type');
      }

      if (response.data) {
        alert(`Refund ${actionType} successful`);
        setShowActionModal(false);
        loadRefunds(); // Reload data
      }
    } catch (error) {
      console.error(`Failed to ${actionType} refund:`, error);
      alert(`Failed to ${actionType} refund. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = async (refund) => {
    try {
      const response = await adminService.getRefundDetails(refund._id);
      setSelectedRefund(response.data.data); // Correctly access nested data
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to load refund details:', error);
      alert('Failed to load refund details');
    }
  };

  const checkStatus = async (refund) => {
    try {
      const response = await adminService.checkRefundStatus(refund._id);
      setSelectedRefund(response.data);
      alert(`Current status: ${response.data.status}`);
    } catch (error) {
      console.error('Failed to check refund status:', error);
      alert('Failed to check refund status');
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'processed': return 'success';
      case 'denied': return 'error';
      case 'info_requested': return 'secondary';
      default: return 'default';
    }
  };

  const formatAmount = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600 mt-1">Manage and process guest refund requests</p>
        </div>
        <Button onClick={loadRefunds} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Refunds"
          value={stats.total}
          icon="📊"
          variant="default"
        />
        <StatsCard
          title="Pending"
          value={stats.pending || 0}
          icon="⏳"
          variant="warning"
        />
        <StatsCard
          title="Approved"
          value={stats.approved || 0}
          icon="✅"
          variant="info"
        />
        <StatsCard
          title="Processed"
          value={stats.processed || 0}
          icon="✨"
          variant="success"
        />
        <StatsCard
          title="Denied"
          value={stats.denied || 0}
          icon="❌"
          variant="error"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by booking number, guest name, email, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processed">Processed</option>
              <option value="denied">Denied</option>
              <option value="info_requested">Info Requested</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Refunds Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRefunds.map((refund) => (
                <tr key={refund._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {refund.bookingId?.bookingNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{refund.guestId?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{refund.guestId?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatAmount(refund.amount, refund.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {refund.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(refund.status)}>
                      {refund.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(refund.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDetails(refund)}
                    >
                      View
                    </Button>
                    {refund.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAction(refund, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleAction(refund, 'deny')}
                        >
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAction(refund, 'request-info')}
                        >
                          Request Info
                        </Button>
                      </>
                    )}
                    {refund.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAction(refund, 'process')}
                      >
                        Process
                      </Button>
                    )}
                    {(refund.status === 'processed' || refund.status === 'processing') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkStatus(refund)}
                      >
                        Check Status
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRefunds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No refund requests found
            </div>
          )}
        </div>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedRefund && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Refund Request Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Booking Number</label>
                <p className="text-gray-900">{selectedRefund.bookingId?.bookingNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Guest Name</label>
                <p className="text-gray-900">{selectedRefund.guestId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Guest Email</label>
                <p className="text-gray-900">{selectedRefund.guestId?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <p className="text-gray-900">{formatAmount(selectedRefund.amount, selectedRefund.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge variant={getStatusBadgeVariant(selectedRefund.status)}>
                  {selectedRefund.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">{format(new Date(selectedRefund.createdAt), 'PPpp')}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <p className="text-gray-900 mt-1">{selectedRefund.reason}</p>
            </div>

            {selectedRefund.evidence && selectedRefund.evidence.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Evidence</label>
                <div className="mt-1 space-y-2">
                  {selectedRefund.evidence.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm"><strong>Type:</strong> {item.type}</p>
                      <p className="text-sm"><strong>Description:</strong> {item.description}</p>
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800 text-sm">
                          View File
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRefund.denialReason && (
              <div>
                <label className="text-sm font-medium text-gray-700">Denial Reason</label>
                <p className="text-gray-900 mt-1">{selectedRefund.denialReason}</p>
              </div>
            )}

            {selectedRefund.infoRequested && (
              <div>
                <label className="text-sm font-medium text-gray-700">Information Requested</label>
                <p className="text-gray-900 mt-1">{selectedRefund.infoRequested}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <Modal
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Refund`}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to {actionType} this refund request?
            </p>
            
            {selectedRefund && (
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Booking:</strong> {selectedRefund.bookingId?.bookingNumber}</p>
                <p><strong>Amount:</strong> {formatAmount(selectedRefund.amount, selectedRefund.currency)}</p>
                <p><strong>Guest:</strong> {selectedRefund.guestId?.name}</p>
              </div>
            )}

            {actionType === 'deny' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Denial *
                </label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for denying this refund..."
                  rows={3}
                  required
                />
              </div>
            )}

            {actionType === 'request-info' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Guest *
                </label>
                <Textarea
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="What additional information do you need from the guest?"
                  rows={3}
                  required
                />
              </div>
            )}

            {actionType === 'process' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Payment ID *
                </label>
                <Input
                  value={originalPaymentId}
                  onChange={(e) => setOriginalPaymentId(e.target.value)}
                  placeholder="Enter the original PayHere payment ID"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is the payment ID from the original booking payment.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowActionModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'deny' ? 'error' : 'primary'}
                onClick={confirmAction}
                disabled={processing}
              >
                {processing ? <Spinner size="sm" /> : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminRefundManagementPage;