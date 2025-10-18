// 📁 frontend/src/components/food/FoodStatusTracker.jsx
// Real-time Food Order Status Tracker with Socket.io
// Shows timeline with ETA for guest order tracking
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Truck, 
  Package,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import io from 'socket.io-client';

const FoodStatusTracker = ({ orderId, initialOrder }) => {
  const [timeline, setTimeline] = useState(initialOrder?.taskHistory || []);
  const [currentStatus, setCurrentStatus] = useState(initialOrder?.status || 'Pending');
  const [kitchenStatus, setKitchenStatus] = useState(initialOrder?.kitchenStatus || 'pending');
  const [eta, setEta] = useState(null);
  const [socket, setSocket] = useState(null);
  // Add state for review modal
  const [showReview, setShowReview] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);

  // Socket.io connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) return;

    // Connect to Socket.io server
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    // Join user-specific room
    newSocket.emit('join-role-room', { 
      role: 'guest', 
      userId 
    });

    // Listen for status updates
    newSocket.on('foodStatusUpdate', (data) => {
      if (data.orderId === orderId) {
        setCurrentStatus(data.status);
        if (data.timeline) setTimeline(data.timeline);
        if (data.eta) setEta(new Date(data.eta));
      }
    });
    
    // Listen for review prompt
    newSocket.on('showReview', (data) => {
      if (data.orderId === orderId) {
        setReviewOrder(data);
        setShowReview(true);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [orderId]);

  // Fetch timeline on mount
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/food/workflow/timeline/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const result = await response.json();
        
        if (result.success) {
          setTimeline(result.data.timeline || []);
          setCurrentStatus(result.data.status);
          setKitchenStatus(result.data.kitchenStatus);
          if (result.data.currentETA) {
            setEta(new Date(result.data.currentETA));
          }
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
      }
    };

    if (orderId) {
      fetchTimeline();
    }
  }, [orderId]);

  // Status configuration
  const statusSteps = [
    {
      key: 'Pending',
      label: 'Order Confirmed',
      icon: CheckCircle,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      key: 'Assigned',
      label: 'Assigned to Kitchen',
      icon: Package,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    {
      key: 'Preparing',
      label: 'Being Prepared',
      icon: ChefHat,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    {
      key: 'Ready',
      label: 'Ready for Delivery',
      icon: Sparkles,
      color: 'text-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    {
      key: 'Delivered',
      label: 'Delivered',
      icon: Truck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    }
  ];

  // Get current step index
  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => 
      step.key === currentStatus || step.key.toLowerCase() === kitchenStatus
    );
  };

  const currentStepIndex = getCurrentStepIndex();

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diffMinutes = Math.floor((now - past) / 1000 / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return past.toLocaleDateString();
  };

  // Format ETA
  const formatETA = (etaDate) => {
    if (!etaDate) return null;
    
    const now = new Date();
    const diffMinutes = Math.floor((etaDate - now) / 1000 / 60);
    
    if (diffMinutes <= 0) return 'Any moment now!';
    if (diffMinutes === 1) return '1 minute';
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (diffHours === 1) {
      return remainingMinutes > 0 
        ? `1 hour ${remainingMinutes} min` 
        : '1 hour';
    }
    
    return remainingMinutes > 0 
      ? `${diffHours} hours ${remainingMinutes} min` 
      : `${diffHours} hours`;
  };
  
  // Handle review submission
  const handleReviewSubmit = () => {
    setShowReview(false);
    // You might want to show a thank you message or update the UI
  };

  return (
    <div className="space-y-6">
      {/* ETA Banner */}
      {eta && currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6" />
              <div>
                <p className="text-sm opacity-90">Estimated Time</p>
                <p className="text-2xl font-bold">{formatETA(eta)}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <ChefHat className="w-8 h-8 opacity-50" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Progress Steps */}
      <div className="relative">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.key} className="relative mb-8 last:mb-0">
              {/* Connecting Line */}
              {index < statusSteps.length - 1 && (
                <div 
                  className={`absolute left-5 top-12 w-0.5 h-16 ${
                    isCompleted ? 'bg-gradient-to-b from-indigo-500 to-purple-500' : 'bg-gray-200'
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Icon Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-indigo-100 shadow-lg' : ''}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-indigo-500"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Content */}
                <div className="flex-1">
                  <div className={`
                    p-4 rounded-2xl border transition-all
                    ${isCompleted ? step.bg + ' ' + step.border : 'bg-gray-50 border-gray-200'}
                    ${isCurrent ? 'shadow-lg' : ''}
                  `}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold ${isCompleted ? step.color : 'text-gray-400'}`}>
                        {step.label}
                      </h4>
                      
                      {isCompleted && timeline.find(t => t.status === step.key) && (
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(timeline.find(t => t.status === step.key)?.updatedAt)}
                        </span>
                      )}
                    </div>

                    {/* Timeline entry note */}
                    {timeline.find(t => t.status === step.key)?.note && (
                      <p className="text-sm text-gray-600 mt-2">
                        {timeline.find(t => t.status === step.key).note}
                      </p>
                    )}

                    {/* Current step indicator */}
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex items-center gap-2 text-xs text-indigo-600"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          🔄
                        </motion.div>
                        <span className="font-medium">In progress...</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled/Error State */}
      {currentStatus === 'Cancelled' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h4 className="font-semibold">Order Cancelled</h4>
              <p className="text-sm text-red-600">
                {timeline.find(t => t.status === 'Cancelled')?.note || 'This order has been cancelled'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Completed State */}
      {currentStatus === 'Delivered' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h4 className="font-semibold">Order Delivered!</h4>
              <p className="text-sm text-green-600">
                Enjoy your meal! 🎉
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Review Modal */}
      {showReview && reviewOrder && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <ReviewModal 
            open={showReview} 
            onClose={() => setShowReview(false)} 
            order={reviewOrder} 
            onSubmit={handleReviewSubmit} 
          />
        </React.Suspense>
      )}
    </div>
  );
};

// Lazy load the ReviewModal component
const ReviewModal = React.lazy(() => import('../../../features/food-reviews/components/ReviewModal'));

export default FoodStatusTracker;