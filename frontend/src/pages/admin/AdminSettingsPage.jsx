import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import adminService from '../../services/adminService';

export default function AdminSettingsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'Hotel Management System',
    hotelName: 'Grand Hotel',
    description: 'A luxury hotel experience',
    contactEmail: 'info@grandhotel.com',
    contactPhone: '+1 (555) 123-4567',
    address: '123 Hotel Street, City, State 12345',
    timezone: 'UTC',
    currency: 'USD',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587', // String for input type="number"
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: 'noreply@grandhotel.com',
    smtpSecure: 'false', // String for select
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    bookingConfirmations: true,
    promotionalEmails: true,
    adminNotifications: true,
    passwordMinLength: '8', // String for input type="number"
    sessionTimeout: '30', // String for input type="number"
    maxLoginAttempts: '5', // String for input type="number"
    twoFactorRequired: false,
    allowGuestBooking: true,
    requireApproval: false,
    maxAdvanceBooking: '365', // String for input type="number"
    cancellationPolicy: '24 hours before check-in',
    defaultCheckInTime: '15:00',
    defaultCheckOutTime: '11:00',
    maxGuestsPerRoom: '4', // String for input type="number"
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await adminService.getAdminSettings();
        const fetchedSettings = response.data;
        console.log('Fetched settings:', fetchedSettings);

        // Define expected types and defaults
        const defaults = {
          siteName: 'Hotel Management System',
          hotelName: 'Grand Hotel',
          description: 'A luxury hotel experience',
          contactEmail: 'info@grandhotel.com',
          contactPhone: '+1 (555) 123-4567',
          address: '123 Hotel Street, City, State 12345',
          timezone: 'UTC',
          currency: 'USD',
          smtpHost: 'smtp.gmail.com',
          smtpPort: '587',
          smtpUser: '',
          smtpPassword: '',
          smtpFrom: 'noreply@grandhotel.com',
          smtpSecure: 'false',
          enableEmailNotifications: true,
          enableSMSNotifications: false,
          bookingConfirmations: true,
          promotionalEmails: true,
          adminNotifications: true,
          passwordMinLength: '8',
          sessionTimeout: '30',
          maxLoginAttempts: '5',
          twoFactorRequired: false,
          allowGuestBooking: true,
          requireApproval: false,
          maxAdvanceBooking: '365',
          cancellationPolicy: '24 hours before check-in',
          defaultCheckInTime: '15:00',
          defaultCheckOutTime: '11:00',
          maxGuestsPerRoom: '4',
          maintenanceMode: false,
        };

        // Sanitize and type-cast fetched settings
        const sanitizedSettings = {};
        Object.keys(defaults).forEach((key) => {
          let value = fetchedSettings[key];
          if (value === undefined || value === null) {
            value = defaults[key];
          } else {
            // Type casting for specific fields
            if (['smtpPort', 'passwordMinLength', 'sessionTimeout', 'maxLoginAttempts', 'maxAdvanceBooking', 'maxGuestsPerRoom'].includes(key)) {
              value = String(value); // Ensure string for number inputs
            } else if (key === 'smtpSecure') {
              value = String(value); // Ensure string for select
            } else if (typeof defaults[key] === 'boolean') {
              value = Boolean(value); // Ensure boolean
            }
          }
          sanitizedSettings[key] = value;
        });

        console.log('Sanitized settings:', sanitizedSettings); // Debug
        setSettings(sanitizedSettings);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setSaveMessage(`Failed to load settings: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'email', label: 'Email Settings', icon: '📧' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'booking', label: 'Booking Settings', icon: '📅' },
  ];

  const handleSettingChange = (key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      if (['smtpPort', 'passwordMinLength', 'sessionTimeout', 'maxLoginAttempts', 'maxAdvanceBooking', 'maxGuestsPerRoom'].includes(key)) {
        newSettings[key] = value; // Keep as string for input
      } else if (key === 'smtpSecure') {
        newSettings[key] = value; // Keep as string for select
      } else if (typeof prev[key] === 'boolean') {
        newSettings[key] = value === true || value === 'true';
      } else {
        newSettings[key] = value;
      }
      return newSettings;
    });
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveMessage('');
    try {
      // Convert string values to correct types for backend
      const payload = {
        ...settings,
        smtpPort: parseInt(settings.smtpPort, 10),
        smtpSecure: settings.smtpSecure === 'true',
        passwordMinLength: parseInt(settings.passwordMinLength, 10),
        sessionTimeout: parseInt(settings.sessionTimeout, 10),
        maxLoginAttempts: parseInt(settings.maxLoginAttempts, 10),
        maxAdvanceBooking: parseInt(settings.maxAdvanceBooking, 10),
        maxGuestsPerRoom: parseInt(settings.maxGuestsPerRoom, 10),
      };
      console.log('Saving settings:', payload);
      const response = await adminService.updateAdminSettings(payload);
      const updatedSettings = response.data;

      // Sanitize updated settings from backend
      const sanitizedSettings = {};
      Object.keys(settings).forEach((key) => {
        let value = updatedSettings[key];
        if (value === undefined || value === null) {
          value = settings[key];
        } else if (['smtpPort', 'passwordMinLength', 'sessionTimeout', 'maxLoginAttempts', 'maxAdvanceBooking', 'maxGuestsPerRoom'].includes(key)) {
          value = String(value);
        } else if (key === 'smtpSecure') {
          value = String(value);
        }
        sanitizedSettings[key] = value;
      });

      setSettings(sanitizedSettings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage(`Failed to save settings: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    setLoading(true);
    try {
      console.log('Testing email with:', {
        smtpHost: settings.smtpHost,
        smtpPort: parseInt(settings.smtpPort, 10),
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFrom: settings.smtpFrom,
        smtpSecure: settings.smtpSecure === 'true',
      });
      await adminService.testEmailConfig({
        smtpHost: settings.smtpHost,
        smtpPort: parseInt(settings.smtpPort, 10),
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFrom: settings.smtpFrom,
        smtpSecure: settings.smtpSecure === 'true',
      });
      setSaveMessage('Test email sent successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to test email:', error);
      setSaveMessage(`Failed to send test email: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure hotel management system settings</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-md ${
              saveMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {saveMessage}
          </div>
        )}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Site Name"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange('siteName', e.target.value)}
                />
                <Input
                  label="Hotel Name"
                  value={settings.hotelName}
                  onChange={(e) => handleSettingChange('hotelName', e.target.value)}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                />
                <Input
                  label="Contact Phone"
                  value={settings.contactPhone}
                  onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                />
                <Select
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </Select>
                <Select
                  label="Currency"
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Textarea
                  label="Hotel Description"
                  value={settings.description}
                  onChange={(e) => handleSettingChange('description', e.target.value)}
                  rows={3}
                />
                <Textarea
                  label="Address"
                  value={settings.address}
                  onChange={(e) => handleSettingChange('address', e.target.value)}
                  rows={2}
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={loading}>
                Save General Settings
              </Button>
            </div>
          )}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Email Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="SMTP Host"
                  value={settings.smtpHost}
                  onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
                />
                <Input
                  label="SMTP Port"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => handleSettingChange('smtpPort', e.target.value)}
                />
                <Input
                  label="SMTP Username"
                  value={settings.smtpUser}
                  onChange={(e) => handleSettingChange('smtpUser', e.target.value)}
                />
                <Input
                  label="SMTP Password"
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
                />
                <Input
                  label="From Email"
                  type="email"
                  value={settings.smtpFrom}
                  onChange={(e) => handleSettingChange('smtpFrom', e.target.value)}
                />
                <Select
                  label="SMTP Secure"
                  value={settings.smtpSecure}
                  onChange={(e) => handleSettingChange('smtpSecure', e.target.value)}
                >
                  <option value="true">True (SSL/TLS)</option>
                  <option value="false">False (STARTTLS)</option>
                </Select>
              </div>
              <div className="flex space-x-4">
                <Button onClick={handleSaveSettings} disabled={loading}>
                  Save Email Settings
                </Button>
                <Button onClick={testEmailConfiguration} variant="outline" disabled={loading}>
                  Test Email Configuration
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Email Notifications</label>
                  <input
                    type="checkbox"
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => handleSettingChange('enableEmailNotifications', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable SMS Notifications</label>
                  <input
                    type="checkbox"
                    checked={settings.enableSMSNotifications}
                    onChange={(e) => handleSettingChange('enableSMSNotifications', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Booking Confirmations</label>
                  <input
                    type="checkbox"
                    checked={settings.bookingConfirmations}
                    onChange={(e) => handleSettingChange('bookingConfirmations', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Promotional Emails</label>
                  <input
                    type="checkbox"
                    checked={settings.promotionalEmails}
                    onChange={(e) => handleSettingChange('promotionalEmails', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Admin Notifications</label>
                  <input
                    type="checkbox"
                    checked={settings.adminNotifications}
                    onChange={(e) => handleSettingChange('adminNotifications', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={loading}>
                Save Notification Settings
              </Button>
            </div>
          )}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Security Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Minimum Password Length"
                  type="number"
                  min="6"
                  max="20"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleSettingChange('passwordMinLength', e.target.value)}
                />
                <Input
                  label="Session Timeout (minutes)"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                />
                <Input
                  label="Max Login Attempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Require Special Characters in Passwords</label>
                  <input
                    type="checkbox"
                    checked={settings.requireSpecialCharacters}
                    onChange={(e) => handleSettingChange('requireSpecialCharacters', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Require Two-Factor Authentication for Admins</label>
                  <input
                    type="checkbox"
                    checked={settings.twoFactorRequired}
                    onChange={(e) => handleSettingChange('twoFactorRequired', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={loading}>
                Save Security Settings
              </Button>
            </div>
          )}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Booking Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Max Advance Booking (days)"
                  type="number"
                  min="1"
                  max="730"
                  value={settings.maxAdvanceBooking}
                  onChange={(e) => handleSettingChange('maxAdvanceBooking', e.target.value)}
                />
                <Input
                  label="Check-in Time"
                  type="time"
                  value={settings.defaultCheckInTime}
                  onChange={(e) => handleSettingChange('defaultCheckInTime', e.target.value)}
                />
                <Input
                  label="Check-out Time"
                  type="time"
                  value={settings.defaultCheckOutTime}
                  onChange={(e) => handleSettingChange('defaultCheckOutTime', e.target.value)}
                />
                <Input
                  label="Max Guests Per Room"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxGuestsPerRoom}
                  onChange={(e) => handleSettingChange('maxGuestsPerRoom', e.target.value)}
                />
              </div>
              <Textarea
                label="Cancellation Policy"
                value={settings.cancellationPolicy}
                onChange={(e) => handleSettingChange('cancellationPolicy', e.target.value)}
                rows={3}
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Allow Guest Booking Without Registration</label>
                  <input
                    type="checkbox"
                    checked={settings.allowGuestBooking}
                    onChange={(e) => handleSettingChange('allowGuestBooking', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Require Admin Approval for Bookings</label>
                  <input
                    type="checkbox"
                    checked={settings.requireApproval}
                    onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={loading}>
                Save Booking Settings
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}