// src/services/adminService.js
import api from "./api";

const adminService = {
  sendInvitation: (data) => api.post("/admin/invitations", data),
  getInvitations: (data) => api.get("/admin/invitations", data),
  updateInvitation: (id, data) => api.put(`/admin/invitations/${id}`, data),
  deleteInvitation: (id) => api.delete(`/admin/invitations/${id}`),
  getUsers: () => api.get("/admin/users"),
  createPrivilegedUser: (data) => api.post("/admin/users", data),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  getPendingApprovals: () => api.get("/admin/approvals"),
  approveUser: (userId) => api.put(`/admin/approvals/${userId}`),

  // Notification methods aligned with backend
  sendNotification: (data) => api.post("/notifications/send", data),
  sendBulkNotifications: (data) => api.post("/notifications/send/bulk", data),
  getAdminNotifications: (params = {}) => {
    console.log(
      "[API] Making GET request to /notifications/admin with params:",
      params
    );
    return api
      .get("/notifications/admin", { params })
      .then((response) => {
        console.log("[API] Received response:", {
          status: response.status,
          data: response.data,
          headers: response.headers,
        });
        return response;
      })
      .catch((error) => {
        console.error("[API] Error fetching notifications:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw error;
      });
  },
  getNotificationStats: () => api.get("/notifications/stats"),
  getUserNotifications: (userId, params = {}) =>
    api.get(`/notifications/user/${userId}`, { params }),
  adminDeleteNotification: (id) => api.delete(`/notifications/admin/${id}`),
  markAllAsRead: () => api.patch("/notifications/read-all"),

  // Template management
  getTemplates: () => api.get("/notifications/templates"),
  createTemplate: (data) => api.post("/notifications/templates", data),
  updateTemplate: (id, data) => api.put(`/notifications/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/notifications/templates/${id}`),

  // User preferences (admin can manage other users' preferences)
  getUserPreferences: (userId) =>
    api.get(`/notifications/preferences/${userId}`),
  updateUserPreferences: (userId, data) =>
    api.put(`/notifications/preferences/${userId}`, data),
};

export default adminService;
