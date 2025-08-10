// src/components/admin/components/notification/TemplateForm.jsx
import React, { useState, useEffect } from "react";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Textarea from "../../../../components/ui/Textarea";
import Button from "../../../../components/ui/Button";

export default function TemplateForm({
  template = null,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    type: "system",
    channel: "email",
    isActive: true,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(template ? { id: template._id, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Template Name"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <Input
        label="Subject"
        id="subject"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        required
      />

      <Textarea
        label="Body"
        id="body"
        name="body"
        value={formData.body}
        onChange={handleChange}
        rows={8}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Type"
          id="type"
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
          id="channel"
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
      </div>

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

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {template ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}