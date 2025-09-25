import React, { useState, useEffect } from 'react';
import { 
  Clock, Users, CheckCircle, AlertTriangle, 
  UserCheck, Bell, TrendingUp, Calendar, ArrowRight
} from 'lucide-react';
import api from '../../services/api';

const TaskOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);

  useEffect(() => {
    fetchOverview();
    fetchNotifications();
    fetchUrgentTasks();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchOverview();
      fetchUrgentTasks();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/manager/tasks/overview');
      setOverview(response.data.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=5');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUrgentTasks = async () => {
    try {
      const response = await api.get('/manager/tasks/pending?priority=critical,high&limit=5');
      setUrgentTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching urgent tasks:', error);
    }
  };

  const getStatusCount = (status) => {
    return overview?.statusCounts?.find(s => s._id === status)?.count || 0;
  };

  const formatTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - new Date(date)) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600">{getStatusCount('pending')}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting assignment</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-400" />
          </div>
          {getStatusCount('pending') > 5 && (
            <div className="mt-3 flex items-center text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              High volume - consider auto-assignment
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
              <p className="text-3xl font-bold text-blue-600">{getStatusCount('assigned')}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to start</p>
            </div>
            <Users className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-purple-600">{getStatusCount('in-progress')}</p>
              <p className="text-xs text-gray-500 mt-1">Being worked on</p>
            </div>
            <UserCheck className="h-10 w-10 text-purple-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-3xl font-bold text-green-600">{getStatusCount('completed')}</p>
              <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Urgent Tasks
            </h3>
            <span className="text-sm text-gray-500">Requires immediate attention</span>
          </div>
          
          {urgentTasks.length > 0 ? (
            <div className="space-y-3">
              {urgentTasks.map((task) => {
                const minutesAgo = Math.floor((Date.now() - new Date(task.requestedAt)) / (1000 * 60));
                const isAutoAssignmentNear = minutesAgo >= 4;
                
                return (
                  <div key={task._id} className={`p-3 rounded-lg border-l-4 ${
                    task.priority === 'critical' ? 'bg-red-50 border-red-400' : 'bg-orange-50 border-orange-400'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          {task.guestId?.name} - Room {task.roomNumber}
                        </p>
                        <p className="text-sm text-gray-500">{task.department}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          task.priority === 'critical' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {formatTimeAgo(task.requestedAt)}
                        </div>
                        {isAutoAssignmentNear && (
                          <div className="text-xs text-red-600 mt-1">
                            Auto-assigns in {5 - minutesAgo}m
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
                View All Urgent Tasks
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500">No urgent tasks at the moment</p>
              <p className="text-sm text-gray-400">Great job keeping up!</p>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Recent Notifications
            </h3>
            <span className="text-sm text-gray-500">Last 24 hours</span>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification._id} className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
              ))}
              
              <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
                View All Notifications
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No recent notifications</p>
            </div>
          )}
        </div>
      </div>

      {/* Department Performance */}
      {overview?.departmentStats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Department Performance
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Today's stats
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.departmentStats.map((dept) => {
              const completionRate = dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0;
              const efficiency = completionRate >= 80 ? 'high' : completionRate >= 60 ? 'medium' : 'low';
              
              return (
                <div key={dept._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{dept._id}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      efficiency === 'high' ? 'bg-green-100 text-green-800' :
                      efficiency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {efficiency} efficiency
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Completion Rate</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          efficiency === 'high' ? 'bg-green-600' :
                          efficiency === 'medium' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold text-gray-900">{dept.total}</div>
                      <div className="text-gray-600">Total</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-600">{dept.completed}</div>
                      <div className="text-gray-600">Done</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-semibold text-yellow-600">{dept.pending || 0}</div>
                      <div className="text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-600">{(dept.assigned || 0) + (dept.inProgress || 0)}</div>
                      <div className="text-gray-600">Active</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
            <UserCheck className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Assign Pending Tasks</h4>
            <p className="text-sm text-gray-600">Quickly assign tasks to available staff</p>
          </button>
          
          <button className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left">
            <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">View Status Dashboard</h4>
            <p className="text-sm text-gray-600">Monitor task progress and completion</p>
          </button>
          
          <button className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
            <Clock className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Generate Reports</h4>
            <p className="text-sm text-gray-600">Create task performance reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;