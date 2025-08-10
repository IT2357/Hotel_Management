// src/components/admin/components/notification/SendBulkNotificationForm.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Textarea from "../../../../components/ui/Textarea";
import Button from "../../../../components/ui/Button";
import Spinner from "../../../../components/ui/Spinner";

export default function SendBulkNotificationForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    type: "system",
    channel: "email",
    title: "",
    message: "",
    priority: "normal",
    userGroup: "all",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit(formData);
      toast.success("Bulk notifications sent successfully");
      setFormData({
        type: "system",
        channel: "email",
        title: "",
        message: "",
        priority: "normal",
        userGroup: "all",
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="User Group"
          name="userGroup"
          value={formData.userGroup}
          onChange={handleChange}
          required
        >
          <option value="all">All Users</option>
          <option value="active">Active Users</option>
          <option value="inactive">Inactive Users</option>
          <option value="admins">Admins</option>
          <option value="customers">Customers</option>
        </Select>

        <Select
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="system">System</option>
          <option value="alert">Alert</option>
          <option value="promotional">Promotional</option>
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
          <option value="in-app">In-App</option>
        </Select>

        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
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

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Sending...
            </>
          ) : (
            "Send Bulk Notifications"
          )}
        </Button>
      </div>
    </form>
  );
}