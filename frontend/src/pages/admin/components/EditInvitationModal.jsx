// src/pages/admin/components/EditInvitationModal.jsx

import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import PermissionSelector from "./PermissionSelector";

const EditInvitationModal = ({ isOpen, invitation, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [showPerms, setShowPerms] = useState(false);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    if (invitation) {
      setFormData(invitation);
      setPermissions(invitation.permissions || []);
      // Show granular permissions if role is admin (always show for admin role)
      setShowPerms(invitation.role === "admin");
    }
  }, [invitation]);

  if (!formData || !formData._id) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      expiresAt:
        typeof formData.expiresAt === "string"
          ? new Date(formData.expiresAt)
          : formData.expiresAt,
    };
    if (formData.role === "admin") {
      if (showPerms && permissions.length) {
        payload.permissions = permissions;
      } else {
        payload.permissions = undefined; // remove perms when toggled off
      }
    }
    onUpdate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Invitation"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
            required
          />
        </div>

        {/* Role Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Role</label>
          <select
            value={formData.role}
            onChange={(e) => handleChange("role", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
          >
            <option value="staff">👨‍💼 Staff</option>
            <option value="admin">🔑 Admin</option>
            <option value="manager">👨‍💻 Manager</option>
          </select>
        </div>

        {/* Used Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">✓ Status</label>
          <select
            value={formData.used ? "true" : "false"}
            onChange={(e) => handleChange("used", e.target.value === "true")}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
          >
            <option value="false">❌ Not Used</option>
            <option value="true">✅ Used</option>
          </select>
        </div>

        {/* Expiry Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">⏰ Expires At</label>
          <input
            type="datetime-local"
            value={
              formData.expiresAt
                ? new Date(formData.expiresAt).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) => handleChange("expiresAt", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
          />
        </div>

        {/* Permissions Toggle + Selector (Admin only) */}
        {formData.role === "admin" && (
          <div className="space-y-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
                checked={showPerms}
                onChange={(e) => setShowPerms(e.target.checked)}
              />
              Show granular permissions
            </label>
            {showPerms && (
              <div className="bg-gray-50 rounded-xl p-4">
                <PermissionSelector
                  selectedPermissions={permissions}
                  onPermissionChange={setPermissions}
                />
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditInvitationModal;
