// 📁 frontend/src/pages/admin/AdminInvoicesPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import debounce from 'lodash/debounce';
import { formatCurrency } from '../../utils/currencyUtils';
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import DefaultAdminLayout from '../../layout/admin/DefaultAdminLayout';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState({
    search: false,
    status: false,
    paymentMethod: false,
    dateFrom: false,
    dateTo: false,
    general: true // For initial load
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedActionInvoice, setSelectedActionInvoice] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalInvoices: 0
  });
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Check authentication token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Redirecting to login.');
      window.location.href = '/login';
    }
  }, []);

  // Initial data fetch with debounce
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, general: true }));
        await updateFilters({}, { signal });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching initial data:', error);
          setAlert({
            type: 'error',
            message: error.message || 'Failed to load invoices. Please try again.'
          });
        }
      } finally {
        if (isMounted) {
          setLoading(prev => ({ ...prev, general: false }));
        }
      }
    };
    
    // Debounce the initial fetch to prevent multiple rapid calls
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchInitialData();
      }
    }, 100);
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
      controller.abort();
      setLoading({
        search: false,
        status: false,
        paymentMethod: false,
        dateFrom: false,
        dateTo: false,
        general: false
      });
    };
  }, []);

  // Memoize the fetchInvoices function with proper dependencies
  const fetchInvoices = useCallback(async (filterType = 'general', options = {}, overrideFilters = null) => {
    console.log('fetchInvoices called with:', { filterType, options });
    
    if (!filterType || typeof filterType !== 'string') {
      console.error('Invalid filterType:', filterType);
      filterType = 'general';
    }
    
    const { signal } = options || {};
    
    try {
      // Set loading state for the specific filter
      setLoading(prev => ({
        ...prev,
        ...(filterType === 'search' && { search: true }),
        ...(filterType === 'status' && { status: true }),
        ...(filterType === 'paymentMethod' && { paymentMethod: true }),
        ...(['dateFrom', 'dateTo'].includes(filterType) && { [filterType]: true }),
        ...(filterType === 'general' && { general: true })
      }));
      
      // Get filters to use (prefer override to avoid stale state)
      const currentFilters = overrideFilters ? { ...overrideFilters } : { ...filters };
      console.log('Current filters:', currentFilters);
      
      // Create URLSearchParams and only append non-empty filter values
      const params = new URLSearchParams();
      {
        // Always include pagination parameters
        const page = currentFilters.page || 1;
        const limit = currentFilters.limit || 20;
        params.append('page', page);
        params.append('limit', limit);
        
        // Handle each filter explicitly to ensure correct formatting
        if (currentFilters.search) {
          params.append('search', String(currentFilters.search).trim());
        }
        if (currentFilters.status) {
          params.append('status', String(currentFilters.status));
        }
        if (currentFilters.paymentMethod) {
          params.append('paymentMethod', String(currentFilters.paymentMethod));
        }
        
        // Format dates for API - optimized date handling
        const formatDate = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
          } catch (e) {
            console.error('Error formatting date:', e);
            return '';
          }
        };
        
        const formattedDateFrom = formatDate(currentFilters.dateFrom);
        const formattedDateTo = formatDate(currentFilters.dateTo);
        
        if (formattedDateFrom) params.append('dateFrom', formattedDateFrom);
        if (formattedDateTo) params.append('dateTo', formattedDateTo);
        
        // Add cache-busting parameter
        params.append('_', Date.now());
        
        const apiUrl = `/api/invoices/admin/all?${params.toString()}`;
        console.log('API URL:', apiUrl);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found in localStorage');
          // Redirect to login page or show error
          window.location.href = '/login';
          throw new Error('No authentication token found. Redirecting to login...');
        }
        
        const fetchOptions = {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'include',
          cache: 'no-store',
          signal
        };
        
        console.log('Fetching invoices with options:', {
          url: apiUrl,
          method: 'GET',
          headers: {
            ...fetchOptions.headers,
            'Authorization': 'Bearer [REDACTED]'
          },
          credentials: fetchOptions.credentials
        });
        
        const response = await fetch(apiUrl, fetchOptions);
        console.log('Response status:', response.status);
        
        // Check if the request was aborted
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log('API Response:', responseData); // Log the full response
        
        if (responseData.success && responseData.data) {
          const { data } = responseData;
          const invoices = data?.invoices || [];
          const pagination = data?.pagination || {
            currentPage: 1,
            totalPages: 1,
            total: 0,
            limit: 20
          };
          
          console.log(`Found ${invoices.length} invoices`);
          console.log('Pagination:', pagination);
          
          setInvoices(invoices);
          setPagination({
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalInvoices: pagination.total,
            limit: pagination.limit
          });
          
          return data;
        } else {
          console.error('API returned success:false', responseData);
          throw new Error(responseData.message || 'Failed to fetch invoices');
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to fetch invoices:', error);
        setAlert({ 
          type: 'error', 
          message: error.message || 'Failed to fetch invoices' 
        });
      }
      throw error;
    } finally {
      // Reset loading states
      if (!signal?.aborted) {
        setLoading({
          search: false,
          status: false,
          paymentMethod: false,
          dateFrom: false,
          dateTo: false,
          general: false
        });
      }
    }
  }, [filters]);

  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  // Memoize the updateFilters function with useCallback
  const updateFilters = useCallback((newFilters, options = {}) => {
    try {
      const { signal } = options || {};
      
      setFilters(prev => {
        if (!prev) {
          console.error('Previous filters state is undefined');
          return {};
        }
        
        // Create a new filters object by merging the new filters with the previous state
        const updatedFilters = {
          ...prev,
          ...(newFilters || {})
        };
        
        // Determine which filter type is being updated
        let filterType = 'general';
        if (newFilters && 'search' in newFilters) {
          filterType = 'search';
        } else if (newFilters && 'status' in newFilters) {
          filterType = 'status';
        } else if (newFilters && 'paymentMethod' in newFilters) {
          filterType = 'paymentMethod';
        } else if (newFilters && 'dateFrom' in newFilters) {
          filterType = 'dateFrom';
        } else if (newFilters && 'dateTo' in newFilters) {
          filterType = 'dateTo';
        } else if (newFilters && 'page' in newFilters) {
          filterType = 'general';
        }
        
        // If any filter except page is changing, reset to page 1
        const isPageChange = newFilters && Object.keys(newFilters).length === 1 && 'page' in newFilters;
        if (!isPageChange) {
          updatedFilters.page = 1;
        }
        
        // Ensure we have all filter fields with default values if not set
        const finalFilters = {
          page: 1,
          limit: 20,
          search: '',
          status: '',
          paymentMethod: '',
          dateFrom: '',
          dateTo: '',
          ...updatedFilters
        };
        
        // Remove any empty strings or undefined values
        Object.keys(finalFilters).forEach(key => {
          if (finalFilters[key] === '' || finalFilters[key] === undefined) {
            delete finalFilters[key];
          }
        });
        
        // Use requestAnimationFrame to ensure state is updated before fetching
        requestAnimationFrame(() => {
          try {
            if (typeof fetchInvoices === 'function') {
              // Pass the finalFilters to avoid race conditions with state updates
              fetchInvoices(filterType, { signal }, finalFilters);
            } else {
              console.error('fetchInvoices is not a function');
            }
          } catch (error) {
            console.error('Error in fetchInvoices:', error);
          }
        });
        
        return finalFilters;
      });
    } catch (error) {
      console.error('Error in updateFilters:', error);
      setAlert({
        type: 'error',
        message: 'Error updating filters. Please try again.'
      });
    }
  }, [filters]);
  
  // Add debounced filter updates for search input
  const debouncedUpdateFilters = useMemo(
    () => debounce((newFilters) => {
      updateFilters(newFilters);
    }, 300),
    [updateFilters]
  );
  
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateFilters.cancel();
    };
  }, [debouncedUpdateFilters]);

  const getStatusColor = (status) => {
    // Handle consolidated status values
    if (status === 'Draft') return 'bg-gray-100 text-gray-800';
    if (status === 'Sent - Payment Pending') return 'bg-blue-100 text-blue-800';
    if (status === 'Sent - Payment Processing') return 'bg-indigo-100 text-indigo-800';
    if (status === 'Paid') return 'bg-green-100 text-green-800';
    if (status === 'Overdue') return 'bg-red-100 text-red-800';
    if (status === 'Cancelled') return 'bg-gray-100 text-gray-800';
    if (status === 'Refunded') return 'bg-purple-100 text-purple-800';
    if (status === 'Failed') return 'bg-red-100 text-red-800';
    if (status === 'Awaiting Approval') return 'bg-yellow-100 text-yellow-800';

    // Legacy support
    const colors = {
      'Sent': 'bg-blue-100 text-blue-800',
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

  const getPaymentMethodInfo = (paymentMethod) => {
    const methods = {
      'Credit Card': { label: 'Credit Card', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      'Cash': { label: 'Cash', color: 'bg-green-100 text-green-800', icon: '💵' },
      'Online': { label: 'Online Payment', color: 'bg-indigo-100 text-indigo-800', icon: '💻' },
      'Wallet': { label: 'Wallet', color: 'bg-purple-100 text-purple-800', icon: '👛' },
      // Legacy/alternate keys support
      card: { label: 'Credit/Debit Card', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      cash: { label: 'Cash', color: 'bg-green-100 text-green-800', icon: '💵' },
      bank: { label: 'Bank Transfer', color: 'bg-purple-100 text-purple-800', icon: '🏦' },
      // support lowercase 'online'
      online: { label: 'Online Payment', color: 'bg-indigo-100 text-indigo-800', icon: '💻' },
    };
    return methods[paymentMethod] || methods[String(paymentMethod || '').trim()] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
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

  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const openDetailsModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    // First hide the modal
    setShowDetailsModal(false);
    // Then clear the state after the animation completes
    setTimeout(() => {
      setSelectedInvoice(null);
    }, 300); // Match this with your modal's transition duration
  };

  const openActionModal = (invoice, type) => {
    setSelectedActionInvoice(invoice);
    setActionType(type);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    // Use setTimeout to ensure the modal is fully unmounted before resetting state
    setTimeout(() => {
      setActionType('');
      setActionNotes('');
      setSelectedActionInvoice(null);
      setActionLoading(false);
    }, 300);
  };

  const handleStatusChange = async (invoiceId, newStatus, notes = '') => {
    let originalInvoice = null;
    try {
      setActionLoading(true);
      
      // Store original state for rollback
      originalInvoice = invoices.find(inv => inv._id === invoiceId);
      
      // Update the UI optimistically first
      const updatedInvoices = invoices.map(invoice => 
        invoice._id === invoiceId 
          ? { 
              ...invoice, 
              status: newStatus,
              paymentStatus: newStatus,
              ...(newStatus === 'Paid' && { paidAt: new Date().toISOString() })
            } 
          : invoice
      );
      
      setInvoices(updatedInvoices);
      // Also optimistically update selected invoice if its details modal is open
      setSelectedInvoice(prev => {
        if (!prev || prev._id !== invoiceId) return prev;
        return {
          ...prev,
          status: newStatus,
          paymentStatus: newStatus,
          ...(newStatus === 'Paid' ? { paidAt: new Date().toISOString() } : {})
        };
      });
      
      // Close the modal immediately
      closeActionModal();
      
      // Make the API call
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Session expired. Redirecting to login.');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/invoices/admin/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          status: newStatus,
          reason: notes
        })
      });

      const data = await response.json();
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.warn('Unauthorized. Session expired. Redirecting to login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update invoice status');
      }
      
      if (data.success) {
        // Refresh the data from server to ensure consistency and sync details modal
        const refreshed = await fetchInvoices(false);
        if (showDetailsModal && selectedInvoice?._id === invoiceId && refreshed?.invoices) {
          const updated = (refreshed.invoices || []).find(inv => inv._id === invoiceId);
          if (updated) setSelectedInvoice(updated);
        }
        
        setAlert({ 
          type: 'success', 
          message: `Invoice ${newStatus.toLowerCase()} successfully`,
          autoDismiss: 3000
        });
      } else {
        throw new Error(data.message || 'Failed to update invoice status');
      }
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      
      // Revert to original state on error
      if (originalInvoice) {
        setInvoices(prevInvoices => 
          prevInvoices.map(invoice => 
            invoice._id === invoiceId ? originalInvoice : invoice
          )
        );
      }
      
      setAlert({ 
        type: 'error', 
        message: error.message || 'Failed to update invoice status. Please try again.',
        autoDismiss: 5000
      });
      
      // Re-fetch fresh data
      await fetchInvoices(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    setSelectedInvoices(
      selectedInvoices.length === invoices.length
        ? []
        : invoices.map(i => i._id)
    );
  };

  const openBulkModal = (actionType) => {
    setBulkActionType(actionType);
    setShowBulkModal(true);
  };

  const handleBulkAction = async () => {
    try {
      setActionLoading(true);
      
      // Filter selected invoices based on the action type
      let eligibleInvoices = [];
      const originalInvoices = {}; // Store original states for rollback
      
      // Determine eligible invoices and store their original states
      selectedInvoices.forEach(id => {
        const invoice = invoices.find(inv => inv._id === id);
        if (!invoice) return;
        
        let isEligible = false;
        
        if (bulkActionType === 'send') {
          isEligible = invoice.status === 'Draft';
        } else if (bulkActionType === 'mark_paid') {
          isEligible = invoice.status !== 'Paid' && 
                       invoice.status !== 'Cancelled' &&
                       invoice.status !== 'Refunded' && 
                       invoice.status !== 'Failed';
        } else if (bulkActionType === 'cancel') {
          isEligible = invoice.status !== 'Paid' && 
                       invoice.status !== 'Cancelled' &&
                       invoice.status !== 'Refunded' && 
                       invoice.status !== 'Failed';
        }
        
        if (isEligible) {
          eligibleInvoices.push(id);
          originalInvoices[id] = { ...invoice };
        }
      });
      
      if (eligibleInvoices.length === 0) {
        setAlert({ 
          type: 'error', 
          message: 'No eligible invoices found for this action',
          autoDismiss: 3000
        });
        return;
      }
      
      // Close the bulk modal
      closeBulkModal();
      
      // Update UI optimistically
      const newStatus = bulkActionType === 'mark_paid' ? 'Paid' : 
                       bulkActionType === 'cancel' ? 'Cancelled' : 'Sent';
      
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          eligibleInvoices.includes(invoice._id)
            ? {
                ...invoice,
                status: newStatus,
                paymentStatus: newStatus,
                ...(newStatus === 'Paid' && { paidAt: new Date().toISOString() })
              }
            : invoice
        )
      );
      
      // Process each eligible invoice
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Session expired. Redirecting to login.');
        window.location.href = '/login';
        return;
      }

      const results = await Promise.allSettled(
        eligibleInvoices.map(id => 
          fetch(`/api/invoices/admin/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify({
              status: newStatus,
              reason: actionNotes
            })
          })
        )
      );
      
      // Check for failed updates
      const failedUpdates = results.filter(
        (result, index) => result.status === 'rejected' || !result.value.ok
      );
      
      if (failedUpdates.length > 0) {
        // Revert failed updates
        const failedIds = failedUpdates.map((_, index) => eligibleInvoices[index]);
        
        setInvoices(prevInvoices => 
          prevInvoices.map(invoice => 
            failedIds.includes(invoice._id) && originalInvoices[invoice._id]
              ? originalInvoices[invoice._id]
              : invoice
          )
        );
        
        throw new Error(
          `Failed to update ${failedUpdates.length} of ${eligibleInvoices.length} invoices`
        );
      }
      
      // Refresh data from server and sync details modal if open
      const refreshed = await fetchInvoices(false);
      if (showDetailsModal && selectedInvoice?._id) {
        const updated = (refreshed?.invoices || []).find(inv => inv._id === selectedInvoice._id);
        if (updated) setSelectedInvoice(updated);
      }
      
      setAlert({
        type: 'success',
        message: `Successfully updated ${eligibleInvoices.length} invoice(s)`,
        autoDismiss: 3000
      });
      
    } catch (error) {
      console.error('Bulk action failed:', error);
      
      setAlert({
        type: 'error',
        message: error.message || 'An error occurred during bulk update',
        autoDismiss: 5000
      });
      
      // Ensure we have the latest data
      await fetchInvoices(false);
    } finally {
      setActionLoading(false);
      setSelectedInvoices([]);
    }
  };

  const closeBulkModal = () => {
    // First hide the modal
    setShowBulkModal(false);
    // Then clear the state after the animation completes
    setTimeout(() => {
      setBulkActionType('');
      setActionNotes('');
      setActionLoading(false);
    }, 300); // Match this with your modal's transition duration
  };

  const stats = {
    total: invoices.length,
    paid: (invoices || []).filter(i => i.status === 'Paid').length,
    pending: (invoices || []).filter(i =>
      i.status === 'Sent - Payment Pending' ||
      i.status === 'Sent - Payment Processing' ||
      i.status === 'Draft'
    ).length,
    overdue: (invoices || []).filter(i => i.status === 'Overdue').length,
    revenue: formatCurrency((invoices || []).filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.amount || i.totalAmount || 0), 0)),
  };

  return (
    <DefaultAdminLayout>
      <div className="space-y-6">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🧾 Invoice Management</h1>
              <p className="text-indigo-100 text-lg">
                Manage invoices, payments, and billing operations
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchInvoices}
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Invoices</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Paid</p>
                <p className="text-3xl font-bold text-green-900">{stats.paid}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-900">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Allow text to shrink and truncate nicely inside flex */}
              <div className="min-w-0">
                <p className="text-purple-600 text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold text-purple-900 truncate" title={stats.revenue}>{stats.revenue}</p>
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
            <div className="w-full relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="🔍 Search invoices, customers..."
                  value={filters.search || ''}
                  onChange={(e) => debouncedUpdateFilters({ search: e.target.value })}
                  className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full pr-10"
                  disabled={loading.general}
                />
                {(loading.search || loading.general) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Status and Payment Method - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="relative">
                  <Select
                    value={filters.status || ''}
                    onChange={(e) => updateFilters({ status: e.target.value || undefined })}
                    className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                    disabled={loading.status || loading.general}
                  >
                    <option value="">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent - Payment Pending">Sent - Payment Pending</option>
                    <option value="Sent - Payment Processing">Sent - Payment Processing</option>
                    <option value="Awaiting Approval">Awaiting Approval (Overstay)</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Failed">Failed</option>
                  </Select>
                  {(loading.status || loading.general) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="relative">
                  <Select
                    value={filters.paymentMethod || ''}
                    onChange={(e) => updateFilters({ paymentMethod: e.target.value || undefined })}
                    className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                    disabled={loading.paymentMethod || loading.general}
                  >
                    <option value="">All Payment Methods</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Wallet">Wallet</option>
                  </Select>
                  {(loading.paymentMethod || loading.general) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date Range - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <div className="relative">
                  <Input 
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined })}
                    className={`py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full ${(loading.dateFrom || loading.general) ? 'pr-10' : ''}`}
                    disabled={loading.dateFrom || loading.general}
                  />
                  {(loading.dateFrom || loading.general) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <div className="relative">
                  <Input 
                    type="date"
                    value={filters.dateTo || ''}
                    min={filters.dateFrom}
                    onChange={(e) => updateFilters({ dateTo: e.target.value || undefined })}
                    className={`py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full ${(loading.dateTo || loading.general) ? 'pr-10' : ''}`}
                    disabled={loading.dateTo || loading.general}
                  />
                  {(loading.dateTo || loading.general) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => updateFilters({ 
                    status: 'Overdue',
                    page: 1 
                  })}
                  className="h-[42px] whitespace-nowrap bg-red-50 text-red-700 hover:bg-red-100 border-red-200 flex items-center justify-center min-w-[120px]"
                  disabled={loading.status || loading.general}
                >
                  {(loading.status || loading.general) ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : 'Show Overdue'}
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
                  className="h-[42px] whitespace-nowrap text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center justify-center min-w-[120px]"
                  disabled={loading.general}
                >
                  {loading.general ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Resetting...
                    </>
                  ) : 'Reset Filters'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedInvoices.length > 0 && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-xl rounded-2xl p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="text-indigo-800">
                <p className="font-semibold">{selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected</p>
                <p className="text-sm text-indigo-600">Choose an action to perform on selected invoices</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Send - only for draft invoices */}
                {selectedInvoices.some(id => {
                  const invoice = invoices.find(inv => inv._id === id);
                  return invoice && invoice.status === 'Draft';
                }) && (
                  <Button
                    size="sm"
                    onClick={() => openBulkModal('send')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    📧 Send ({selectedInvoices.filter(id => {
                      const invoice = invoices.find(inv => inv._id === id);
                      return invoice && invoice.status === 'Draft';
                    }).length})
                  </Button>
                )}

                {/* Mark as Paid - only for non-paid invoices */}
                {selectedInvoices.some(id => {
                  const invoice = invoices.find(inv => inv._id === id);
                  return invoice && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' &&
                         invoice.status !== 'Refunded' && invoice.status !== 'Failed';
                }) && (
                  <Button
                    size="sm"
                    onClick={() => openBulkModal('mark_paid')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✅ Mark Paid ({selectedInvoices.filter(id => {
                      const invoice = invoices.find(inv => inv._id === id);
                      return invoice && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' &&
                             invoice.status !== 'Refunded' && invoice.status !== 'Failed';
                    }).length})
                  </Button>
                )}

                {/* Cancel - only for non-paid and non-cancelled invoices */}
                {selectedInvoices.some(id => {
                  const invoice = invoices.find(inv => inv._id === id);
                  return invoice && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' &&
                         invoice.status !== 'Refunded' && invoice.status !== 'Failed';
                }) && (
                  <Button
                    size="sm"
                    onClick={() => openBulkModal('cancel')}
                    variant="danger"
                  >
                    ❌ Cancel ({selectedInvoices.filter(id => {
                      const invoice = invoices.find(inv => inv._id === id);
                      return invoice && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' &&
                             invoice.status !== 'Refunded' && invoice.status !== 'Failed';
                    }).length})
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Invoices List */}
        {loading.general || loading.search || loading.status || loading.paymentMethod ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-4">
              {loading.search ? 'Searching invoices...' : 
               loading.status ? 'Filtering by status...' : 
               loading.paymentMethod ? 'Filtering by payment method...' : 'Loading invoices...'}
            </p>
          </div>
        ) : (
          <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 Invoices</h2>
                <div className="text-sm text-gray-500">
                  {invoices.length} invoice{invoices.length === 1 ? '' : 's'} found
                </div>
              </div>
              {invoices.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-gray-300 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 text-xl mb-2">No invoices found</p>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 lg:gap-6">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Invoice Header with Status Color */}
                      <div className={`rounded-xl p-4 mb-4 shadow-lg text-center ${getStatusColor(invoice.paymentStatus || invoice.status).includes('green') ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        getStatusColor(invoice.paymentStatus || invoice.status).includes('yellow') ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                        getStatusColor(invoice.paymentStatus || invoice.status).includes('red') ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                        'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'}`}>
                        <h3 className="font-bold text-lg mb-2">{invoice.invoiceNumber}</h3>
                        <Badge className={`${getStatusColor(invoice.paymentStatus || invoice.status)} bg-white/20 text-white border-white/30 text-sm px-3 py-1`}>
                          {getStatusColor(invoice.paymentStatus || invoice.status).includes('green') ? '✅' : getStatusColor(invoice.paymentStatus || invoice.status).includes('yellow') ? '⏳' : getStatusColor(invoice.paymentStatus || invoice.status).includes('red') ? '❌' : '📄'} {invoice.paymentStatus || invoice.status}
                        </Badge>
                      </div>

                      {/* Invoice Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">{invoice.userId?.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{invoice.bookingId?.roomId?.title} (Room {invoice.bookingId?.roomId?.roomNumber})</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">රු</span>
                          <span className="font-semibold text-green-600">{formatCurrency(invoice.amount || invoice.totalAmount || 0, invoice.currency || 'LKR')}</span>
                        </div>
                      </div>

                      {/* Selection Checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice._id)}
                            onChange={() => handleSelectInvoice(invoice._id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label className="ml-2 text-sm text-gray-600">Select</label>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsModal(invoice)}
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
              onPageChange={(page) => updateFilters({ page })}
            />
          </div>
        )}

      {/* Comprehensive Invoice Details Modal */}
      <Modal
        isOpen={showDetailsModal && selectedInvoice}
        onClose={closeDetailsModal}
        title={`Invoice Details - ${selectedInvoice?.invoiceNumber || 'Unknown'}`}
        size="2xl"
        zIndex={1000}
      >
        {selectedInvoice && (
          <>
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-3">📄 Invoice Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600">Invoice Number:</span>
                        <p className="text-gray-900">{selectedInvoice?.invoiceNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <div className="mt-1">
                          {getStatusBadge(selectedInvoice?.paymentStatus || selectedInvoice?.status)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Created:</span>
                        <p className="text-gray-900">{selectedInvoice?.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Currency:</span>
                        <p className="text-gray-900">{selectedInvoice?.currency || 'LKR'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  {/* OVERSTAY INVOICE SPECIFIC ACTIONS */}
                  {selectedInvoice?.overstayTracking?.isOverstayInvoice && (
                    <>
                      {selectedInvoice?.status === 'Awaiting Approval' && (
                        <>
                          <Button
                            onClick={() => {
                              openActionModal(selectedInvoice, 'approve_overstay');
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            ✅ Approve Payment
                          </Button>
                          <Button
                            onClick={() => {
                              openActionModal(selectedInvoice, 'reject_overstay');
                            }}
                            variant="danger"
                            className="w-full"
                          >
                            ❌ Reject Payment
                          </Button>
                          <Button
                            onClick={() => {
                              openActionModal(selectedInvoice, 'adjust_overstay');
                            }}
                            variant="outline"
                          className="w-full text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
                          ⚙️ Adjust Charges
                        </Button>
                      </>
                    )}
                    {selectedInvoice?.status === 'Paid' && (
                      <Button
                        onClick={() => {
                          openActionModal(selectedInvoice, 'extend_stay');
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        📅 Extend Stay
                      </Button>
                    )}
                    {selectedInvoice?.status === 'Overdue' && (
                      <>
                        <Button
                          onClick={() => {
                            openActionModal(selectedInvoice, 'adjust_overstay');
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                          ⚙️ Adjust Charges
                        </Button>
                        <Button
                          onClick={() => {
                            openActionModal(selectedInvoice, 'approve_overstay');
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          ✅ Force Approve
                        </Button>
                        <Button
                          onClick={() => {
                            openActionModal(selectedInvoice, 'waive_charges');
                          }}
                          variant="outline"
                          className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
                        >
                          💜 Waive Charges
                        </Button>
                      </>
                    )}
                    {selectedInvoice?.status === 'Failed' && (
                      <Button
                        onClick={() => {
                          openActionModal(selectedInvoice, 'approve_overstay');
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        🔄 Retry Approval
                      </Button>
                    )}
                  </>
                )}

                {/* STANDARD INVOICE ACTIONS (Non-Overstay) */}
                {!selectedInvoice?.overstayTracking?.isOverstayInvoice && (
                  <>
                    {selectedInvoice?.status === 'Draft' && (
                      <Button
                        onClick={() => {
                          openActionModal(selectedInvoice, 'send');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Send Invoice
                      </Button>
                    )}
                    {(selectedInvoice?.status === 'Sent - Payment Pending' || selectedInvoice?.status === 'Sent - Payment Processing') && (
                      <>
                        <Button
                          onClick={() => {
                            openActionModal(selectedInvoice, 'mark_paid');
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Mark as Paid
                        </Button>
                        <Button
                          onClick={() => {
                            openActionModal(selectedInvoice, 'overdue');
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Mark Overdue
                        </Button>
                      </>
                    )}
                    {selectedInvoice?.status === 'Overdue' && (
                      <Button
                        onClick={() => {
                          openActionModal(selectedInvoice, 'mark_paid');
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Mark as Paid
                      </Button>
                    )}
                    {selectedInvoice?.status !== 'Paid' && selectedInvoice?.status !== 'Cancelled' &&
                     selectedInvoice?.status !== 'Refunded' && selectedInvoice?.status !== 'Failed' && (
                      <Button
                        onClick={() => {
                          openActionModal(selectedInvoice, 'cancel');
                        }}
                        variant="danger"
                        className="w-full"
                      >
                        Cancel Invoice
                      </Button>
                    )}
                  </>
                )}

                <Button
                  onClick={() => {
                    // Export invoice functionality
                    console.log('Export invoice');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Export Invoice
                </Button>
              </div>
            </div>
          </div>

          {/* OVERSTAY INFORMATION (if applicable) */}
          {selectedInvoice?.overstayTracking?.isOverstayInvoice && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">⏱️ Overstay Information</h4>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Original Check-out:</span>
                    <p className="text-gray-900">{selectedInvoice?.overstayTracking?.originalCheckOutDate ? new Date(selectedInvoice.overstayTracking.originalCheckOutDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Current Check-out:</span>
                    <p className="text-gray-900">{selectedInvoice?.overstayTracking?.currentCheckOutDate ? new Date(selectedInvoice.overstayTracking.currentCheckOutDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Days Overstayed:</span>
                    <p className="text-lg font-bold text-amber-700">{selectedInvoice?.overstayTracking?.daysOverstayed} days</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Daily Rate (1.5x):</span>
                    <p className="text-gray-900">{formatCurrency(selectedInvoice?.overstayTracking?.dailyRate, selectedInvoice?.currency)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Base Charges:</span>
                    <p className="text-gray-900">{formatCurrency(selectedInvoice?.overstayTracking?.chargeBreakdown?.baseCharges || 0, selectedInvoice?.currency)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Accumulated Charges:</span>
                    <p className="text-gray-900">{formatCurrency(selectedInvoice?.overstayTracking?.chargeBreakdown?.accumulatedCharges || 0, selectedInvoice?.currency)}</p>
                  </div>
                  {selectedInvoice?.overstayTracking?.updatedByAdmin && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Admin Adjustment Notes:</span>
                      <p className="text-gray-900 text-sm mt-1">{selectedInvoice?.overstayTracking?.adjustmentNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT APPROVAL STATUS (for overstay invoices) */}
          {selectedInvoice?.overstayTracking?.isOverstayInvoice && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">✓ Approval Status</h4>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Approval Status:</span>
                    <div className="mt-1">
                      <Badge className={
                        selectedInvoice?.paymentApproval?.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedInvoice?.paymentApproval?.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {selectedInvoice?.paymentApproval?.approvalStatus === 'approved' ? '✅ Approved' :
                         selectedInvoice?.paymentApproval?.approvalStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                      </Badge>
                    </div>
                  </div>
                  {selectedInvoice?.paymentApproval?.approvedBy && (
                    <div>
                      <span className="font-medium text-gray-600">Approved By:</span>
                      <p className="text-gray-900">{selectedInvoice?.paymentApproval?.approvedBy?.name || 'Admin'}</p>
                    </div>
                  )}
                  {selectedInvoice?.paymentApproval?.approvedAt && (
                    <div>
                      <span className="font-medium text-gray-600">Approved At:</span>
                      <p className="text-gray-900">{new Date(selectedInvoice.paymentApproval.approvedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedInvoice?.paymentApproval?.approvalNotes && (
                    <div>
                      <span className="font-medium text-gray-600">Approval Notes:</span>
                      <p className="text-gray-900 text-sm">{selectedInvoice?.paymentApproval?.approvalNotes}</p>
                    </div>
                  )}
                  {selectedInvoice?.paymentApproval?.rejectionReason && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-red-600">Rejection Reason:</span>
                      <p className="text-gray-900 text-sm mt-1">{selectedInvoice?.paymentApproval?.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">👤 Customer Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="text-gray-900">
                    {selectedInvoice.userId?.address ? 
                      (typeof selectedInvoice.userId.address === 'string' ? 
                        selectedInvoice.userId.address : 
                        [
                          selectedInvoice.userId.address.street,
                          selectedInvoice.userId.address.city,
                          selectedInvoice.userId.address.postalCode,
                          selectedInvoice.userId.address.country
                        ].filter(Boolean).join(', ') || 'Not provided'
                      ) : 
                      'Not provided'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          {selectedInvoice.bookingId && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">📅 Booking Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Booking Number:</span>
                    <p className="text-gray-900 font-mono">{selectedInvoice?.bookingId?.bookingNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Room Number:</span>
                    <p className="text-gray-900">{selectedInvoice?.bookingId?.roomId?.roomNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Room Type:</span>
                    <p className="text-gray-900">{selectedInvoice?.bookingId?.roomId?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Check-in:</span>
                    <p className="text-gray-900">{selectedInvoice?.bookingId?.checkIn ? new Date(selectedInvoice.bookingId.checkIn).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Check-out:</span>
                    <p className="text-gray-900">{selectedInvoice?.bookingId?.checkOut ? new Date(selectedInvoice.bookingId.checkOut).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Invoice Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Issue Date:</span>
                  <p className="text-gray-900">{selectedInvoice?.issuedAt ? new Date(selectedInvoice.issuedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Due Date:</span>
                  <p className="text-gray-900">{selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Payment Method:</span>
                  <div className="mt-1">
                    {getPaymentMethodBadge(selectedInvoice?.paymentMethod || selectedInvoice?.bookingId?.paymentMethod)}
                  </div>
                </div>
              </div>
              {selectedInvoice?.paidAt && (
                <div className="mt-3 p-3 bg-green-50 rounded">
                  <span className="font-medium text-gray-600">Paid Date:</span>
                  <p className="text-gray-900">{new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Breakdown */}
          {selectedInvoice?.items && selectedInvoice.items.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Items Breakdown</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{item?.description || 'N/A'}</span>
                        {item?.quantity && item.quantity > 1 && (
                          <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(item?.amount || 0, selectedInvoice?.currency)}</span>
                        {item?.unitPrice && (
                          <div className="text-sm text-gray-500">
                            {formatCurrency(item.unitPrice, selectedInvoice?.currency)} each
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                  {selectedInvoice?.taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency((selectedInvoice?.amount || selectedInvoice?.totalAmount || 0) / (1 + selectedInvoice?.taxRate / 100), selectedInvoice?.currency)}
                      </span>
                    </div>
                  )}
                  {selectedInvoice?.taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({selectedInvoice?.taxRate}%):</span>
                      <span className="font-medium">
                        {formatCurrency((selectedInvoice?.amount || selectedInvoice?.totalAmount || 0) * selectedInvoice?.taxRate / 100, selectedInvoice?.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900">Total Amount:</span>
                    <span className="text-gray-900">
                      {formatCurrency(selectedInvoice?.amount || selectedInvoice?.totalAmount || 0, selectedInvoice?.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Information */}
          {selectedInvoice?.transactionId && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Transaction Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Transaction ID:</span>
                    <p className="text-gray-900 font-mono text-sm">{selectedInvoice?.transactionId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Status:</span>
                    <p className="text-gray-900">{selectedInvoice?.paymentStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {selectedInvoice?.statusNotes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Admin Notes</h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-900">{selectedInvoice?.statusNotes}</p>
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
              // Print invoice functionality
              window.print();
            }}
            variant="outline"
          >
            Print Invoice
          </Button>
          <Button
            onClick={() => {
              // Email invoice functionality
              console.log('Email invoice to customer');
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
              Email Customer
            </Button>
          </div>
          </>
        )}
      </Modal>      {/* Action Modal */}
      <Modal
        isOpen={showActionModal && selectedActionInvoice}
        onClose={closeActionModal}
        title={actionType === 'send' ? 'Send Invoice' :
               actionType === 'mark_paid' ? 'Mark Invoice as Paid' :
               actionType === 'overdue' ? 'Mark Invoice as Overdue' :
               actionType === 'cancel' ? 'Cancel Invoice' :
               actionType === 'approve_overstay' ? 'Approve Overstay Payment' :
               actionType === 'reject_overstay' ? 'Reject Overstay Payment' :
               actionType === 'adjust_overstay' ? 'Adjust Overstay Charges' :
               actionType === 'waive_charges' ? 'Waive Overstay Charges' :
               actionType === 'extend_stay' ? 'Extend Guest Stay' : 'Invoice Action'}
        size="md"
        zIndex={1100}
      >
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">{selectedActionInvoice?.invoiceNumber}</h4>
          <p className="text-sm text-gray-600">
            Customer: {selectedActionInvoice?.userId?.name}
          </p>
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(selectedActionInvoice?.amount || selectedActionInvoice?.totalAmount || 0, selectedActionInvoice?.currency)}
          </p>
          {selectedActionInvoice?.overstayTracking?.isOverstayInvoice && (
            <>
              <p className="text-sm text-gray-600 mt-2">
                📅 Days Overstayed: {selectedActionInvoice?.overstayTracking?.daysOverstayed}
              </p>
              <p className="text-sm text-gray-600">
                💰 Daily Rate: {formatCurrency(selectedActionInvoice?.overstayTracking?.dailyRate, selectedActionInvoice?.currency)}
              </p>
            </>
          )}
        </div>

        {/* OVERSTAY-SPECIFIC INPUTS */}
        {selectedActionInvoice?.overstayTracking?.isOverstayInvoice && (
          <>
            {/* Adjust Charges */}
            {(actionType === 'adjust_overstay' || actionType === 'waive_charges') && (
              <div className="mb-4 space-y-4">
                {actionType === 'adjust_overstay' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Charge Amount (LKR) *
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder={selectedActionInvoice?.amount?.toString()}
                        min="0"
                        step="100"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {formatCurrency(selectedActionInvoice?.amount, selectedActionInvoice?.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Adjustment *
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        rows="2"
                        placeholder="e.g., Guest negotiated, Damage assessment..."
                        required
                      />
                    </div>
                  </>
                )}
                {actionType === 'waive_charges' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Waiving Charges *
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="e.g., Goodwill, Service issue, Loyalty customer..."
                      required
                    />
                    <p className="text-sm text-purple-600 mt-2 font-medium">
                      ⚠️ This will set charges to 0 and mark as Paid
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reject Payment */}
            {actionType === 'reject_overstay' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g., Documentation incomplete, Amount disputed..."
                  required
                />
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ℹ️ Guest will be notified and blocked from checkout
                </p>
              </div>
            )}

            {/* Approve Payment */}
            {actionType === 'approve_overstay' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="2"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g., Payment verified, Guest approved for checkout..."
                />
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✅ Guest will be allowed to checkout immediately
                </p>
              </div>
            )}

            {/* Extend Stay */}
            {actionType === 'extend_stay' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Days *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  min="1"
                  max="30"
                  placeholder="1"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Will create new invoice for extended days
                </p>
              </div>
            )}
          </>
        )}

        {/* STANDARD INVOICE INPUTS */}
        {!selectedActionInvoice?.overstayTracking?.isOverstayInvoice && (
          <>
            {(actionType === 'cancel' || actionType === 'overdue') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'cancel' ? 'Cancellation Reason' : 'Overdue Reason'} *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === 'cancel' ? 'Reason for cancellation...' : 'Reason for marking overdue...'}
                  required
                />
              </div>
            )}
          </>
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
              // Overstay-specific actions
              if (selectedActionInvoice?.overstayTracking?.isOverstayInvoice) {
                if (actionType === 'approve_overstay') {
                  handleStatusChange(selectedActionInvoice?._id, 'Paid', actionNotes);
                } else if (actionType === 'reject_overstay') {
                  handleStatusChange(selectedActionInvoice?._id, 'Failed', actionNotes);
                } else if (actionType === 'adjust_overstay') {
                  handleStatusChange(selectedActionInvoice?._id, 'Awaiting Approval', actionNotes);
                } else if (actionType === 'waive_charges') {
                  handleStatusChange(selectedActionInvoice?._id, 'Paid', actionNotes);
                } else if (actionType === 'extend_stay') {
                  handleStatusChange(selectedActionInvoice?._id, 'Paid', actionNotes);
                }
              } else {
                // Standard invoice actions
                const newStatus = actionType === 'send' ? 'Sent' :
                                 actionType === 'mark_paid' ? 'Paid' :
                                 actionType === 'overdue' ? 'Overdue' : 'Cancelled';
                handleStatusChange(selectedActionInvoice?._id, newStatus, actionNotes);
              }
            }}
            disabled={actionLoading ||
              ((actionType === 'cancel' || actionType === 'overdue') && !actionNotes.trim()) ||
              ((actionType === 'adjust_overstay' || actionType === 'waive_charges' || actionType === 'reject_overstay') && !actionNotes.trim()) ||
              ((actionType === 'extend_stay') && !actionNotes.trim())
            }
            className={actionType === 'send' ? 'bg-blue-600 hover:bg-blue-700' :
                       actionType === 'mark_paid' || actionType === 'approve_overstay' ? 'bg-green-600 hover:bg-green-700' :
                       actionType === 'reject_overstay' ? 'bg-red-600 hover:bg-red-700' :
                       actionType === 'adjust_overstay' || actionType === 'extend_stay' ? 'bg-amber-600 hover:bg-amber-700' :
                       actionType === 'waive_charges' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            {actionLoading ? 'Processing...' :
             actionType === 'send' ? 'Send Invoice' :
             actionType === 'mark_paid' ? 'Mark as Paid' :
             actionType === 'overdue' ? 'Mark Overdue' :
             actionType === 'cancel' ? 'Cancel Invoice' :
             actionType === 'approve_overstay' ? 'Approve Payment' :
             actionType === 'reject_overstay' ? 'Reject Payment' :
             actionType === 'adjust_overstay' ? 'Adjust Charges' :
             actionType === 'waive_charges' ? 'Waive Charges' :
             actionType === 'extend_stay' ? 'Extend Stay' : 'Submit'}
          </Button>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={closeBulkModal}
        title={`Bulk ${bulkActionType === 'send' ? 'Send' :
                      bulkActionType === 'mark_paid' ? 'Mark Paid' :
                      bulkActionType === 'cancel' ? 'Cancel' : 'Action'} Invoices`}
        size="md"
      >
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            You are about to {bulkActionType.replace('_', ' ')} {(selectedInvoices || []).length} selected invoice(s).
          </p>
        </div>

        {/* Action Notes */}
        {bulkActionType === 'cancel' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Reason for bulk cancellation..."
              required
            />
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
            disabled={actionLoading || (bulkActionType === 'cancel' && !actionNotes.trim())}
            className={bulkActionType === 'send' ? 'bg-blue-600 hover:bg-blue-700' :
                       bulkActionType === 'mark_paid' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {actionLoading ? 'Processing...' :
             `Bulk ${bulkActionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
          </Button>
        </div>
      </Modal>

      </div>
    </DefaultAdminLayout>
  );
}
