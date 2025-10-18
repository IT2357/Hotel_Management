import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  ShoppingBag, 
  QrCode, 
  Phone, 
  MapPin,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import FoodButton from './FoodButton';

const OrderTracking = ({ 
  order, 
  onRefresh, 
  className = '' 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [estimatedTime, setEstimatedTime] = useState(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate estimated completion time
  useEffect(() => {
    if (order && order.createdAt) {
      const orderTime = new Date(order.createdAt);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - orderTime) / 60000);
      
      // Estimate based on order type and status
      let estimatedMinutes = 20; // Default
      
      if (order.orderType === 'dine-in') {
        estimatedMinutes = 25; // Dine-in takes longer
      } else if (order.orderType === 'takeaway') {
        estimatedMinutes = 15; // Takeaway is faster
      }
      
      // Adjust based on current status
      if (order.status === 'preparing') {
        estimatedMinutes = Math.max(10, estimatedMinutes - elapsedMinutes);
      } else if (order.status === 'ready') {
        estimatedMinutes = 0;
      }
      
      setEstimatedTime(estimatedMinutes);
    }
  }, [order, currentTime]);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        title: 'Order Received',
        description: 'Your order has been received and is being processed',
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      confirmed: {
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is being prepared',
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      preparing: {
        title: 'Preparing Your Order',
        description: 'Our chefs are preparing your delicious meal',
        icon: ChefHat,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      ready: {
        title: 'Ready for Pickup',
        description: order.orderType === 'dine-in' 
          ? 'Your order is ready! Please wait for table service'
          : 'Your order is ready for pickup!',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      delivered: {
        title: 'Order Delivered',
        description: 'Your order has been delivered. Enjoy your meal!',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      cancelled: {
        title: 'Order Cancelled',
        description: 'Your order has been cancelled',
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    };

    return statusMap[status] || statusMap.pending;
  };

  const getTimelineSteps = () => {
    const steps = [
      { key: 'pending', title: 'Order Received' },
      { key: 'confirmed', title: 'Order Confirmed' },
      { key: 'preparing', title: 'Preparing' },
      { key: 'ready', title: 'Ready' },
      { key: 'delivered', title: 'Delivered' }
    ];

    const currentIndex = steps.findIndex(step => step.key === order.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const generatePickupCode = () => {
    if (!order.pickupCode) {
      // Generate a simple pickup code
      return `TK${order._id.slice(-6).toUpperCase()}`;
    }
    return order.pickupCode;
  };

  if (!order) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Order Found</h3>
        <p className="text-gray-500">Please check your order ID and try again.</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const timelineSteps = getTimelineSteps();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Order Header */}
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
          <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
        </div>
        <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">{statusInfo.title}</h2>
        <p className="text-[#4A4A4A]/70 mb-4">{statusInfo.description}</p>
        
        {/* Order ID */}
        <div className="text-sm text-[#4A4A4A]/60">
          Order ID: {order._id || order.id}
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#4A4A4A] mb-4">Order Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-[#4A4A4A]/70 mb-1">Order Type</div>
            <div className="flex items-center gap-2">
              {order.orderType === 'dine-in' ? (
                <ChefHat className="w-4 h-4 text-[#FF9933]" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-[#FF9933]" />
              )}
              <span className="font-medium text-[#4A4A4A] capitalize">
                {order.orderType.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-[#4A4A4A]/70 mb-1">Total Amount</div>
            <div className="font-semibold text-[#FF9933] text-lg">
              LKR {order.totals?.total?.toFixed(2) || order.totalPrice?.toFixed(2) || '0.00'}
            </div>
          </div>

          {order.tableNumber && (
            <div>
              <div className="text-sm text-[#4A4A4A]/70 mb-1">Table Number</div>
              <div className="font-medium text-[#4A4A4A]">Table {order.tableNumber}</div>
            </div>
          )}

          {order.pickupTime && (
            <div>
              <div className="text-sm text-[#4A4A4A]/70 mb-1">Pickup Time</div>
              <div className="font-medium text-[#4A4A4A]">{order.pickupTime} minutes</div>
            </div>
          )}

          <div>
            <div className="text-sm text-[#4A4A4A]/70 mb-1">Order Time</div>
            <div className="font-medium text-[#4A4A4A]">
              {formatTime(order.createdAt)}
            </div>
          </div>

          <div>
            <div className="text-sm text-[#4A4A4A]/70 mb-1">Payment Method</div>
            <div className="font-medium text-[#4A4A4A] capitalize">
              {order.paymentMethod?.toLowerCase() || 'Cash'}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#4A4A4A] mb-6">Order Progress</h3>
        
        <div className="space-y-4">
          {timelineSteps.map((step, index) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                step.completed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-current" />
                )}
              </div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  step.completed ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {step.title}
                </div>
                {step.current && (
                  <div className="text-sm text-green-600">
                    Currently in progress
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Estimated Time */}
      {estimatedTime !== null && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                {estimatedTime > 0 ? 'Estimated Time Remaining' : 'Your order is ready!'}
              </h4>
              <p className="text-blue-700">
                {estimatedTime > 0 
                  ? `Approximately ${estimatedTime} minutes`
                  : 'Please come to collect your order'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Code for Takeaway */}
      {order.orderType === 'takeaway' && order.status === 'ready' && (
        <div className="bg-[#FF9933]/10 rounded-xl border border-[#FF9933]/20 p-6">
          <div className="text-center">
            <QrCode className="w-12 h-12 text-[#FF9933] mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-[#4A4A4A] mb-2">
              Your Pickup Code
            </h4>
            <div className="text-3xl font-bold text-[#FF9933] mb-2">
              {generatePickupCode()}
            </div>
            <p className="text-sm text-[#4A4A4A]/70">
              Show this code to our staff when collecting your order
            </p>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold text-[#4A4A4A] mb-4">Need Help?</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#FF9933]" />
            <div>
              <div className="font-medium text-[#4A4A4A]">Call Us</div>
              <div className="text-sm text-[#4A4A4A]/70">+94 77 123 4567</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#FF9933]" />
            <div>
              <div className="font-medium text-[#4A4A4A]">Visit Us</div>
              <div className="text-sm text-[#4A4A4A]/70">123 Culinary Street, Colombo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <FoodButton
          onClick={onRefresh}
          className="bg-[#FF9933] hover:bg-[#CC7A29] text-white px-6 py-3"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </FoodButton>
      </div>
    </div>
  );
};

export default OrderTracking;
