import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Textarea from "../../../../components/ui/Textarea";
import Spinner from "../../../../components/ui/Spinner";

export default function SendNotificationForm({ users, onSubmit, templates, staffProfiles = [] }) {
  const [formData, setFormData] = useState({
    userId: "",
    type: "system",
    channel: "email",
    title: "",
    message: "",
    priority: "normal",
  });
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Get unique departments from staff profiles
  const departments = useMemo(() => {
    const depts = [...new Set(staffProfiles
      .filter(profile => profile.department)
      .map(profile => profile.department)
    )];
    return depts.sort();
  }, [staffProfiles]);

  // Filter users based on search, role, and department
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(user => {
      // Search filter
      const matchesSearch = !searchQuery || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      // Department filter (only for staff)
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

  const handleTemplateChange = (templateId) => {
    const template = Array.isArray(templates)
      ? templates.find((t) => t._id === templateId)
      : null;
    if (template) {
      setFormData({
        ...formData,
        title: template.subject || "",
        message: template.body || "",
        type: template.type || "system",
        channel: template.channel || "email",
      });
    } else if (templateId) {
      toast.warn("Selected template not found");
    }
  };

  const handleUserSelect = (user) => {
    setFormData({ ...formData, userId: user.id || user._id });
    setSearchQuery(`${user.email} (${user.name || "No Name"})`);
    setShowUserDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId) {
      toast.error("Please select a user");
      return;
    }
    
    try {
      setIsSending(true);
      await onSubmit(formData);
      toast.success("Notification sent successfully");
      setFormData({
        userId: "",
        type: "system",
        channel: "email",
        title: "",
        message: "",
        priority: "normal",
      });
      setSearchQuery("");
      setRoleFilter("all");
      setDepartmentFilter("all");
    } catch (error) {
      toast.error(`Failed to send notification: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const clearUserSelection = () => {
    setFormData({ ...formData, userId: "" });
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* User Selection Section */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Select User</h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

          {/* Search Input */}
          <div className="relative">
            <Input
              label="Search Users"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowUserDropdown(true);
                if (!e.target.value) {
                  setFormData({ ...formData, userId: "" });
                }
              }}
              onFocus={() => setShowUserDropdown(true)}
            />
            
            {formData.userId && (
              <button
                type="button"
                onClick={clearUserSelection}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            
            {/* User Dropdown */}
            {showUserDropdown && searchQuery && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const staffProfile = staffProfiles.find(profile => 
                      profile.userId === (user.id || user._id)
                    );
                    
                    return (
                      <div
                        key={user.id || user._id}
                        onClick={() => handleUserSelect(user)}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="font-medium">{user.name || "No Name"}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Role: {user.role}
                          {user.role === "staff" && staffProfile?.department && 
                            ` | Department: ${staffProfile.department}`
                          }
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-gray-500 text-center">
                    No users found matching your criteria
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Selected User Display */}
          {formData.userId && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
              <span className="text-sm font-medium">Selected: </span>
              <span className="text-sm">{searchQuery}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="system">System</option>
            <option value="alert">Alert</option>
            <option value="promotional">Promotional</option>
            <option value="booking_confirmation">Booking Confirmation</option>
            <option value="payment_receipt">Payment Receipt</option>
            <option value="task_assigned">Task Assigned</option>
            <option value="shift_scheduled">Shift Scheduled</option>
            <option value="admin_message">Admin Message</option>
          </Select>
          
          <Select
            label="Channel"
            value={formData.channel}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
            required
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
            <option value="inApp">In-App</option>
          </Select>
          
          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <Textarea
          label="Message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={5}
          required
        />

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSending || !formData.userId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
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
    </div>
  );
}