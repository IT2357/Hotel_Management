// src/services/adminService.js
import api from "./api";

const adminService = {
  // User management
  getUsers: (params) => api.get("/admin/users", { params }),
  createPrivilegedUser: (data) => api.post("/admin/users", data),
  updateUserRole: (userId, data) =>
    api.put(`/admin/users/${userId}/role`, data),
  deactivateUser: (userId, data) =>
    api.put(`/admin/users/${userId}/deactivate`, data),
  reactivateUser: (userId) => api.put(`/admin/users/${userId}/reactivate`),
  deleteUser: (userId, data) => api.delete(`/admin/users/${userId}`, { data }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}/details`),
  updateUserProfile: (userId, data) =>
    api.put(`/admin/users/${userId}/profile`, data),
  getUserActivity: (userId, params) =>
    api.get(`/admin/users/${userId}/activity`, { params }),
  resetUserPassword: (userId, data) =>
    api.put(`/admin/users/${userId}/reset-password`, data),
  updateUserPassword: (userId, data) =>
    api.post(`/users/${userId}/update-password`, data),
  getPendingApprovals: () => api.get("/admin/approvals"),
  approveUser: (userId, data) => api.put(`/admin/approvals/${userId}`, data),
  getDashboardStats: () => api.get("/admin/dashboard/stats"),

  async getStaffProfiles() {
    try {
      const response = await api.get("/admin/staff-profiles");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch staff profiles:", error);
      throw error;
    }
  },

  // Invitation management
  sendInvitation: (data) => api.post("/admin/invitations", data),
  getInvitations: (data) => api.get("/admin/invitations", data),
  updateInvitation: (id, data) => api.put(`/admin/invitations/${id}`, data),
  deleteInvitation: (id) => api.delete(`/admin/invitations/${id}`),

  // Refund management
  getPendingRefunds: () => api.get("/admin/refunds/pending"),
  getRefunds: (params = {}) => api.get("/admin/refunds", { params }),
  getRefundDetails: (id) => api.get(`/admin/refunds/${id}`),
  approveRefund: (id) => api.post(`/admin/refunds/${id}/approve`),
  denyRefund: (id, reason) => api.post(`/admin/refunds/${id}/deny`, { reason }),
  requestMoreInfo: (id, message) =>
    api.post(`/admin/refunds/${id}/request-info`, { infoRequested: message }),
  processRefund: (id, originalPaymentId) =>
    api.post(`/admin/payment-gateway/refund`, {
      id,
      originalPaymentId,
    }),
  checkRefundStatus: (id) => api.get(`/admin/refunds/${id}/status`),

  // Admin Settings
  getAdminSettings: () => api.get("/admin/settings"),
  getSettingsByCategory: (category) => api.get(`/admin/settings/${category}`),
  updateAdminSettings: (data) => api.put("/admin/settings", data),
  testEmailConfig: (data) => api.post("/admin/settings/test-email", data),
  testSMSConfig: (data) => api.post("/admin/settings/test-sms", data),
  testSocialAuthConfig: (data) => api.post("/admin/settings/test-social-auth", data),
  backupSettings: () => api.get("/admin/settings/backup/download"),
  restoreSettings: (data) => api.post("/admin/settings/restore", data),
  resetToDefaults: () => api.post("/admin/settings/reset"),
  validatePaymentGateway: (data) => api.post("/admin/settings/validate-payment", data),
};

export default adminService;
