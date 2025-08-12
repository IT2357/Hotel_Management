// frontend/src/services/notificationService.js
import api from "./api";

class NotificationService {
  // User notification operations
  async getMyNotifications(params = {}) {
    const response = await api.get("/notifications/my", { params });
    return response.data;
  }

  async getMyPreferences() {
    const response = await api.get("/notifications/my/preferences");
    return response.data;
  }

  async updateMyPreferences(preferences) {
    const response = await api.put(
      "/notifications/my/preferences",
      preferences
    );
    return response.data;
  }

  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  }

  async getUnreadCount() {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  }

  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Admin-only operations
  async sendNotification(data) {
    const response = await api.post("/notifications/send", data);
    return response.data;
  }

  async sendBulkNotifications(data) {
    const response = await api.post("/notifications/send/bulk", data);
    return response.data;
  }

  async getAdminNotifications(params = {}) {
    const response = await api.get("/notifications/admin", { params });
    return response.data;
  }

  async getNotificationStats() {
    const response = await api.get("/notifications/stats");
    return response.data;
  }

  async getUserNotifications(userId, params = {}) {
    const response = await api.get(`/notifications/user/${userId}`, { params });
    return response.data;
  }

  async adminDeleteNotification(notificationId) {
    const response = await api.delete(`/notifications/admin/${notificationId}`);
    return response.data;
  }

  // Template management (admin-only)
  async getTemplates(params = {}) {
    const response = await api.get("/notifications/templates", { params });
    return response.data?.data || [];
  }

  async createTemplate(templateData) {
    const response = await api.post("/notifications/templates", templateData);
    return response.data;
  }

  async updateTemplate(templateId, templateData) {
    const response = await api.put(
      `/notifications/templates/${templateId}`,
      templateData
    );
    return response.data;
  }

  async deleteTemplate(templateId) {
    const response = await api.delete(`/notifications/templates/${templateId}`);
    return response.data;
  }

  // User preference management (admin-only)
  async getUserPreferences(userId) {
    const response = await api.get(`/notifications/preferences/${userId}`);
    return response.data;
  }

  async updateUserPreferences(userId, preferences) {
    const response = await api.put(
      `/notifications/preferences/${userId}`,
      preferences
    );
    return response.data;
  }
}

export default new NotificationService();
