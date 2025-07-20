// src/pages/admin/components/EditInvitationModal.jsx

import { useState, useEffect } from "react";

const EditInvitationModal = ({ isOpen, invitation, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (invitation) {
      setFormData(invitation);
    }
  }, [invitation]);

  if (!isOpen || !formData || !formData._id) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      expiresAt:
        typeof formData.expiresAt === "string"
          ? new Date(formData.expiresAt)
          : formData.expiresAt,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      onClick={onClose} // Close when clicking outside the modal
    >
      <div
        className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
      >
        <h2 className="text-xl font-semibold">Edit Invitation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Used Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Used</label>
            <select
              value={formData.used ? "true" : "false"}
              onChange={(e) => handleChange("used", e.target.value === "true")}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="false">Not Used</option>
              <option value="true">Used</option>
            </select>
          </div>

          {/* Expiry Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Expires At</label>
            <input
              type="datetime-local"
              value={
                formData.expiresAt
                  ? new Date(formData.expiresAt).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => handleChange("expiresAt", e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvitationModal;
