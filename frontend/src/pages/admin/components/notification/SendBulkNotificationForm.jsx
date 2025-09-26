import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import Spinner from "../../../../components/ui/Spinner";
import useDebounce from "../../../../hooks/useDebounce";

export default function SendBulkNotificationForm({ onSubmit, templates, users = [], staffProfiles = [] }) {
  const [formData, setFormData] = useState({
    type: "admin_message",
    channel: "inApp",
    title: "",
    message: "",
    priority: "medium",
    userGroup: "all",
    specificRoles: [],
    specificDepartments: [],
    specificUsers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Missing state variables for user selection
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search query
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  // Get unique departments from staff profiles (matching your enum)
  const departments = useMemo(() => {
    const availableDepartments = ["Housekeeping", "Kitchen", "Maintenance", "Service"];
    const activeDepartments = staffProfiles
      .filter(profile => profile.department && availableDepartments.includes(profile.department))
      .map(profile => profile.department);
    return [...new Set(activeDepartments)].sort();
  }, [staffProfiles]);

  // Filter users for specific users selection
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || false;
      const emailMatch = user.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || false;
      const searchMatch = debouncedSearchQuery === "" || nameMatch || emailMatch;
      
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      
      let departmentMatch = true;
      if (roleFilter === "staff" && departmentFilter !== "all") {
        const staffProfile = staffProfiles.find(profile =>
          profile.userId === (user.id || user._id)
        );
        departmentMatch = staffProfile?.department === departmentFilter;
      }
      
      return searchMatch && roleMatch && departmentMatch;
    });
  }, [users, staffProfiles, debouncedSearchQuery, roleFilter, departmentFilter]);

  // Pagination for filtered users
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  // Calculate recipient count based on selection
  const recipientCount = useMemo(() => {
    if (!Array.isArray(users)) return 0;

    switch (formData.userGroup) {
      case "all":
        return users.length;
      
      case "specific_roles":
        return users.filter(user =>
          formData.specificRoles.includes(user.role)
        ).length;
      
      case "specific_departments":
        if (formData.specificDepartments.length === 0) return 0;
        return users.filter(user => {
          if (user.role !== "staff") return false;
          const staffProfile = staffProfiles.find(profile =>
            profile.userId === (user.id || user._id)
          );
          return staffProfile && formData.specificDepartments.includes(staffProfile.department);
        }).length;
      
      case "specific_users":
        return formData.specificUsers.length;
      
      case "active":
        return users.filter(user => user.isActive !== false).length;
      
      case "inactive":
        return users.filter(user => user.isActive === false).length;
      
      default:
        return 0;
    }
  }, [users, staffProfiles, formData.userGroup, formData.specificRoles, formData.specificDepartments, formData.specificUsers]);

  // Get list of recipients for preview
  const getRecipients = () => {
    if (!Array.isArray(users)) return [];

    switch (formData.userGroup) {
      case "all":
        return users;
      
      case "specific_roles":
        return users.filter(user => 
          formData.specificRoles.includes(user.role)
        );
      
      case "specific_departments":
        return users.filter(user => {
          if (user.role !== "staff") return false;
          const staffProfile = staffProfiles.find(profile => 
            profile.userId === (user.id || user._id)
          );
          return staffProfile && formData.specificDepartments.includes(staffProfile.department);
        });
      
      case "specific_users":
        return users.filter(user => 
          formData.specificUsers.includes(user.id || user._id)
        );
      
      case "active":
        return users.filter(user => user.isActive !== false);
      
      case "inactive":
        return users.filter(user => user.isActive === false);
      
      default:
        return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleMultiSelectChange = (name, value) => {
    const currentValues = formData[name];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    setFormData({
      ...formData,
      [name]: newValues,
    });
  };

  const handleTemplateChange = (templateId) => {
    const template = Array.isArray(templates)
      ? templates.find((t) => t._id === templateId)
      : null;
    if (template) {
      setFormData({
        ...formData,
        title: template.subject || template.body?.substring(0, 50) || "",
        message: template.body || "",
        type: template.type || "admin_message",
        channel: template.channel || "inApp",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (recipientCount === 0) {
      toast.error("No recipients selected");
      return;
    }

    // Prepare user IDs based on selection
    const recipients = getRecipients();
    const userIds = recipients.map(user => user.id || user._id);

    const bulkData = {
      userIds,
      type: formData.type,
      channel: formData.channel,
      title: formData.title,
      message: formData.message,
      priority: formData.priority,
    };

    try {
      setIsLoading(true);
      await onSubmit(bulkData);
      toast.success(`Bulk notifications sent to ${recipientCount} users`);
      setFormData({
        type: "admin_message",
        channel: "inApp",
        title: "",
        message: "",
        priority: "medium",
        userGroup: "all",
        specificRoles: [],
        specificDepartments: [],
        specificUsers: [],
      });
      setSearchQuery("");
      setRoleFilter("all");
      setDepartmentFilter("all");
      setCurrentPage(1);
    } catch (error) {
      console.error("Bulk send error:", error);
      toast.error(`Failed to send bulk notifications: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
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

        {/* Recipient Selection */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Select Recipients</h3>
          
          <Select
            label="User Group"
            name="userGroup"
            value={formData.userGroup}
            onChange={handleChange}
            required
          >
            <option value="all">All Users</option>
            <option value="specific_roles">Specific Roles</option>
            <option value="specific_departments">Specific Departments</option>
            <option value="specific_users">Specific Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
          </Select>

          {/* Role Selection */}
          {formData.userGroup === "specific_roles" && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Select Roles</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["guest", "staff", "manager", "admin"].map(role => (
                  <label key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.specificRoles.includes(role)}
                      onChange={() => handleMultiSelectChange("specificRoles", role)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="capitalize text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Department Selection */}
          {formData.userGroup === "specific_departments" && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Select Departments</label>
              {departments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {departments.map(dept => (
                    <label key={dept} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.specificDepartments.includes(dept)}
                        onChange={() => handleMultiSelectChange("specificDepartments", dept)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No departments available</p>
              )}
            </div>
          )}

          {/* User Selection */}
          {formData.userGroup === "specific_users" && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Select Users</label>
              
              {/* Search for users */}
              {/* Search and Filters */}
              <div className="mb-3 space-y-2">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  onChange={(e) => {
                    const query = e.target.value.toLowerCase();
                    setSearchQuery(query);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
                
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="guest">Guest</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                
                {/* Department Filter (for staff) */}
                {roleFilter === "staff" && (
                  <select
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Users List with Pagination */}
              <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.specificUsers.length} of {filteredUsers.length} users selected
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        specificUsers: filteredUsers.map(user => user.id || user._id)
                      })}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        specificUsers: []
                      })}
                      className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Users List */}
                {paginatedUsers.map(user => {
                  const staffProfile = staffProfiles.find(profile =>
                    profile.userId === (user.id || user._id)
                  );
                  
                  return (
                    <label key={user.id || user._id} className="flex items-center space-x-2 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={formData.specificUsers.includes(user.id || user._id)}
                        onChange={() => handleMultiSelectChange("specificUsers", user.id || user._id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email} - {user.role}
                          {user.role === "staff" && staffProfile?.department &&
                            ` - ${staffProfile.department}`
                          }
                        </div>
                      </div>
                    </label>
                  );
                })}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recipient Count */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
            <span className="text-sm font-medium">Recipients: </span>
            <span className="text-sm">{recipientCount} users will receive this notification</span>
            {recipientCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowPreview(!showPreview)}
                className="ml-2"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            )}
          </div>

          {/* Recipients Preview */}
          {showPreview && recipientCount > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-2">
              <h4 className="text-sm font-medium mb-2">Recipients:</h4>
              {getRecipients().map(user => {
                const staffProfile = staffProfiles.find(profile => 
                  profile.userId === (user.id || user._id)
                );
                return (
                  <div key={user.id || user._id} className="text-xs text-gray-600 dark:text-gray-300">
                    {user.name || "No Name"} ({user.email}) - {user.role}
                    {user.role === "staff" && staffProfile?.department && 
                      ` - ${staffProfile.department}`
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="admin_message">Admin Message</option>
            <option value="system_alert">System Alert</option>
            <option value="emergency_alert">Emergency Alert</option>
            <option value="manager_message">Manager Message</option>
            <option value="test_notification">Test Notification</option>
          </Select>

          <Select
            label="Channel"
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            required
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
            <option value="inApp">In-App</option>
          </Select>

          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>

        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <Textarea
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          required
        />

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                type: "admin_message",
                channel: "inApp",
                title: "",
                message: "",
                priority: "medium",
                userGroup: "all",
                specificRoles: [],
                specificDepartments: [],
                specificUsers: [],
              });
              setShowPreview(false);
              setSearchQuery("");
              setRoleFilter("all");
              setDepartmentFilter("all");
              setCurrentPage(1);
            }}
          >
            Clear
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || recipientCount === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Sending to {recipientCount} users...
              </>
            ) : (
              `Send to ${recipientCount} Users`
            )}
          </Button>
        </div>
      </div>
    </div>
  )}