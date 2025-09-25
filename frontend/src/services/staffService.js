// 📁 frontend/src/services/staffService.js
import api from './api.js';

// Task Management
export const staffService = {
  // Get all tasks with filtering
  getTasks: async (params = {}) => {
    const response = await api.get('/staff/tasks', { params });
    return response.data;
  },

  // Get tasks for current user
  getMyTasks: async (params = {}) => {
    const response = await api.get('/staff/tasks/my', { params });
    return response.data;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await api.post('/staff/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTaskStatus: async (taskId, updateData) => {
    const response = await api.put(`/staff/tasks/${taskId}/status`, updateData);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/staff/tasks/${taskId}`);
    return response.data;
  },

  // Add note to task
  addTaskNote: async (taskId, noteContent) => {
    const response = await api.post(`/staff/tasks/${taskId}/notes`, {
      content: noteContent
    });
    return response.data;
  },

  // Get task statistics
  getTaskStats: async (params = {}) => {
    const response = await api.get('/staff/tasks/stats', { params });
    return response.data;
  },

  // Notification Management
  // Get notifications for current user
  getNotifications: async (params = {}) => {
    const response = await api.get('/staff/notifications', { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/staff/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async (params = {}) => {
    const response = await api.put('/staff/notifications/read-all', null, { params });
    return response.data;
  },

  // Acknowledge notification
  acknowledgeNotification: async (notificationId) => {
    const response = await api.put(`/staff/notifications/${notificationId}/acknowledge`);
    return response.data;
  },

  // Create announcement
  createAnnouncement: async (announcementData) => {
    const response = await api.post('/staff/notifications/announcement', announcementData);
    return response.data;
  },

  // Get notification statistics
  getNotificationStats: async (params = {}) => {
    const response = await api.get('/staff/notifications/stats', { params });
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/staff/notifications/${notificationId}`);
    return response.data;
  },

  // Get urgent alerts
  getUrgentAlerts: async (params = {}) => {
    const response = await api.get('/staff/notifications/urgent', { params });
    return response.data;
  },

  // Staff Profile Management
  // Get current user's staff profile
  getMyProfile: async () => {
    const response = await api.get('/staff/profile');
    return response.data;
  },

  // Update current user's staff profile
  updateMyProfile: async (profileData) => {
    const response = await api.put('/staff/profile', profileData);
    return response.data;
  },

  // Upload current user's profile photo
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/staff/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get colleagues
  getColleagues: async (params = {}) => {
    const response = await api.get('/staff/colleagues', { params });
    return response.data;
  },

  // Get specific colleague profile
  getColleagueProfile: async (staffId) => {
    const response = await api.get(`/staff/colleagues/${staffId}`);
    return response.data;
  },

  // Schedule Management
  // Get current user's schedule
  getMySchedule: async (params = {}) => {
    const response = await api.get('/staff/schedule', { params });
    return response.data;
  },

  // Get weekly schedule
  getWeeklySchedule: async (params = {}) => {
    const response = await api.get('/staff/schedule/week', { params });
    return response.data;
  },

  // Update availability
  updateAvailability: async (availabilityData) => {
    const response = await api.put('/staff/schedule/availability', availabilityData);
    return response.data;
  },

  // Accept handoff
  acceptHandoff: async (taskId) => {
    const response = await api.post(`/staff/tasks/${taskId}/accept-handoff`);
    return response.data;
  }
};

// Department-specific task categories
export const taskCategories = {
  maintenance: [
    { value: "electrical", label: "Electrical" },
    { value: "plumbing", label: "Plumbing" },
    { value: "hvac", label: "HVAC" },
    { value: "appliance", label: "Appliance" },
    { value: "structural", label: "Structural" },
    { value: "general", label: "General" }
  ],
  kitchen: [
    { value: "food_preparation", label: "Food Preparation" },
    { value: "cooking", label: "Cooking" },
    { value: "cleaning", label: "Cleaning" },
    { value: "inventory", label: "Inventory" },
    { value: "equipment", label: "Equipment" }
  ],
  service: [
    { value: "guest_request", label: "Guest Request" },
    { value: "room_service", label: "Room Service" },
    { value: "concierge", label: "Concierge" },
    { value: "transportation", label: "Transportation" },
    { value: "event", label: "Event" }
  ],
  cleaning: [
    { value: "cleaning", label: "Cleaning" },
    { value: "laundry", label: "Laundry" },
    { value: "restocking", label: "Restocking" },
    { value: "inspection", label: "Inspection" },
    { value: "deep_cleaning", label: "Deep Cleaning" }
  ]
};

// Task status options
export const taskStatusOptions = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "process", label: "Process", color: "orange" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "handoff_pending", label: "Handoff Pending", color: "purple" },
  { value: "handoff_accepted", label: "Handoff Accepted", color: "blue" }
];

// Priority options
export const priorityOptions = [
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "yellow" },
  { value: "high", label: "High", color: "orange" },
  { value: "urgent", label: "Urgent", color: "red" }
];

// Location options
export const locationOptions = [
  { value: "room", label: "Room" },
  { value: "kitchen", label: "Kitchen" },
  { value: "lobby", label: "Lobby" },
  { value: "gym", label: "Gym" },
  { value: "pool", label: "Pool" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Other" }
];

// Notification types
export const notificationTypes = [
  { value: "task_assigned", label: "Task Assigned" },
  { value: "task_updated", label: "Task Updated" },
  { value: "task_completed", label: "Task Completed" },
  { value: "urgent_alert", label: "Urgent Alert" },
  { value: "system_announcement", label: "System Announcement" },
  { value: "reminder", label: "Reminder" }
];

// Department configuration
export const departmentConfig = {
  maintenance: {
    name: "Maintenance",
    color: "blue",
    icon: "🔧",
    description: "Equipment repair, facility maintenance, and technical support"
  },
  kitchen: {
    name: "Kitchen",
    color: "orange",
    icon: "👨‍🍳",
    description: "Food preparation, cooking, and kitchen operations"
  },
  service: {
    name: "Service",
    color: "green",
    icon: "👔",
    description: "Guest services, concierge, and customer support"
  },
  cleaning: {
    name: "Cleaning",
    color: "purple",
    icon: "🧹",
    description: "Room cleaning, laundry, and facility maintenance"
  }
};

// Utility functions
export const staffUtils = {
  // Format task duration
  formatDuration: (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  },

  // Format timestamp
  formatTimestamp: (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  },

  // Get status color
  getStatusColor: (status) => {
    const statusMap = {
      pending: "yellow",
      process: "orange",
      completed: "green",
      handoff_pending: "purple",
      handoff_accepted: "blue"
    };
    return statusMap[status] || "gray";
  },

  // Get priority color
  getPriorityColor: (priority) => {
    const priorityMap = {
      low: "green",
      medium: "yellow",
      high: "orange",
      urgent: "red"
    };
    return priorityMap[priority] || "gray";
  },

  // Validate task data
  validateTaskData: (taskData) => {
    const errors = [];

    if (!taskData.title?.trim()) {
      errors.push("Task title is required");
    }

    if (!taskData.description?.trim()) {
      errors.push("Task description is required");
    }

    if (!taskData.category) {
      errors.push("Task category is required");
    }

    if (!taskData.location) {
      errors.push("Task location is required");
    }

    if (taskData.estimatedDuration && taskData.estimatedDuration < 0) {
      errors.push("Estimated duration must be positive");
    }

    return errors;
  },

  // Generate task summary
  generateTaskSummary: (tasks) => {
    const summary = {
      total: tasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      urgent: 0,
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      byCategory: {}
    };

    tasks.forEach(task => {
      summary[task.status] = (summary[task.status] || 0) + 1;
      summary.byPriority[task.priority] = (summary.byPriority[task.priority] || 0) + 1;
      summary.byCategory[task.category] = (summary.byCategory[task.category] || 0) + 1;
      
      if (task.isUrgent) {
        summary.urgent++;
      }
    });

    return summary;
  }
};

export default staffService; 