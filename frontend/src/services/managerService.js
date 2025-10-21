// src/services/managerService.js
import api from './api';

// Tasks
export const fetchTasks = async (params = {}) => {
  const { data } = await api.get('/manager/tasks', { params });
  // If controller returns {tasks, pagination, ...}, normalize; if it returns array, use directly
  return Array.isArray(data) ? { tasks: data, pagination: null } : data;
};

export const createTask = async (payload) => {
  const { data } = await api.post('/manager/tasks', payload);
  return data;
};

export const updateTask = async (taskId, updates) => {
  const { data } = await api.patch(`/manager/tasks/${taskId}`, updates);
  return data;
};

// Staff
export const fetchStaff = async (params = {}) => {
  const { data } = await api.get('/manager/staff', { params });
  return data;
};

export const fetchManagerProfile = async () => {
  const { data } = await api.get('/manager/profile/overview');
  return data;
};

// Demo seed
export const seedDemo = async () => {
  const { data } = await api.post('/manager/demo-seed');
  return data;
};
