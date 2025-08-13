import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import notificationService from "../../services/notificationService";
import NotificationList from "./components/notification/NotificationList";
import NotificationStats from "./components/notification/NotificationStats";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";

// Import the enhanced components we just created
import SendNotificationForm from "./components/notification/SendNotificationForm";
import SendBulkNotificationForm from "./components/notification/SendBulkNotificationForm";
import NotificationTemplates from "./components/notification/NotificationTemplates";
import UserPreferencesManager from "./components/notification/UserPreferencesManager";

export default function NotificationManagementPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      const res = await notificationService.getAdminNotifications({
        page: currentPage,
        limit: 10,
      });
      const extracted = extractNotifications(res);
      setTotalPages(res.data?.data?.pagination?.pages || 1);
      return extracted;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error(`Failed to load notifications: ${error.message}`);
      return [];
    }
  }, [extractNotifications, currentPage]);

  const fetchUsers = useCallback(async () => {
    try {
      const usersRes = await adminService.getUsers();
      const fetchedUsers = Array.isArray(usersRes?.data?.data?.users)
        ? usersRes.data.data.users
        : [];
      return fetchedUsers;
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(`Failed to load users: ${error.message}`);
      return [];
    }
  }, []);

  const fetchStaffProfiles = useCallback(async () => {
    try {
      const response = await adminService.getStaffProfiles();
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch staff profiles:", error);
      return [];
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await notificationService.getTemplates();
      const items = Array.isArray(res) ? res : [];
      return items;
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error(`Failed to load templates: ${error.message}`);
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Always fetch users and staff profiles for forms
        const [fetchedUsers, fetchedStaffProfiles] = await Promise.all([
          fetchUsers(),
          fetchStaffProfiles(),
        ]);
        
        if (isMounted) {
          setUsers(fetchedUsers);
          setStaffProfiles(fetchedStaffProfiles);
        }

        // Fetch data based on active tab
        if (["all", "system", "user"].includes(activeTab)) {
          const extracted = await fetchNotifications();
          if (isMounted) setNotifications(extracted);
        }

        if (activeTab === "all") {
          try {
            const statsRes = await notificationService.getNotificationStats({
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

        if (["send", "bulk-send", "templates"].includes(activeTab)) {
          try {
            const fetchedTemplates = await fetchTemplates();
            if (isMounted) {
              setTemplates(fetchedTemplates);
            }
          } catch (error) {
            if (error.name !== "AbortError" && isMounted) {
              toast.error(`Failed to load templates: ${error.message}`);
              setTemplates([]);
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
  }, [activeTab, currentPage, fetchNotifications, fetchTemplates, fetchUsers, fetchStaffProfiles]);

  const handleSendNotification = async (notificationData) => {
    try {
      setIsLoading(true);
      await notificationService.sendNotification(notificationData);
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
      await notificationService.sendBulkNotifications(bulkData);
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
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      toast.error(`Failed to mark notifications as read: ${error.message}`);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.adminDeleteNotification(id);
      toast.success("Notification deleted successfully");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      toast.error(`Failed to delete notification: ${error.message}`);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await notificationService.createTemplate(templateData);
      toast.success("Template created successfully");
      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      toast.error(`Failed to create template: ${error.message}`);
    }
  };

  const handleUpdateTemplate = async (id, templateData) => {
    try {
      await notificationService.updateTemplate(id, templateData);
      toast.success("Template updated successfully");
      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      toast.error(`Failed to update template: ${error.message}`);
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await notificationService.deleteTemplate(id);
      toast.success("Template deleted successfully");
      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      toast.error(`Failed to delete template: ${error.message}`);
    }
  };

  const filteredNotifications = useCallback(() => {
    if (!Array.isArray(notifications)) {
      console.log("Notifications is not an array:", notifications);
      return [];
    }

    let filtered = [...notifications];

    // Filter by tab
    if (activeTab === "system") {
      filtered = filtered.filter((n) => n.type === "booking_confirmation");
    } else if (activeTab === "user") {
      filtered = filtered.filter((n) => n.type === "task_assigned");
    } else if (activeTab === "user-notifications" && selectedUser) {
      filtered = filtered.filter((n) => n.userId === selectedUser);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((n) => {
        const titleMatch = n.title?.toLowerCase()?.includes(query) || false;
        const messageMatch = n.message?.toLowerCase()?.includes(query) || false;
        const emailMatch = n.userEmail?.toLowerCase()?.includes(query) || false;
        return titleMatch || messageMatch || emailMatch;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField] ?? "";
      let bValue = b[sortField] ?? "";
      if (sortField === "createdAt") {
        aValue = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        bValue = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      }
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [notifications, activeTab, selectedUser, searchQuery, sortField, sortOrder]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

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
                  setCurrentPage(1);
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
              {["all", "system", "user", "user-notifications"].includes(activeTab) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSortChange("createdAt")}
                        className={`px-3 py-1 text-sm rounded ${
                          sortField === "createdAt"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        Date {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSortChange("title")}
                        className={`px-3 py-1 text-sm rounded ${
                          sortField === "title"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        Title {sortField === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      {activeTab !== "system" && (
                        <button
                          onClick={() => handleSortChange("userEmail")}
                          className={`px-3 py-1 text-sm rounded ${
                            sortField === "userEmail"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          User {sortField === "userEmail" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {["all", "system", "user", "user-notifications"].includes(activeTab) && (
                <NotificationList
                  key={`${activeTab}-${searchQuery}-${selectedUser}-${sortField}-${sortOrder}`}
                  notifications={filteredNotifications()}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  onDelete={handleDeleteNotification}
                  onMarkAllRead={activeTab === "all" ? handleMarkAllAsRead : undefined}
                />
              )}

              {activeTab === "templates" && (
                <NotificationTemplates
                  templates={templates}
                  onCreate={handleCreateTemplate}
                  onUpdate={handleUpdateTemplate}
                  onDelete={handleDeleteTemplate}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "send" && (
                <SendNotificationForm
                  users={users}
                  onSubmit={handleSendNotification}
                  templates={templates}
                  staffProfiles={staffProfiles}
                />
              )}

              {activeTab === "bulk-send" && (
                <SendBulkNotificationForm
                  onSubmit={handleSendBulkNotifications}
                  templates={templates}
                  users={users}
                  staffProfiles={staffProfiles}
                />
              )}

              {activeTab === "preferences" && (
                <UserPreferencesManager
                  users={users}
                  staffProfiles={staffProfiles}
                  onUpdatePreferences={() => {
                    // Refresh data if needed
                    toast.success("Preferences updated successfully");
                  }}
                />
              )}

              {activeTab === "user-notifications" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">User Notifications</h3>
                  <select
                    className="border rounded p-2 mb-4 w-full max-w-md dark:bg-gray-800 dark:border-gray-700"
                    onChange={(e) => {
                      setSelectedUser(e.target.value);
                      setCurrentPage(1);
                    }}
                    value={selectedUser || ""}
                  >
                    <option value="">Select a user</option>
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user) => {
                        const staffProfile = user.role === "staff" 
                          ? staffProfiles.find(profile => profile.userId === (user.id || user._id))
                          : null;
                        
                        return (
                          <option key={user.id || user._id} value={user.id || user._id}>
                            {user.email} ({user.name || "No Name"}) - {user.role}
                            {staffProfile?.department && ` - ${staffProfile.department}`}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>No users available</option>
                    )}
                  </select>
                  <NotificationList
                    notifications={filteredNotifications()}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={(page) => setCurrentPage(page)}
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