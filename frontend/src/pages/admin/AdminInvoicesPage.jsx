// 📁 frontend/src/pages/admin/AdminInvoicesPage.jsx
import { useState, useEffect } from "react";
import Card from "../../components/ui/card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import Input from "../../components/ui/input";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import DefaultAdminLayout from '../../layout/admin/DefaultAdminLayout';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);
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

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/invoices/admin/all?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        cache: 'no-store' // Prevent caching
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      if (data.success) {
        setInvoices(data.data.invoices || []);
        setPagination(data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalInvoices: data.data.invoices?.length || 0
        });
      }
      return data.data;
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setAlert({ 
        type: 'error', 
        message: error.message || 'Failed to fetch invoices' 
      });
      throw error;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

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
      card: { label: 'Credit/Debit Card', color: 'bg-blue-100 text-blue-800', icon: '💳' },
      cash: { label: 'Pay at Hotel', color: 'bg-green-100 text-green-800', icon: '💵' },
      bank: { label: 'Bank Transfer', color: 'bg-purple-100 text-purple-800', icon: '🏦' },
      Online: { label: 'Online Payment', color: 'bg-indigo-100 text-indigo-800', icon: '💻' },
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
    setShowDetailsModal(false);
    setSelectedInvoice(null);
  };

  const openActionModal = (invoice, type) => {
    setSelectedInvoice(invoice);
    setActionType(type);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    // Use setTimeout to ensure the modal is fully unmounted before resetting state
    setTimeout(() => {
      setActionType('');
      setActionNotes('');
      setSelectedInvoice(null);
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
      
      // Close the modal immediately
      closeActionModal();
      
      // Make the API call
      const response = await fetch(`/api/invoices/admin/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          status: newStatus,
          reason: notes
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update invoice status');
      }
      
      if (data.success) {
        // Refresh the data from server to ensure consistency
        await fetchInvoices(false);
        
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
      const results = await Promise.allSettled(
        eligibleInvoices.map(id => 
          fetch(`/api/invoices/admin/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
      
      // Refresh data from server
      await fetchInvoices(false);
      
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

    try {
      setActionLoading(true);

      // For bulk actions, we'll update each invoice individually
      const updatePromises = eligibleInvoices.map(invoiceId =>
        fetch(`/api/invoices/admin/${invoiceId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            status: bulkActionType === 'mark_paid' ? 'Paid' : bulkActionType === 'send' ? 'Sent - Payment Pending' : 'Cancelled',
            reason: actionNotes
          })
        })
      );

      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter(result => !result.ok);

      if (failedUpdates.length > 0) {
        setAlert({ type: 'error', message: `${failedUpdates.length} invoice(s) failed to update` });
      } else {
        setAlert({ type: 'success', message: `Bulk action completed successfully for ${eligibleInvoices.length} invoice(s)` });
        setSelectedInvoices([]);
        fetchInvoices();
        closeBulkModal();
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      setAlert({ type: 'error', message: 'Failed to perform bulk action' });
    } finally {
      setActionLoading(false);
    }
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    // Use setTimeout to ensure the modal is fully unmounted before resetting state
    setTimeout(() => {
      setBulkActionType('');
      setActionNotes('');
      setActionLoading(false);
    }, 300);
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
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="🔍 Search invoices, customers..."
                  value={filters.search}
                  onChange={(e) => updateFilters({...filters, search: e.target.value, page: 1})}
                  className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="w-full xl:w-64">
              <Select
                value={filters.status}
                onChange={(e) => updateFilters({...filters, status: e.target.value, page: 1})}
                className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent - Payment Pending">Sent - Payment Pending</option>
                <option value="Sent - Payment Processing">Sent - Payment Processing</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
                <option value="Failed">Failed</option>
              </Select>
            </div>
            <div className="w-full xl:w-64">
              <Select
                value={filters.paymentMethod}
                onChange={(e) => updateFilters({...filters, paymentMethod: e.target.value, page: 1})}
                className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Payment Methods</option>
                <option value="card">Credit/Debit Card</option>
                <option value="cash">Pay at Hotel</option>
                <option value="bank">Bank Transfer</option>
                <option value="Online">Online Payment</option>
              </Select>
            </div>
            <div className="w-full xl:w-48">
              <Input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) => updateFilters({...filters, dateFrom: e.target.value, page: 1})}
                className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="w-full xl:w-48">
              <Input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) => updateFilters({...filters, dateTo: e.target.value, page: 1})}
                className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-4">Loading invoices...</p>
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
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
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
              onPageChange={(page) => updateFilters({...filters, page})}
            />
          </div>
        )}

      {/* Comprehensive Invoice Details Modal */}
      <Modal
        isOpen={showDetailsModal && selectedInvoice}
        onClose={closeDetailsModal}
        title={`Invoice Details - ${selectedInvoice?.invoiceNumber || 'Unknown'}`}
        size="2xl"
      >
        {selectedInvoice && (
          <div>
            <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <h4 className="font-medium text-gray-700 mb-3">Invoice Information</h4>
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
                {selectedInvoice?.status === 'Draft' && (
                  <Button
                    onClick={() => {
                      closeDetailsModal();
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
                        closeDetailsModal();
                        openActionModal(selectedInvoice, 'mark_paid');
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Mark as Paid
                    </Button>
                    <Button
                      onClick={() => {
                        closeDetailsModal();
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
                      closeDetailsModal();
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
                      closeDetailsModal();
                      openActionModal(selectedInvoice, 'cancel');
                    }}
                    variant="danger"
                    className="w-full"
                  >
                    Cancel Invoice
                  </Button>
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

          {/* Customer Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Customer Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="text-gray-900">{selectedInvoice.userId?.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          {selectedInvoice.bookingId && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Booking Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Booking Number:</span>
                  <p className="text-gray-900">{selectedInvoice?.bookingId?.bookingNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Room:</span>
                  <p className="text-gray-900">{selectedInvoice?.bookingId?.roomId?.title}</p>
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
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal && selectedInvoice}
        onClose={closeActionModal}
        title={actionType === 'send' ? 'Send Invoice' :
               actionType === 'mark_paid' ? 'Mark Invoice as Paid' :
               actionType === 'overdue' ? 'Mark Invoice as Overdue' :
               actionType === 'cancel' ? 'Cancel Invoice' : 'Invoice Action'}
        size="md"
      >
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">{selectedInvoice?.invoiceNumber}</h4>
          <p className="text-sm text-gray-600">
            Customer: {selectedInvoice?.userId?.name}
          </p>
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(selectedInvoice?.amount || selectedInvoice?.totalAmount || 0, selectedInvoice?.currency)}
          </p>
        </div>

        {/* Action Notes */}
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
              const newStatus = actionType === 'send' ? 'Sent' :
                               actionType === 'mark_paid' ? 'Paid' :
                               actionType === 'overdue' ? 'Overdue' : 'Cancelled';
              handleStatusChange(selectedInvoice?._id, newStatus, actionNotes);
            }}
            disabled={actionLoading ||
              ((actionType === 'cancel' || actionType === 'overdue') && !actionNotes.trim())
            }
            className={actionType === 'send' ? 'bg-blue-600 hover:bg-blue-700' :
                       actionType === 'mark_paid' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {actionLoading ? 'Processing...' :
             actionType === 'send' ? 'Send Invoice' :
             actionType === 'mark_paid' ? 'Mark as Paid' :
             actionType === 'overdue' ? 'Mark Overdue' : 'Cancel Invoice'}
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
