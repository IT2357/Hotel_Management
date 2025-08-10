import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import NotificationList from "./components/notification/NotificationList";
import NotificationStats from "./components/notification/NotificationStats";
import SendNotificationForm from "./components/notification/SendNotificationForm";
import SendBulkNotificationForm from "./components/notification/SendBulkNotificationForm";
import NotificationTemplates from "./components/notification/NotificationTemplates";
import UserPreferencesManager from "./components/notification/UserPreferencesManager";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";

export default function NotificationManagementPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]); // Initialize as empty array

  const extractNotifications = useCallback((res) => {
    try {
      const responseData = res?.data?.data || res?.data;
      const rawNotifications = Array.isArray(responseData)
        ? responseData
        : responseData?.notifications || [];
      if (!Array.isArray(rawNotifications)) {
        console.warn("Expected array of notifications but got:", rawNotifications);
        return [];
      }
      return rawNotifications.map((notification) => ({
        ...notification,
        id: notification._id || notification.id,
        userId: notification.userId?._id || notification.userId,
        userEmail: notification.userId?.email,
        userName: notification.userId?.name,
        isRead: Boolean(notification.isRead),
        daysOld: parseInt(notification.daysOld) || 0,
      }));
    } catch (error) {
      console.error("Error processing notifications:", error);
      return [];
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await adminService.getAdminNotifications();
      return extractNotifications(res);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error(`Failed to load notifications: ${error.message}`);
      return [];
    }
  }, [extractNotifications]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (["all", "system", "user"].includes(activeTab)) {
          const extracted = await fetchNotifications();
          if (isMounted) setNotifications(extracted);
        }

        if (activeTab === "all") {
          try {
            const statsRes = await adminService.getNotificationStats({
              signal: abortController.signal,
            });
            if (isMounted) {
              setStats(statsRes?.data?.data ?? statsRes?.data ?? null);
            }
          } catch (error) {
            if (error.name !== "AbortError" && isMounted) {
              toast.error(`Failed to load stats: ${error.message}`);
            }
          }
        }

        if (["preferences", "user-notifications"].includes(activeTab)) {
          try {
            const usersRes = await adminService.getUsers({
              signal: abortController.signal,
            });
            // Ensure users is always an array
            const fetchedUsers = Array.isArray(usersRes?.data?.data)
              ? usersRes.data.data
              : Array.isArray(usersRes?.data)
              ? usersRes.data
              : [];
            if (isMounted) {
              setUsers(fetchedUsers);
            }
          } catch (error) {
            if (error.name !== "AbortError" && isMounted) {
              toast.error(`Failed to load users: ${error.message}`);
            }
            if (isMounted) {
              setUsers([]); // Fallback to empty array on error
            }
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [activeTab, fetchNotifications]);

  const handleSendNotification = async (notificationData) => {
    try {
      setIsLoading(true);
      await adminService.sendNotification(notificationData);
      toast.success("Notification sent successfully");
      const updatedNotifications = await fetchNotifications();
      setNotifications(updatedNotifications);
    } catch (error) {
      toast.error(`Failed to send notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBulkNotifications = async (bulkData) => {
    try {
      setIsLoading(true);
      await adminService.sendBulkNotifications(bulkData);
      toast.success("Bulk notifications sent successfully");
      const updatedNotifications = await fetchNotifications();
      setNotifications(updatedNotifications);
    } catch (error) {
      toast.error(`Failed to send bulk notifications: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminService.markAllAsRead();
      toast.success("All notifications marked as read");
      const updatedNotifications = await fetchNotifications();
      setNotifications(updatedNotifications);
    } catch (error) {
      toast.error(`Failed to mark notifications as read: ${error.message}`);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await adminService.adminDeleteNotification(id);
      toast.success("Notification deleted successfully");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      toast.error(`Failed to delete notification: ${error.message}`);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await adminService.createTemplate(templateData);
      toast.success("Template created successfully");
    } catch (error) {
      toast.error(`Failed to create template: ${error.message}`);
    }
  };

  const filteredNotifications = useCallback(() => {
    if (!Array.isArray(notifications)) return [];

    switch (activeTab) {
      case "system":
        return notifications.filter((n) => n.type === "system");
      case "user":
        return notifications.filter((n) => n.type === "user");
      case "user-notifications":
        return selectedUser
          ? notifications.filter((n) => n.userId === selectedUser)
          : [];
      default:
        return notifications;
    }
  }, [notifications, activeTab, selectedUser]);

  const tabs = [
    "all",
    "system",
    "user",
    "templates",
    "send",
    "bulk-send",
    "preferences",
    "user-notifications",
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
          Notification Management
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Logged in as: <span className="font-medium">{user?.email}</span>
        </div>
      </div>
      {activeTab === "all" && stats && <NotificationStats stats={stats} />}
      <div className="mt-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedUser(null);
                  setActiveTab(tab);
                }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
              >
                {tab
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {["all", "system", "user"].includes(activeTab) && (
                <NotificationList
                  notifications={filteredNotifications()}
                  onDelete={handleDeleteNotification}
                  onMarkAllRead={
                    activeTab === "all" ? handleMarkAllAsRead : undefined
                  }
                />
              )}
              {activeTab === "templates" && (
                <NotificationTemplates
                  onCreate={handleCreateTemplate}
                  onUpdate={adminService.updateTemplate}
                  onDelete={adminService.deleteTemplate}
                />
              )}
              {activeTab === "send" && (
                <SendNotificationForm
                  users={Array.isArray(users) ? users : []} // Ensure users is an array
                  onSubmit={handleSendNotification}
                  templates={adminService.getTemplates}
                />
              )}
              {activeTab === "bulk-send" && (
                <SendBulkNotificationForm
                  onSubmit={handleSendBulkNotifications}
                  templates={adminService.getTemplates}
                />
              )}
              {activeTab === "preferences" && (
                <UserPreferencesManager
                  users={Array.isArray(users) ? users : []} // Ensure users is an array
                  onUpdatePreferences={adminService.updateUserPreferences}
                />
              )}
              {activeTab === "user-notifications" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">User Notifications</h3>
                  <select
                    className="border rounded p-2 mb-4 w-full max-w-md dark:bg-gray-800 dark:border-gray-700"
                    onChange={(e) => setSelectedUser(e.target.value)}
                    value={selectedUser || ""}
                  >
                    <option value="">Select a user</option>
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} ({user.name})
                        </option>
                      ))
                    ) : (
                      <option disabled>No users available</option>
                    )}
                  </select>
                  <NotificationList
                    notifications={filteredNotifications()}
                    onDelete={handleDeleteNotification}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}