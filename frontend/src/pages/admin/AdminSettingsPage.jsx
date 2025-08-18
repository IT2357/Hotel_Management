import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

export default function AdminSettingsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      hotelName: 'Grand Hotel',
      description: 'A luxury hotel experience',
      contactEmail: 'info@grandhotel.com',
      contactPhone: '+1 (555) 123-4567',
      address: '123 Hotel Street, City, State 12345',
      timezone: 'UTC',
      currency: 'USD'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@grandhotel.com',
      fromName: 'Grand Hotel'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      bookingConfirmations: true,
      promotionalEmails: true,
      adminNotifications: true
    },
    security: {
      passwordMinLength: 8,
      requireSpecialCharacters: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorRequired: false
    },
    booking: {
      allowGuestBooking: true,
      requireApproval: false,
      maxAdvanceBooking: 365,
      cancellationPolicy: '24 hours before check-in',
      checkInTime: '15:00',
      checkOutTime: '11:00'
    }
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'email', label: 'Email Settings', icon: '📧' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'booking', label: 'Booking Settings', icon: '📅' }
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async (category) => {
    setLoading(true);
    setSaveMessage('');
    
    try {
      // Mock API call - replace with actual settings service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Saving ${category} settings:`, settings[category]);
      setSaveMessage(`${category} settings saved successfully!`);
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    setLoading(true);
    try {
      // Mock API call to test email configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveMessage('Test email sent successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to send test email. Please check your configuration.');
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
        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-md ${
            saveMessage.includes('successfully') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
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

        {/* Settings Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Hotel Name"
                  value={settings.general.hotelName}
                  onChange={(e) => handleSettingChange('general', 'hotelName', e.target.value)}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) => handleSettingChange('general', 'contactEmail', e.target.value)}
                />
                <Input
                  label="Contact Phone"
                  value={settings.general.contactPhone}
                  onChange={(e) => handleSettingChange('general', 'contactPhone', e.target.value)}
                />
                <Select
                  label="Timezone"
                  value={settings.general.timezone}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </Select>
                <Select
                  label="Currency"
                  value={settings.general.currency}
                  onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Textarea
                  label="Hotel Description"
                  value={settings.general.description}
                  onChange={(e) => handleSettingChange('general', 'description', e.target.value)}
                  rows={3}
                />
                <Textarea
                  label="Address"
                  value={settings.general.address}
                  onChange={(e) => handleSettingChange('general', 'address', e.target.value)}
                  rows={2}
                />
              </div>
              <Button onClick={() => handleSaveSettings('general')} disabled={loading}>
                Save General Settings
              </Button>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Email Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="SMTP Host"
                  value={settings.email.smtpHost}
                  onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                />
                <Input
                  label="SMTP Port"
                  value={settings.email.smtpPort}
                  onChange={(e) => handleSettingChange('email', 'smtpPort', e.target.value)}
                />
                <Input
                  label="SMTP Username"
                  value={settings.email.smtpUser}
                  onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                />
                <Input
                  label="SMTP Password"
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                />
                <Input
                  label="From Email"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                />
                <Input
                  label="From Name"
                  value={settings.email.fromName}
                  onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <Button onClick={() => handleSaveSettings('email')} disabled={loading}>
                  Save Email Settings
                </Button>
                <Button onClick={testEmailConfiguration} variant="outline" disabled={loading}>
                  Test Configuration
                </Button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSaveSettings('notifications')} disabled={loading}>
                Save Notification Settings
              </Button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Security Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Minimum Password Length"
                  type="number"
                  min="6"
                  max="20"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                />
                <Input
                  label="Session Timeout (minutes)"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                />
                <Input
                  label="Max Login Attempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Require Special Characters in Passwords
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.security.requireSpecialCharacters}
                    onChange={(e) => handleSettingChange('security', 'requireSpecialCharacters', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Require Two-Factor Authentication for Admins
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorRequired}
                    onChange={(e) => handleSettingChange('security', 'twoFactorRequired', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <Button onClick={() => handleSaveSettings('security')} disabled={loading}>
                Save Security Settings
              </Button>
            </div>
          )}

          {/* Booking Settings */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Booking Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Max Advance Booking (days)"
                  type="number"
                  min="1"
                  max="730"
                  value={settings.booking.maxAdvanceBooking}
                  onChange={(e) => handleSettingChange('booking', 'maxAdvanceBooking', parseInt(e.target.value))}
                />
                <Input
                  label="Check-in Time"
                  type="time"
                  value={settings.booking.checkInTime}
                  onChange={(e) => handleSettingChange('booking', 'checkInTime', e.target.value)}
                />
                <Input
                  label="Check-out Time"
                  type="time"
                  value={settings.booking.checkOutTime}
                  onChange={(e) => handleSettingChange('booking', 'checkOutTime', e.target.value)}
                />
              </div>
              <Textarea
                label="Cancellation Policy"
                value={settings.booking.cancellationPolicy}
                onChange={(e) => handleSettingChange('booking', 'cancellationPolicy', e.target.value)}
                rows={3}
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Allow Guest Booking Without Registration
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.booking.allowGuestBooking}
                    onChange={(e) => handleSettingChange('booking', 'allowGuestBooking', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Require Admin Approval for Bookings
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.booking.requireApproval}
                    onChange={(e) => handleSettingChange('booking', 'requireApproval', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <Button onClick={() => handleSaveSettings('booking')} disabled={loading}>
                Save Booking Settings
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}