import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, formatters } from '../../services/taskManagementAPI';

const TaskAssignPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [availableStaff, setAvailableStaff] = useState({});
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    department: 'all',
    priority: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    task: null,
    selectedStaff: '',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getAllTasks({
        status: filters.status === 'all' ? undefined : filters.status,
        department: filters.department === 'all' ? undefined : filters.department,
        priority: filters.priority === 'all' ? undefined : filters.priority,
        limit: 50
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffForDepartment = async (department) => {
    if (availableStaff[department]) return; // Already cached
    
    try {
      const response = await taskAPI.getAvailableStaff(department);
      setAvailableStaff(prev => ({
        ...prev,
        [department]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching staff for ${department}:`, error);
    }
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAssignClick = async (task) => {
    await fetchStaffForDepartment(task.department);
    setAssignmentModal({
      isOpen: true,
      task,
      selectedStaff: '',
      notes: ''
    });
  };

  const handleAssignSubmit = async () => {
    const { task, selectedStaff, notes } = assignmentModal;
    
    if (!selectedStaff) {
      alert('Please select a staff member');
      return;
    }

    try {
      await taskAPI.assignTask(task._id, {
        staffId: selectedStaff,
        notes
      });
      
      // Refresh tasks list
      fetchTasks();
      
      // Close modal
      setAssignmentModal({
        isOpen: false,
        task: null,
        selectedStaff: '',
        notes: ''
      });
      
      alert('Task assigned successfully!');
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task. Please try again.');
    }
  };

  const handleBulkAssign = () => {
    if (selectedTasks.length === 0) {
      alert('Please select tasks to assign');
      return;
    }
    // TODO: Implement bulk assignment modal
    alert('Bulk assignment feature coming soon!');
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'border-green-300 bg-green-50',
      medium: 'border-yellow-300 bg-yellow-50',
      high: 'border-orange-300 bg-orange-50',
      critical: 'border-red-300 bg-red-50'
    };
    return colors[priority] || 'border-gray-300 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Assignment</h1>
            <p className="text-gray-600 mt-2">Assign tasks to available staff members</p>
          </div>
          
          <div className="flex space-x-4">
            {selectedTasks.length > 0 && (
              <button
                onClick={handleBulkAssign}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Assign Selected ({selectedTasks.length})
              </button>
            )}
            <button
              onClick={() => navigate('/manager/tasks/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Services">Services</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Cleaning">Cleaning</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: 'pending', department: 'all', priority: 'all' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task._id}
                className={`border-l-4 ${getPriorityColor(task.priority)} bg-white p-6 rounded-r-lg shadow-md hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task._id)}
                      onChange={() => handleTaskSelect(task._id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatPriority(task.priority).class}`}>
                          {formatters.formatPriority(task.priority).icon} {formatters.formatPriority(task.priority).label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatTaskStatus(task.status).class}`}>
                          {formatters.formatTaskStatus(task.status).label}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Guest:</span>
                          <span>{task.guestName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Room:</span>
                          <span>{task.roomNumber}</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${formatters.formatDepartment(task.department).color} px-2 py-1 rounded`}>
                          <span>{formatters.formatDepartment(task.department).icon}</span>
                          <span>{task.department}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">Due:</span>
                            <span className={new Date(task.dueDate) < new Date() ? 'text-red-600 font-semibold' : ''}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {task.estimatedDuration && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Estimated Duration:</span> {formatters.formatDuration(task.estimatedDuration)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {task.status === 'pending' ? (
                      <button
                        onClick={() => handleAssignClick(task)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Assign
                      </button>
                    ) : task.assignedTo ? (
                      <div className="text-sm text-gray-600 text-right">
                        <div className="font-medium">Assigned to:</div>
                        <div>{task.assignedTo.name}</div>
                        <div className="text-xs">{task.assignedTo.email}</div>
                      </div>
                    ) : null}
                    
                    <button
                      onClick={() => navigate(`/manager/tasks/${task._id}`)}
                      className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6">No tasks match your current filters.</p>
              <button
                onClick={() => navigate('/manager/tasks/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Create New Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {assignmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Assign Task: {assignmentModal.task?.title}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Staff Member
              </label>
              <select
                value={assignmentModal.selectedStaff}
                onChange={(e) => setAssignmentModal(prev => ({ ...prev, selectedStaff: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose staff member...</option>
                {availableStaff[assignmentModal.task?.department]?.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} - {staff.position}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Notes (Optional)
              </label>
              <textarea
                value={assignmentModal.notes}
                onChange={(e) => setAssignmentModal(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any special instructions or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAssignmentModal({ isOpen: false, task: null, selectedStaff: '', notes: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAssignPage;
