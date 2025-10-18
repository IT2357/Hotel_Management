// 📁 frontend/src/components/food/TaskCard.jsx
// Individual Task Card Component for Kitchen Queue
// Displays order details, priority, timer, and action buttons
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ChefHat,
  Flame,
  Play,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Users,
  Timer
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';

const TaskCard = ({ task, index, onAction }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [eta, setEta] = useState(null);

  // Update timer every second
  useEffect(() => {
    if (task.status === 'in-progress' && task.startedAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const started = new Date(task.startedAt);
        const elapsed = Math.floor((now - started) / 1000); // seconds
        setTimeElapsed(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [task.status, task.startedAt]);

  // Calculate ETA
  useEffect(() => {
    if (task.estimatedCompletionTime) {
      const etaDate = new Date(task.estimatedCompletionTime);
      setEta(etaDate);
    }
  }, [task.estimatedCompletionTime]);

  // Format time elapsed
  const formatTimeElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format ETA
  const formatETA = (etaDate) => {
    if (!etaDate) return null;

    const now = new Date();
    const diffMinutes = Math.floor((etaDate - now) / 1000 / 60);

    if (diffMinutes <= 0) return 'Overdue';
    if (diffMinutes === 1) return '1 min';
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (task.status) {
      case 'queued':
        return { label: 'Queued', color: 'bg-blue-100 text-blue-700', icon: Clock };
      case 'assigned':
        return { label: 'Assigned', color: 'bg-purple-100 text-purple-700', icon: Users };
      case 'in-progress':
        return { label: 'In Progress', color: 'bg-orange-100 text-orange-700', icon: ChefHat };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle };
    }
  };

  // Get priority display
  const getPriorityDisplay = () => {
    if (task.isRoomService) {
      return { label: 'Room Service', color: 'bg-red-600 text-white', icon: MapPin };
    }

    switch (task.priority) {
      case 'urgent':
        return { label: 'Urgent', color: 'bg-red-500 text-white', icon: Flame };
      case 'high':
        return { label: 'High', color: 'bg-orange-500 text-white', icon: Flame };
      case 'normal':
        return { label: 'Normal', color: 'bg-blue-500 text-white', icon: Clock };
      case 'low':
        return { label: 'Low', color: 'bg-gray-500 text-white', icon: Clock };
      default:
        return { label: 'Unknown', color: 'bg-gray-300 text-gray-700', icon: AlertTriangle };
    }
  };

  const statusDisplay = getStatusDisplay();
  const priorityDisplay = getPriorityDisplay();
  const StatusIcon = statusDisplay.icon;
  const PriorityIcon = priorityDisplay.icon;

  // Check if ETA is approaching or overdue
  const isEtaWarning = eta && (new Date() - eta) > -5 * 60 * 1000; // 5 min warning
  const isEtaOverdue = eta && new Date() > eta;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className={`
        bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300
        ${task.isRoomService ? 'border-red-300 shadow-red-100' : 'border-gray-200'}
        ${task.status === 'in-progress' ? 'ring-2 ring-orange-200' : ''}
        hover:shadow-xl
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              Order #{task.orderId?._id?.slice(-6).toUpperCase() || 'N/A'}
            </h3>
            
            {/* Priority Badge */}
            <FoodBadge className={priorityDisplay.color}>
              <div className="flex items-center gap-1">
                <PriorityIcon className="w-3 h-3" />
                {priorityDisplay.label}
              </div>
            </FoodBadge>

            {/* Status Badge */}
            <FoodBadge className={statusDisplay.color}>
              <div className="flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusDisplay.label}
              </div>
            </FoodBadge>
          </div>

          {/* Task Type */}
          <p className="text-sm text-gray-600">
            Task: <span className="font-medium capitalize">{task.taskType}</span>
          </p>
        </div>

        {/* Timer / ETA */}
        <div className="text-right">
          {task.status === 'in-progress' ? (
            <div className="bg-orange-100 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2 text-orange-700">
                <Timer className="w-4 h-4" />
                <span className="font-mono font-bold text-lg">
                  {formatTimeElapsed(timeElapsed)}
                </span>
              </div>
              <p className="text-xs text-orange-600">Elapsed</p>
            </div>
          ) : eta && (
            <div className={`px-3 py-2 rounded-xl ${
              isEtaOverdue ? 'bg-red-100' : isEtaWarning ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              <div className={`flex items-center gap-2 ${
                isEtaOverdue ? 'text-red-700' : isEtaWarning ? 'text-yellow-700' : 'text-blue-700'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-bold">
                  {formatETA(eta)}
                </span>
              </div>
              <p className={`text-xs ${
                isEtaOverdue ? 'text-red-600' : isEtaWarning ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {isEtaOverdue ? 'Overdue' : 'ETA'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
        <div className="space-y-1">
          {task.orderId?.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.name || item.foodId?.name || 'Unknown Item'}
              </span>
              <span className="text-gray-500">
                LKR {((item.price || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          )) || (
            <p className="text-sm text-gray-500">No items available</p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-gray-700">Total:</span>
            <span className="text-orange-600">
              LKR {(task.orderId?.totalPrice || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Type & Special Notes */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {task.orderId?.orderType === 'room-service' ? 'Room Service' :
               task.orderId?.isTakeaway ? 'Takeaway' : 'Dine-in'}
            </span>
          </div>

          {task.orderId?.customerDetails?.deliveryAddress && (
            <span className="text-gray-600 text-xs">
              {task.orderId.customerDetails.deliveryAddress}
            </span>
          )}
        </div>

        {task.orderId?.customerDetails?.specialInstructions && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-1">Special Instructions:</p>
            <p className="text-sm text-gray-700 italic">
              {task.orderId.customerDetails.specialInstructions}
            </p>
          </div>
        )}

        {task.notes && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-1">Staff Notes:</p>
            <p className="text-sm text-gray-700">
              {task.notes}
            </p>
          </div>
        )}
      </div>

      {/* Allergen Warning */}
      {!task.allergyChecked && task.orderId?.items?.some(item => 
        item.foodId?.allergens && item.foodId.allergens.length > 0
      ) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Allergen Alert</p>
            <p className="text-xs text-yellow-700">
              This order contains allergens. Please verify ingredients.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {task.status === 'queued' || task.status === 'assigned' ? (
          <FoodButton
            onClick={() => onAction(task._id, 'start')}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Preparation
          </FoodButton>
        ) : task.status === 'in-progress' ? (
          <FoodButton
            onClick={() => onAction(task._id, 'ready')}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Ready
          </FoodButton>
        ) : null}
      </div>

      {/* Assigned Staff Info */}
      {task.assignedTo && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>
            Assigned to: {task.assignedTo.name || 'Staff Member'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;
