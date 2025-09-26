import React, { useState, useEffect } from 'react';
import { Button, Badge, Card, Select, Modal, Textarea, FileInput } from 'flowbite-react';
import { useSnackbar } from 'notistack';
import io from 'socket.io-client';
import {
  getTasks,
  updateTaskStatus,
  updateTaskPriority,
  processTaskHandoff,
  createTask
} from '../../services/taskService';

const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004');

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [handoffData, setHandoffData] = useState({ toStaffId: '', reason: '' });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    department: 'Kitchen Staff',
    priority: 'medium',
    location: 'room',
    category: 'cleaning',
    attachments: []
  });

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTasks();

    socket.on('taskCreated', (newTask) => {
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      enqueueSnackbar('New task created', { variant: 'info' });
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
      enqueueSnackbar(`Task ${updatedTask.title} updated`, { variant: 'info' });
    });

    socket.on('taskDeleted', ({ id }) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
      enqueueSnackbar('Task deleted', { variant: 'info' });
    });

    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const taskData = await getTasks();
      setTasks(taskData);
    } catch (error) {
      enqueueSnackbar('Failed to load tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      enqueueSnackbar('Task status updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update task status', { variant: 'error' });
    }
  };

  const handlePriorityChange = async (taskId) => {
    try {
      await updateTaskPriority(taskId);
      enqueueSnackbar('Task priority updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update task priority', { variant: 'error' });
    }
  };

  const handleHandoff = async () => {
    try {
      await processTaskHandoff(selectedTask._id, handoffData.toStaffId, handoffData.reason);
      enqueueSnackbar('Task handed off successfully', { variant: 'success' });
      setShowHandoffModal(false);
      setSelectedTask(null);
      setHandoffData({ toStaffId: '', reason: '' });
    } catch (error) {
      enqueueSnackbar('Failed to handoff task', { variant: 'error' });
    }
  };

  const handleCreateTask = async () => {
    try {
      const formData = new FormData();
      Object.keys(newTask).forEach(key => {
        if (key !== 'attachments') {
          formData.append(key, newTask[key]);
        }
      });
      for (let i = 0; i < newTask.attachments.length; i++) {
        formData.append('attachments', newTask.attachments[i]);
      }

      await createTask(formData);
      enqueueSnackbar('Task created successfully', { variant: 'success' });
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        department: 'Kitchen Staff',
        priority: 'medium',
        location: 'room',
        category: 'cleaning',
        attachments: []
      });
    } catch (error) {
      enqueueSnackbar('Failed to create task', { variant: 'error' });
    }
  };

  const handleAttachmentChange = (e) => {
    setNewTask({ ...newTask, attachments: e.target.files });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'gray',
      assigned: 'blue',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'gray',
      medium: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <Button onClick={() => setShowCreateModal(true)} color="blue">
          Create New Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <Card key={task._id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  <Badge color={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  <Badge color={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-gray-600 mb-2">{task.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Department: {task.department}</span>
                  <span>Location: {task.location}</span>
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  {task.assignedTo && (
                    <span>Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  size="sm"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Button
                  size="sm"
                  color="light"
                  onClick={() => handlePriorityChange(task._id)}
                >
                  Escalate
                </Button>
                <Button
                  size="sm"
                  color="warning"
                  onClick={() => {
                    setSelectedTask(task);
                    setShowHandoffModal(true);
                  }}
                >
                  Handoff
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Task Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <Modal.Header>Create New Task</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <Select
                  value={newTask.department}
                  onChange={(e) => setNewTask({...newTask, department: e.target.value})}
                >
                  <option value="Kitchen Staff">Kitchen Staff</option>
                  <option value="Server Staff">Server Staff</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Cleaning Staff">Cleaning Staff</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Attachments</label>
              <FileInput
                id="attachments"
                multiple
                onChange={handleAttachmentChange}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleCreateTask}>Create Task</Button>
          <Button color="gray" onClick={() => setShowCreateModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Handoff Modal */}
      <Modal show={showHandoffModal} onClose={() => setShowHandoffModal(false)}>
        <Modal.Header>Handoff Task</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Assign to Staff ID</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={handoffData.toStaffId}
                onChange={(e) => setHandoffData({...handoffData, toStaffId: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reason</label>
              <Textarea
                value={handoffData.reason}
                onChange={(e) => setHandoffData({...handoffData, reason: e.target.value})}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleHandoff}>Handoff Task</Button>
          <Button color="gray" onClick={() => setShowHandoffModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TaskManagement;
