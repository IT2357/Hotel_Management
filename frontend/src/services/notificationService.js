// frontend/src/services/notificationService.js
import api from "./api";

class NotificationService {
  // User notification operations
  async getMyNotifications(options = {}) {
    try {
      const params = new URLSearchParams(options);
      const response = await api.get(`/notifications/my?${params}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to get my notifications:', error.message);
      // Return empty array if service is unavailable
      return { notifications: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
  }

  async getMyPreferences() {
    try {
      const response = await api.get("/notifications/my/preferences");
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get my preferences:", error);
      throw error;
    }
  }

  async updateMyPreferences(preferences) {
    try {
      const response = await api.put(
        "/notifications/my/preferences",
        preferences
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to update my preferences:", error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to mark as read:", error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await api.patch("/notifications/read-all");
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count || 0;
    } catch (error) {
      console.warn('Failed to get unread count:', error.message);
      // Return 0 if service is unavailable
      return 0;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  }

  // Admin-only operations
  async sendNotification(data) {
    try {
      const response = await api.post("/notifications/send", data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to send notification:", error);
      throw error;
    }
  }

  async sendBulkNotifications(data) {
    try {
      const response = await api.post("/notifications/send/bulk", data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
      throw error;
    }
  }

  async getAdminNotifications(params = {}) {
    try {
      const response = await api.get("/notifications/admin", { params });
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get admin notifications:", error);
      throw error;
    }
  }

  async getNotificationStats() {
    try {
      const response = await api.get("/notifications/stats");
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get notification stats:", error);
      throw error;
    }
  }

  async getUserNotifications(userId, params = {}) {
    try {
      const response = await api.get(`/notifications/user/${userId}`, {
        params,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get user notifications:", error);
      throw error;
    }
  }

  async adminDeleteNotification(notificationId) {
    try {
      const response = await api.delete(
        `/notifications/admin/${notificationId}`
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to admin delete notification:", error);
      throw error;
    }
  }

  // Template management (admin-only)
  async getTemplates(params = {}) {
    try {
      const response = await api.get("/notifications/templates", { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Failed to get templates:", error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const response = await api.post("/notifications/templates", templateData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to create template:", error);
      throw error;
    }
  }

  async updateTemplate(templateId, templateData) {
    try {
      const response = await api.put(
        `/notifications/templates/${templateId}`,
        templateData
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to update template:", error);
      throw error;
    }
  }

  async deleteTemplate(templateId) {
    try {
      const response = await api.delete(
        `/notifications/templates/${templateId}`
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to delete template:", error);
      throw error;
    }
  }

  // User preference management (admin-only)
  async getUserPreferences(userId) {
    try {
      const response = await api.get(`/notifications/preferences/${userId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      throw error;
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const response = await api.put(
        `/notifications/preferences/${userId}`,
        preferences
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to update user preferences:", error);
      throw error;
    }
  }

  // Get notification metadata (types, channels, etc.)
  async getNotificationMetadata() {
    try {
      const response = await api.get("/notifications/metadata");
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get notification metadata:", error);
      throw error;
    }
  }
}

export default new NotificationService();
