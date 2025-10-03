import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import notificationService from "../../services/notificationService";
import NotificationList from "./components/notification/NotificationList";
import NotificationStats from "./components/notification/NotificationStats";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import Card from "../../components/ui/card";
import Input from "../../components/ui/input";
import Select from "../../components/ui/Select";
import useDebounce from "../../hooks/useDebounce";
import DefaultAdminLayout from "../../layout/admin/DefaultAdminLayout";

// Import the enhanced components we just created
import SendNotificationForm from "./components/notification/SendNotificationForm";
import SendBulkNotificationForm from "./components/notification/SendBulkNotificationForm";
import NotificationTemplates from "./components/notification/NotificationTemplates";
import UserPreferencesManager from "./components/notification/UserPreferencesManager";
import NotificationFilters from "./components/notification/NotificationFilters";

export default function NotificationManagementPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // New filter states
  const [filters, setFilters] = useState({
    userType: "",
    channel: "",
    priority: "",
    status: "",
    type: "",
    read: "",
  });

  const extractNotifications = useCallback((res) => {
    try {
      // res can be:
      // - an array of notifications
      // - an object with { notifications, pagination }
      // - a raw axios response (legacy)
      const responseData = Array.isArray(res)
        ? res
        : res?.notifications || res?.data?.data?.notifications || res?.data || [];

      const rawNotifications = Array.isArray(responseData)
        ? responseData
        : [];

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
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchQuery.trim() || undefined,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      };
      
      // notificationService returns the parsed data object, not the raw Axios response
      const data = await notificationService.getAdminNotifications(params);
      const extracted = extractNotifications(data?.notifications || data || []);
      setTotalPages(data?.pagination?.pages || 1);
      return extracted;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error(`Failed to load notifications: ${error.message}`);
      return [];
    }
  }, [extractNotifications, currentPage, debouncedSearchQuery, filters]);

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
        if (["overview", "notifications"].includes(activeTab)) {
          const extracted = await fetchNotifications();
          if (isMounted) setNotifications(extracted);
        }

        if (activeTab === "overview") {
          try {
            // service returns the stats object directly
            const statsRes = await notificationService.getNotificationStats();
            if (isMounted) {
              setStats(statsRes ?? null);
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
  }, [activeTab, currentPage, debouncedSearchQuery, filters, fetchNotifications, fetchTemplates, fetchUsers, fetchStaffProfiles]);

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
  }, [notifications, sortField, sortOrder]);

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

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userType: "",
      channel: "",
      priority: "",
      status: "",
      type: "",
      read: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'notifications', label: 'All Notifications', icon: '🔔' },
    { id: 'templates', label: 'Templates', icon: '📝' },
    { id: 'send', label: 'Send Notification', icon: '📤' },
    { id: 'bulk-send', label: 'Bulk Send', icon: '📨' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  return (
    <DefaultAdminLayout>
      <div className="space-y-6">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🔔 Notification Management</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user?.name?.split(" ")[0]}! Manage notifications and communication
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  const updated = await fetchNotifications();
                  setNotifications(updated);
                }}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedUser(null);
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Overview Stats */}
        {activeTab === "overview" && stats && <NotificationStats stats={stats} />}

        {/* Filter Section for notifications tabs */}
        {["overview", "notifications"].includes(activeTab) && (
          <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="🔍 Search notifications..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="w-full lg:w-64">
                <Select
                  value={filters.channel}
                  onChange={(e) => handleFilterChange('channel', e.target.value)}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Channels</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                  <option value="inApp">In-App</option>
                </Select>
              </div>
              <div className="w-full lg:w-64">
                <Select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
              <div className="w-full lg:w-64">
                <Select
                  value={filters.read}
                  onChange={(e) => handleFilterChange('read', e.target.value)}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Read</option>
                  <option value="false">Unread</option>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {["overview", "notifications"].includes(activeTab) && (
              <NotificationList
                key={`${activeTab}-${searchQuery}-${JSON.stringify(filters)}-${sortField}-${sortOrder}`}
                notifications={filteredNotifications()}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
                onDelete={handleDeleteNotification}
                onMarkAllRead={activeTab === "overview" ? handleMarkAllAsRead : undefined}
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
                  toast.success("Preferences updated successfully");
                }}
              />
            )}
          </div>
        )}
      </div>
    </DefaultAdminLayout>
  );
}