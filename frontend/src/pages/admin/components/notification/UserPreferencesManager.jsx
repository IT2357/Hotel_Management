import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import adminService from "../../../../services/adminService";
import notificationService from "../../../../services/notificationService";
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
      const response = await notificationService.getUserPreferences(userId);
      const data = response.data;
      
      // Backend sends preferences as a Map structure, convert to flat structure
      if (data?.preferences) {
        setPreferences(data.preferences);
      } else {
        setPreferences(null);
      }
    } catch (error) {
      toast.error(`Failed to load preferences: ${error.message}`);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (notificationType, channel, value) => {
    setPreferences({
      ...preferences,
      [notificationType]: {
        ...preferences?.[notificationType],
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
      await notificationService.updateUserPreferences(selectedUser, preferences);
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
      {preferences && !isLoading && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Notification Preferences</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(preferences).map(([notificationType, channels]) => (
              <div key={notificationType} className="border-b pb-4 last:border-b-0">
                <h4 className="font-medium text-sm mb-2 capitalize">
                  {notificationType.replace(/_/g, " ")}
                </h4>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  {Object.entries(channels).map(([channel, enabled]) => (
                    <label key={channel} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          handlePreferenceChange(notificationType, channel, e.target.checked)
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="capitalize text-sm">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4">
            <Button onClick={handleSave} disabled={isLoading || !selectedUser}>
              {isLoading ? <Spinner size="sm" /> : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}
      {!isLoading && selectedUser && !preferences && (
        <p className="text-red-500">No preferences available for this user</p>
      )}
    </div>
  );
}