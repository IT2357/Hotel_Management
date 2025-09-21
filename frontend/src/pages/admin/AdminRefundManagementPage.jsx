import React, { useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import DefaultAdminLayout from '../../layout/admin/DefaultAdminLayout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import Modal from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import Spinner from '../../components/ui/Spinner';
import { Select } from '../../components/ui/select';
import useDebounce from '../../hooks/useDebounce';

const AdminRefundManagementPage = () => {
  const { user } = useContext(AuthContext);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [originalPaymentId, setOriginalPaymentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  const debouncedSearch = useDebounce(filters.search, 500);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Refunds', icon: '📋' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'approved', label: 'Approved', icon: '✅' },
    { id: 'processed', label: 'Processed', icon: '✨' },
    { id: 'denied', label: 'Denied', icon: '❌' },
  ];

  const stats = refunds.reduce(
    (acc, refund) => {
      acc.total++;
      acc[refund.status] = (acc[refund.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, processed: 0, denied: 0, info_requested: 0 }
  );

  useEffect(() => {
    loadRefunds();
  }, [activeTab, debouncedSearch]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingRefunds();
      let filteredRefunds = response.data.data || [];
      if (activeTab !== 'all') {
        filteredRefunds = filteredRefunds.filter(refund => refund.status === activeTab);
      }
      if (filters.search) {
        filteredRefunds = filteredRefunds.filter(
          refund =>
            refund.bookingId?.bookingNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
            refund.guestId?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            refund.guestId?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
            refund.reason?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      setRefunds(filteredRefunds);
    } catch (error) {
      console.error('Failed to load refunds:', error);
      alert(error.response?.data?.message || 'Failed to load refunds.');
    } finally {
      setLoading(false);
    }
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
      alert(`Refund ${actionType} successful`);
      setShowActionModal(false);
      loadRefunds();
    } catch (error) {
      console.error(`Failed to ${actionType} refund:`, error);
      alert(error.response?.data?.message || `Failed to ${actionType} refund.`);
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = async (refund) => {
    try {
      const response = await adminService.getRefundDetails(refund._id);
      setSelectedRefund(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to load refund details:', error);
      alert(error.response?.data?.message || 'Failed to load refund details.');
    }
  };

  const checkStatus = async (refund) => {
    try {
      const response = await adminService.checkRefundStatus(refund._id);
      alert(`Current status: ${response.data.status}`);
      loadRefunds();
    } catch (error) {
      console.error('Failed to check refund status:', error);
      alert(error.response?.data?.message || 'Failed to check refund status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'processed':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'denied':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'info_requested':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency }).format(amount);
  };

  return (
    <DefaultAdminLayout>
      <div className="space-y-6">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">💸 Refund Management</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user?.name?.split(' ')[0]}! Manage and process guest refund requests
              </p>
            </div>
            <Button
              onClick={loadRefunds}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Modern Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Refunds</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending || 0}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-blue-900">{stats.approved || 0}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Processed</p>
                <p className="text-3xl font-bold text-green-900">{stats.processed || 0}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Denied</p>
                <p className="text-3xl font-bold text-red-900">{stats.denied || 0}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Filter Section */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="🔍 Search by booking number, guest name, email, or reason..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            {/* <div className="w-full lg:w-64">
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processed">Processed</option>
                <option value="denied">Denied</option>
                <option value="info_requested">Info Requested</option>
              </Select>
            </div> */}
          </div>
        </Card>

        {/* Refunds List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-4">Loading refunds...</p>
          </div>
        ) : (
          <RefundsList
            refunds={refunds}
            onViewDetails={viewDetails}
            onAction={handleAction}
            onCheckStatus={checkStatus}
            getStatusColor={getStatusColor}
            formatAmount={formatAmount}
          />
        )}

        {/* Modals */}
        <RefundDetailsModal
          isOpen={showDetailsModal}
          refund={selectedRefund}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRefund(null);
          }}
          formatAmount={formatAmount}
          getStatusColor={getStatusColor}
        />
        <RefundActionModal
          isOpen={showActionModal}
          refund={selectedRefund}
          actionType={actionType}
          actionReason={actionReason}
          setActionReason={setActionReason}
          actionMessage={actionMessage}
          setActionMessage={setActionMessage}
          originalPaymentId={originalPaymentId}
          setOriginalPaymentId={setOriginalPaymentId}
          onClose={() => setShowActionModal(false)}
          onConfirm={confirmAction}
          processing={processing}
          formatAmount={formatAmount}
        />
      </div>
    </DefaultAdminLayout>
  );
};

function RefundsList({ refunds, onViewDetails, onAction, onCheckStatus, getStatusColor, formatAmount }) {
  if (refunds.length === 0) {
    return (
      <Card className="bg-white shadow-xl rounded-2xl border-0 text-center py-16">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-gray-500 text-xl mb-2">No refund requests found</p>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Refund Requests</h2>
          <div className="text-sm text-gray-500">
            {refunds.length} {refunds.length === 1 ? 'refund' : 'refunds'} found
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {refunds.map((refund) => (
            <div
              key={refund._id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`${getStatusColor(refund.status)} rounded-xl p-4 text-white mb-4 shadow-lg bg-opacity-20`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{refund.bookingId?.bookingNumber || 'N/A'}</h3>
                    <p className="text-white/90 text-sm">{refund.guestId?.name || 'N/A'}</p>
                  </div>
                  <Badge className={`${getStatusColor(refund.status)} bg-white/20 text-white border-white/30`}>
                    {refund.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{refund.guestId?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Created: {format(new Date(refund.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.21 0 4-1.79 4-4S14.21 0 12 0 8 1.79 8 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>{formatAmount(refund.amount, refund.currency)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="truncate max-w-xs">{refund.reason}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(refund)}
                  className="flex-1 rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                >
                  👁️ View
                </Button>
                {refund.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onAction(refund, 'approve')}
                      className="flex-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      ✅ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => onAction(refund, 'deny')}
                      className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    >
                      ❌ Deny
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAction(refund, 'request-info')}
                      className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                    >
                      ℹ️ Request Info
                    </Button>
                  </>
                )}
                {refund.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onAction(refund, 'process')}
                    className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    🚀 Process
                  </Button>
                )}
                {(refund.status === 'processed' || refund.status === 'processing') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCheckStatus(refund)}
                    className="flex-1 rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                  >
                    🔄 Check Status
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RefundDetailsModal({ isOpen, refund, onClose, formatAmount, getStatusColor }) {
  if (!refund) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Refund Request Details" className="rounded-2xl shadow-xl">
      <div className="space-y-6 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Refund Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-600">Booking Number</p>
              <p className="text-sm text-gray-900">{refund.bookingId?.bookingNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Guest Name</p>
              <p className="text-sm text-gray-900">{refund.guestId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Guest Email</p>
              <p className="text-sm text-gray-900">{refund.guestId?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Amount</p>
              <p className="text-sm text-gray-900">{formatAmount(refund.amount, refund.currency)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Status</p>
              <Badge className={`${getStatusColor(refund.status)} bg-white/20 text-white border-white/30`}>
                {refund.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Created</p>
              <p className="text-sm text-gray-900">{format(new Date(refund.createdAt), 'PPpp')}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Reason</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{refund.reason}</p>
        </div>
        {refund.evidence && refund.evidence.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Evidence</h3>
            <div className="space-y-2">
              {refund.evidence.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-700"><strong>Type:</strong> {item.type}</p>
                  <p className="text-sm text-gray-700"><strong>Description:</strong> {item.description}</p>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      View File
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {refund.denialReason && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Denial Reason</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{refund.denialReason}</p>
          </div>
        )}
        {refund.infoRequested && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Information Requested</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{refund.infoRequested}</p>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RefundActionModal({
  isOpen,
  refund,
  actionType,
  actionReason,
  setActionReason,
  actionMessage,
  setActionMessage,
  originalPaymentId,
  setOriginalPaymentId,
  onClose,
  onConfirm,
  processing,
  formatAmount,
}) {
  if (!refund) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Refund`}
      className="rounded-2xl shadow-xl"
    >
      <div className="space-y-6 p-6">
        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-gray-700 mb-2">You are about to {actionType} the following refund:</p>
          <div className="space-y-2">
            <p><strong>Booking:</strong> {refund.bookingId?.bookingNumber || 'N/A'}</p>
            <p><strong>Amount:</strong> {formatAmount(refund.amount, refund.currency)}</p>
            <p><strong>Guest:</strong> {refund.guestId?.name || 'N/A'}</p>
          </div>
        </div>
        {actionType === 'deny' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Denial *</label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide a detailed reason for denying this refund..."
              rows={4}
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        )}
        {actionType === 'request-info' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message to Guest *</label>
            <Textarea
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              placeholder="What additional information do you need from the guest?"
              rows={4}
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        )}
        {actionType === 'process' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Original Payment ID *</label>
            <Input
              value={originalPaymentId}
              onChange={(e) => setOriginalPaymentId(e.target.value)}
              placeholder="Enter the original PayHere payment ID"
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">This is the payment ID from the original booking payment.</p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            Cancel
          </Button>
          <Button
            variant={actionType === 'deny' ? 'error' : 'primary'}
            onClick={onConfirm}
            disabled={processing}
            className={`rounded-full ${
              actionType === 'deny'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {processing ? <Spinner size="sm" /> : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AdminRefundManagementPage;