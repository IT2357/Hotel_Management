import axios from 'axios';

// Prefer Vite proxy in dev by default ("/api"), allow overriding via VITE_API_URL
const rawBase = (import.meta.env?.VITE_API_URL ?? '/api');
const API_BASE_URL = String(rawBase).replace(/\/$/, ''); // trim trailing slash

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/task-management`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔍 API Request Debug:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No authentication token found - this will likely cause a 401/400 error');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.warn('🔒 Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ====================================
// TASK MANAGEMENT API
// ====================================

export const taskAPI = {
  // Get all tasks with filtering
  getAllTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get single task by ID
  getTaskById: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Assign task to staff
  assignTask: async (taskId, assignmentData) => {
    const response = await api.put(`/tasks/${taskId}/assign`, assignmentData);
    return response.data;
  },

  // Accept a task (staff accepting in-progress task)
  acceptTask: async (taskId) => {
    // Use the status update endpoint for consistency
    const response = await api.put(`/tasks/${taskId}/status`, {
      status: 'in-progress',
      updatedAt: new Date().toISOString()
    });
    return response.data;
  },

  // Complete a task (staff completing their task)
  completeTask: async (taskId, notes = '') => {
    // Use the status update endpoint instead of the old complete endpoint
    const response = await api.put(`/tasks/${taskId}/status`, {
      status: 'completed',
      completionNotes: notes,
      updatedAt: new Date().toISOString()
    });
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (taskId, statusData) => {
    const response = await api.put(`/tasks/${taskId}/status`, statusData);
    return response.data;
  },

  // Cancel or unassign task
  cancelTask: async (taskId, reason) => {
    const response = await api.put(`/tasks/${taskId}/cancel`, { reason });
    return response.data;
  },

  // Get available staff for department
  getAvailableStaff: async (department) => {
    const response = await api.get(`/tasks/staff/${encodeURIComponent(department)}`);
    return response.data;
  },

  // Get all staff members
  getAllStaff: async () => {
    const response = await api.get('/staff');
    return response.data;
  },

  // Get my tasks (for staff)
  getMyTasks: async (params = {}) => {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Get task statistics
  getTaskStats: async (params = {}) => {
    const response = await api.get('/tasks/stats', { params });
    return response.data;
  },
};

// ====================================
// FEEDBACK API
// ====================================

export const feedbackAPI = {
  // Create new feedback
  createFeedback: async (feedbackData) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },

  // Get feedback for task
  getFeedbackForTask: async (taskId) => {
    const response = await api.get(`/feedback/task/${taskId}`);
    return response.data;
  },

  // Get my feedback
  getMyFeedback: async (params = {}) => {
    const response = await api.get('/feedback/my-feedback', { params });
    return response.data;
  },

  // Mark feedback as read
  markFeedbackAsRead: async (feedbackId) => {
    const response = await api.put(`/feedback/${feedbackId}/read`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/feedback/unread-count');
    return response.data;
  },

  // Reply to feedback
  replyToFeedback: async (feedbackId, replyData) => {
    const response = await api.post(`/feedback/${feedbackId}/reply`, replyData);
    return response.data;
  },

  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    const response = await api.delete(`/feedback/${feedbackId}`);
    return response.data;
  },

  // Get feedback statistics
  getFeedbackStats: async (params = {}) => {
    const response = await api.get('/feedback/stats', { params });
    return response.data;
  },
};

// ====================================
// REPORTS API
// ====================================

export const reportsAPI = {
  // Get task reports
  getTaskReports: async (params = {}) => {
    const response = await api.get('/reports/tasks', { params });
    return response.data;
  },

  // Get workload report
  getWorkloadReport: async (params = {}) => {
    const response = await api.get('/reports/workload', { params });
    return response.data;
  },

  // Get delayed tasks report
  getDelayedTasksReport: async (params = {}) => {
    const response = await api.get('/reports/delayed', { params });
    return response.data;
  },

  // Export report
  exportReport: async (params = {}) => {
    const response = await api.get('/reports/export', { params });
    return response.data;
  },
};

// ====================================
// HELPER FUNCTIONS
// ====================================

export const formatters = {
  // Format task status for display
  formatTaskStatus: (status) => {
    const statusMap = {
      'pending': { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      'assigned': { label: 'Assigned', class: 'bg-blue-100 text-blue-800' },
      'in-progress': { label: 'In Progress', class: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'Completed', class: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelled', class: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
  },

  // Format priority for display
  formatPriority: (priority) => {
    const priorityMap = {
      'low': { label: 'Low', class: 'bg-green-100 text-green-800', icon: '🟢' },
      'medium': { label: 'Medium', class: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      'high': { label: 'High', class: 'bg-orange-100 text-orange-800', icon: '🟠' },
      'critical': { label: 'Critical', class: 'bg-red-100 text-red-800', icon: '🔴' },
    };
    return priorityMap[priority] || { label: priority, class: 'bg-gray-100 text-gray-800', icon: '⚪' };
  },

  // Format department for display
  formatDepartment: (department) => {
    const departmentMap = {
      'Kitchen': { label: 'Kitchen', icon: '👨‍🍳', color: 'bg-red-50 text-red-700' },
      'Services': { label: 'Services', icon: '🛎️', color: 'bg-blue-50 text-blue-700' },
      'Maintenance': { label: 'Maintenance', icon: '🔧', color: 'bg-orange-50 text-orange-700' },
      'Cleaning': { label: 'Cleaning', icon: '🧹', color: 'bg-green-50 text-green-700' },
    };
    return departmentMap[department] || { label: department, icon: '📋', color: 'bg-gray-50 text-gray-700' };
  },

  // Format duration in minutes to readable format
  formatDuration: (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  },

  // Format date to relative time
  formatRelativeTime: (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  },

  // Calculate task urgency score
  calculateUrgency: (task) => {
    let score = 0;
    
    // Priority weight
    const priorityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    score += priorityWeights[task.priority] || 0;
    
    // Overdue weight
    if (task.dueDate && new Date() > new Date(task.dueDate)) {
      const hoursOverdue = (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60);
      score += Math.min(hoursOverdue / 6, 4); // Max 4 points for being overdue
    }
    
    // Status weight
    const statusWeights = { pending: 2, assigned: 1, 'in-progress': 0.5 };
    score += statusWeights[task.status] || 0;
    
    return Math.round(score * 10) / 10; // Round to 1 decimal place
  },
};

export default api;