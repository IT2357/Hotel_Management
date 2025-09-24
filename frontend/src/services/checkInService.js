import api from './api';

const API_URL = '/check-in-out';

export const checkInGuest = async (checkInData) => {
  const response = await api.post(API_URL, checkInData);
  return response.data;
};

export const checkOutGuest = async (checkOutData) => {
  const response = await api.post(`${API_URL}/check-out`, checkOutData);
  return response.data;
};

export const getCheckInDetails = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const listCurrentGuests = async () => {
  const response = await api.get(`${API_URL}/current-guests`);
  return response.data;
};

export const updateGuestPreferences = async (id, preferences) => {
  const response = await api.put(`${API_URL}/${id}/preferences`, { preferences });
  return response.data;
};
