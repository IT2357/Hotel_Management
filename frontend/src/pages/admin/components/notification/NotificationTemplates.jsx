import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Button from '../../../../components/ui/Button';
import Modal from "../../../../components/ui/Modal";
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Spinner from "../../../../components/ui/Spinner";

const TemplateForm = ({ template = null, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    type: "system",
    channel: "email",
    isActive: true,
    variables: [],
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        subject: template.subject || "",
        body: template.body || "",
        type: template.type || "system",
        channel: template.channel || "email",
        isActive: template.isActive !== undefined ? template.isActive : true,
        variables: template.variables || [],
      });
    } else {
      setFormData({
        name: "",
        subject: "",
        body: "",
        type: "system",
        channel: "email",
        isActive: true,
        variables: [],
      });
    }
  }, [template]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleVariablesChange = (e) => {
    const variables = e.target.value.split(',').map(v => v.trim()).filter(v => v);
    setFormData({
      ...formData,
      variables,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error("Name, subject, and body are required");
      return;
    }

    const templateData = {
      ...formData,
      variables: formData.variables.filter(v => v), // Remove empty variables
    };

    onSubmit(templateData);
  };

  const notificationTypes = [
    "system", "alert", "promotional", "booking_confirmation", "payment_receipt", 
    "payment_failed", "checkin_reminder", "checkout_reminder", "food_order_confirmation",
    "food_order_ready", "service_request_update", "cancellation_confirmation",
    "refund_update", "review_request", "task_assigned", "task_reminder",
    "task_overdue", "shift_scheduled", "shift_reminder", "shift_change",
    "manager_message", "emergency_alert", "staff_alert", "guest_complaint",
    "system_alert", "inventory_alert", "high_occupancy_alert", "system_error",
    "security_alert", "financial_alert", "audit_log", "admin_activity",
    "admin_message", "test_notification"
  ];

  return (
    <div className="space-y-4">
      <Input
        label="Template Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Booking Confirmation Email"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          {notificationTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
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
      </div>

      <Input
        label="Subject"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        placeholder="e.g., Your booking is confirmed!"
        required
      />

      <Textarea
        label="Body"
        name="body"
        value={formData.body}
        onChange={handleChange}
        rows={8}
        placeholder="Use {{variable}} for dynamic content. e.g., Hello {{user.name}}, your booking for {{booking.roomNumber}} is confirmed."
        required
      />

      <Input
        label="Variables (comma-separated)"
        value={formData.variables.join(', ')}
        onChange={handleVariablesChange}
        placeholder="e.g., user.name, user.email, booking.roomNumber, booking.checkInDate"
      />

      <div className="flex items-center">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {template ? "Updating..." : "Creating..."}
            </>
          ) : (
            template ? "Update Template" : "Create Template"
          )}
        </Button>
      </div>
    </div>
  );
};

export default function NotificationTemplates({ 
  templates = [], 
  onCreate, 
  onUpdate, 
  onDelete,
  isLoading = false 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || template.type === typeFilter;
    const matchesChannel = channelFilter === "all" || template.channel === channelFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" ? template.isActive : !template.isActive);
    
    return matchesSearch && matchesType && matchesChannel && matchesStatus;
  });

  const handleCreate = async (templateData) => {
    try {
      setIsSubmitting(true);
      await onCreate(templateData);
      setIsModalOpen(false);
      setCurrentTemplate(null);
      toast.success("Template created successfully");
    } catch (error) {
      toast.error(`Failed to create template: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (templateData) => {
    try {
      setIsSubmitting(true);
      await onUpdate(currentTemplate._id, templateData);
      setIsModalOpen(false);
      setCurrentTemplate(null);
      toast.success("Template updated successfully");
    } catch (error) {
      toast.error(`Failed to update template: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      try {
        await onDelete(templateId);
        toast.success("Template deleted successfully");
      } catch (error) {
        toast.error(`Failed to delete template: ${error.message}`);
      }
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTemplate(null);
  };

  const uniqueTypes = [...new Set(templates.map(t => t.type))].sort();
  const uniqueChannels = [...new Set(templates.map(t => t.channel))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Notification Templates</h3>
        <Button 
          onClick={() => {
            setCurrentTemplate(null);
            setIsModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </Select>
        
        <Select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option value="all">All Channels</option>
          {uniqueChannels.map(channel => (
            <option key={channel} value={channel}>
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </option>
          ))}
        </Select>
        
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 rounded-lg shadow">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Variables
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {template.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {template.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {template.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {template.variables?.length || 0} variables
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(template._id, template.name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || typeFilter !== "all" || channelFilter !== "all" || statusFilter !== "all" 
                      ? "No templates match your filters"
                      : "No templates found. Create your first template!"
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentTemplate ? "Edit Template" : "Create Template"}
        size="lg"
      >
        <TemplateForm
          template={currentTemplate}
          onSubmit={currentTemplate ? handleUpdate : handleCreate}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}