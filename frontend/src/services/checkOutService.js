import api from './api';

const API_URL = '/check-in-out';

export const checkOutGuest = async (checkOutData) => {
  const response = await api.post(API_URL, checkOutData);
  return response.data;
};

export const generateReceipt = async (checkInOutId) => {
  const response = await api.get(`${API_URL}/${checkInOutId}/receipt`);
  return response.data;
};

export const getCheckOutDetails = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};
