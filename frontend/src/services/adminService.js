// src/services/adminService.js
import api from "./api";

const adminService = {
  // User management
  getUsers: () => api.get("/admin/users"),
  createPrivilegedUser: (data) => api.post("/admin/users", data),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  getPendingApprovals: () => api.get("/admin/approvals"),
  approveUser: (userId) => api.put(`/admin/approvals/${userId}`),
  // frontend/src/services/adminService.js
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
};

export default adminService;
