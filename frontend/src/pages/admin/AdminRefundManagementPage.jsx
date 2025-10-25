import React, { useState, useEffect, useContext, useMemo } from 'react';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/currencyUtils';
import DefaultAdminLayout from '../../layout/admin/DefaultAdminLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import useDebounce from '../../hooks/useDebounce';
import Pagination from '../../components/ui/Pagination';

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
  // Gateway payment ID only needed for non-cash payments
  const [originalPaymentId, setOriginalPaymentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 20,
  });
  const [refundsPagination, setRefundsPagination] = useState({ currentPage: 1, totalPages: 1, totalRefunds: 0 });
  const [pageSizeOptions, setPageSizeOptions] = useState([10, 20, 50, 100]);
  const debouncedSearch = useDebounce(filters.search, 500);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'approved', label: 'Approved', icon: '✅' },
    { id: 'processed', label: 'Processed', icon: '🚀' },
    { id: 'denied', label: 'Denied', icon: '❌' },
  ];

  const stats = useMemo(() => {
    if (!Array.isArray(refunds) || refunds.length === 0) {
      return { total: 0, pending: 0, approved: 0, processed: 0, denied: 0, info_requested: 0 };
    }

    return refunds.reduce(
      (acc, refund) => {
        acc.total++;
        acc[refund.status] = (acc[refund.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, processed: 0, denied: 0, info_requested: 0 }
    );
  }, [refunds]);

  useEffect(() => {
    loadRefunds();
  }, [activeTab, debouncedSearch, filters.page, filters.limit]);

  // Reset page to 1 when filters other than page/limit change
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch]);

  // Load default page size from admin settings
  useEffect(() => {
    const initPageSize = async () => {
      try {
        const res = await adminService.getAdminSettings();
        const settings = res?.data?.data ?? res?.data ?? {};
        const defaultSize = settings?.systemSettings?.pagination?.defaultPageSize;
        const options = settings?.systemSettings?.pagination?.pageSizeOptions;
        if (defaultSize && Number.isInteger(defaultSize)) {
          setFilters(prev => ({ ...prev, limit: defaultSize }));
        }
        if (Array.isArray(options) && options.length) {
          setPageSizeOptions(options);
        }
      } catch (e) {
        // ignore, keep default 20
      }
    };
    initPageSize();
  }, []);

  // Debug effect to monitor refunds state
  useEffect(() => {
    console.log('📋 Refunds state changed:', {
      refundsLength: refunds.length,
      refundsArray: refunds,
      firstRefund: refunds[0] ? {
        id: refunds[0]._id,
        status: refunds[0].status,
        bookingNumber: refunds[0].bookingId?.bookingNumber,
        guestName: refunds[0].guestId?.name
      } : null
    });
  }, [refunds]);

  const loadRefunds = async () => {
    try {
      setLoading(true);

      // Get refunds based on active tab
      const params = { page: filters.page, limit: filters.limit };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await adminService.getRefunds(params);

      // Debug the actual response structure
      console.log('📋 Raw API Response Structure:', {
        'response.data': response.data,
        'response.data.refunds': response.data.refunds,
        'typeof response.data.refunds': typeof response.data.refunds,
        'Array.isArray(response.data.refunds)': Array.isArray(response.data.refunds),
        'response.data.data': response.data.data,
        'typeof response.data.data': typeof response.data.data,
        'response.data.data.refunds': response.data.data?.refunds
      });

      // Fix API response parsing - the correct path is response.data.data.refunds
      let filteredRefunds = response.data.data?.refunds || response.data.refunds || response.data || [];

      // Ensure filteredRefunds is always an array
      if (!Array.isArray(filteredRefunds)) {
        console.log('📋 filteredRefunds is not an array, converting...');
        if (typeof filteredRefunds === 'object' && filteredRefunds !== null) {
          // If it's a single object, wrap it in an array
          filteredRefunds = [filteredRefunds];
          console.log('📋 Converted single object to array');
        } else {
          // If it's something else, use empty array
          filteredRefunds = [];
          console.log('📋 Set to empty array');
        }
      }

      // Additional client-side filtering if needed (for search within results)
      if (filters.search && filteredRefunds.length > 0) {
        filteredRefunds = filteredRefunds.filter(
          refund =>
            refund.bookingId?.bookingNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
            refund.guestId?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            refund.guestId?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
            refund.reason?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setRefunds(filteredRefunds);

      // Update pagination from API if available
      const apiPagination = response?.data?.data?.pagination || response?.data?.pagination;
      if (apiPagination) {
        setRefundsPagination({
          currentPage: apiPagination.currentPage || filters.page,
          totalPages: apiPagination.totalPages || 1,
          totalRefunds: apiPagination.totalRefunds || filteredRefunds.length,
        });
      } else {
        // Fallback if API didn't return pagination
        setRefundsPagination({ currentPage: filters.page, totalPages: 1, totalRefunds: filteredRefunds.length });
      }

      console.log('📋 State updated - refunds length:', filteredRefunds.length);
      console.log('📋 Current refunds state after update:', refunds);
      return filteredRefunds;
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
    // nothing to reset for gateway input (cash only)
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
          if (actionReason.trim().length < 20) {
            alert('Denial reason must be at least 20 characters long');
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
          // Conditionally require payment id for non-cash
          const isCash = selectedRefund?.invoiceId?.paymentMethod === 'Cash';
          if (!isCash && !originalPaymentId.trim()) {
            alert('Please provide the original payment ID for gateway refunds');
            return;
          }
          response = await adminService.processRefund(selectedRefund._id, {
            originalPaymentId: isCash ? undefined : originalPaymentId,
            gatewayResponse: isCash ? { method: 'Cash' } : { method: 'Gateway', originalPaymentId }
          });
          break;
        default:
          throw new Error('Invalid action type');
      }
      alert(`Refund ${actionType} successful`);
      setShowActionModal(false);
      const updatedList = await loadRefunds();
      // If details modal is open for this refund, refresh its details to reflect changes
      if (showDetailsModal && selectedRefund?._id) {
        try {
          const details = await adminService.getRefundDetails(selectedRefund._id);
          setSelectedRefund(details.data?.data || details.data || selectedRefund);
        } catch (e) {
          // As a fallback, sync from the refreshed list
          const fallback = (updatedList || []).find(r => r._id === selectedRefund._id);
          if (fallback) setSelectedRefund(fallback);
        }
      }
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
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'approved':
        return 'bg-gradient-to-r from-blue-400 to-indigo-500';
      case 'processed':
        return 'bg-gradient-to-r from-green-400 to-emerald-500';
      case 'denied':
        return 'bg-gradient-to-r from-red-400 to-pink-500';
      case 'info_requested':
        return 'bg-gradient-to-r from-purple-400 to-violet-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-slate-500';
    }
  };

  // Use the imported formatCurrency utility for consistent currency formatting
  const formatAmount = formatCurrency;

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

        {/* Feature Tips */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-2">💡 Keyboard Shortcuts & Features</h3>
              <ul className="text-sm text-purple-800 space-y-1.5">
                <li className="flex items-center gap-2"><kbd className="px-2 py-1 rounded bg-purple-200 font-semibold text-xs">←</kbd> / <kbd className="px-2 py-1 rounded bg-purple-200 font-semibold text-xs">→</kbd> <span>to navigate between pages</span></li>
                <li className="flex items-center gap-2"><span>📊 Use the <strong>Per page</strong> selector to show 10, 20, 50, or 100 refunds</span></li>
                <li className="flex items-center gap-2"><span>⚙️ Manage default items per page in Admin Settings</span></li>
              </ul>
            </div>
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

        {/* Pagination */}
        {refundsPagination?.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={refundsPagination.currentPage}
              totalPages={refundsPagination.totalPages}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
              pageSize={filters.limit}
              pageSizeOptions={pageSizeOptions}
              onPageSizeChange={(size) => setFilters(prev => ({ ...prev, limit: size, page: 1 }))}
            />
          </div>
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
  // Ensure refunds is always an array
  const safeRefunds = Array.isArray(refunds) ? refunds : [];

  if (safeRefunds.length === 0) {
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
            {safeRefunds.length} {safeRefunds.length === 1 ? 'refund' : 'refunds'} found
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          {safeRefunds.map((refund) => (
            <div
              key={refund._id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`${getStatusColor(refund.status || 'pending')} rounded-xl p-4 text-white mb-4 shadow-lg text-center`}>
                <h3 className="font-bold text-lg mb-2">{refund.bookingId?.bookingNumber || 'N/A'}</h3>
                <Badge className={`${getStatusColor(refund.status)} bg-white/20 text-white border-white/30 text-sm px-3 py-1`}>
                  {getStatusColor(refund.status).includes('yellow') ? '⏳' : getStatusColor(refund.status).includes('green') ? '✅' : getStatusColor(refund.status).includes('blue') ? '🔄' : '❌'} {refund.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </Badge>
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
                  <span className="mr-2">රු</span>
                  <span>{formatAmount(refund.amount, refund.currency || 'LKR')}</span>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Refund Request Details" className="rounded-2xl shadow-xl" zIndex={1000}>
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
              <p className="text-sm text-gray-900">
                {formatAmount(refund.amount, refund.currency || 'LKR')}
              </p>
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
      zIndex={1100}
    >
      <div className="space-y-6 p-6">
        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-gray-700 mb-2">You are about to {actionType} the following refund:</p>
          <div className="space-y-2">
            <p><strong>Booking:</strong> {refund.bookingId?.bookingNumber || 'N/A'}</p>
            <p><strong>Amount:</strong> {formatAmount(refund.amount, refund.currency || 'LKR')}</p>
            <p><strong>Guest:</strong> {refund.guestId?.name || 'N/A'}</p>
          </div>
        </div>
        {actionType === 'deny' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Denial *</label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide a detailed reason for denying this refund (minimum 20 characters)..."
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
            {refund?.invoiceId?.paymentMethod === 'Cash' ? (
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700">
                This refund will be recorded as a cash refund (pay-at-hotel). No gateway reference is required.
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Original Payment ID *</label>
                <Input
                  value={originalPaymentId}
                  onChange={(e) => setOriginalPaymentId(e.target.value)}
                  placeholder="Enter the original gateway payment ID"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Required for card/bank refunds.</p>
              </div>
            )}
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