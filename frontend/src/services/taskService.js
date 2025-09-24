import api from './api';

const API_URL = '/tasks';

export const getTasks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const response = await api.get(url);
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await api.get(`${API_URL}/${taskId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post(API_URL, taskData);
  return response.data;
};

export const updateTask = async (taskId, updates) => {
  const response = await api.put(`${API_URL}/${taskId}`, updates);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`${API_URL}/${taskId}/status`, { status });
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`${API_URL}/${taskId}`);
  return response.data;
};

export const autoAssignTasks = async () => {
  const response = await api.post(`${API_URL}/auto-assign`);
  return response.data;
};

export const updateTaskPriority = async (taskId) => {
  const response = await api.patch(`${API_URL}/${taskId}/priority`);
  return response.data;
};

export const processTaskHandoff = async (taskId, toStaffId, reason) => {
  const response = await api.patch(`${API_URL}/${taskId}/handoff`, { toStaffId, reason });
  return response.data;
};

export const getStaffPerformance = async (staffId) => {
  const response = await api.get(`${API_URL}/performance/${staffId}`);
  return response.data;
};
