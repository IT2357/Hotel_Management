import { useState, useEffect, useContext } from 'react';

import { AuthContext } from "../../context/AuthContext";
import { formatCurrency } from '../../utils/currencyUtils';
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import DefaultAdminLayout from '../../layout/admin/DefaultAdminLayout';

export default function AdminBookingsPage() {

  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedActionBooking, setSelectedActionBooking] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '', // Empty string means no status filter
    paymentMethod: '', // Empty string means no payment method filter
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });
  
  // Debug effect to log filter changes
  useEffect(() => {
    console.log('Filters changed:', filters);
  }, [filters]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0
  });
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [holdUntil, setHoldUntil] = useState('');
  const [heldBookings, setHeldBookings] = useState([]);
  const [loadingHeld, setLoadingHeld] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    // Ticker for countdowns
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Format date to YYYY-MM-DD for API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatRemaining = (endIso) => {
    if (!endIso) return '—';
    const end = new Date(endIso).getTime();
    const diffMs = end - nowTs;
    if (diffMs <= 0) return 'expired';
    const totalSec = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Create URLSearchParams and only append non-empty filter values
      const params = new URLSearchParams();
      
      // Handle each filter explicitly to ensure correct formatting
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.paymentMethod) {
        params.append('paymentMethod', filters.paymentMethod);
      }
      
      // Format dates for API
      if (filters.dateFrom) {
        const fromDate = formatDateForAPI(filters.dateFrom);
        params.append('dateFrom', fromDate);
        console.log('Filtering from date:', fromDate);
      }
      if (filters.dateTo) {
        // Set time to end of day for dateTo
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        const toDate = endOfDay.toISOString();
        params.append('dateTo', toDate);
        console.log('Filtering to date:', toDate);
      }
      
      // Always include pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      params.append('page', page);
      params.append('limit', limit);
      
      const apiUrl = `/api/bookings/admin/all?${params.toString()}`;
      console.log('API Request URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        const bookings = data.data?.bookings || [];
        const pagination = data.data?.pagination || {};
        
        console.log(`Found ${bookings.length} bookings`);
        console.log('Pagination:', pagination);
        console.log('Bookings Data:', bookings);
        
        setBookings(bookings);
        setPagination({
          currentPage: pagination.currentPage || 1,
          totalPages: pagination.totalPages || 1,
          totalBookings: pagination.total || 0
        });
      } else {
        console.error('API returned success:false', data);
        throw new Error(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setAlert({ 
        type: 'error', 
        message: error.message || 'Failed to fetch bookings. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHeldBookings = async () => {
    try {
      setLoadingHeld(true);
      const response = await fetch(`/api/bookings/admin/held`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setHeldBookings(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch held bookings:', error);
      setAlert({ type: 'error', message: 'Failed to fetch held bookings' });
    } finally {
      setLoadingHeld(false);
    }
  };

  const releaseHold = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/admin/${bookingId}/release-hold`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Hold released successfully' });
        // Refresh both lists
        fetchHeldBookings();
        fetchBookings();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to release hold' });
      }
    } catch (error) {
      console.error('Failed to release hold:', error);
      setAlert({ type: 'error', message: 'Failed to release hold' });
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => {
      // Create a new filters object by merging the new filters with the previous state
      const updatedFilters = {
        ...prev,
        ...newFilters
      };
      
      // If any filter except page is changing, reset to page 1
      const isPageChange = Object.keys(newFilters).length === 1 && 'page' in newFilters;
      if (!isPageChange) {
        updatedFilters.page = 1;
      }
      
      // Remove any empty strings or undefined values
      Object.keys(updatedFilters).forEach(key => {
        if (updatedFilters[key] === '' || updatedFilters[key] === undefined) {
          delete updatedFilters[key];
        }
      });
      
      // Ensure we always have default values
      return {
        page: 1,
        limit: 20,
        search: '',
        status: '',
        paymentMethod: '',
        dateFrom: '',
        dateTo: '',
        ...updatedFilters
      };
    });
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
      'Accepted': 'bg-green-100 text-green-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'On Hold': 'bg-blue-100 text-blue-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodInfo = (paymentMethod) => {
    const methods = {
      card: { label: 'Credit/Debit Card', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      'Credit Card': { label: 'Credit/Debit Card', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      Online: { label: 'Online Payment', color: 'bg-indigo-100 text-indigo-800', icon: '💻' },
      Cash: { label: 'Pay at Hotel', color: 'bg-green-100 text-green-800', icon: '💵' },
      Wallet: { label: 'Digital Wallet', color: 'bg-purple-100 text-purple-800', icon: '📱' },
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const openDetailsModal = (booking) => {
    // Set both states in a single batch update to prevent flashing
    setShowDetailsModal(true);
    setSelectedBooking(booking);
  };

  const closeDetailsModal = () => {
    // First hide the modal, then clear the booking data after the animation completes
    setShowDetailsModal(false);
    // Use a small timeout to ensure the modal has time to animate out
    setTimeout(() => {
      setSelectedBooking(null);
    }, 300); // Match this with your modal's transition duration
  };

  const openActionModal = (booking, type) => {
    // Set all states in a single batch update
    setShowActionModal(true);
    setSelectedActionBooking(booking);
    setActionType(type);
  };

  const closeActionModal = () => {
    // First hide the modal
    setShowActionModal(false);
    // Then clear the state after the animation completes
    setTimeout(() => {
      setSelectedActionBooking(null);
      setActionType('');
      setApprovalNotes('');
      setRejectionReason('');
      setHoldUntil('');
    }, 300); // Match this with your modal's transition duration
  };

  const handleStatusChange = async (bookingId, newStatus, notes = '') => {
    try {
      setActionLoading(true);

      // Determine the correct endpoint and parameters based on status
      let endpoint = '';
      let requestBody = {};

      if (actionType === 'approve') {
        endpoint = `/api/bookings/admin/${bookingId}/approve`;
        requestBody = { approvalNotes: notes };
      } else if (actionType === 'reject') {
        endpoint = `/api/bookings/admin/${bookingId}/reject`;
        requestBody = { reason: notes };
      } else if (actionType === 'hold') {
        endpoint = `/api/bookings/admin/${bookingId}/hold`;
        requestBody = { reason: notes, holdUntil: holdUntil };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use the raw text or status
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: `Booking ${newStatus.toLowerCase()} successfully` });
        fetchBookings();
        closeActionModal();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to update booking status' });
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
      setAlert({ type: 'error', message: 'Failed to update booking status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectBooking = (bookingId) => {
    // Only allow selection of bookings that are eligible for bulk actions (On Hold or Pending Approval status)
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking || (booking.status !== 'On Hold' && booking.status !== 'Pending Approval')) {
      return; // Don't allow selection of ineligible bookings
    }

    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    // Only select bookings that are eligible for bulk actions (On Hold or Pending Approval status)
    const eligibleBookings = bookings.filter(booking => booking.status === 'On Hold' || booking.status === 'Pending Approval');
    setSelectedBookings(
      selectedBookings.length === eligibleBookings.length
        ? []
        : eligibleBookings.map(b => b._id)
    );
  };

  const openBulkModal = (actionType) => {
    setBulkActionType(actionType);
    setShowBulkModal(true);
  };

  const handleBulkAction = async () => {
    if (selectedBookings.length === 0) {
      setAlert({ type: 'error', message: 'Please select bookings to perform bulk action' });
      return;
    }

    try {
      setActionLoading(true);

      // Determine the correct endpoint based on action type
      let endpoint = '';
      if (bulkActionType === 'approve') {
        endpoint = '/api/bookings/admin/bulk/approve';
      } else if (bulkActionType === 'reject') {
        endpoint = '/api/bookings/admin/bulk/reject';
      } else if (bulkActionType === 'hold') {
        endpoint = '/api/bookings/admin/bulk/hold';
      }

      // Prepare request body based on action type
      let requestBody = { bookingIds: selectedBookings };

      if (bulkActionType === 'approve') {
        requestBody.approvalNotes = approvalNotes;
      } else if (bulkActionType === 'reject') {
        requestBody.reason = rejectionReason;
      } else if (bulkActionType === 'hold') {
        requestBody.holdUntil = holdUntil;
        requestBody.reason = approvalNotes; // Hold reason is stored in approvalNotes
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use the raw text or status
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: `Bulk action completed successfully` });
        setSelectedBookings([]);
        fetchBookings();
        closeBulkModal();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to perform bulk action' });
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      setAlert({ type: 'error', message: 'Failed to perform bulk action' });
    } finally {
      setActionLoading(false);
    }
  };

  const closeBulkModal = () => {
    // First hide the modal
    setShowBulkModal(false);
    // Then clear the state after the animation completes
    setTimeout(() => {
      setBulkActionType('');
      setApprovalNotes('');
      setRejectionReason('');
      setHoldUntil('');
    }, 300); // Match this with your modal's transition duration
  };

  const stats = {
    total: bookings.length,
    pending: (bookings || []).filter(b => b.status === 'Pending Approval').length,
    confirmed: (bookings || []).filter(b =>
      b.status === 'Confirmed' ||
      b.status === 'Approved - Payment Pending' ||
      b.status === 'Approved - Payment Processing' ||
      b.status === 'Completed'
    ).length,
    onHold: (bookings || []).filter(b => b.status === 'On Hold').length,
    rejected: (bookings || []).filter(b => b.status === 'Rejected').length,
    cancelled: (bookings || []).filter(b => b.status === 'Cancelled').length,
    revenue: formatCurrency((bookings || []).reduce((sum, b) => sum + (b.costBreakdown?.total || b.totalPrice || 0), 0)),
  };

  return (
    <DefaultAdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-0">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">📅 Booking Management</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user?.name?.split(" ")[0]}! Manage bookings, approvals, and reservations. 
                <span className="block text-sm mt-1 opacity-90">
                  💡 Filter by "On Hold" or "Pending Approval" status to see bookings awaiting your approval
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchBookings}
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
        </div>

        {/* Modern Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3 lg:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Accepted</p>
                <p className="text-3xl font-bold text-green-900">{stats.confirmed}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">On Hold</p>
                <p className="text-3xl font-bold text-blue-900">{stats.onHold}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold text-purple-900">{stats.revenue}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-4 lg:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="🔍 Search bookings, guests, rooms..."
                  value={filters.search}
                  onChange={(e) => updateFilters({...filters, search: e.target.value, page: 1})}
                  className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                />
              </div>
            </div>

            {/* Status and Payment Method - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select
                  value={filters.status}
                  onChange={(e) => updateFilters({...filters, status: e.target.value, page: 1})}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                >
                  <option value="">All Status</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Approved - Payment Pending">Approved (Pay at Hotel)</option>
                  <option value="Approved - Payment Processing">Approved (Payment Processing)</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </Select>
              </div>
              
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <Select
                  value={filters.paymentMethod}
                  onChange={(e) => updateFilters({...filters, paymentMethod: e.target.value, page: 1})}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                >
                  <option value="">All Payment Methods</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="cash">Pay at Hotel</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                </Select>
              </div>
            </div>

            {/* Date Range - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <Input 
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({...filters, dateFrom: e.target.value, page: 1})}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <Input 
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom}
                  onChange={(e) => updateFilters({...filters, dateTo: e.target.value, page: 1})}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => updateFilters({ ...filters, status: 'On Hold', page: 1 })}
                  className="h-[42px] whitespace-nowrap bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                >
                  Show Only Held
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateFilters({
                    search: '',
                    status: '',
                    paymentMethod: '',
                    dateFrom: '',
                    dateTo: '',
                    page: 1
                  })}
                  className="h-[42px] whitespace-nowrap text-gray-700 border-gray-200 hover:bg-gray-50"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Held Bookings Quick Access */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Held Bookings</h3>
              <p className="text-sm text-gray-500">On Hold and not yet expired</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchHeldBookings} variant="outline">Refresh Held</Button>
            </div>
          </div>
          {loadingHeld ? (
            <div className="flex items-center gap-2 text-gray-500"><Spinner /> Loading held bookings...</div>
          ) : heldBookings.length === 0 ? (
            <p className="text-gray-500">No current held bookings.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {heldBookings.map(h => (
                <div key={h._id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{h.bookingNumber}</div>
                    <Badge className="bg-blue-100 text-blue-800">On Hold</Badge>
                  </div>
                  <div className="text-sm text-gray-600">Room {h.roomId?.roomNumber} · {h.roomId?.title}</div>
                  <div className="text-sm text-gray-600">{new Date(h.checkIn).toLocaleDateString()} - {new Date(h.checkOut).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Hold until: {h.holdUntil ? new Date(h.holdUntil).toLocaleString() : 'N/A'}</div>
                  <div className="text-xs mt-1 font-medium text-blue-700">Expires in: {formatRemaining(h.holdUntil)}</div>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => releaseHold(h._id)}>Release Hold</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Bulk Actions */}
        {selectedBookings.length > 0 && bookings.some(booking => (booking.status === 'On Hold' || booking.status === 'Pending Approval') && selectedBookings.includes(booking._id)) && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-xl rounded-2xl p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="text-indigo-800">
                <p className="font-semibold">{selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected</p>
                <p className="text-sm text-indigo-600">Choose an action to perform on selected bookings</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => openBulkModal('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✅ Approve ({selectedBookings.length})
                </Button>
                <Button
                  size="sm"
                  onClick={() => openBulkModal('reject')}
                  variant="danger"
                >
                  ❌ Reject ({selectedBookings.length})
                </Button>
                <Button
                  size="sm"
                  onClick={() => openBulkModal('hold')}
                  variant="outline"
                >
                  ⏸️ Hold ({selectedBookings.length})
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-4">Loading bookings...</p>
          </div>
        ) : (
          <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 Bookings</h2>
                <div className="text-sm text-gray-500">
                  {bookings.length} booking{bookings.length === 1 ? '' : 's'} found
                </div>
              </div>
              {bookings.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-gray-300 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 text-xl mb-2">No bookings found</p>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 lg:gap-6">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Booking Header with Status Color */}
                      <div className={`rounded-xl p-4 mb-4 shadow-lg text-center ${getStatusColor(booking.status).includes('yellow') ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                        getStatusColor(booking.status).includes('green') ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        getStatusColor(booking.status).includes('blue') ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                        'bg-gradient-to-r from-red-500 to-pink-500 text-white'}`}>
                        <h3 className="font-bold text-lg mb-2">{booking.bookingNumber}</h3>
                        <Badge className={`${getStatusColor(booking.status)} bg-white/20 text-white border-white/30 text-sm px-3 py-1`}>
                          {getStatusColor(booking.status).includes('yellow') ? '⏳' : getStatusColor(booking.status).includes('green') ? '✅' : getStatusColor(booking.status).includes('blue') ? '⏸️' : '❌'} {booking.status}
                        </Badge>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">{booking.userId?.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{booking.roomId?.title} (Room {booking.roomId?.roomNumber})</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-semibold text-green-600">{formatCurrency(booking.costBreakdown?.total || booking.totalPrice || 0)}</span>
                        </div>
                      </div>

                      {/* Selection Checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedBookings.includes(booking._id)}
                            disabled={booking.status !== 'On Hold' && booking.status !== 'Pending Approval'}
                            onChange={() => handleSelectBooking(booking._id)}
                            className={`rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                              booking.status !== 'On Hold' && booking.status !== 'Pending Approval' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <label className={`ml-2 text-sm ${
                            booking.status !== 'On Hold' && booking.status !== 'Pending Approval' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Select
                          </label>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsModal(booking)}
                          className="rounded-full p-2 border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                        >
                          👁️ View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => updateFilters({...filters, page})}
            />
          </div>
        )}

      {/* Comprehensive Booking Details Modal */}
      <Modal
        isOpen={showDetailsModal && selectedBooking}
        onClose={closeDetailsModal}
        title={`Booking Details - ${selectedBooking?.bookingNumber || 'Unknown'}`}
        size="2xl"
        zIndex={1000}
      >
        {selectedBooking && (
          <>
            <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <h4 className="font-medium text-gray-700 mb-3">Booking Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Booking Number:</span>
                    <p className="text-gray-900">{selectedBooking?.bookingNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedBooking?.status)}>
                        {selectedBooking?.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>
                    <p className="text-gray-900">{selectedBooking?.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Guests:</span>
                    <p className="text-gray-900">{selectedBooking?.guests} guest(s)</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                {selectedBooking?.status === 'On Hold' || selectedBooking?.status === 'Pending Approval' && (
                  <>
                    <Button
                      onClick={() => {
                        openActionModal(selectedBooking, 'approve');
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      ✅ Approve Booking
                    </Button>
                    <Button
                      onClick={() => {
                        openActionModal(selectedBooking, 'reject');
                      }}
                      variant="danger"
                      className="w-full"
                    >
                      ❌ Reject Booking
                    </Button>
                    <Button
                      onClick={() => {
                        openActionModal(selectedBooking, 'hold');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      ⏸️ Put On Hold
                    </Button>
                  </>
                )}
                {(selectedBooking?.status === 'Approved - Payment Pending' ||
                  selectedBooking?.status === 'Approved - Payment Processing' ||
                  selectedBooking?.status === 'Confirmed') && (
                  <Button
                    onClick={() => {
                      openActionModal(selectedBooking, 'cancel');
                    }}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    🚫 Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Guest Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="text-gray-900">{selectedBooking.userId?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{selectedBooking.userId?.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{selectedBooking.userId?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="text-gray-900">{selectedBooking.userId?.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Room Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Room Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Room:</span>
                  <p className="text-gray-900">{selectedBooking?.roomId?.title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Room Number:</span>
                  <p className="text-gray-900">{selectedBooking?.roomId?.roomNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Type:</span>
                  <p className="text-gray-900">{selectedBooking?.roomId?.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Capacity:</span>
                  <p className="text-gray-900">{selectedBooking?.roomId?.capacity} guests</p>
                </div>
              </div>
              {selectedBooking?.roomId?.amenities && selectedBooking.roomId.amenities.length > 0 && (
                <div className="mt-3">
                  <span className="font-medium text-gray-600">Amenities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBooking.roomId.amenities.map((amenity, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stay Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Stay Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Check-in:</span>
                  <p className="text-gray-900">{selectedBooking?.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedBooking?.checkIn ? new Date(selectedBooking.checkIn).toLocaleTimeString() : ''}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Check-out:</span>
                  <p className="text-gray-900">{selectedBooking?.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedBooking?.checkOut ? new Date(selectedBooking.checkOut).toLocaleTimeString() : ''}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Duration:</span>
                  <p className="text-gray-900">
                    {selectedBooking?.checkIn && selectedBooking?.checkOut ? Math.ceil((new Date(selectedBooking.checkOut) - new Date(selectedBooking.checkIn)) / (1000 * 60 * 60 * 24)) : 0} nights
                  </p>
                </div>
              </div>
              {selectedBooking?.foodPlan && (
                <div className="mt-3">
                  <span className="font-medium text-gray-600">Meal Plan:</span>
                  <p className="text-gray-900">{selectedBooking.foodPlan}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Cost Breakdown</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Charges:</span>
                  <span className="font-medium">{formatCurrency(selectedBooking?.costBreakdown?.subtotal || selectedBooking?.totalPrice || 0)}</span>
                </div>
                {selectedBooking?.costBreakdown?.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(selectedBooking.costBreakdown.tax)}</span>
                  </div>
                )}
                {selectedBooking?.costBreakdown?.serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee:</span>
                    <span className="font-medium">{formatCurrency(selectedBooking.costBreakdown.serviceFee)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900">{formatCurrency(selectedBooking?.costBreakdown?.total || selectedBooking?.totalPrice || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Payment Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Payment Method:</span>
                  <div className="mt-1">
                    {getPaymentMethodBadge(selectedBooking?.paymentMethod)}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Payment Status:</span>
                  <p className="text-gray-900">{selectedBooking?.paymentStatus || 'Not processed'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {selectedBooking?.specialRequests && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Special Requests</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-900">{selectedBooking.specialRequests}</p>
              </div>
            </div>
          )}

          {/* Booking Information */}
          {selectedBooking?.bookingId && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Booking Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Booking Number:</span>
                  <p className="text-gray-900">{selectedBooking?.bookingId?.bookingNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Room:</span>
                  <p className="text-gray-900">{selectedBooking?.bookingId?.roomId?.title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Check-in:</span>
                  <p className="text-gray-900">{selectedBooking?.bookingId?.checkIn ? new Date(selectedBooking.bookingId.checkIn).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Check-out:</span>
                  <p className="text-gray-900">{selectedBooking?.bookingId?.checkOut ? new Date(selectedBooking.bookingId.checkOut).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {selectedBooking?.adminNotes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Admin Notes</h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-900">{selectedBooking.adminNotes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={closeDetailsModal}>
            Close
          </Button>
          <Button
            onClick={() => {
              // Export booking details functionality
              console.log('Export booking details');
            }}
            variant="outline"
          >
            Export Details
          </Button>
        </div>
          </>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal && selectedActionBooking}
        onClose={closeActionModal}
        title={actionType === 'approve' ? 'Approve Booking' :
               actionType === 'reject' ? 'Reject Booking' :
               actionType === 'hold' ? 'Put Booking on Hold' :
               actionType === 'cancel' ? 'Cancel Booking' : 'Booking Action'}
        size="md"
        zIndex={1100}
      >
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">{selectedActionBooking?.bookingNumber}</h4>
          <p className="text-sm text-gray-600">
            Guest: {selectedActionBooking?.userId?.name}
          </p>
          <p className="text-sm text-gray-600">
            Room: {selectedActionBooking?.roomId?.title}
          </p>
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(selectedActionBooking?.costBreakdown?.total || selectedActionBooking?.totalPrice || 0)}
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
          <div className="space-y-4">
            <div>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Holding
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Reason for putting on hold..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={closeActionModal}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const newStatus = actionType === 'approve' ? 'Accepted' :
                               actionType === 'reject' ? 'Rejected' :
                               actionType === 'hold' ? 'On Hold' : 'Cancelled';
              const notes = actionType === 'approve' ? approvalNotes :
                           actionType === 'reject' ? rejectionReason : approvalNotes;
              handleStatusChange(selectedActionBooking?._id, newStatus, notes);
            }}
            disabled={actionLoading ||
              (actionType === 'reject' && !rejectionReason.trim()) ||
              (actionType === 'hold' && !holdUntil)
            }
            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {actionLoading ? 'Processing...' :
             actionType === 'approve' ? 'Approve Booking' :
             actionType === 'reject' ? 'Reject Booking' :
             actionType === 'hold' ? 'Put on Hold' :
             actionType === 'cancel' ? 'Cancel Booking' : 'Update Status'}
          </Button>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={closeBulkModal}
        title={`Bulk ${bulkActionType === 'approve' ? 'Approve' :
                      bulkActionType === 'reject' ? 'Reject' :
                      bulkActionType === 'hold' ? 'Hold' : 'Action'} Bookings`}
        size="md"
      >
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            You are about to {bulkActionType} {(selectedBookings || []).length} selected booking(s).
          </p>
        </div>

        {/* Approval Notes */}
        {bulkActionType === 'approve' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes for these approvals..."
            />
          </div>
        )}

        {/* Rejection Reason */}
        {bulkActionType === 'reject' && (
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
        {bulkActionType === 'hold' && (
          <div className="space-y-4">
            <div>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Holding
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Reason for putting on hold..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={closeBulkModal}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkAction}
            disabled={actionLoading ||
              (bulkActionType === 'reject' && !rejectionReason.trim()) ||
              (bulkActionType === 'hold' && !holdUntil)
            }
            className={bulkActionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {actionLoading ? 'Processing...' :
             `Bulk ${bulkActionType.charAt(0).toUpperCase() + bulkActionType.slice(1)}`}
          </Button>
        </div>
      </Modal>

      </div>
    </DefaultAdminLayout>
  );
}


