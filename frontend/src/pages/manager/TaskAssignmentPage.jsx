import React, { useState, useEffect } from 'react';
import { Clock, User, AlertTriangle, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const TaskAssignmentPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningTask, setAssigningTask] = useState(null);
  const [filters, setFilters] = useState({
    department: 'all',
    priority: 'all',
    status: 'pending'
  });
  const [departments, setDepartments] = useState([]);
  const [staffByDepartment, setStaffByDepartment] = useState({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchDepartments();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/manager/tasks/pending', {
        params: filters
      });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/manager/tasks/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStaffByDepartment = async (department) => {
    try {
      const response = await api.get(`/manager/tasks/staff/${department}`);
      setStaffByDepartment(prev => ({
        ...prev,
        [department]: response.data.data || []
      }));
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAssignTask = async (taskId, staffId, additionalData = {}) => {
    try {
      setAssigningTask(taskId);
      await api.put(`/manager/tasks/${taskId}/assign`, {
        staffId,
        ...additionalData
      });
      
      // Remove assigned task from the list
      setTasks(prev => prev.filter(task => task._id !== taskId));
      setShowAssignModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task. Please try again.');
    } finally {
      setAssigningTask(null);
    }
  };

  const openAssignModal = async (task) => {
    setSelectedTask(task);
    if (!staffByDepartment[task.department]) {
      await fetchStaffByDepartment(task.department);
    }
    setShowAssignModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - new Date(date)) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Assignment</h1>
            <p className="text-gray-600 mt-1">Assign guest requests to available staff members</p>
          </div>
          <button
            onClick={fetchTasks}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="ml-auto text-sm text-gray-600">
              {tasks.length} tasks found
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No pending tasks to assign right now.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {task.title}
                          </h3>
                          <p className="text-gray-700 mb-3">{task.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {task.guestId && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{task.guestId.name}</span>
                                {task.roomNumber && (
                                  <span className="text-gray-400">• Room {task.roomNumber}</span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTimeAgo(task.requestedAt)}</span>
                              {task.isNearAutoAssignment && (
                                <span className="text-orange-600 font-medium">
                                  • Auto-assign in {5 - task.pendingFor}m
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span>📋</span>
                              <span>{task.department}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.toUpperCase()}
                            </span>
                          </div>
                          
                          {task.isNearAutoAssignment && (
                            <div className="flex items-center gap-1 text-orange-600 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Auto-assign soon</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => openAssignModal(task)}
                      disabled={assigningTask === task._id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {assigningTask === task._id ? 'Assigning...' : 'Assign Task'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Assign Task</h3>
              <p className="text-gray-600 mb-4">{selectedTask.title}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Staff ({selectedTask.department})
                  </label>
                  <div className="space-y-2">
                    {(staffByDepartment[selectedTask.department] || []).map((staff) => (
                      <div
                        key={staff._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAssignTask(selectedTask._id, staff._id)}
                      >
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-gray-600">
                            Current workload: {staff.currentWorkload} active tasks
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssignmentPage;