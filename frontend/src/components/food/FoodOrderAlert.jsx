// 📁 frontend/src/components/food/FoodOrderAlert.jsx
// Manager Notification Component - Toast alerts for new food orders
// Socket.io integration for real-time notifications
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChefHat, Flame, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const FoodOrderAlert = ({ userRole, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Only for managers and admins
    if (!['manager', 'admin'].includes(userRole)) return;

    const token = localStorage.getItem('token');
    if (!token || !userId) return;

    // Connect to Socket.io
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    // Join manager room
    newSocket.emit('join-role-room', {
      role: userRole,
      userId
    });

    // Listen for new food orders
    newSocket.on('newFoodOrder', (data) => {
      console.log('New food order notification:', data);

      const notification = {
        id: Date.now(),
        orderId: data.orderId,
        totalPrice: data.totalPrice,
        items: data.items,
        priority: data.priority,
        isRoomService: data.isRoomService,
        timestamp: data.timestamp
      };

      setNotifications(prev => [notification, ...prev]);

      // Play sound notification
      playNotificationSound();

      // Auto-remove after 10 seconds
      setTimeout(() => {
        removeNotification(notification.id);
      }, 10000);

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Food Order!', {
          body: `${data.items} items • LKR ${data.totalPrice} • Priority: ${data.priority}`,
          icon: '/chef-icon.png',
          badge: '/chef-icon.png'
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userRole, userId]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Navigate to kitchen queue
  const handleViewKitchen = () => {
    navigate('/kitchen-dashboard');
  };

  // Navigate to specific order
  const handleViewOrder = (orderId) => {
    navigate(`/manager/food-orders/${orderId}`);
  };

  return (
    <div className="fixed top-20 right-4 z-40 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="pointer-events-auto"
          >
            <div className={`
              bg-white rounded-2xl shadow-2xl border-2 overflow-hidden w-96
              ${notification.isRoomService 
                ? 'border-red-300 shadow-red-100' 
                : notification.priority === 'urgent'
                ? 'border-orange-300 shadow-orange-100'
                : 'border-blue-300 shadow-blue-100'
              }
            `}>
              {/* Header */}
              <div className={`
                p-4 flex items-center justify-between
                ${notification.isRoomService
                  ? 'bg-gradient-to-r from-red-500 to-pink-500'
                  : notification.priority === 'urgent'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }
              `}>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">New Food Order!</h3>
                    <p className="text-xs opacity-90">
                      {notification.isRoomService ? '🏨 Room Service' : `Priority: ${notification.priority}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-bold text-gray-900">
                      #{notification.orderId?.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-lg text-orange-600">
                      LKR {notification.totalPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Bell className="w-4 h-4" />
                  <span>{notification.items} item{notification.items !== 1 ? 's' : ''} ordered</span>
                </div>

                {notification.isRoomService && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">
                      Room service - Priority handling required
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleViewOrder(notification.orderId)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FoodOrderAlert;
