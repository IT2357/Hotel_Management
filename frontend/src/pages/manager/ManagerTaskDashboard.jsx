import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, reportsAPI, formatters } from '../../services/taskManagementAPI';

const ManagerTaskDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentTasks: [],
    delayedTasks: [],
    workloadReport: null,
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState({
    department: 'all',
    timeRange: 'today'
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));

      // Calculate date range based on timeRange filter
      const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (filters.timeRange) {
          case 'today':
            return { startDate: today, endDate: now };
          case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);
            return { startDate: weekStart, endDate: now };
          case 'month':
            const monthStart = new Date(today);
            monthStart.setMonth(today.getMonth() - 1);
            return { startDate: monthStart, endDate: now };
          default:
            return {};
        }
      };

      const dateRange = getDateRange();
      const commonParams = {
        ...dateRange,
        ...(filters.department !== 'all' && { department: filters.department })
      };

      // Fetch all dashboard data in parallel with individual error handling
      console.log('Starting API calls with params:', commonParams);
      
      let statsRes, recentTasksRes, delayedTasksRes, workloadRes;
      
      try {
        console.log('Calling taskAPI.getTaskStats...');
        statsRes = await taskAPI.getTaskStats(commonParams);
        console.log('Stats response:', statsRes);
      } catch (error) {
        console.error('getTaskStats failed:', error.response?.data || error.message);
        statsRes = { data: { totalTasks: 0, pendingTasks: 0, completedTasks: 0, departments: [] } };
      }

      try {
        console.log('Calling taskAPI.getAllTasks...');
        recentTasksRes = await taskAPI.getAllTasks({ ...commonParams, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
        console.log('Recent tasks response:', recentTasksRes);
      } catch (error) {
        console.error('getAllTasks failed:', error.response?.data || error.message);
        recentTasksRes = { data: { tasks: [] } };
      }

      try {
        console.log('Calling reportsAPI.getDelayedTasksReport...');
        delayedTasksRes = await reportsAPI.getDelayedTasksReport({ department: filters.department });
        console.log('Delayed tasks response:', delayedTasksRes);
      } catch (error) {
        console.error('getDelayedTasksReport failed:', error.response?.data || error.message);
        delayedTasksRes = { data: [] };
      }

      try {
        console.log('Calling reportsAPI.getWorkloadReport...');
        workloadRes = await reportsAPI.getWorkloadReport({ department: filters.department });
        console.log('Workload response:', workloadRes);
      } catch (error) {
        console.error('getWorkloadReport failed:', error.response?.data || error.message);
        workloadRes = { data: {} };
      }

      // Set dashboard data with all responses
      setDashboardData({
        stats: statsRes.data,
        recentTasks: recentTasksRes.data.tasks,
        delayedTasks: delayedTasksRes.data,
        workloadReport: workloadRes.data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: `Failed to load dashboard data: ${error.message}`
      }));
    }
  }, [filters.department, filters.timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{dashboardData.error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentTasks, delayedTasks, workloadReport } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage hotel operations</p>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              to="/manager/reports"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              📊 Reports Dashboard
            </Link>
          </div>
          
          {/* Filters */}
          <div className="flex space-x-4 mt-4 lg:mt-0">
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Services">Services</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Cleaning">Cleaning</option>
            </select>
            
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/manager/tasks/create"
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-semibold">Create Task</div>
          </Link>
          
          <Link
            to="/manager/tasks/assign"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold">Assign Tasks</div>
          </Link>
          
          <Link
            to="/manager/tasks/feedback"
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">View Reports</div>
          </Link>
          
          <Link
            to="/manager/tasks/feedback"
            className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold">Feedback</div>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalTasks || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <div className="text-2xl">📋</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats?.overview?.completedTasks || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <div className="text-2xl">✅</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.overview?.inProgressTasks || 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <div className="text-2xl">🔄</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{delayedTasks?.summary?.total || 0}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <div className="text-2xl">⚠️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
              <Link
                to="/manager/tasks/assign"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatPriority(task.priority).class}`}>
                          {formatters.formatPriority(task.priority).label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatTaskStatus(task.status).class}`}>
                          {formatters.formatTaskStatus(task.status).label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center ${formatters.formatDepartment(task.department).color} px-2 py-1 rounded`}>
                          {formatters.formatDepartment(task.department).icon} {task.department}
                        </span>
                        <span>Room {task.roomNumber}</span>
                        {task.assignedTo && <span>→ {task.assignedTo.name}</span>}
                      </div>
                      <span>{formatters.formatRelativeTime(task.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">📋</div>
                  <p>No recent tasks found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Department Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Department Performance</h3>
              {stats?.departmentBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {stats.departmentBreakdown.map((dept) => (
                    <div key={dept._id} className="flex justify-between items-center">
                      <span className="font-medium">{dept._id}</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{dept.count} tasks</div>
                        <div className="text-xs text-gray-500">
                          {Math.round((dept.completed / dept.count) * 100)}% completed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>

            {/* Staff Workload Alert */}
            {workloadReport?.summary && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Staff Workload</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Staff:</span>
                    <span className="font-semibold">{workloadReport.summary.totalStaff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Workload:</span>
                    <span className="font-semibold">{Math.round(workloadReport.summary.averageWorkload)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overloaded Staff:</span>
                    <span className={`font-semibold ${workloadReport.summary.overloadedStaff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {workloadReport.summary.overloadedStaff}
                    </span>
                  </div>
                </div>
                <Link
                  to="/manager/tasks/feedback"
                  className="mt-4 block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
            )}

            {/* Urgent Tasks Alert */}
            {delayedTasks?.summary?.critical > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="text-red-500 text-xl mr-2">🚨</div>
                  <h4 className="font-bold text-red-700">Urgent Attention Required</h4>
                </div>
                <p className="text-red-600 text-sm mb-3">
                  {delayedTasks.summary.critical} tasks are critically overdue
                </p>
                <Link
                  to="/manager/tasks"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                >
                  View Overdue Tasks
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTaskDashboard;
