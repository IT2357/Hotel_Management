import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Card from "../../components/ui/Card";
import adminService from "../../services/adminService";

export default function AdminSettingsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    siteName: "Hotel Management System",
    hotelName: "Grand Hotel",
    description: "A luxury hotel experience",
    contactEmail: "info@grandhotel.com",
    contactPhone: "+1 (555) 123-4567",
    address: "123 Hotel Street, City, State 12345",
    timezone: "UTC",
    currency: "USD",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    smtpFrom: "noreply@grandhotel.com",
    smtpSecure: "false",
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    bookingConfirmations: true,
    promotionalEmails: true,
    adminNotifications: true,
    passwordMinLength: "8",
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    twoFactorRequired: false,
    allowGuestBooking: true,
    requireApproval: false,
    maxAdvanceBooking: "365",
    cancellationPolicy: "24 hours before check-in",
    defaultCheckInTime: "15:00",
    defaultCheckOutTime: "11:00",
    maxGuestsPerRoom: "4",
    maintenanceMode: false,
    requireSpecialCharacters: false,
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "email", label: "Email Settings", icon: "📧" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "booking", label: "Booking Settings", icon: "📅" },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await adminService.getAdminSettings();
        const fetchedSettings = response.data;
        const defaults = {
          siteName: "Hotel Management System",
          hotelName: "Grand Hotel",
          description: "A luxury hotel experience",
          contactEmail: "info@grandhotel.com",
          contactPhone: "+1 (555) 123-4567",
          address: "123 Hotel Street, City, State 12345",
          timezone: "UTC",
          currency: "USD",
          smtpHost: "smtp.gmail.com",
          smtpPort: "587",
          smtpUser: "",
          smtpPassword: "",
          smtpFrom: "noreply@grandhotel.com",
          smtpSecure: "false",
          enableEmailNotifications: true,
          enableSMSNotifications: false,
          bookingConfirmations: true,
          promotionalEmails: true,
          adminNotifications: true,
          passwordMinLength: "8",
          sessionTimeout: "30",
          maxLoginAttempts: "5",
          twoFactorRequired: false,
          allowGuestBooking: true,
          requireApproval: false,
          maxAdvanceBooking: "365",
          cancellationPolicy: "24 hours before check-in",
          defaultCheckInTime: "15:00",
          defaultCheckOutTime: "11:00",
          maxGuestsPerRoom: "4",
          maintenanceMode: false,
          requireSpecialCharacters: false,
        };
        const sanitizedSettings = {};
        Object.keys(defaults).forEach((key) => {
          let value = fetchedSettings[key];
          if (value === undefined || value === null) {
            value = defaults[key];
          } else {
            if (["smtpPort", "passwordMinLength", "sessionTimeout", "maxLoginAttempts", "maxAdvanceBooking", "maxGuestsPerRoom"].includes(key)) {
              value = String(value);
            } else if (key === "smtpSecure") {
              value = String(value);
            } else if (typeof defaults[key] === "boolean") {
              value = Boolean(value);
            }
          }
          sanitizedSettings[key] = value;
        });
        setSettings(sanitizedSettings);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        setSaveMessage(`Failed to load settings: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      if (["smtpPort", "passwordMinLength", "sessionTimeout", "maxLoginAttempts", "maxAdvanceBooking", "maxGuestsPerRoom"].includes(key)) {
        newSettings[key] = value;
      } else if (key === "smtpSecure") {
        newSettings[key] = value;
      } else if (typeof prev[key] === "boolean") {
        newSettings[key] = value === true || value === "true";
      } else {
        newSettings[key] = value;
      }
      return newSettings;
    });
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveMessage("");
    try {
      const payload = {
        ...settings,
        smtpPort: parseInt(settings.smtpPort, 10),
        smtpSecure: settings.smtpSecure === "true",
        passwordMinLength: parseInt(settings.passwordMinLength, 10),
        sessionTimeout: parseInt(settings.sessionTimeout, 10),
        maxLoginAttempts: parseInt(settings.maxLoginAttempts, 10),
        maxAdvanceBooking: parseInt(settings.maxAdvanceBooking, 10),
        maxGuestsPerRoom: parseInt(settings.maxGuestsPerRoom, 10),
      };
      const response = await adminService.updateAdminSettings(payload);
      const updatedSettings = response.data;
      const sanitizedSettings = {};
      Object.keys(settings).forEach((key) => {
        let value = updatedSettings[key];
        if (value === undefined || value === null) {
          value = settings[key];
        } else if (["smtpPort", "passwordMinLength", "sessionTimeout", "maxLoginAttempts", "maxAdvanceBooking", "maxGuestsPerRoom"].includes(key)) {
          value = String(value);
        } else if (key === "smtpSecure") {
          value = String(value);
        }
        sanitizedSettings[key] = value;
      });
      setSettings(sanitizedSettings);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage(`Failed to save settings: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    setLoading(true);
    try {
      await adminService.testEmailConfig({
        smtpHost: settings.smtpHost,
        smtpPort: parseInt(settings.smtpPort, 10),
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFrom: settings.smtpFrom,
        smtpSecure: settings.smtpSecure === "true",
      });
      setSaveMessage("Test email sent successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to test email:", error);
      setSaveMessage(`Failed to send test email: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Modern Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">⚙️ System Settings</h1>
            <p className="text-indigo-100 text-lg">
              Configure your hotel management system, {user?.name?.split(" ")[0]}!
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveSettings}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save All Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Card className={`bg-gradient-to-br ${saveMessage.includes("successfully") ? "from-green-50 to-green-100 border-green-200" : "from-red-50 to-red-100 border-red-200"} shadow-xl rounded-2xl border p-4`}>
          <p className={`${saveMessage.includes("successfully") ? "text-green-800" : "text-red-800"}`}>{saveMessage}</p>
        </Card>
      )}

      {/* Modern Tab Navigation */}
      <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Settings Form */}
      <Card className="bg-white shadow-xl rounded-2xl border-0 p-8">
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">⚙️ General Settings</h2>
            <p className="text-gray-600">Configure the basic settings for your system</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Site Name</label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                  placeholder="Enter site name"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hotel Name</label>
                <Input
                  value={settings.hotelName}
                  onChange={(e) => handleSettingChange("hotelName", e.target.value)}
                  placeholder="Enter hotel name"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange("contactEmail", e.target.value)}
                  placeholder="Enter contact email"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                <Input
                  value={settings.contactPhone}
                  onChange={(e) => handleSettingChange("contactPhone", e.target.value)}
                  placeholder="Enter contact phone"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                <Select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange("timezone", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                <Select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange("currency", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hotel Description</label>
                <Textarea
                  value={settings.description}
                  onChange={(e) => handleSettingChange("description", e.target.value)}
                  rows={3}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <Textarea
                  value={settings.address}
                  onChange={(e) => handleSettingChange("address", e.target.value)}
                  rows={2}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Save General Settings
            </Button>
          </div>
        )}
        {activeTab === "email" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📧 Email Configuration</h2>
            <p className="text-gray-600">Set up email settings for notifications</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                <Input
                  value={settings.smtpHost}
                  onChange={(e) => handleSettingChange("smtpHost", e.target.value)}
                  placeholder="Enter SMTP host"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                <Input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => handleSettingChange("smtpPort", e.target.value)}
                  placeholder="Enter SMTP port"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Username</label>
                <Input
                  value={settings.smtpUser}
                  onChange={(e) => handleSettingChange("smtpUser", e.target.value)}
                  placeholder="Enter SMTP username"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Password</label>
                <Input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => handleSettingChange("smtpPassword", e.target.value)}
                  placeholder="Enter SMTP password"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Email</label>
                <Input
                  type="email"
                  value={settings.smtpFrom}
                  onChange={(e) => handleSettingChange("smtpFrom", e.target.value)}
                  placeholder="Enter from email"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Secure</label>
                <Select
                  value={settings.smtpSecure}
                  onChange={(e) => handleSettingChange("smtpSecure", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="true">True (SSL/TLS)</option>
                  <option value="false">False (STARTTLS)</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Save Email Settings
              </Button>
              <Button
                onClick={testEmailConfiguration}
                variant="outline"
                disabled={loading}
                className="rounded-xl border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
              >
                Test Email Configuration
              </Button>
            </div>
          </div>
        )}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔔 Notification Preferences</h2>
            <p className="text-gray-600">Manage notification settings for users</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Enable Email Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.enableEmailNotifications}
                  onChange={(e) => handleSettingChange("enableEmailNotifications", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Enable SMS Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.enableSMSNotifications}
                  onChange={(e) => handleSettingChange("enableSMSNotifications", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Booking Confirmations</label>
                <input
                  type="checkbox"
                  checked={settings.bookingConfirmations}
                  onChange={(e) => handleSettingChange("bookingConfirmations", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Promotional Emails</label>
                <input
                  type="checkbox"
                  checked={settings.promotionalEmails}
                  onChange={(e) => handleSettingChange("promotionalEmails", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Admin Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.adminNotifications}
                  onChange={(e) => handleSettingChange("adminNotifications", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Save Notification Settings
            </Button>
          </div>
        )}
        {activeTab === "security" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔒 Security Configuration</h2>
            <p className="text-gray-600">Configure security settings for your system</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Password Length</label>
                <Input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleSettingChange("passwordMinLength", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Session Timeout (minutes)</label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Login Attempts</label>
                <Input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Require Special Characters in Passwords</label>
                <input
                  type="checkbox"
                  checked={settings.requireSpecialCharacters}
                  onChange={(e) => handleSettingChange("requireSpecialCharacters", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Require Two-Factor Authentication for Admins</label>
                <input
                  type="checkbox"
                  checked={settings.twoFactorRequired}
                  onChange={(e) => handleSettingChange("twoFactorRequired", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Save Security Settings
            </Button>
          </div>
        )}
        {activeTab === "booking" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📅 Booking Configuration</h2>
            <p className="text-gray-600">Configure booking settings for guests</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Advance Booking (days)</label>
                <Input
                  type="number"
                  min="1"
                  max="730"
                  value={settings.maxAdvanceBooking}
                  onChange={(e) => handleSettingChange("maxAdvanceBooking", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Time</label>
                <Input
                  type="time"
                  value={settings.defaultCheckInTime}
                  onChange={(e) => handleSettingChange("defaultCheckInTime", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Time</label>
                <Input
                  type="time"
                  value={settings.defaultCheckOutTime}
                  onChange={(e) => handleSettingChange("defaultCheckOutTime", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Guests Per Room</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxGuestsPerRoom}
                  onChange={(e) => handleSettingChange("maxGuestsPerRoom", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
              <Textarea
                value={settings.cancellationPolicy}
                onChange={(e) => handleSettingChange("cancellationPolicy", e.target.value)}
                rows={3}
                className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Allow Guest Booking Without Registration</label>
                <input
                  type="checkbox"
                  checked={settings.allowGuestBooking}
                  onChange={(e) => handleSettingChange("allowGuestBooking", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700">Require Admin Approval for Bookings</label>
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => handleSettingChange("requireApproval", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Save Booking Settings
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}