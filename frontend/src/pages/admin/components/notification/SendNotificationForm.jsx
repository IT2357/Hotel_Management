import { useState } from "react";
import { toast } from "react-toastify";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Textarea from "../../../../components/ui/Textarea";
import Spinner from "../../../../components/ui/Spinner";

export default function SendNotificationForm({ users, onSubmit, templates }) {
  const [formData, setFormData] = useState({
    userId: "",
    type: "system",
    channel: "email",
    title: "",
    message: "",
    priority: "normal",
  });
  const [isSending, setIsSending] = useState(false);

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
    } else {
      toast.warn("Selected template not found");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSending(true);
      await onSubmit(formData); // Use onSubmit prop
      toast.success("Notification sent successfully");
      setFormData({
        userId: "",
        type: "system",
        channel: "email",
        title: "",
        message: "",
        priority: "normal",
      });
    } catch (error) {
      toast.error(`Failed to send notification: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="User"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          required
        >
          <option value="">Select User</option>
          {Array.isArray(users) && users.length > 0 ? (
            users.map((user) => (
              <option key={user.id || user._id} value={user.id || user._id}>
                {user.email} ({user.name || "No Name"})
              </option>
            ))
          ) : (
            <option disabled>No users available</option>
          )}
        </Select>
        <Select
          label="Template"
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">Select Template (optional)</option>
          {Array.isArray(templates) && templates.length > 0 ? (
            templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name || "Unnamed Template"}
              </option>
            ))
          ) : (
            <option disabled>No templates available</option>
          )}
        </Select>
        <Select
          label="Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="system">System</option>
          <option value="alert">Alert</option>
          <option value="promotional">Promotional</option>
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
          <option value="in-app">In-App</option>
        </Select>
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) =>
            setFormData({ ...formData, priority: e.target.value })
          }
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
        <Button type="submit" disabled={isSending}>
          {isSending ? <Spinner size="sm" /> : "Send Notification"}
        </Button>
      </div>
    </form>
  );
}