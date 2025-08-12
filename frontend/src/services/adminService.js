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

  // Invitation management
  sendInvitation: (data) => api.post("/admin/invitations", data),
  getInvitations: (data) => api.get("/admin/invitations", data),
  updateInvitation: (id, data) => api.put(`/admin/invitations/${id}`, data),
  deleteInvitation: (id) => api.delete(`/admin/invitations/${id}`),
};

export default adminService;
