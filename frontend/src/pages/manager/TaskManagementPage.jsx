import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  Filter,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Building,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Eye
} from "lucide-react";
import { fetchTasks as apiFetchTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, fetchStaff as apiFetchStaff, seedDemo } from "../../services/managerService";

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    guestName: '',
    roomNumber: '',
    priority: 'medium',
    estimatedTime: 30,
    assignedTo: '',
    dueDate: '',
    category: 'General'
  });

  useEffect(() => {
    fetchTasks();
    fetchStaff();
  }, []);

  const fetchTasks = async () => {
    try {
      const { tasks: apiTasks } = await apiFetchTasks();
      // normalize to UI shape
      const normalized = (apiTasks || []).map((t) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        guestName: t.guestName,
        roomNumber: t.roomNumber,
        status: t.status,
        priority: t.priority,
        category: t.category,
        estimatedTime: t.estimatedTime ?? 30,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        assignedTo: t.assignedTo?._id || t.assignedTo || null,
        assignedStaff: t.assignedTo
          ? {
              id: t.assignedTo._id,
              name: t.assignedTo.name,
              role: t.assignedTo.role,
              avatar: t.assignedTo.avatar || '',
              isOnline: t.assignedTo.isOnline,
            }
          : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      }));
      setTasks(normalized);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const apiStaff = await apiFetchStaff({ status: 'online' });
      const normalized = (apiStaff || []).map((s) => ({
        id: s._id,
        name: s.name,
        role: s.role,
        department: s.department,
        avatar: s.avatar || '',
        isOnline: s.isOnline,
        phone: s.phone,
        email: s.email,
      }));
      setStaff(normalized);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' };
      case 'in-progress':
        return { icon: RotateCcw, color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' };
      case 'completed':
        return { icon: CheckCircle2, color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' };
      case 'rejected':
        return { icon: XCircle, color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' };
      default:
        return { icon: Clock, color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent': return { color: 'bg-red-100 text-red-800', label: 'Urgent' };
      case 'high': return { color: 'bg-orange-100 text-orange-800', label: 'High' };
      case 'medium': return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' };
      case 'low': return { color: 'bg-green-100 text-green-800', label: 'Low' };
      default: return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.guestName.trim() || !newTask.roomNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        guestName: newTask.guestName,
        roomNumber: newTask.roomNumber,
        estimatedTime: newTask.estimatedTime,
        dueDate: newTask.dueDate || null,
        assignTo: newTask.assignedTo || null,
      };
      const created = await apiCreateTask(payload);
      // optimistic add using normalized shape
      const assigned = created.assignedTo
        ? {
            id: created.assignedTo._id,
            name: created.assignedTo.name,
            role: created.assignedTo.role,
            avatar: created.assignedTo.avatar || '',
            isOnline: created.assignedTo.isOnline,
          }
        : null;
      const normalized = {
        id: created._id,
        title: created.title,
        description: created.description,
        guestName: created.guestName,
        roomNumber: created.roomNumber,
        status: created.status,
        priority: created.priority,
        category: created.category,
        estimatedTime: created.estimatedTime ?? 30,
        createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
        dueDate: created.dueDate ? new Date(created.dueDate) : null,
        assignedTo: created.assignedTo?._id || null,
        assignedStaff: assigned,
        completedAt: created.completedAt ? new Date(created.completedAt) : null,
      };
      setTasks([normalized, ...tasks]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Create task failed:', err);
      alert(err.response?.data?.error || 'Failed to create task');
    }
    setNewTask({
      title: '',
      description: '',
      guestName: '',
      roomNumber: '',
      priority: 'medium',
      estimatedTime: 30,
      assignedTo: '',
      dueDate: '',
      category: 'General'
    });
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const prev = tasks;
    setTasks(prev.map(t => t.id === taskId ? { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : null } : t));
    try {
      await apiUpdateTask(taskId, { status: newStatus });
      // Optionally refetch single task
    } catch (err) {
      console.error('Update status failed:', err);
      setTasks(prev); // revert
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleAssignTask = async (taskId, staffId) => {
    const assignedStaff = staff.find(s => s.id === staffId);
    const prev = tasks;
    setTasks(prev.map(t => t.id === taskId ? { ...t, assignedTo: staffId, assignedStaff, status: 'assigned' } : t));
    try {
      await apiUpdateTask(taskId, { assignedTo: staffId, status: 'assigned' });
    } catch (err) {
      console.error('Assign failed:', err);
      setTasks(prev);
      alert(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.roomNumber.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { pending: 0, 'in-progress': 1, completed: 2, rejected: 3 };
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
    return b.createdAt - a.createdAt;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all hotel service requests</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, staff, or guests..."
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter Tasks</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);
            const priorityConfig = getPriorityConfig(task.priority);
            
            // Get border color based on priority and status
            const getBorderColor = () => {
              if (task.status === 'pending' && task.priority === 'urgent') return 'border-l-red-500';
              if (task.status === 'completed') return 'border-l-green-500';
              if (task.status === 'in-progress') return 'border-l-blue-500';
              if (task.status === 'pending') return 'border-l-yellow-500';
              return 'border-l-gray-300';
            };

            return (
              <div key={task.id} className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 border-l-4 ${getBorderColor()}`}>
                {/* Task Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {task.title}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ml-2 ${
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'in-progress' ? 'in progress' : task.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                </div>

                {/* Guest & Room Info */}
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <User className="h-4 w-4" />
                  <span>{task.guestName}</span>
                  <span className="mx-1">•</span>
                  <MapPin className="h-4 w-4" />
                  <span>Room {task.roomNumber}</span>
                </div>

                {/* Assignment Section */}
                {task.assignedStaff ? (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {task.assignedStaff.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.assignedStaff.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{task.assignedStaff.role.replace('-', ' ')}</p>
                      </div>
                    </div>
                    {task.assignedStaff.isOnline && <div className="w-2 h-2 rounded-full bg-green-400"></div>}
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                      Awaiting Assignment
                    </span>
                  </div>
                )}

                {/* Time Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Created {formatTimeAgo(task.createdAt)}</span>
                  </div>
                  <span>Est. {task.estimatedTime}m</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {task.status === 'pending' && (
                    <>
                      <select
                        onChange={(e) => e.target.value && handleAssignTask(task.id, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign</option>
                        {staff.filter(member => member.isOnline).map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role.replace('-', ' ')})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'rejected')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {task.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowEditModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Reassign
                      </button>
                      <button
                        onClick={() => {
                          console.log('View progress for task:', task.id);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        View Progress
                      </button>
                    </>
                  )}

                  {task.status === 'completed' && (
                    <button className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500">Try adjusting your filters or creating a new task</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name *</label>
                <input
                  type="text"
                  value={newTask.guestName}
                  onChange={(e) => setNewTask({ ...newTask, guestName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter guest name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Number *</label>
                <input
                  type="text"
                  value={newTask.roomNumber}
                  onChange={(e) => setNewTask({ ...newTask, roomNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter room number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Room Service">Room Service</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Concierge">Concierge</option>
                  <option value="Housekeeping">Housekeeping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (min)</label>
                <input
                  type="number"
                  value={newTask.estimatedTime}
                  onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {staff.filter(member => member.isOnline).map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role.replace('-', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;