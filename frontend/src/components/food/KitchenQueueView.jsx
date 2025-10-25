// 📁 frontend/src/components/food/KitchenQueueView.jsx
// Kitchen Queue View - Staff dashboard for managing food order tasks
// Real-time updates via Socket.io, priority-based task display
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChefHat,
  AlertCircle,
  CheckCircle,
  Flame,
  Users,
  Package,
  TrendingUp,
  Filter,
  RefreshCw,
  Bell,
  Loader2
} from 'lucide-react';
import io from 'socket.io-client';
import TaskCard from './TaskCard';
import QualityCheckModal from './QualityCheckModal';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';

const KitchenQueueView = ({ staffId, userRole }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    inProgress: 0,
    avgTime: 0
  });

  // Socket.io connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) return;

    // Connect to Socket.io server
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    // Join kitchen room
    newSocket.emit('join-role-room', {
      role: userRole || 'staff',
      userId
    });

    // Listen for new tasks
    newSocket.on('newFoodTask', (data) => {
      console.log('New food task received:', data);
      fetchKitchenQueue();
      showNotification('New Order!', `Priority: ${data.priority}`);
    });

    // Listen for task assignments
    newSocket.on('foodTaskAssigned', (data) => {
      if (data.assignedTo === staffId || data.assignedTo === userId) {
        console.log('Task assigned to you:', data);
        fetchKitchenQueue();
        showNotification('Task Assigned', `Order ${data.orderId.slice(-6)}`);
      }
    });

    // Listen for order status changes
    newSocket.on('orderStatusChanged', (data) => {
      console.log('Order status changed:', data);
      fetchKitchenQueue();
    });

    // Listen for order modifications
    newSocket.on('orderModified', (data) => {
      console.log('Order modified:', data);
      showNotification('Order Modified', data.message, 'warning');
      fetchKitchenQueue();
    });

    // Listen for order cancellations
    newSocket.on('orderCancelled', (data) => {
      console.log('Order cancelled:', data);
      showNotification('Order Cancelled', data.reason, 'error');
      fetchKitchenQueue();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [staffId, userRole]);

  // Fetch kitchen queue - fetch ALL food orders, not just task queue
  const fetchKitchenQueue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // ✅ Fetch directly from food orders endpoint to show ALL orders
      // This includes pending orders that haven't been confirmed yet
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/kitchen/orders?status=${filterStatus || 'all'}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      
      console.log('🍳 Kitchen orders fetched:', result);

      if (result.success) {
        // Transform FoodOrder data to match the task queue format for display
        const orders = (result.data || []).map(order => ({
          _id: order._id,
          orderId: order._id,
          orderNumber: order.orderNumber || order._id.slice(-6),
          status: order.status || order.kitchenStatus || 'pending',
          priority: order.orderType === 'room-service' ? 'urgent' : 'normal',
          isRoomService: order.orderType === 'room-service',
          createdAt: order.createdAt,
          items: order.items || [],
          orderType: order.orderType,
          totalPrice: order.totalPrice || order.total,
          customerName: order.customerDetails?.customerName || 
                       `${order.guest?.firstName || ''} ${order.guest?.lastName || ''}`.trim() ||
                       'Guest',
          tableNumber: order.tableNumber,
          // Include full order object for detailed view
          fullOrder: order
        }));
        
        console.log('🍳 Transformed orders:', orders);
        setTasks(orders);
        calculateStats(orders);
      }
    } catch (error) {
      console.error('Error fetching kitchen queue:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (taskList) => {
    const total = taskList.length;
    const urgent = taskList.filter(t => t.priority === 'urgent' || t.isRoomService).length;
    const inProgress = taskList.filter(t => t.status === 'in-progress').length;

    // Calculate average completion time for completed tasks
    const completedTasks = taskList.filter(t => t.completedAt && t.startedAt);
    const avgTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const duration = (new Date(t.completedAt) - new Date(t.startedAt)) / 1000 / 60;
          return sum + duration;
        }, 0) / completedTasks.length
      : 0;

    setStats({ total, urgent, inProgress, avgTime });
  };

  // Show browser notification
  const showNotification = (title, body, type = 'info') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/chef-icon.png' });
    }

    // Also show in-app toast
    const colors = {
      info: 'bg-blue-500',
      warning: 'bg-orange-500',
      error: 'bg-red-500',
      success: 'bg-green-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right duration-300`;
    notification.innerHTML = `
      <Bell class="w-5 h-5" />
      <div>
        <div class="font-bold">${title}</div>
        <div class="text-sm opacity-90">${body}</div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 5000);
  };

  // ✅ Enhanced task action handler - supports preparing, ready, completed
  const handleTaskAction = async (taskId, action, data = {}) => {
    try {
      const token = localStorage.getItem('token');
      const task = tasks.find(t => t._id === taskId);

      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      console.log('🔧 Handling action:', action, 'for order:', task.orderId || task._id);

      let endpoint = '';
      let method = 'PUT';
      let body = {};
      
      // Use the order ID (task.orderId or task._id if it's already an order)
      const orderId = task.orderId?._id || task.orderId || task._id;

      switch (action) {
        case 'preparing':
        case 'start':
          endpoint = `/api/kitchen/orders/${orderId}/status`;
          body = {
            status: 'preparing',
            notes: 'Kitchen staff started preparing order'
          };
          break;

        case 'ready':
          endpoint = `/api/kitchen/orders/${orderId}/status`;
          body = {
            status: 'ready',
            notes: 'Order is ready for pickup/delivery'
          };
          break;

        case 'completed':
        case 'complete':
          endpoint = `/api/kitchen/orders/${orderId}/status`;
          body = {
            status: 'completed',
            notes: 'Order has been delivered to customer'
          };
          break;

        default:
          console.error('Unknown action:', action);
          return;
      }

      console.log('📡 Sending request:', endpoint, body);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      const result = await response.json();
      
      console.log('✅ Action response:', result);

      if (result.success) {
        fetchKitchenQueue();
        const actionMessages = {
          preparing: 'Order marked as preparing',
          start: 'Order preparation started',
          ready: 'Order marked as ready',
          completed: 'Order marked as delivered',
          complete: 'Order completed'
        };
        showNotification('Success ✓', actionMessages[action] || `Order ${action}`, 'success');
      } else {
        showNotification('Error', result.message || 'Failed to update order', 'error');
      }
    } catch (error) {
      console.error('❌ Error handling task action:', error);
      showNotification('Error', 'Failed to update order status', 'error');
    }
  };

  // Handle quality check completion
  const handleQualityCheckComplete = async (qualityChecks) => {
    if (selectedTask) {
      await handleTaskAction(selectedTask._id, 'complete', { qualityChecks });
      setShowQualityCheck(false);
      setSelectedTask(null);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    const statusMatch = 
      filterStatus === 'pending' ? ['queued', 'assigned'].includes(task.status) :
      filterStatus === 'active' ? task.status === 'in-progress' :
      filterStatus === 'all';
    
    return priorityMatch && statusMatch;
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchKitchenQueue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchKitchenQueue, 30000);
    return () => clearInterval(interval);
  }, [filterStatus, filterPriority]); // ✅ Re-fetch when filters change

  // Priority badge colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'normal':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Queue</h1>
              <p className="text-gray-600">Manage food preparation tasks</p>
            </div>
          </div>

          <FoodButton
            onClick={fetchKitchenQueue}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </FoodButton>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent Orders</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.avgTime > 0 ? `${Math.round(stats.avgTime)}m` : '-'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex gap-2">
              {['pending', 'active', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Priority:</span>
            <div className="flex gap-2">
              {['all', 'urgent', 'high', 'normal', 'low'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    filterPriority === priority
                      ? getPriorityColor(priority)
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="text-gray-600 text-lg">Loading kitchen queue...</span>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <CheckCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500">
              No pending tasks in the kitchen queue
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onAction={handleTaskAction}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Quality Check Modal */}
      {showQualityCheck && selectedTask && (
        <QualityCheckModal
          task={selectedTask}
          onComplete={handleQualityCheckComplete}
          onClose={() => {
            setShowQualityCheck(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default KitchenQueueView;
