import api from './api';
import axios from 'axios';

const API_URL = '/check-in-out';

// Guest self-service check-in
export const guestSelfCheckIn = async (bookingId, formData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/guest/check-in`, formData, {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Guest self-service check-out
export const guestSelfCheckOut = async (checkInOutId, checkOutData) => {
  const response = await api.post(`${API_URL}/guest/check-out`, checkOutData);
  return response.data;
};

// Get guest's current check-in status
export const getGuestCheckInStatus = async () => {
  const response = await api.get(`${API_URL}/guest/status`);
  return response.data;
};

// Get guest receipt
export const getGuestReceipt = async (checkInOutId) => {
  const response = await api.get(`${API_URL}/guest/${checkInOutId}/receipt`);
  return response.data;
};

// Update guest preferences
export const updateGuestPreferences = async (checkInOutId, preferences) => {
  const response = await api.patch(`${API_URL}/guest/${checkInOutId}/preferences`, { preferences });
  return response.data;
};

export const checkInGuest = async (data) => {
  // Use a separate axios instance for file uploads to avoid content-type conflicts
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/check-in`, data, {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return response.data;
};

export const checkOutGuest = async (checkInOutId, checkOutData = {}) => {
  const response = await api.post(`${API_URL}/check-out`, { checkInOutId, ...checkOutData });
  return response.data;
};

export const getCurrentGuests = async () => {
  const response = await api.get(`${API_URL}/current-guests`);
  return response.data;
};

// Overstay management functions
export const getPendingOverstayInvoices = async () => {
  const response = await api.get(`${API_URL}/admin/overstay/pending-invoices`);
  return response.data;
};

export const approveOverstayPayment = async (invoiceId, notes = '') => {
  const response = await api.post(`${API_URL}/admin/overstay/${invoiceId}/approve`, { approvalNotes: notes });
  return response.data;
};

export const rejectOverstayPayment = async (invoiceId, reason = '') => {
  const response = await api.post(`${API_URL}/admin/overstay/${invoiceId}/reject`, { rejectionReason: reason });
  return response.data;
};

export const adjustOverstayCharges = async (invoiceId, newAmount, notes = '') => {
  const response = await api.post(`${API_URL}/admin/overstay/${invoiceId}/adjust-charges`, {
    newAmount,
    adjustmentNotes: notes
  });
  return response.data;
};

export const getCheckInDetails = async (id) => {
  const response = await api.get(`${API_URL}/check-in/${id}`);
  return response.data;
};

export const generateReceipt = async (id) => {
  const response = await api.get(`${API_URL}/${id}/receipt`);
  return response.data;
};
