import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Card from '../../components/ui/Card';
import Alert from '../../components/common/Alert';
import { 
  SettingsSection, 
  SettingsGrid, 
  SettingsField, 
  SettingsToggle, 
  SettingsCard 
} from "../../components/settings/SettingsSection";
import adminService from "../../services/adminService";

export default function AdminSettingsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "general", label: "General", icon: "⚙️", description: "Basic hotel information and contact details" },
    { id: "email", label: "Email Settings", icon: "📧", description: "SMTP configuration and email settings" },
    { id: "sms", label: "SMS Settings", icon: "📱", description: "SMS configuration and notifications" },
    { id: "social", label: "Social Auth", icon: "🔐", description: "Social authentication settings" },
    { id: "notifications", label: "Notifications", icon: "🔔", description: "Notification preferences and alerts" },
    { id: "security", label: "Security", icon: "🔒", description: "Authentication and security policies" },
    { id: "booking", label: "Booking Settings", icon: "📅", description: "Reservation and booking configurations" },
    { id: "payment", label: "Payment Gateway", icon: "💳", description: "Payment processing and gateway settings" },
    { id: "rooms", label: "Room Management", icon: "🏨", description: "Room assignment and housekeeping settings" },
    { id: "staff", label: "Staff Management", icon: "👥", description: "Employee scheduling and performance tracking" },
    { id: "financial", label: "Financial", icon: "💰", description: "Taxes, fees, and financial configurations" },
    { id: "reporting", label: "Reporting", icon: "📊", description: "Analytics and reporting preferences" },
    { id: "integrations", label: "Integrations", icon: "🔗", description: "Third-party service integrations" },
    { id: "system", label: "System", icon: "🖥️", description: "System maintenance and performance settings" },
    { id: "customization", label: "Customization", icon: "🎨", description: "Theme, branding, and UI customization" },
    { id: "guest", label: "Guest Experience", icon: "🌟", description: "Guest services and experience settings" },
  ];

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getAdminSettings();
      setSettings(response.data || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setAlert({
        type: "error",
        message: `Failed to load settings: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSettings();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchSettings]);

  const handleSettingChange = useCallback((path, value) => {
    setSettings((prev) => {
      const updateNestedValue = (obj, pathArray, newValue) => {
        if (pathArray.length === 1) {
          return { ...obj, [pathArray[0]]: newValue };
        }

        const [currentKey, ...remainingKeys] = pathArray;
        const currentValue = obj[currentKey] || {};

        return {
          ...obj,
          [currentKey]: updateNestedValue(currentValue, remainingKeys, newValue)
        };
      };

      const keys = path.split('.');
      return updateNestedValue(prev, keys, value);
    });
  }, []);

  const handleSaveSettings = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await adminService.updateAdminSettings(settings);
      setSettings(response.data);
      setLastUpdated(new Date());
      setAlert({ type: "success", message: "Settings saved successfully!" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setAlert({
        type: "error",
        message: `Failed to save settings: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const testSMSConfiguration = useCallback(async () => {
    setLoading(true);
    try {
      await adminService.testSMSConfig({
        smsProvider: settings.smsProvider,
        smsAccountSid: settings.smsAccountSid,
        smsAuthToken: settings.smsAuthToken,
        smsPhoneNumber: settings.smsPhoneNumber,
      });
      setAlert({ type: "success", message: "SMS configuration test completed successfully!" });
    } catch (error) {
      console.error("Failed to test SMS:", error);
      setAlert({
        type: "error",
        message: `Failed to test SMS configuration: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [settings.smsProvider, settings.smsAccountSid, settings.smsAuthToken, settings.smsPhoneNumber]);

  const testSocialAuthConfiguration = useCallback(async () => {
    setLoading(true);
    try {
      await adminService.testSocialAuthConfig({
        googleClientId: settings.googleClientId,
        googleClientSecret: settings.googleClientSecret,
        facebookAppId: settings.facebookAppId,
        facebookAppSecret: settings.facebookAppSecret,
        enableGoogleAuth: settings.enableGoogleAuth,
        enableFacebookAuth: settings.enableFacebookAuth,
      });
      setAlert({ type: "success", message: "Social authentication configuration validated successfully!" });
    } catch (error) {
      console.error("Failed to test social auth:", error);
      setAlert({
        type: "error",
        message: `Failed to validate social authentication: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [settings.googleClientId, settings.googleClientSecret, settings.facebookAppId, settings.facebookAppSecret, settings.enableGoogleAuth, settings.enableFacebookAuth]);

  const testEmailConfiguration = useCallback(async () => {
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
      setAlert({ type: "success", message: "Test email sent successfully!" });
    } catch (error) {
      console.error("Failed to test email:", error);
      setAlert({
        type: "error",
        message: `Failed to send test email: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const handleBackupSettings = useCallback(async () => {
    try {
      const response = await adminService.backupSettings();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setAlert({ type: "success", message: "Settings backup downloaded successfully!" });
    } catch (error) {
      console.error("Failed to backup settings:", error);
      setAlert({
        type: "error",
        message: `Failed to backup settings: ${error.response?.data?.message || error.message}`
      });
    }
  }, []);

  const handleRestoreSettings = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const response = await adminService.restoreSettings(backupData);
      setSettings(response.data);
      setLastUpdated(new Date());
      setAlert({ type: "success", message: "Settings restored successfully!" });
    } catch (error) {
      console.error("Failed to restore settings:", error);
      setAlert({
        type: "error",
        message: `Failed to restore settings: ${error.response?.data?.message || error.message}`
      });
    }
  }, []);

  const handleResetToDefaults = useCallback(async () => {
    if (!window.confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await adminService.resetToDefaults();
      setSettings(response.data);
      setLastUpdated(new Date());
      setAlert({ type: "success", message: "Settings reset to defaults successfully!" });
    } catch (error) {
      console.error("Failed to reset settings:", error);
      setAlert({
        type: "error",
        message: `Failed to reset settings: ${error.response?.data?.message || error.message}`
      });
    }
  }, []);

  const validatePaymentGateway = useCallback(async () => {
    if (!settings.paymentGateway) {
      setAlert({ type: "warning", message: "Please configure payment gateway settings first" });
      return;
    }

    setLoading(true);
    try {
      await adminService.validatePaymentGateway(settings.paymentGateway);
      setAlert({ type: "success", message: "Payment gateway configuration is valid!" });
    } catch (error) {
      console.error("Failed to validate payment gateway:", error);
      setAlert({
        type: "error",
        message: `Payment gateway validation failed: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [settings.paymentGateway]);

  const filteredTabs = tabs.filter(tab => 
    tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tab.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSettingsContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <SettingsSection
            title="General Settings"
            description="Configure the basic settings for your system"
            icon="⚙️"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <SettingsGrid>
              <SettingsField label="Site Name" required>
                <Input
                  value={settings.siteName || ""}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                  placeholder="Enter site name"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Hotel Name" required>
                <Input
                  value={settings.hotelName || ""}
                  onChange={(e) => handleSettingChange("hotelName", e.target.value)}
                  placeholder="Enter hotel name"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Contact Email" required>
                <Input
                  type="email"
                  value={settings.contactEmail || ""}
                  onChange={(e) => handleSettingChange("contactEmail", e.target.value)}
                  placeholder="Enter contact email"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Contact Phone">
                <Input
                  value={settings.contactPhone || ""}
                  onChange={(e) => handleSettingChange("contactPhone", e.target.value)}
                  placeholder="Enter contact phone"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Timezone">
                <Select
                  value={settings.timezone || "Asia/Colombo"}
                  onChange={(e) => handleSettingChange("timezone", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <optgroup label="Sri Lanka">
                    <option value="Asia/Colombo">Sri Lanka Time (Asia/Colombo)</option>
                  </optgroup>
                  <optgroup label="Popular Timezones">
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
                    <option value="Asia/Dubai">UAE (Asia/Dubai)</option>
                  </optgroup>
                  <optgroup label="Other Regions">
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </optgroup>
                </Select>
              </SettingsField>
              <SettingsField label="Currency">
                <Select
                  value={settings.currency || "LKR"}
                  onChange={(e) => handleSettingChange("currency", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <optgroup label="Sri Lanka">
                    <option value="LKR">LKR - Sri Lankan Rupee 🇱🇰</option>
                  </optgroup>
                  <optgroup label="Popular Currencies">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </optgroup>
                  <optgroup label="Other Currencies">
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </optgroup>
                </Select>
              </SettingsField>
            </SettingsGrid>
            <SettingsGrid cols={1}>
              <SettingsField label="Hotel Description">
                <Textarea
                  value={settings.description || ""}
                  onChange={(e) => handleSettingChange("description", e.target.value)}
                  rows={3}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Address">
                <Textarea
                  value={settings.address || ""}
                  onChange={(e) => handleSettingChange("address", e.target.value)}
                  rows={2}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
            </SettingsGrid>
          </SettingsSection>
        );

      case "sms":
        return (
          <SettingsSection
            title="SMS Configuration"
            description="Configure SMS settings for notifications"
            icon="📱"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <SettingsGrid>
              <SettingsField label="SMS Provider" required>
                <Select
                  value={settings.smsProvider || "twilio"}
                  onChange={(e) => handleSettingChange("smsProvider", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="twilio">Twilio</option>
                  <option value="aws-sns">AWS SNS</option>
                  <option value="nexmo">Nexmo/Vonage</option>
                  <option value="dialog">Dialog (Sri Lanka)</option>
                  <option value="mobitel">Mobitel (Sri Lanka)</option>
                </Select>
              </SettingsField>
              <SettingsField label="Account SID" required>
                <Input
                  value={settings.smsAccountSid || ""}
                  onChange={(e) => handleSettingChange("smsAccountSid", e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Auth Token" required>
                <Input
                  type="password"
                  value={settings.smsAuthToken || ""}
                  onChange={(e) => handleSettingChange("smsAuthToken", e.target.value)}
                  placeholder="Enter auth token"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Phone Number" required>
                <Input
                  value={settings.smsPhoneNumber || ""}
                  onChange={(e) => handleSettingChange("smsPhoneNumber", e.target.value)}
                  placeholder="+94771234567"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
            </SettingsGrid>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => testSMSConfiguration()}
                variant="outline"
                disabled={loading}
                className="rounded-xl border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Test SMS Configuration
              </Button>
            </div>
          </SettingsSection>
        );

      case "social":
        return (
          <SettingsSection
            title="Social Authentication"
            description="Configure social login options"
            icon="🔐"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <div className="space-y-6">
              <SettingsGrid>
                <SettingsField label="Google Client ID">
                  <Input
                    value={settings.googleClientId || ""}
                    onChange={(e) => handleSettingChange("googleClientId", e.target.value)}
                    placeholder="Google OAuth Client ID"
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </SettingsField>
                <SettingsField label="Google Client Secret">
                  <Input
                    type="password"
                    value={settings.googleClientSecret || ""}
                    onChange={(e) => handleSettingChange("googleClientSecret", e.target.value)}
                    placeholder="Google OAuth Client Secret"
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </SettingsField>
                <SettingsField label="Facebook App ID">
                  <Input
                    value={settings.facebookAppId || ""}
                    onChange={(e) => handleSettingChange("facebookAppId", e.target.value)}
                    placeholder="Facebook App ID"
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </SettingsField>
                <SettingsField label="Facebook App Secret">
                  <Input
                    type="password"
                    value={settings.facebookAppSecret || ""}
                    onChange={(e) => handleSettingChange("facebookAppSecret", e.target.value)}
                    placeholder="Facebook App Secret"
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </SettingsField>
              </SettingsGrid>

              <div className="space-y-4">
                <SettingsToggle
                  label="Enable Google Login"
                  description="Allow users to sign in with Google"
                  checked={settings.enableGoogleAuth || false}
                  onChange={(value) => handleSettingChange("enableGoogleAuth", value)}
                />
                <SettingsToggle
                  label="Enable Facebook Login"
                  description="Allow users to sign in with Facebook"
                  checked={settings.enableFacebookAuth || false}
                  onChange={(value) => handleSettingChange("enableFacebookAuth", value)}
                />
                <SettingsToggle
                  label="Enable Social Registration"
                  description="Allow new user registration via social login"
                  checked={settings.enableSocialRegistration || true}
                  onChange={(value) => handleSettingChange("enableSocialRegistration", value)}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => testSocialAuthConfiguration()}
                  variant="outline"
                  disabled={loading}
                  className="rounded-xl border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Test Social Auth Configuration
                </Button>
              </div>
            </div>
          </SettingsSection>
        );

      case "email":
        return (
          <SettingsSection
            title="Email Configuration"
            description="Set up email settings for notifications"
            icon="📧"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <SettingsGrid>
              <SettingsField label="SMTP Host" required>
                <Input
                  value={settings.smtpHost || ""}
                  onChange={(e) => handleSettingChange("smtpHost", e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="SMTP Port" required>
                <Input
                  type="number"
                  value={settings.smtpPort || "587"}
                  onChange={(e) => handleSettingChange("smtpPort", e.target.value)}
                  placeholder="587"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="SMTP Username" required>
                <Input
                  value={settings.smtpUser || ""}
                  onChange={(e) => handleSettingChange("smtpUser", e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="SMTP Password" required>
                <Input
                  type="password"
                  value={settings.smtpPassword || ""}
                  onChange={(e) => handleSettingChange("smtpPassword", e.target.value)}
                  placeholder="Enter SMTP password"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="From Email" required>
                <Input
                  type="email"
                  value={settings.smtpFrom || ""}
                  onChange={(e) => handleSettingChange("smtpFrom", e.target.value)}
                  placeholder="noreply@yourhotel.com"
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="SMTP Secure">
                <Select
                  value={settings.smtpSecure || "false"}
                  onChange={(e) => handleSettingChange("smtpSecure", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="true">True (SSL/TLS)</option>
                  <option value="false">False (STARTTLS)</option>
                </Select>
              </SettingsField>
            </SettingsGrid>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={testEmailConfiguration}
                variant="outline"
                disabled={loading}
                className="rounded-xl border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Test Email Configuration
              </Button>
            </div>
          </SettingsSection>
        );

      case "notifications":
        return (
          <SettingsSection
            title="Notification Preferences"
            description="Manage notification settings for users"
            icon="🔔"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <div className="space-y-4">
              <SettingsToggle
                label="Enable Email Notifications"
                description="Send notifications via email"
                checked={settings.enableEmailNotifications || false}
                onChange={(value) => handleSettingChange("enableEmailNotifications", value)}
              />
              <SettingsToggle
                label="Enable SMS Notifications"
                description="Send notifications via SMS"
                checked={settings.enableSMSNotifications || false}
                onChange={(value) => handleSettingChange("enableSMSNotifications", value)}
              />
              <SettingsToggle
                label="Booking Confirmations"
                description="Send confirmation emails for bookings"
                checked={settings.bookingConfirmations || false}
                onChange={(value) => handleSettingChange("bookingConfirmations", value)}
              />
              <SettingsToggle
                label="Promotional Emails"
                description="Send promotional and marketing emails"
                checked={settings.promotionalEmails || false}
                onChange={(value) => handleSettingChange("promotionalEmails", value)}
              />
              <SettingsToggle
                label="Admin Notifications"
                description="Send notifications to administrators"
                checked={settings.adminNotifications || false}
                onChange={(value) => handleSettingChange("adminNotifications", value)}
              />
            </div>
          </SettingsSection>
        );

      case "security":
        return (
          <SettingsSection
            title="Security Configuration"
            description="Configure security settings for your system"
            icon="🔒"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <SettingsGrid cols={3}>
              <SettingsField label="Minimum Password Length" description="6-20 characters">
                <Input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.passwordMinLength || "8"}
                  onChange={(e) => handleSettingChange("passwordMinLength", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Session Timeout" description="Minutes (5-120)">
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.sessionTimeout || "30"}
                  onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Max Login Attempts" description="3-10 attempts">
                <Input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts || "5"}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
            </SettingsGrid>
            <div className="space-y-4">
              <SettingsToggle
                label="Require Special Characters in Passwords"
                description="Passwords must contain special characters"
                checked={settings.requireSpecialCharacters || false}
                onChange={(value) => handleSettingChange("requireSpecialCharacters", value)}
              />
              <SettingsToggle
                label="Require Two-Factor Authentication for Admins"
                description="Enable 2FA for administrator accounts"
                checked={settings.twoFactorRequired || false}
                onChange={(value) => handleSettingChange("twoFactorRequired", value)}
              />
            </div>
          </SettingsSection>
        );

      case "booking":
        return (
          <SettingsSection
            title="Booking Configuration"
            description="Configure booking settings for guests"
            icon="📅"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <SettingsGrid>
              <SettingsField label="Max Advance Booking" description="Days (1-730)">
                <Input
                  type="number"
                  min="1"
                  max="730"
                  value={settings.maxAdvanceBooking || "365"}
                  onChange={(e) => handleSettingChange("maxAdvanceBooking", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Check-in Time">
                <Input
                  type="time"
                  value={settings.defaultCheckInTime || "15:00"}
                  onChange={(e) => handleSettingChange("defaultCheckInTime", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Check-out Time">
                <Input
                  type="time"
                  value={settings.defaultCheckOutTime || "11:00"}
                  onChange={(e) => handleSettingChange("defaultCheckOutTime", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Max Guests Per Room" description="1-10 guests">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxGuestsPerRoom || "4"}
                  onChange={(e) => handleSettingChange("maxGuestsPerRoom", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
            </SettingsGrid>
            <SettingsGrid cols={1}>
              <SettingsField label="Cancellation Policy">
                <Textarea
                  value={settings.cancellationPolicy || ""}
                  onChange={(e) => handleSettingChange("cancellationPolicy", e.target.value)}
                  rows={3}
                  placeholder="Enter your cancellation policy..."
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
            </SettingsGrid>
            <div className="space-y-4">
              <SettingsToggle
                label="Allow Guest Booking Without Registration"
                description="Guests can book without creating an account"
                checked={settings.allowGuestBooking || false}
                onChange={(value) => handleSettingChange("allowGuestBooking", value)}
              />
              <SettingsToggle
                label="Require Admin Approval for All Bookings"
                description="All bookings need administrator approval regardless of payment method"
                checked={settings.requireApprovalForAllBookings || false}
                onChange={(value) => handleSettingChange("requireApprovalForAllBookings", value)}
              />
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Method Approval Settings</h4>
                <div className="space-y-3">
                  <SettingsToggle
                    label="Require Approval for Cash Payments"
                    description="Bookings with cash payment require admin approval"
                    checked={settings.cashPaymentApprovalRequired || true}
                    onChange={(value) => handleSettingChange("cashPaymentApprovalRequired", value)}
                  />
                  <SettingsToggle
                    label="Require Approval for Bank Transfer Payments"
                    description="Bookings with bank transfer payment require admin approval"
                    checked={settings.bankTransferApprovalRequired || true}
                    onChange={(value) => handleSettingChange("bankTransferApprovalRequired", value)}
                  />
                  <SettingsToggle
                    label="Require Approval for Card Payments"
                    description="Bookings with card payment require admin approval"
                    checked={settings.cardPaymentApprovalRequired || false}
                    onChange={(value) => handleSettingChange("cardPaymentApprovalRequired", value)}
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Approval Workflow Settings</h4>
                <SettingsGrid>
                  <SettingsField label="Auto-Approval Threshold" description="Amount below which bookings are auto-approved">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.autoApprovalThreshold || "5000"}
                      onChange={(e) => handleSettingChange("autoApprovalThreshold", e.target.value)}
                      placeholder="5000"
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </SettingsField>
                  <SettingsField label="Approval Timeout" description="Hours after which pending bookings auto-expire">
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.approvalTimeoutHours || "24"}
                      onChange={(e) => handleSettingChange("approvalTimeoutHours", e.target.value)}
                      placeholder="24"
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </SettingsField>
                </SettingsGrid>
                <div className="space-y-3 mt-3">
                  <SettingsToggle
                    label="Allow Guest Booking Modifications"
                    description="Guests can modify their bookings while pending approval"
                    checked={settings.allowGuestBookingModifications || true}
                    onChange={(value) => handleSettingChange("allowGuestBookingModifications", value)}
                  />
                  <SettingsToggle
                    label="Show Approval Status to Guests"
                    description="Guests can see their booking approval status"
                    checked={settings.showApprovalStatusToGuests || true}
                    onChange={(value) => handleSettingChange("showApprovalStatusToGuests", value)}
                  />
                  <SettingsToggle
                    label="Enable Booking Reminders"
                    description="Send reminders to guests about their bookings"
                    checked={settings.enableBookingReminders || true}
                    onChange={(value) => handleSettingChange("enableBookingReminders", value)}
                  />
                  <SettingsField label="Reminder Hours Before Check-in">
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.reminderHoursBeforeCheckIn || "48"}
                      onChange={(e) => handleSettingChange("reminderHoursBeforeCheckIn", e.target.value)}
                      placeholder="48"
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </SettingsField>
                </div>
              </div>
            </div>
          </SettingsSection>
        );

      case "payment":
        return (
          <SettingsSection
            title="Payment Gateway"
            description="Configure payment processing settings"
            icon="💳"
            onSave={handleSaveSettings}
            loading={loading}
          >
            <SettingsGrid>
              <SettingsField label="Payment Provider" required>
                <Select
                  value={settings.paymentGateway?.provider || "payhere"}
                  onChange={(e) => handleSettingChange("paymentGateway.provider", e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <optgroup label="Sri Lanka">
                    <option value="payhere">PayHere 🇱🇰</option>
                  </optgroup>
                  <optgroup label="International">
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="square">Square</option>
                    <option value="razorpay">Razorpay</option>
                  </optgroup>
                </Select>
              </SettingsField>
              <SettingsField label="Public Key" required>
                <Input
                  value={settings.paymentGateway?.publicKey || ""}
                  onChange={(e) => handleSettingChange("paymentGateway.publicKey", e.target.value)}
                  placeholder="pk_test_..."
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Secret Key" required>
                <Input
                  type="password"
                  value={settings.paymentGateway?.secretKey || ""}
                  onChange={(e) => handleSettingChange("paymentGateway.secretKey", e.target.value)}
                  placeholder="sk_test_..."
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
              <SettingsField label="Webhook Secret">
                <Input
                  type="password"
                  value={settings.paymentGateway?.webhookSecret || ""}
                  onChange={(e) => handleSettingChange("paymentGateway.webhookSecret", e.target.value)}
                  placeholder="whsec_..."
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </SettingsField>
            </SettingsGrid>
            <div className="space-y-4">
              <SettingsToggle
                label="Test Mode"
                description="Use test/sandbox environment"
                checked={settings.paymentGateway?.testMode || true}
                onChange={(value) => handleSettingChange("paymentGateway.testMode", value)}
              />
              <SettingsToggle
                label="Auto Capture"
                description="Automatically capture payments"
                checked={settings.paymentGateway?.autoCapture || true}
                onChange={(value) => handleSettingChange("paymentGateway.autoCapture", value)}
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={validatePaymentGateway}
                variant="outline"
                disabled={loading}
                className="rounded-xl border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Validate Configuration
              </Button>
            </div>
          </SettingsSection>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h3>
            <p className="text-gray-600">
              The {tabs.find(tab => tab.id === activeTab)?.label} settings panel is under development.
            </p>
          </div>
        );
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
            {lastUpdated && (
              <p className="text-indigo-200 text-sm mt-1">
                🔄 Last updated: {lastUpdated.toLocaleString()}
                {loading && <span className="ml-2 text-yellow-300">⏳ Refreshing...</span>}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              className={`${autoRefresh ? "bg-green-500/20 border-green-300/30 text-green-100" : "bg-white/10 border-white/30 text-white"} hover:bg-white/20`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
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
            <Button
              onClick={handleBackupSettings}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Backup
            </Button>
            <label className="bg-white/10 border border-white/30 text-white hover:bg-white/20 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200">
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Restore
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreSettings}
                className="hidden"
              />
            </label>
            <Button
              onClick={handleResetToDefaults}
              variant="outline"
              className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Search and Tab Navigation */}
      <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search settings categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl text-left transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{tab.icon}</span>
                <h3 className="font-semibold text-sm">{tab.label}</h3>
              </div>
              <p className={`text-xs ${activeTab === tab.id ? "text-indigo-100" : "text-gray-500"}`}>
                {tab.description}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Settings Form */}
      <Card className="bg-white shadow-xl rounded-2xl border-0 p-8">
        {renderSettingsContent()}
      </Card>
    </div>
  );
}