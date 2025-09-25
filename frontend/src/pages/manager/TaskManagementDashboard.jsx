import React, { useState } from 'react';
import { 
  ClipboardList, UserCheck, TrendingUp, 
  Bell, Settings
} from 'lucide-react';
import TaskAssignmentPage from './TaskAssignmentPage';
import TaskStatusDashboard from './TaskStatusDashboard';
import TaskOverview from './TaskOverview';

const TaskManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'assign', label: 'Task Assignment', icon: UserCheck },
    { id: 'status', label: 'Status Dashboard', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
              <p className="text-gray-600">Manage guest requests and task assignments</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="h-6 w-6" />
                </button>
              </div>
              
              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'overview' && <TaskOverview />}
        {activeTab === 'assign' && <TaskAssignmentPage />}
        {activeTab === 'status' && <TaskStatusDashboard />}
      </div>
    </div>
  );
};

export default TaskManagementDashboard;