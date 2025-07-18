import api from "./api";

const adminService = {
  sendInvitation: (data) => api.post("/admin/invitations", data),
  getInvitations: (params = {}) => api.get("/admin/invitations", params),
  updateInvitation: (id, data) => api.put(`/admin/invitations/${id}`, data),
  deleteInvitation: (id) => api.delete(`/admin/invitations/${id}`),
  getUsers: () => api.get("/admin/users"),
  createPrivilegedUser: (data) => api.post("/admin/users", data),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  getPendingApprovals: () => api.get("/admin/approvals"),
  approveUser: (userId) => api.put(`/admin/approvals/${userId}`),
};

export default adminService;
