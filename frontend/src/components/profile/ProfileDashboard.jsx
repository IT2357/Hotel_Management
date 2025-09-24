import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Activity, 
  Shield, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  Eye,
  Lock,
  Bell,
  Smartphone,
  Globe,
  Download,
  Upload,
  TrendingUp,
  Users as UsersIcon,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const ProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'John Anderson',
    email: 'john.anderson@company.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    role: 'Manager',
    department: 'Operations',
    joinDate: '2023-01-15',
    lastActive: '2 hours ago'
  });

  // Role-based colors matching your system
  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'staff':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const statsCards = [
    {
      title: 'Total Sessions',
      value: '1,247',
      change: '+12%',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      iconBg: 'bg-blue-500',
      icon: Activity
    },
    {
      title: 'Projects Managed',
      value: '23',
      change: '+5%',
      color: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
      iconBg: 'bg-purple-500',
      icon: UsersIcon
    },
    {
      title: 'Tasks Completed',
      value: '456',
      change: '+18%',
      color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
      iconBg: 'bg-green-500',
      icon: CheckCircle
    },
    {
      title: 'Performance Score',
      value: '94%',
      change: '+3%',
      color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200',
      iconBg: 'bg-emerald-500',
      icon: TrendingUp
    }
  ];

  const recentActivities = [
    {
      action: 'Completed project review',
      time: '2 hours ago',
      status: 'completed',
      icon: CheckCircle
    },
    {
      action: 'Updated team permissions',
      time: '5 hours ago',
      status: 'completed',
      icon: Shield
    },
    {
      action: 'Login from new device',
      time: '1 day ago',
      status: 'warning',
      icon: AlertCircle
    },
    {
      action: 'Password changed',
      time: '3 days ago',
      status: 'completed',
      icon: Lock
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{userInfo.name}</h1>
                <p className="text-indigo-100 text-lg">{userInfo.department} • {userInfo.role}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userInfo.role)}` }>
                    {userInfo.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor('active')}` }>
                    Active
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-100">Last active</p>
              <p className="text-white font-semibold">{userInfo.lastActive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className={`p-6 rounded-lg border ${stat.color}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-green-600">{stat.change} from last month</p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    { icon: User, label: 'Full Name', field: 'name', value: userInfo.name },
                    { icon: Mail, label: 'Email', field: 'email', value: userInfo.email },
                    { icon: Phone, label: 'Phone', field: 'phone', value: userInfo.phone },
                    { icon: MapPin, label: 'Location', field: 'location', value: userInfo.location }
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">{item.label}</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => handleInputChange(item.field, e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          ) : (
                            <p className="text-gray-900">{item.value}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.status === 'completed' ? 'bg-green-100' :
                          activity.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            activity.status === 'completed' ? 'text-green-600' :
                            activity.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Timeline</h3>
            <div className="space-y-6">
              {[
                { date: 'Today', activities: [
                  { time: '2:30 PM', action: 'Reviewed quarterly reports', type: 'work' },
                  { time: '11:45 AM', action: 'Team standup meeting', type: 'meeting' },
                  { time: '9:15 AM', action: 'Logged in from desktop', type: 'system' }
                ]},
                { date: 'Yesterday', activities: [
                  { time: '4:20 PM', action: 'Approved budget proposal', type: 'work' },
                  { time: '2:10 PM', action: 'Updated project timeline', type: 'work' },
                  { time: '10:30 AM', action: 'Client call - Project Alpha', type: 'meeting' }
                ]},
                { date: 'December 20, 2024', activities: [
                  { time: '3:45 PM', action: 'Password changed', type: 'security' },
                  { time: '1:20 PM', action: 'Downloaded monthly report', type: 'system' },
                  { time: '9:00 AM', action: 'Department meeting', type: 'meeting' }
                ]}
              ].map((day, dayIndex) => (
                <div key={dayIndex}>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{day.date}</h4>
                  <div className="space-y-3 ml-4">
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="flex items-center space-x-3 relative">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'work' ? 'bg-blue-500' :
                          activity.type === 'meeting' ? 'bg-green-500' :
                          activity.type === 'security' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-900">{activity.action}</p>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Password Strength</p>
                    <p className="text-2xl font-bold text-gray-900">Strong</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Two-Factor Auth</p>
                    <p className="text-2xl font-bold text-gray-900">Enabled</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-4">
                {[
                  { label: 'Change Password', description: 'Update your account password', action: 'Change' },
                  { label: 'Two-Factor Authentication', description: 'Add an extra layer of security', action: 'Configure' },
                  { label: 'Login Notifications', description: 'Get notified of new logins', action: 'Manage' },
                  { label: 'Active Sessions', description: 'View and manage your active sessions', action: 'View All' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <button className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors">
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', description: 'Receive updates via email', enabled: true },
                  { label: 'Push Notifications', description: 'Browser and mobile notifications', enabled: true },
                  { label: 'SMS Alerts', description: 'Important alerts via SMS', enabled: false },
                  { label: 'Weekly Digest', description: 'Summary of your weekly activity', enabled: true }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={item.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Data & Privacy</h3>
              <div className="space-y-4">
                {[
                  { label: 'Export Data', description: 'Download your account data', icon: Download, action: 'Export' },
                  { label: 'Data Retention', description: 'Manage how long we keep your data', icon: Clock, action: 'Configure' },
                  { label: 'Privacy Settings', description: 'Control your privacy preferences', icon: Eye, action: 'Manage' },
                  { label: 'Delete Account', description: 'Permanently delete your account', icon: XCircle, action: 'Delete', danger: true }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <button className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        item.danger 
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                          : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                      }`}>
                        {item.action}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;
