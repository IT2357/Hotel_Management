import api from './api';

const API_URL = '/key-cards';

export const createKeyCard = async (cardNumber) => {
  const response = await api.post(API_URL, { cardNumber });
  return response.data;
};

export const assignKeyCard = async (id, assignmentData) => {
  const response = await api.patch(`${API_URL}/${id}/assign`, assignmentData);
  return response.data;
};

export const getAvailableKeyCards = async () => {
  const response = await api.get(`${API_URL}/available`);
  return response.data;
};

export const assignKeyToGuest = async (id, assignmentData) => {
  const response = await api.post(`${API_URL}/${id}/assign-to-guest`, assignmentData);
  return response.data;
};

export const returnKeyFromGuest = async (id) => {
  const response = await api.post(`${API_URL}/${id}/return`);
  return response.data;
};

export const activateKeyCard = async (id) => {
  const response = await api.patch(`${API_URL}/${id}/activate`);
  return response.data;
};

export const deactivateKeyCard = async (id) => {
  const response = await api.patch(`${API_URL}/${id}/deactivate`);
  return response.data;
};

export const updateKeyCardStatus = async (id, status, reason = '') => {
  const response = await api.put(`${API_URL}/${id}/status`, { status, reason });
  return response.data;
};

export const listKeyCards = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getKeyCardDetails = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};
