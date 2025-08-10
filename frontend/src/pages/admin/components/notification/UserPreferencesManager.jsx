import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import adminService from "../../../../services/adminService";
import Select from "../../../../components/ui/Select";
import Button from "../../../../components/ui/Button";
import Spinner from "../../../../components/ui/Spinner";

export default function UserPreferencesManager({ users, onUpdatePreferences }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPreferences(selectedUser);
    } else {
      setPreferences(null);
    }
  }, [selectedUser]);

  const fetchUserPreferences = async (userId) => {
    try {
      setIsLoading(true);
      const data = await adminService.getUserPreferences(userId);
      // Ensure preferences has a channels object
      setPreferences({
        channels: data?.channels || {
          email: true,
          sms: true,
          push: true,
          "in-app": true,
        },
      });
    } catch (error) {
      toast.error(`Failed to load preferences: ${error.message}`);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (channel, value) => {
    setPreferences({
      ...preferences,
      channels: {
        ...preferences?.channels,
        [channel]: value,
      },
    });
  };

  const handleSave = async () => {
    if (!selectedUser || !preferences) {
      toast.error("No user or preferences selected");
      return;
    }
    try {
      setIsLoading(true);
      await adminService.updateUserPreferences(selectedUser, preferences);
      toast.success("Preferences updated successfully");
      if (onUpdatePreferences) onUpdatePreferences();
    } catch (error) {
      toast.error(`Failed to update preferences: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        label="Select User"
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      >
        <option value="">Select a user</option>
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
      {isLoading && <Spinner size="lg" />}
      {preferences?.channels && !isLoading && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Notification Preferences</h3>
          {Object.entries(preferences.channels).map(([channel, enabled]) => (
            <div key={channel} className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handlePreferenceChange(channel, e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="capitalize">{channel}</span>
              </label>
            </div>
          ))}
          <div className="pt-4">
            <Button onClick={handleSave} disabled={isLoading || !selectedUser}>
              {isLoading ? <Spinner size="sm" /> : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}
      {!isLoading && selectedUser && !preferences?.channels && (
        <p className="text-red-500">No preferences available for this user</p>
      )}
    </div>
  );
}