import React, { useState, useEffect, useMemo, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../../../context/AuthContext";
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Spinner from "../../../../components/ui/Spinner";

export default function SendNotificationForm({ users, onSubmit, templates, staffProfiles = [] }) {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    userId: "",
    type: "",
    channel: "",
    title: "",
    message: "",
    priority: "medium",
  });

  const [metadata, setMetadata] = useState({ 
    types: [], 
    channels: [],
    priorities: ["low", "medium", "high", "critical"]
  });
  
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);

  // Fetch notification metadata with authentication
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get("/api/notifications/metadata", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setMetadata({
            types: response.data.types,
            channels: response.data.channels,
            priorities: ["low", "medium", "high", "critical"]
          });
        }
      } catch (error) {
        console.error("Failed to load notification metadata:", error);
        
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          logout();
          return;
        }

        toast.error("Failed to load notification options. Using default values.");
        
        // Fallback data if API fails
        setMetadata({
          types: [
            "system", "alert", "promotional",
            "booking_confirmation", "payment_receipt",
            "task_assigned", "shift_scheduled",
            "admin_message"
          ],
          channels: ["email", "inApp", "sms", "push"],
          priorities: ["low", "medium", "high", "critical"]
        });
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, [logout]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get departments based on staff profiles
  const departments = useMemo(() => {
    const availableDepartments = ["Housekeeping", "Kitchen", "Maintenance", "Service"];
    const activeDepartments = staffProfiles
      .filter(profile => profile.department && availableDepartments.includes(profile.department))
      .map(profile => profile.department);
    return [...new Set(activeDepartments)].sort();
  }, [staffProfiles]);

  // Filter users based on search, role, and department
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(user => {
      const matchesSearch = !searchQuery.trim() || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      let matchesDepartment = true;
      if (departmentFilter !== "all" && user.role === "staff") {
        const staffProfile = staffProfiles.find(profile => 
          profile.userId === (user.id || user._id)
        );
        matchesDepartment = staffProfile?.department === departmentFilter;
      }
      
      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [users, searchQuery, roleFilter, departmentFilter, staffProfiles]);

  // Filter notification types based on selected user's role
  const filteredTypes = useMemo(() => {
    if (!selectedUserInfo) return metadata.types;
    
    const role = selectedUserInfo.role;
    const roleSpecificTypes = {
      guest: [
        "booking_confirmation", "payment_receipt", "payment_failed",
        "checkin_reminder", "checkout_reminder", "food_order_confirmation",
        "food_order_ready", "service_request_update", "cancellation_confirmation",
        "refund_update", "review_request"
      ],
      staff: [
        "task_assigned", "task_reminder", "task_overdue", "shift_scheduled",
        "shift_reminder", "shift_change", "manager_message", "emergency_alert"
      ],
      manager: [
        "staff_alert", "guest_complaint", "system_alert", "inventory_alert",
        "high_occupancy_alert"
      ],
      admin: [
        "system_error", "security_alert", "financial_alert", "audit_log",
        "admin_activity"
      ]
    };
    
    return metadata.types.filter(type => 
      roleSpecificTypes[role]?.includes(type) || 
      ["system", "alert", "promotional"].includes(type)
    );
  }, [metadata.types, selectedUserInfo]);

  // Apply template when selected
  const handleTemplateChange = (templateId) => {
    if (!templateId) return;
    
    const template = Array.isArray(templates)
      ? templates.find((t) => t._id === templateId)
      : null;
      
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.subject || "",
        message: template.body || "",
        type: template.type || "",
        channel: template.channel || "",
        priority: template.defaultPriority || "medium"
      }));
      toast.success("Template applied successfully");
    } else {
      toast.warn("Selected template not found");
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    const staffProfile = staffProfiles.find(profile => 
      profile.userId === (user.id || user._id)
    );
    
    setFormData(prev => ({
      ...prev,
      userId: user.id || user._id,
      type: "", // Reset type when user changes
      channel: "" // Reset channel when user changes
    }));
    
    setSelectedUserInfo({
      ...user,
      department: staffProfile?.department
    });
    setSearchQuery("");
    setShowUserDropdown(false);
    toast.success(`Selected user: ${user.name || user.email}`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId) {
      toast.error("Please select a user");
      return;
    }
    
    if (!formData.type) {
      toast.error("Please select a notification type");
      return;
    }
    
    if (!formData.channel) {
      toast.error("Please select a delivery channel");
      return;
    }
    
    try {
      setIsSending(true);
      const token = localStorage.getItem("token");
      
      await onSubmit({
        ...formData,
        userType: selectedUserInfo.role
      }, token);
      
      // Reset form on success
      setFormData({
        userId: "",
        type: "",
        channel: "",
        title: "",
        message: "",
        priority: "medium",
      });
      setSelectedUserInfo(null);
      setSearchQuery("");
      setRoleFilter("all");
      setDepartmentFilter("all");
    } catch (error) {
      console.error("Send notification error:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
      } else {
        toast.error(error.response?.data?.message || "Failed to send notification");
      }
    } finally {
      setIsSending(false);
    }
  };

  const clearUserSelection = () => {
    setFormData(prev => ({
      ...prev,
      userId: "",
      type: "",
      channel: ""
    }));
    setSelectedUserInfo(null);
    setSearchQuery("");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowUserDropdown(value.length > 0);
    if (!value) {
      clearUserSelection();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* User Selection Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Select User</h3>
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="guest">Guest</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
          
          {roleFilter === "staff" && (
            <Select
              label="Department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
          )}
        </div>

        {/* User Search */}
        <div className="relative user-search-container">
          <Input
            label="Search Users"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowUserDropdown(true)}
          />
          
          {selectedUserInfo && (
            <button
              type="button"
              onClick={clearUserSelection}
              className="absolute right-2 top-8 sm:top-9 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear selection"
            >
              ✕
            </button>
          )}
          
          {/* User Dropdown */}
          {showUserDropdown && searchQuery && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 10).map((user) => {
                  const staffProfile = staffProfiles.find(profile => 
                    profile.userId === (user.id || user._id)
                  );
                  
                  return (
                    <div
                      key={user.id || user._id}
                      onClick={() => handleUserSelect(user)}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium truncate">
                        {user.name || "No Name"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Role: {user.role}
                        {user.role === "staff" && staffProfile?.department && 
                          ` | Dept: ${staffProfile.department}`
                        }
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-gray-500 text-center">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Selected User Display */}
        {selectedUserInfo && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
            <div className="text-sm">
              <span className="font-medium">Selected: </span>
              <span>{selectedUserInfo.name || "No Name"}</span>
              <span className="text-gray-600 dark:text-gray-300">
                ({selectedUserInfo.email}) - {selectedUserInfo.role}
                {selectedUserInfo.department && ` - ${selectedUserInfo.department}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Template Selection */}
      <Select
        label="Template (Optional)"
        onChange={(e) => handleTemplateChange(e.target.value)}
        value=""
      >
        <option value="">Select Template (optional)</option>
        {Array.isArray(templates) && templates.length > 0 ? (
          templates.map((template) => (
            <option key={template._id} value={template._id}>
              {template.name || template.subject || "Unnamed Template"}
            </option>
          ))
        ) : (
          <option disabled>No templates available</option>
        )}
      </Select>

      {/* Notification Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Select
          label="Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
          disabled={loadingMeta || !selectedUserInfo}
        >
          <option value="">Select Type</option>
          {loadingMeta ? (
            <option disabled>Loading types...</option>
          ) : (
            filteredTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))
          )}
        </Select>
        
        <Select
          label="Channel"
          value={formData.channel}
          onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
          required
          disabled={loadingMeta}
        >
          <option value="">Select Channel</option>
          {loadingMeta ? (
            <option disabled>Loading channels...</option>
          ) : (
            metadata.channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel === "inApp" ? "In-App" : channel.charAt(0).toUpperCase() + channel.slice(1)}
              </option>
            ))
          )}
        </Select>
        
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          {metadata.priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        placeholder="Enter notification title"
      />

      <Textarea
        label="Message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        rows={4}
        required
        placeholder="Enter notification message"
      />

      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSubmit} 
          disabled={isSending || !formData.userId || !formData.type || !formData.channel || !formData.title || !formData.message}
        >
          {isSending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Sending...
            </>
          ) : (
            "Send Notification"
          )}
        </Button>
      </div>
    </div>
  );
}