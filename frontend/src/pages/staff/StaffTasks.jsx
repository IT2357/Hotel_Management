import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import useAuth from '../../hooks/useAuth';
import { taskAPI, feedbackAPI, formatters } from '../../services/taskManagementAPI';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StaffTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModal, setTaskModal] = useState({
    isOpen: false,
    type: 'view', // 'view', 'update', 'feedback'
  });
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    completionNotes: '',
    completionAttachments: []
  });
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [notification, setNotification] = useState(null);
  const { user } = useAuth();

  const fetchMyTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getMyTasks({
        status: filter === 'all' ? undefined : filter,
        limit: 50
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchMyTasksRef = useRef(fetchMyTasks);

  useEffect(() => {
    fetchMyTasksRef.current = fetchMyTasks;
  }, [fetchMyTasks]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  useEffect(() => {
    if (!user?._id) {
      return undefined;
    }

    const staffIdString = String(user._id);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true
    });

    const handleManagerTaskAssigned = (payload = {}) => {
      if (payload.staffId && payload.staffId !== staffIdString) {
        return;
      }

      setNotification({
        id: payload.task?._id || Date.now().toString(),
        message: payload.task?.title
          ? `You have been assigned a new task: ${payload.task.title}`
          : 'You have been assigned a new task.',
        timestamp: payload.assignedAt || new Date().toISOString()
      });

      fetchMyTasksRef.current()
        .catch((err) => console.error('Error refreshing tasks after assignment:', err));
    };

    socket.on('connect', () => {
      socket.emit('join-role-room', {
        role: user.role || 'staff',
        userId: staffIdString
      });
    });

    socket.on('managerTaskAssigned', handleManagerTaskAssigned);

    return () => {
      socket.off('managerTaskAssigned', handleManagerTaskAssigned);
      socket.disconnect();
    };
  }, [user?._id, user?.role]);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timeout = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timeout);
  }, [notification]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setUpdateForm({
      status: task.status,
      notes: '',
      completionNotes: '',
      completionAttachments: []
    });
    setTaskModal({ isOpen: true, type: 'view' });
  };

  const handleStatusUpdate = async () => {
    if (!selectedTask) return;

    try {
      await taskAPI.updateTaskStatus(selectedTask._id, updateForm);
      
      // Refresh tasks
      fetchMyTasks();
      
      // Close modal
      setTaskModal({ isOpen: false, type: 'view' });
      setSelectedTask(null);
      
      alert('Task status updated successfully!');
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleSendFeedback = async () => {
    if (!selectedTask || !feedbackForm.subject || !feedbackForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await feedbackAPI.createFeedback({
        taskId: selectedTask._id,
        feedbackType: 'staff-to-manager',
        toUser: selectedTask.assignedBy._id,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
        priority: feedbackForm.priority
      });
      
      // Reset form
      setFeedbackForm({
        subject: '',
        message: '',
        priority: 'medium'
      });
      
      // Close modal
      setTaskModal({ isOpen: false, type: 'view' });
      
      alert('Feedback sent successfully!');
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Failed to send feedback. Please try again.');
    }
  };

  const getStatusActions = (status) => {
    switch (status) {
      case 'assigned':
        return ['in-progress'];
      case 'in-progress':
        return ['completed'];
      default:
        return [];
    }
  };

  const getTasksByStatus = () => {
    const grouped = {
      assigned: tasks.filter(t => t.status === 'assigned'),
      'in-progress': tasks.filter(t => t.status === 'in-progress'),
      completed: tasks.filter(t => t.status === 'completed')
    };
    return filter === 'all' ? grouped : { [filter]: tasks };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tasksByStatus = getTasksByStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 mt-2">Manage your assigned tasks and track progress</p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            {['all', 'assigned', 'in-progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status === 'all' ? 'All' : 
                 status === 'in-progress' ? 'In Progress' : 
                 status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {notification && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">New Task Assigned</p>
                <p className="mt-1 text-sm">{notification.message}</p>
                {notification.timestamp && (
                  <p className="mt-2 text-xs text-blue-600">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tasks Display */}
        {filter === 'all' ? (
          // Kanban-style view for all tasks
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div key={status} className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-lg text-gray-900 capitalize">
                    {status === 'in-progress' ? 'In Progress' : status}
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {statusTasks.length}
                    </span>
                  </h3>
                </div>
                
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {statusTasks.length > 0 ? (
                    statusTasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => handleTaskClick(task)}
                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatPriority(task.priority).class}`}>
                            {formatters.formatPriority(task.priority).icon}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{task.description}</p>
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Room {task.roomNumber}</span>
                          <span>{formatters.formatRelativeTime(task.createdAt)}</span>
                        </div>
                        
                        {task.dueDate && (
                          <div className={`text-xs mt-1 ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-2xl mb-2">📭</div>
                      <p className="text-sm">No {status} tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view for specific status
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatPriority(task.priority).class}`}>
                          {formatters.formatPriority(task.priority).icon} {formatters.formatPriority(task.priority).label}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div>Guest: <span className="font-medium">{task.guestName}</span></div>
                        <div>Room: <span className="font-medium">{task.roomNumber}</span></div>
                        {task.estimatedDuration && (
                          <div>Duration: <span className="font-medium">{formatters.formatDuration(task.estimatedDuration)}</span></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-2">
                        {formatters.formatRelativeTime(task.createdAt)}
                      </div>
                      {task.dueDate && (
                        <div className={`text-sm ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${formatters.formatTaskStatus(task.status).class}`}>
                      {formatters.formatTaskStatus(task.status).label}
                    </span>
                    
                    <div className="flex space-x-2">
                      {getStatusActions(task.status).map((action) => (
                        <button
                          key={action}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setUpdateForm({ ...updateForm, status: action });
                            setTaskModal({ isOpen: true, type: 'update' });
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          Mark as {action === 'in-progress' ? 'In Progress' : 'Completed'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No {filter} Tasks</h3>
                <p className="text-gray-600">You don't have any {filter} tasks at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {taskModal.isOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTask.title}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatPriority(selectedTask.priority).class}`}>
                      {formatters.formatPriority(selectedTask.priority).label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatters.formatTaskStatus(selectedTask.status).class}`}>
                      {formatters.formatTaskStatus(selectedTask.status).label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setTaskModal({ isOpen: false, type: 'view' })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {taskModal.type === 'view' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Name: {selectedTask.guestName}</div>
                        <div>Room: {selectedTask.roomNumber}</div>
                        {selectedTask.guestPhone && <div>Phone: {selectedTask.guestPhone}</div>}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Task Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Type: {selectedTask.type}</div>
                        <div>Created: {new Date(selectedTask.createdAt).toLocaleString()}</div>
                        {selectedTask.dueDate && <div>Due: {new Date(selectedTask.dueDate).toLocaleString()}</div>}
                        {selectedTask.estimatedDuration && (
                          <div>Estimated Duration: {formatters.formatDuration(selectedTask.estimatedDuration)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(selectedTask.notes?.manager || selectedTask.notes?.staff) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                      {selectedTask.notes.manager && (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-700">Manager Notes:</div>
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedTask.notes.manager}</div>
                        </div>
                      )}
                      {selectedTask.notes.staff && (
                        <div>
                          <div className="text-sm font-medium text-gray-700">My Notes:</div>
                          <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{selectedTask.notes.staff}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between space-x-3">
                    <button
                      onClick={() => setTaskModal({ isOpen: true, type: 'feedback' })}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Send Feedback
                    </button>
                    
                    {getStatusActions(selectedTask.status).length > 0 && (
                      <button
                        onClick={() => setTaskModal({ isOpen: true, type: 'update' })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Update Status
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {taskModal.type === 'update' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {getStatusActions(selectedTask.status).map((status) => (
                        <option key={status} value={status}>
                          {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress Notes</label>
                    <textarea
                      value={updateForm.notes}
                      onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                      placeholder="Add any updates or notes about the task progress..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {updateForm.status === 'completed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Completion Notes</label>
                      <textarea
                        value={updateForm.completionNotes}
                        onChange={(e) => setUpdateForm({ ...updateForm, completionNotes: e.target.value })}
                        placeholder="Describe how the task was completed..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setTaskModal({ isOpen: true, type: 'view' })}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              )}
              
              {taskModal.type === 'feedback' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={feedbackForm.subject}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                      placeholder="Enter feedback subject..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      placeholder="Enter your feedback message..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={feedbackForm.priority}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setTaskModal({ isOpen: true, type: 'view' })}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendFeedback}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Send Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffTaskPage;
