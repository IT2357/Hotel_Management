/**
 * Edit Profile Modal Component
 * Modal for editing profile information
 */

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { User, Phone, FileText } from "lucide-react";
import { toast } from "sonner";

export const EditProfileModal = ({ profile, profileData, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || "",
    phone: profile.phone || "",
    email: profile.email || "",
    emergencyContactName: profile.emergencyContact?.name || "",
    emergencyContactRelationship: profile.emergencyContact?.relationship || "",
    emergencyContactPhone: profile.emergencyContact?.phone || "",
    notes: profileData?.notes || "",
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Basic validation
      if (!formData.name || formData.name.trim().length < 2) {
        toast.error("Validation Error", {
          description: "Name must be at least 2 characters",
          duration: 3000,
        });
        setIsSaving(false);
        return;
      }

      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      toast.error("Failed to update profile", {
        description: error?.response?.data?.message || error.message || "Please try again",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          <p className="text-violet-100 mt-1">Update your profile information</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-violet-600" />
              Basic Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="+94 11 234 5678"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                placeholder="your.email@example.com"
                title="Email cannot be changed as it's used for authentication"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed (used for login)
              </p>
            </div>
          </div>

          <ManagerSeparator />

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-violet-600" />
              Emergency Contact
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactRelationship: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="e.g., Manager, Supervisor"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactPhone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="+94 77 456 1122"
              />
            </div>
          </div>

          <ManagerSeparator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Notes
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
              placeholder="Add any additional notes or information..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
