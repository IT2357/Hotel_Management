import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { Select } from "../../../../components/ui/select";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import Spinner from "../../../../components/ui/Spinner";

export default function UserPreferencesManager({ 
  users = [], 
  onUpdatePreferences,
  staffProfiles = []
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState(null);

  // Filter users for selection
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Default preferences based on user role
  const getDefaultPreferences = (userRole) => {
    // Base preferences that apply to all users
    const basePreferences = {
      test_notification: { email: false, inApp: true, sms: false },
      admin_message: { email: true, inApp: true, sms: false },
    };

    // Guest-specific preferences
    if (userRole === "guest") {
      return {
        ...basePreferences,
        booking_confirmation: { email: true, inApp: true, sms: false },
        payment_receipt: { email: true, inApp: true, sms: false },
        payment_failed: { email: true, inApp: true, sms: true },
        checkin_reminder: { email: true, inApp: true, sms: true },
        checkout_reminder: { email: false, inApp: true, sms: false },
        food_order_confirmation: { email: false, inApp: true, sms: false },
        food_order_ready: { email: false, inApp: true, sms: false },
        service_request_update: { email: false, inApp: true, sms: false },
        cancellation_confirmation: { email: true, inApp: true, sms: false },
        refund_update: { email: true, inApp: true, sms: false },
        review_request: { email: true, inApp: true, sms: false },
      };
    }

    // Staff-specific preferences
    if (userRole === "staff") {
      return {
        ...basePreferences,
        task_assigned: { email: true, inApp: true, sms: true },
        task_reminder: { email: false, inApp: true, sms: true },
        task_overdue: { email: true, inApp: true, sms: true },
        shift_scheduled: { email: true, inApp: true, sms: true },
        shift_reminder: { email: false, inApp: true, sms: true },
        shift_change: { email: true, inApp: true, sms: true },
        manager_message: { email: true, inApp: true, sms: true },
        emergency_alert: { email: true, inApp: true, sms: true },
      };
    }

    // Manager-specific preferences
    if (userRole === "manager") {
      return {
        ...basePreferences,
        task_assigned: { email: true, inApp: true, sms: true },
        task_reminder: { email: false, inApp: true, sms: true },
        task_overdue: { email: true, inApp: true, sms: true },
        shift_scheduled: { email: true, inApp: true, sms: true },
        shift_reminder: { email: false, inApp: true, sms: true },
        shift_change: { email: true, inApp: true, sms: true },
        manager_message: { email: true, inApp: true, sms: true },
        emergency_alert: { email: true, inApp: true, sms: true },
        staff_alert: { email: true, inApp: true, sms: true },
        guest_complaint: { email: true, inApp: true, sms: true },
        system_alert: { email: true, inApp: true, sms: true },
        inventory_alert: { email: true, inApp: true, sms: false },
        high_occupancy_alert: { email: true, inApp: true, sms: true },
      };
    }

    // Admin-specific preferences
    if (userRole === "admin") {
      return {
        ...basePreferences,
        system_error: { email: true, inApp: true, sms: true },
        security_alert: { email: true, inApp: true, sms: true },
        financial_alert: { email: true, inApp: true, sms: true },
        audit_log: { email: false, inApp: true, sms: false },
        admin_activity: { email: false, inApp: true, sms: false },
        staff_alert: { email: true, inApp: true, sms: true },
        guest_complaint: { email: true, inApp: true, sms: true },
        system_alert: { email: true, inApp: true, sms: true },
        inventory_alert: { email: true, inApp: true, sms: false },
        high_occupancy_alert: { email: true, inApp: true, sms: true },
      };
    }

    // Fallback for unknown roles
    return basePreferences;
  };

  // Fetch user preferences
  const fetchUserPreferences = async (userId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      const data = await response.json();
      
      if (data.success && data.data?.preferences) {
        const prefs = data.data.preferences;
        setPreferences(prefs);
        setOriginalPreferences(JSON.parse(JSON.stringify(prefs)));
      } else {
        // Create default preferences if none exist
        const user = users.find(u => (u.id || u._id) === userId);
        if (user) {
          const defaultPrefs = getDefaultPreferences(user.role);
          setPreferences(defaultPrefs);
          setOriginalPreferences(JSON.parse(JSON.stringify(defaultPrefs)));
        }
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error(`Failed to load preferences: ${error.message}`);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Save preferences
  const handleSave = async () => {
    if (!selectedUser || !preferences) {
      toast.error("No user or preferences selected");
      return;
    }

    try {
      setIsSaving(true);
      // Get user info to include userType
      const user = users.find(u => (u.id || u._id) === selectedUser);
      if (!user) {
        throw new Error("User not found");
      }

      const response = await fetch(`/api/notifications/preferences/${selectedUser}?userType=${user.role}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update preferences');
      }

      toast.success("Preferences updated successfully");
      setHasChanges(false);
      setOriginalPreferences(JSON.parse(JSON.stringify(preferences)));
      
      if (onUpdatePreferences) {
        onUpdatePreferences();
      }
    } catch (error) {
      console.error("Save preferences error:", error);
      toast.error(`Failed to update preferences: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset preferences to original
  const handleReset = () => {
    if (originalPreferences) {
      setPreferences(JSON.parse(JSON.stringify(originalPreferences)));
      setHasChanges(false);
    }
  };

  // Reset to defaults
  const handleResetToDefaults = () => {
    const user = users.find(u => (u.id || u._id) === selectedUser);
    if (user) {
      const defaultPrefs = getDefaultPreferences(user.role);
      setPreferences(defaultPrefs);
      setHasChanges(true);
    }
  };

  // Handle preference change
  const handlePreferenceChange = (notificationType, channel, value) => {
    const newPreferences = {
      ...preferences,
      [notificationType]: {
        ...preferences[notificationType],
        [channel]: value,
      },
    };
    setPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(originalPreferences));
  };

  // Handle user selection
  const handleUserChange = (userId) => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to switch users?"
      );
      if (!confirmed) return;
    }

    setSelectedUser(userId);
    setPreferences(null);
    setOriginalPreferences(null);
    setHasChanges(false);
    
    if (userId) {
      fetchUserPreferences(userId);
    }
  };

  // Toggle all channels for a notification type
  const toggleAllChannels = (notificationType, enabled) => {
    const newPreferences = {
      ...preferences,
      [notificationType]: {
        email: enabled,
        inApp: enabled,
        sms: enabled,
      },
    };
    setPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(originalPreferences));
  };

  // Get user info with department if staff
  const getSelectedUserInfo = () => {
    if (!selectedUser) return null;
    
    const user = users.find(u => (u.id || u._id) === selectedUser);
    if (!user) return null;

    const staffProfile = user.role === "staff" 
      ? staffProfiles.find(profile => profile.userId === selectedUser)
      : null;

    return {
      ...user,
      department: staffProfile?.department,
    };
  };

  const selectedUserInfo = getSelectedUserInfo();

  // Group notification types by category
  const notificationCategories = useMemo(() => {
    if (!preferences || !selectedUserInfo) return {};
  
    const baseCategories = {
      "System": ["admin_message", "test_notification"]
    };
  
    if (selectedUserInfo.role === "guest") {
      return {
        ...baseCategories,
        "Guest Services": [
          "booking_confirmation", "payment_receipt", "payment_failed", 
          "checkin_reminder", "checkout_reminder", "food_order_confirmation",
          "food_order_ready", "service_request_update", "cancellation_confirmation",
          "refund_update", "review_request"
        ]
      };
    }
  
    if (selectedUserInfo.role === "staff") {
      return {
        ...baseCategories,
        "Staff Operations": [
          "task_assigned", "task_reminder", "task_overdue", 
          "shift_scheduled", "shift_reminder", "shift_change",
          "manager_message", "emergency_alert"
        ]
      };
    }
  
    if (selectedUserInfo.role === "manager") {
      return {
        ...baseCategories,
        "Staff Operations": [
          "task_assigned", "task_reminder", "task_overdue", 
          "shift_scheduled", "shift_reminder", "shift_change",
          "manager_message", "emergency_alert"
        ],
        "Management": [
          "staff_alert", "guest_complaint", "system_alert", 
          "inventory_alert", "high_occupancy_alert"
        ]
      };
    }
  
    if (selectedUserInfo.role === "admin") {
      return {
        ...baseCategories,
        "Administration": [
          "system_error", "security_alert", "financial_alert", 
          "audit_log", "admin_activity"
        ],
        "Management": [
          "staff_alert", "guest_complaint", "system_alert", 
          "inventory_alert", "high_occupancy_alert"
        ]
      };
    }
  
    return baseCategories;
  }, [preferences, selectedUserInfo]);

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Select User</h3>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="guest">Guest</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </div>

        {/* User Selection */}
        <Select
          label="Select User"
          value={selectedUser}
          onChange={(e) => handleUserChange(e.target.value)}
        >
          <option value="">Choose a user...</option>
          {filteredUsers.map((user) => {
            const staffProfile = user.role === "staff" 
              ? staffProfiles.find(profile => profile.userId === (user.id || user._id))
              : null;
            
            return (
              <option key={user.id || user._id} value={user.id || user._id}>
                {user.name || "No Name"} ({user.email}) - {user.role}
                {staffProfile?.department && ` - ${staffProfile.department}`}
              </option>
            );
          })}
        </Select>

        {/* Selected User Info */}
        {selectedUserInfo && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
            <div className="text-sm">
              <strong>Selected:</strong> {selectedUserInfo.name || "No Name"} ({selectedUserInfo.email})
              <br />
              <strong>Role:</strong> {selectedUserInfo.role}
              {selectedUserInfo.department && (
                <>
                  <br />
                  <strong>Department:</strong> {selectedUserInfo.department}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <Spinner size="lg" />
        </div>
      )}

      {/* Preferences Editor */}
      {preferences && !isLoading && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            <div className="space-x-2">
              <Button
                variant="secondary"
                onClick={handleResetToDefaults}
                className="text-sm"
              >
                Reset to Defaults
              </Button>
              {hasChanges && (
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  className="text-sm"
                >
                  Undo Changes
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </div>

          {/* Preferences by Category */}
          <div className="space-y-6">
            {Object.entries(notificationCategories).map(([category, types]) => (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-lg mb-4 text-gray-900 dark:text-white">
                  {category}
                </h4>
                
                <div className="space-y-4">
                  {types.map((notificationType) => {
                    const channels = preferences[notificationType];
                    if (!channels) return null;

                    return (
                      <div key={notificationType} className="border-b border-gray-100 dark:border-gray-600 pb-4 last:border-b-0">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-sm capitalize text-gray-800 dark:text-gray-200">
                            {notificationType.replace(/_/g, " ")}
                          </h5>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleAllChannels(notificationType, true)}
                              className="text-xs px-2 py-1"
                            >
                              Enable All
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleAllChannels(notificationType, false)}
                              className="text-xs px-2 py-1"
                            >
                              Disable All
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 ml-4">
                          {Object.entries(channels).map(([channel, enabled]) => (
                            <label key={channel} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) =>
                                  handlePreferenceChange(notificationType, channel, e.target.checked)
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="capitalize text-sm text-gray-700 dark:text-gray-300">
                                {channel === "inApp" ? "In-App" : channel}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Changes Indicator */}
          {hasChanges && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 dark:text-yellow-400 text-sm">
                  ⚠️ You have unsaved changes. Don't forget to save your preferences.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No User Selected */}
      {!selectedUser && !isLoading && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Select a user to view and edit their notification preferences.
        </div>
      )}

      {/* No Preferences Available */}
      {selectedUser && !preferences && !isLoading && (
        <div className="text-center text-red-500 dark:text-red-400 py-8">
          No preferences available for this user. This might indicate a system error.
        </div>
      )}
    </div>
  );
}