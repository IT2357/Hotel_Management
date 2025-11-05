// src/components/admin/components/notification/TemplateForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Textarea from "../../../../components/ui/Textarea";
import Button from "../../../../components/ui/Button";

export default function TemplateForm({ template = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    type: "",
    channel: "",
    isActive: true,
    variables: [],
  });

  const [metadata, setMetadata] = useState({ types: [], channels: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    axios.get("/api/notifications/metadata")
      .then(res => {
        if (res.data.success) {
          setMetadata({
            types: res.data.types,
            channels: res.data.channels,
          });

          setFormData(prev => ({
            ...prev,
            type: template?.type || res.data.types[0] || "",
            channel: template?.channel || res.data.channels[0] || "",
          }));
        }
      })
      .catch(err => {
        console.error("Failed to load notification metadata:", err);
      })
      .finally(() => setLoadingMeta(false));
  }, [template]);

  useEffect(() => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name || "",
        subject: template.subject || "",
        body: template.body || "",
        isActive: template.isActive !== undefined ? template.isActive : true,
        variables: Array.isArray(template.variables) ? template.variables : [],
      }));
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
    const raw = e.target.value;
    const parsed = raw
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    setFormData({ ...formData, variables: parsed });
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

      {formData.channel === "email" && (
        <Input
          label="Subject"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
        />
      )}

      <Textarea
        label="Body"
        id="body"
        name="body"
        value={formData.body}
        onChange={handleChange}
        rows={8}
        required
      />

      <Input
        label="Variables (comma-separated)"
        id="variables"
        name="variables"
        value={formData.variables.join(", ")}
        onChange={handleVariablesChange}
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
          {loadingMeta ? (
            <option disabled>Loading...</option>
          ) : (
            metadata.types.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))
          )}
        </Select>

        <Select
          label="Channel"
          id="channel"
          name="channel"
          value={formData.channel}
          onChange={handleChange}
          required
        >
          {loadingMeta ? (
            <option disabled>Loading...</option>
          ) : (
            metadata.channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel === "inApp" ? "In-App" : channel.charAt(0).toUpperCase() + channel.slice(1)}
              </option>
            ))
          )}
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
