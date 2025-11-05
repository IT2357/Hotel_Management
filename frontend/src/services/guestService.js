import api from './api';

const API_URL = '/guest-services';

export const createServiceRequest = async (requestData) => {
  const response = await api.post(API_URL, requestData);
  return response.data;
};

export const getServiceRequests = async (status = 'all') => {
  const url = status === 'all' ? API_URL : `${API_URL}?status=${status}`;
  const response = await api.get(url);
  return response.data;
};

export const updateRequestStatus = async (id, status) => {
  const response = await api.patch(`${API_URL}/${id}/status`, { status });
  return response.data;
};

export const addRequestNotes = async (id, notes) => {
  const response = await api.post(`${API_URL}/${id}/notes`, { content: notes });
  return response.data;
};

export const getRequestDetails = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

// Create new guest
export const createGuest = async (guestData) => {
  const response = await api.post('/guests', guestData);
  return response.data;
};

// Get all guests
export const getGuests = async () => {
  const response = await api.get('/guests');
  return response.data;
};

// Get single guest
export const getGuestById = async (guestId) => {
  const response = await api.get(`/guests/${guestId}`);
  return response.data;
};

// Update guest
export const updateGuest = async (guestId, guestData) => {
  const response = await api.put(`/guests/${guestId}`, guestData);
  return response.data;
};

// Get public staff updates
export const getPublicStaffUpdates = async (params = {}) => {
  const response = await api.get('/guests/staff-updates/public', { params });
  return response.data;
};

// Delete guest
export const deleteGuest = async (guestId) => {
  const response = await api.delete(`/guests/${guestId}`);
  return response.data;
};
