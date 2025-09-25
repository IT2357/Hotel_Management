import { useState, useEffect } from "react";
import { Search, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function TaskManager({ department, user, viewMode = "mine" }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    assignedTo: "all"
  });
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "process", label: "Process" },
    { value: "completed", label: "Completed" },
    { value: "handoff_pending", label: "Handoff Pending" },
    { value: "handoff_accepted", label: "Handoff Accepted" }
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
  ];

  const categoryOptions = getCategoryOptions(department);

  useEffect(() => {
    fetchTasks();
  }, [department, viewMode]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, searchTerm]);

  // Normalize department to canonical values
  const normalizeDepartment = (value) => {
    const key = String(value || "").toLowerCase().trim();
    const map = {
      chef: "kitchen",
      cheff: "kitchen",
      kitchen: "kitchen",
      maintenance: "maintenance",
      service: "service",
      cleaning: "cleaning",
      housekeeping: "cleaning",
    };
    return map[key] || key || "service";
  };

  const getMockTasks = (dept) => {
    const baseId = Date.now();
    const byDept = {
      maintenance: [
        {
          title: "Fix AC in Room 205",
          description:
            "Guest reported AC not working properly. Check and repair the cooling system.",
          category: "hvac",
          priority: "high",
          status: "pending",
          location: "room",
          roomNumber: "205",
          estimatedDuration: 45,
          isUrgent: false,
        },
        {
          title: "Replace light bulbs in lobby",
          description: "Several lobby light bulbs need replacement.",
          category: "electrical",
          priority: "medium",
          status: "process",
          location: "lobby",
          estimatedDuration: 30,
          isUrgent: false,
        },
        {
          title: "Fix leaking faucet in Room 312",
          description: "Leaking bathroom faucet requires immediate attention.",
          category: "plumbing",
          priority: "urgent",
          status: "pending",
          location: "room",
          roomNumber: "312",
          estimatedDuration: 60,
          isUrgent: true,
        },
      ],
      kitchen: [
        {
          title: "Prepare breakfast buffet",
          description: "Set up and prepare breakfast buffet for guests.",
          category: "food_preparation",
          priority: "high",
          status: "completed",
          location: "kitchen",
          estimatedDuration: 60,
          isUrgent: false,
          completedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
          timeRemaining: 780, // 13 minutes remaining (15 - 2)
          canEdit: true,
        },
        {
          title: "Clean and sanitize prep area",
          description: "Deep clean prep surfaces and equipment.",
          category: "cleaning",
          priority: "medium",
          status: "process",
          location: "kitchen",
          estimatedDuration: 45,
          isUrgent: false,
        },
        {
          title: "Inventory check - dairy products",
          description: "Check stock levels and expiry of dairy items.",
          category: "inventory",
          priority: "medium",
          status: "pending",
          location: "kitchen",
          estimatedDuration: 30,
          isUrgent: false,
        },
      ],
      service: [
        {
          title: "Guest transportation request",
          description: "Room 301 needs airport transfer at 2 PM.",
          category: "transportation",
          priority: "medium",
          status: "pending",
          location: "lobby",
          roomNumber: "301",
          estimatedDuration: 20,
          isUrgent: false,
        },
        {
          title: "VIP guest welcome setup",
          description: "Prepare amenities and setup for VIP arrival.",
          category: "guest_request",
          priority: "high",
          status: "process",
          location: "room",
          roomNumber: "501",
          estimatedDuration: 40,
          isUrgent: false,
        },
      ],
      cleaning: [
        {
          title: "Deep clean Room 102",
          description: "Post-checkout deep cleaning and sanitization.",
          category: "deep_cleaning",
          priority: "high",
          status: "pending",
          location: "room",
          roomNumber: "102",
          estimatedDuration: 90,
          isUrgent: false,
        },
        {
          title: "Laundry - bed linens",
          description: "Process and clean bed linens from checkouts.",
          category: "laundry",
          priority: "medium",
          status: "process",
          location: "other",
          estimatedDuration: 120,
          isUrgent: false,
        },
      ],
    };

    const templates = byDept[dept] || byDept.service || [];
    return templates.map((t, i) => ({
      ...t,
      _id: `${baseId + i}`,
      assignedTo: {
        id: user?.id || "user1",
        name: user?.name || "Current User",
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const dept = normalizeDepartment(department);
      // Choose endpoint based on view mode
      const endpoint = viewMode === "mine"
        ? "/api/staff/tasks/my"
        : `/api/staff/tasks?department=${encodeURIComponent(dept)}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        let received = [];
        if (data?.data?.tasks) {
          received = data.data.tasks;
        } else if (data?.tasks) {
          received = data.tasks;
        } else if (Array.isArray(data)) {
          received = data;
        }
        if (!received || received.length === 0) {
          // Fallback to department-specific mock tasks
          setTasks(getMockTasks(dept));
        } else {
          setTasks(received);
        }
      } else {
        console.error("Failed to fetch tasks");
        setTasks(getMockTasks(dept));
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      const dept = normalizeDepartment(department);
      setTasks(getMockTasks(dept));
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    // Apply assigned to filter (only meaningful in department mode)
    if (filters.assignedTo !== "all") {
      filtered = filtered.filter(task => task.assignedTo?.id === filters.assignedTo);
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleStatusChange = async (taskId, newStatus, handoffData = null) => {
    try {
      // Create a copy of the current task
      const currentTask = tasks.find(t => t._id === taskId);
      if (!currentTask) {
        console.error("Task not found");
        return;
      }

      // Prepare update data
      const updateData = { status: newStatus };
      const now = new Date();
      
      // Set completedAt timestamp when marking as completed
      if (newStatus === 'completed') {
        updateData.completedAt = now.toISOString();
      } else if (currentTask.status === 'completed') {
        // Clear completedAt when changing from completed to another status
        updateData.completedAt = null;
      }
      
      // Add handoff data if present
      if (handoffData) {
        updateData.handoffDepartment = handoffData.department;
        updateData.handoffReason = handoffData.reason;
        updateData.handoffRequestedAt = now.toISOString();
      }

      // Optimistically update the UI
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? {
                ...task,
                ...updateData,
                canEdit: newStatus !== 'completed',
                timeRemaining: newStatus === 'completed' ? 900 : 0 // 15 minutes in seconds
              }
            : task
        )
      );

      // Make the API call
      const response = await fetch(`/api/staff/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const updatedTask = result.data || result;
      
      // Update local state with the server response
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? {
                ...task,
                ...updatedTask,
                status: newStatus,
                ...(handoffData || {}),
                canEdit: updatedTask.canEdit ?? (newStatus !== 'completed'),
                timeRemaining: updatedTask.timeRemaining ??
                  (newStatus === 'completed' ? 900 : 0)
              }
            : task
        )
      );
      
      return updatedTask;
    } catch (error) {
      console.error("Error updating task status:", error);
      
      // Revert optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(task =>
          task._id === taskId
            ? {
                ...task,
                status: currentTask.status,
                completedAt: currentTask.completedAt,
                canEdit: currentTask.canEdit,
                timeRemaining: currentTask.timeRemaining
              }
            : task
        )
      );
      
      // Show error message to user
      alert(`Failed to update task: ${error.message}`);
    }
  };

  const handleAcceptHandoff = async (taskId) => {
    try {
      const response = await fetch(`/api/staff/tasks/${taskId}/accept-handoff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Refresh tasks to get updated data
        fetchTasks();
      } else {
        console.error("Failed to accept handoff");
      }
    } catch (error) {
      console.error("Error accepting handoff:", error);
    }
  };

  const handleSaveTask = async (task) => {
    try {
      const payload = {
        // Only include fields that backend accepts/updates
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
        location: task.location,
        roomNumber: task.roomNumber,
        estimatedDuration: task.estimatedDuration,
        isUrgent: task.isUrgent,
        requiresApproval: task.requiresApproval,
        status: task.status,
        // Include handoff fields if present
        ...(task.handoffDepartment ? { handoffDepartment: task.handoffDepartment } : {}),
        ...(task.handoffReason ? { handoffReason: task.handoffReason } : {}),
      };

      const response = await fetch(`/api/staff/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Failed to save task changes');
        return;
      }

      const data = await response.json();
      const updated = data?.data || data; // formatResponse wrapper compatibility
      const updatedTask = updated?.relatedTask ? updated.relatedTask : updated; // safety
      const finalTask = updated?.task || updated?.updatedTask || updatedTask;

      if (finalTask?._id) {
        setTasks(prev => prev.map(t => (t._id === finalTask._id ? { ...t, ...finalTask } : t)));
      } else if (updated?.data?.tasks) {
        // In case endpoint returns paginated list (defensive)
        setTasks(updated.data.tasks);
      } else {
        // Fallback: refresh from server
        fetchTasks();
      }
    } catch (err) {
      console.error('Error saving task changes:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "process":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "handoff_pending":
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      case "handoff_accepted":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Task Management</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {viewMode === "mine" ? "Tasks assigned to you" : `View and update tasks in the ${department} department`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tasks ({filteredTasks.length})
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm || Object.values(filters).some(f => f !== "all")
                  ? "Try adjusting your search or filters"
                  : viewMode === "mine" ? "No tasks assigned to you yet" : "No tasks have been created yet"}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onStatusChange={handleStatusChange}
                onAcceptHandoff={handleAcceptHandoff}
                onSave={handleSaveTask}
                getStatusIcon={getStatusIcon}
                getPriorityColor={getPriorityColor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Format time remaining for completed tasks
const formatTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Task Card Component
function TaskCard({ task, onStatusChange, getStatusIcon, getPriorityColor, onAcceptHandoff, onSave }) {
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffData, setHandoffData] = useState({ department: "", reason: "" });
  const [timeRemaining, setTimeRemaining] = useState(task.timeRemaining || 0);
  const [canEdit, setCanEdit] = useState(task.canEdit !== false);

  // Update time remaining for completed tasks
  useEffect(() => {
    let interval;
    if (task.status === 'completed' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            setCanEdit(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task.status, timeRemaining]);

  const handleStatusChange = (newStatus) => {
    if (!canEdit && task.status === 'completed') {
      return; // Prevent status change if grace period has expired
    }
    
    if (newStatus === "handoff_pending") {
      setShowHandoffModal(true);
    } else {
      onStatusChange(task._id, newStatus);
      
      // If marking as completed, start the grace period timer
      if (newStatus === 'completed') {
        setTimeRemaining(900); // 15 minutes in seconds
        setCanEdit(true);
      }
    }
  };

  const handleHandoffSubmit = () => {
    onStatusChange(task._id, "handoff_pending", handoffData);
    setShowHandoffModal(false);
    setHandoffData({ department: "", reason: "" });
  };

  return (
    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-black text-white`}>
              {getStatusIcon(task.status)}
              <span className="capitalize">{task.status.replace('_', ' ')}</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {task.isUrgent && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Urgent
              </span>
            )}
            {task.handoffDepartment && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                Handoff to {task.handoffDepartment}
              </span>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-3">{task.description}</p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <span>📍 {task.location}</span>
            {task.roomNumber && <span>🏠 Room {task.roomNumber}</span>}
            <span>📂 {task.category}</span>
            <span>⏱️ {task.estimatedDuration} min</span>
            {task.assignedTo && (
              <span>👤 {task.assignedTo.name}</span>
            )}
            {task.handoffReason && (
              <span>🔄 {task.handoffReason}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {task.status === "handoff_pending" && task.handoffDepartment && (
            <button
              onClick={() => onAcceptHandoff(task._id)}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition duration-200"
            >
              Accept Handoff
            </button>
          )}

          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={!canEdit && task.status === 'completed'}
            aria-label="Task status"
            className="px-3 py-1 text-sm rounded-md border bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          >
            <option value="pending">Pending</option>
            <option value="process">In Progress</option>
            <option value="completed" disabled={!canEdit && task.status === 'completed'}>
              {task.status === 'completed' && !canEdit ? 'Completed (Locked)' : 'Mark as Completed'}
            </option>
            <option value="handoff_pending">Handoff Pending</option>
            <option value="handoff_accepted">Handoff Accepted</option>
          </select>

          {/* Timer display below status button */}
          {task.status === 'completed' && timeRemaining > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Time remaining: {formatTimeRemaining(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onSave && onSave(task)}
          disabled={!canEdit && task.status === 'completed'}
          className={`px-4 py-2 text-sm rounded-md font-semibold shadow-sm focus:outline-none focus:ring-2 transition duration-200 ${
            !canEdit && task.status === 'completed'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
              : 'bg-amber-400 text-gray-900 hover:bg-amber-500 focus:ring-amber-400/70'
          }`}
          title={!canEdit && task.status === 'completed' ? 'Cannot edit completed task' : 'Save Changes'}
          aria-label={!canEdit && task.status === 'completed' ? 'Cannot edit completed task' : 'Save task changes'}
        >
          Save Changes
        </button>
      </div>

      {/* Handoff Modal */}
      {showHandoffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Handoff Task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Handoff to Department *
                  </label>
                  <select
                    required
                    value={handoffData.department}
                    onChange={(e) => setHandoffData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    <option value="service">Service</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Handoff
                  </label>
                  <textarea
                    value={handoffData.reason}
                    onChange={(e) => setHandoffData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Explain why this task needs to be handed off..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowHandoffModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHandoffSubmit}
                  disabled={!handoffData.department}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50"
                >
                  Handoff Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Modal Component
function TaskModal({ mode, task, department, onClose, onSave }) {
  const [formData, setFormData] = useState(
    mode === "edit" ? task : {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      location: "other",
      roomNumber: "",
      estimatedDuration: "",
      materials: [],
      isUrgent: false,
      requiresApproval: false
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {mode === "create" ? "Create New Task" : "Edit Task"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {getCategoryOptions(department).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="room">Room</option>
                <option value="kitchen">Kitchen</option>
                <option value="lobby">Lobby</option>
                <option value="gym">Gym</option>
                <option value="pool">Pool</option>
                <option value="parking">Parking</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Number
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 205"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe the task in detail..."
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={(e) => setFormData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mark as urgent</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Requires approval</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              {mode === "create" ? "Create Task" : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to get category options based on department
function getCategoryOptions(department) {
  const categories = {
    maintenance: [
      { value: "electrical", label: "Electrical" },
      { value: "plumbing", label: "Plumbing" },
      { value: "hvac", label: "HVAC" },
      { value: "appliance", label: "Appliance" },
      { value: "structural", label: "Structural" },
      { value: "general", label: "General" }
    ],
    kitchen: [
      { value: "food_preparation", label: "Food Preparation" },
      { value: "cooking", label: "Cooking" },
      { value: "cleaning", label: "Cleaning" },
      { value: "inventory", label: "Inventory" },
      { value: "equipment", label: "Equipment" }
    ],
    service: [
      { value: "guest_request", label: "Guest Request" },
      { value: "room_service", label: "Room Service" },
      { value: "concierge", label: "Concierge" },
      { value: "transportation", label: "Transportation" },
      { value: "event", label: "Event" }
    ],
    cleaning: [
      { value: "cleaning", label: "Cleaning" },
      { value: "laundry", label: "Laundry" },
      { value: "restocking", label: "Restocking" },
      { value: "inspection", label: "Inspection" },
      { value: "deep_cleaning", label: "Deep Cleaning" }
    ]
  };

  return categories[department] || [];
}

// Helper function to get mock tasks
function getMockTasks(department) {
  const mockTasks = {
    maintenance: [
      {
        id: 1,
        title: "Fix AC in Room 205",
        description: "Guest reported AC not working properly. Need to check and repair.",
        status: "in_progress",
        priority: "high",
        category: "hvac",
        location: "room",
        roomNumber: "205",
        estimatedDuration: 45,
        isUrgent: false,
        assignedTo: { id: 1, name: "John Smith" },
        createdAt: "2024-01-15T10:00:00Z"
      },
      {
        id: 2,
        title: "Replace light bulbs in lobby",
        description: "Several light bulbs in the lobby need replacement.",
        status: "pending",
        priority: "medium",
        category: "electrical",
        location: "lobby",
        estimatedDuration: 30,
        isUrgent: false,
        assignedTo: { id: 2, name: "Mike Johnson" },
        createdAt: "2024-01-15T09:00:00Z"
      }
    ],
    kitchen: [
      {
        id: 3,
        title: "Prepare breakfast buffet",
        description: "Set up and prepare breakfast buffet for hotel guests.",
        status: "completed",
        priority: "high",
        category: "food_preparation",
        location: "kitchen",
        estimatedDuration: 60,
        isUrgent: false,
        assignedTo: { id: 3, name: "Chef Maria" },
        createdAt: "2024-01-15T06:00:00Z"
      }
    ],
    service: [
      {
        id: 4,
        title: "Guest transportation request",
        description: "",
        status: "assigned",
        priority: "medium",
        category: "transportation",
        location: "lobby",
        roomNumber: "301",
        estimatedDuration: 20,
        isUrgent: false,
        assignedTo: { id: 4, name: "Sarah Wilson" },
        createdAt: "2024-01-15T11:00:00Z"
      }
    ],
    cleaning: [
      {
        id: 5,
        title: "Deep clean Room 102",
        description: "Guest checked out. Room needs deep cleaning and sanitization.",
        status: "pending",
        priority: "high",
        category: "deep_cleaning",
        location: "room",
        roomNumber: "102",
        estimatedDuration: 90,
        isUrgent: false,
        assignedTo: { id: 5, name: "Lisa Brown" },
        createdAt: "2024-01-15T12:00:00Z"
      }
    ]
  };

  return mockTasks[department] || [];
} 