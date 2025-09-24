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
