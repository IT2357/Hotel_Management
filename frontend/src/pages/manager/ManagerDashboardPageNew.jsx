import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Star,
  User,
  MapPin,
  Activity
} from "lucide-react";

const ManagerDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data matching your design
      const mockData = {
        metrics: {
          totalTasks: { value: 5, change: -12, label: 'Active tasks in system' },
          pendingTasks: { value: 2, label: 'Awaiting assignment' },
          staffOnline: { value: 4, total: 5, label: 'Currently available' },
          avgCompletionTime: { value: 31, unit: 'm', change: 8, label: 'Task completion time' },
          completedToday: { value: 2, label: 'Tasks finished' },
          averageRating: { value: 4.7, change: 5, label: 'Staff performance' },
          inProgress: { value: 1, label: 'Currently being handled' },
          efficiencyRate: { value: 94, change: 3, label: 'Task completion rate' }
        },
        statusDistribution: [
          { status: 'pending', count: 2, percentage: 40 },
          { status: 'in-progress', count: 1, percentage: 20 },
          { status: 'completed', count: 2, percentage: 40 }
        ],
        recentActivity: [
          {
            id: '1',
            title: 'Kitchen - Special Diet Meal',
            category: 'Kitchen',
            status: 'pending',
            priority: 'urgent',
            guestName: 'Tom Brown',
            roomNumber: '501',
            timeAgo: '16m ago'
          },
          {
            id: '2',
            title: 'Room Service - Breakfast',
            category: 'Room Service',
            status: 'pending',
            priority: 'medium',
            guestName: 'John Doe',
            roomNumber: '204',
            timeAgo: '31m ago'
          },
          {
            id: '3',
            title: 'Housekeeping - Extra Towels',
            category: 'Housekeeping',
            status: 'in-progress',
            priority: 'low',
            guestName: 'Jane Smith',
            roomNumber: '312',
            timeAgo: '46m ago',
            assignedTo: { name: 'Bob Smith', role: 'Housekeeping' }
          },
          {
            id: '4',
            title: 'Maintenance - AC Repair',
            category: 'Maintenance',
            status: 'completed',
            priority: 'high',
            guestName: 'Mike Johnson',
            roomNumber: '156',
            timeAgo: '2h ago',
            assignedTo: { name: 'Carol Davis', role: 'Maintenance' }
          }
        ],
        topPerformers: [
          { id: '1', name: 'Carol Davis', department: 'Maintenance', rating: 4.9, successRate: 98, avgTime: 45, isOnline: true, rank: 1 },
          { id: '2', name: 'Alice Johnson', department: 'Kitchen', rating: 4.8, successRate: 95, avgTime: 25, isOnline: true, rank: 2 },
          { id: '3', name: 'David Wilson', department: 'Server', rating: 4.7, successRate: 96, avgTime: 20, isOnline: true, rank: 3 },
          { id: '4', name: 'Bob Smith', department: 'Housekeeping', rating: 4.6, successRate: 96, avgTime: 35, isOnline: true, rank: 4 }
        ]
      };
      setDashboardData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { metrics, statusDistribution, recentActivity, topPerformers } = dashboardData;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scroll-smooth">{/* Added smooth scrolling */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-8">{/* Added responsive padding and bottom padding */}
        

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tasks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{metrics.totalTasks.value}</span>
              <span className="ml-2 text-sm text-red-500">-{Math.abs(metrics.totalTasks.change)}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{metrics.totalTasks.label}</p>
          </div>

          {/* Pending Tasks */}
          <div className="bg-yellow-300 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Pending Tasks</h3>
              <AlertTriangle className="h-5 w-5 opacity-90" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{metrics.pendingTasks.value}</span>
            </div>
            <p className="text-sm opacity-90 mt-1">{metrics.pendingTasks.label}</p>
          </div>

          {/* Staff Online */}
          <div className="bg-green-400 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Staff Online</h3>
              <Users className="h-5 w-5 opacity-90" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{metrics.staffOnline.value}/{metrics.staffOnline.total}</span>
            </div>
            <p className="text-sm opacity-90 mt-1">{metrics.staffOnline.label}</p>
          </div>

          {/* Avg Completion */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Completion</h3>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{metrics.avgCompletionTime.value}{metrics.avgCompletionTime.unit}</span>
              <span className="ml-2 text-sm text-green-500">+{metrics.avgCompletionTime.change}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{metrics.avgCompletionTime.label}</p>
          </div>
        </div>

        {/* Second Row Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Completed Today */}
          <div className="bg-blue-400 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Completed Today</h3>
              <CheckCircle className="h-5 w-5 opacity-90" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{metrics.completedToday.value}</span>
            </div>
            <p className="text-sm opacity-90 mt-1">{metrics.completedToday.label}</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{metrics.averageRating.value}</span>
              <span className="ml-2 text-sm text-green-500">+{metrics.averageRating.change}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{metrics.averageRating.label}</p>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{metrics.inProgress.value}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{metrics.inProgress.label}</p>
          </div>

          {/* Efficiency Rate */}
          <div className="bg-green-400 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Efficiency Rate</h3>
              <TrendingUp className="h-5 w-5 opacity-90" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{metrics.efficiencyRate.value}%</span>
              <span className="ml-2 text-sm opacity-90">+{metrics.efficiencyRate.change}%</span>
            </div>
            <p className="text-sm opacity-90 mt-1">{metrics.efficiencyRate.label}</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Status Distribution</h3>
            <div className="space-y-6">
              {statusDistribution.map((item, index) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'pending' ? 'bg-yellow-400' :
                        item.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.status === 'in-progress' ? 'In Progress' : item.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{item.count}</span>
                      <span className="text-sm text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.status === 'pending' ? 'bg-yellow-400' :
                        item.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Tasks</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {statusDistribution.reduce((sum, item) => sum + item.count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-start space-x-3 py-2">
                  {/* Status Icon */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    activity.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                    activity.status === 'in-progress' ? 'bg-blue-50 border-blue-400' :
                    'bg-green-50 border-green-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'pending' ? 'bg-yellow-400' :
                      activity.status === 'in-progress' ? 'bg-blue-400' :
                      'bg-green-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Task Title */}
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {activity.title.includes(' - ') ? activity.title.split(' - ')[0] + ' - ' + activity.title.split(' - ')[1].substring(0, 20) + '...' : activity.title}
                        </div>
                        
                        {/* Room and Guest Info */}
                        <div className="text-xs text-gray-500 mb-2">
                          {activity.roomNumber} • {activity.guestName}
                        </div>
                        
                        {/* Staff Assignment */}
                        {activity.assignedTo && (
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-sm flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                {activity.assignedTo.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600">{activity.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status and Time */}
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          activity.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {activity.status === 'in-progress' ? 'in progress' : activity.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {activity.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performers</h3>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center space-x-4">
                  {/* Rank Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  
                  {/* Initials */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-700">
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  {/* Name, Department and Metrics */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {performer.name.length > 10 ? performer.name.substring(0, 8) + '...' : performer.name}
                        </span>
                        {performer.isOnline && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                      </div>
                      <div className={`flex items-center space-x-1 ${
                        performer.rating >= 4.8 ? 'text-green-500' :
                        performer.rating >= 4.7 ? 'text-green-400' :
                        performer.rating >= 4.6 ? 'text-yellow-500' :
                        'text-orange-500'
                      }`}>
                        <span className="text-sm font-bold">{performer.rating}</span>
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">{performer.department}</div>
                    
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-gray-600">{performer.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-gray-600">{performer.successRate}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{performer.avgTime}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;