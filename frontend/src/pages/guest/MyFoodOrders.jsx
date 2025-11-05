import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Star,
  MessageSquare,
  UtensilsCrossed
} from 'lucide-react';
import FoodButton from '../../components/food/FoodButton';
import FoodCard, { CardContent, CardHeader, CardTitle } from '../../components/food/FoodCard';
import FoodBadge from '../../components/food/FoodBadge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';
import Rating from '../../components/ui/Rating';
import FoodReview from '../../components/food/FoodReview';

const MyFoodOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      let response;
      if (token) {
        // Authenticated user - add timestamp to bypass cache
        response = await api.get(`/food/orders/customer?_t=${Date.now()}`);
      } else {
        // Guest user - get email from localStorage
        const guestEmail = localStorage.getItem('guestOrderEmail');
        if (!guestEmail) {
          toast.error('Please provide your email to view orders');
          setOrders([]);
          return;
        }
        // Add timestamp to bypass browser cache
        response = await api.get(`/food/orders/customer?email=${encodeURIComponent(guestEmail)}&_t=${Date.now()}`);
      }
      
      console.log('📦 Food Orders response:', response.data);
      const orderData = response.data.data || response.data || [];
      console.log('📊 Number of orders:', orderData.length);
      setOrders(orderData);
      
      if (orderData.length === 0) {
        toast.info('You have no food orders yet');
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load your orders';
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewUpdate = (orderId, review) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId
          ? { ...order, review }
          : order
      )
    );
    setReviewOrderId(null);
    toast.success('Thank you for your review!');
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'preparing':
      case 'ready':
        return <ChefHat className="h-4 w-4" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return 'warning';
      case 'preparing':
      case 'ready':
        return 'primary';
      case 'delivered':
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UtensilsCrossed className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold text-gray-900">My Food Orders</h2>
        </div>
        <p className="text-gray-600">Track your delicious orders and leave reviews</p>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-50 rounded-2xl"
        >
          <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start by ordering some delicious food from our menu!</p>
          <FoodButton
            onClick={() => navigate('/menu')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            Browse Menu
          </FoodButton>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <FoodCard variant="elevated" className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-100">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          LKR {order.totalPrice?.toFixed(2) || '0.00'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {order.orderType ? order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1) : (order.isTakeaway ? 'Takeaway' : 'Dine-in')}
                        </div>
                      </div>
                    </div>
                    <FoodBadge variant={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                      </div>
                    </FoodBadge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-indigo-600" />
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {item.foodId?.imageUrl || item.foodId?.image ? (
                                <img
                                  src={item.foodId.imageUrl || item.foodId.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <ChefHat className="h-6 w-6 text-indigo-600" style={{ display: (item.foodId?.imageUrl || item.foodId?.image) ? 'none' : 'flex' }} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">LKR {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">LKR {(item.price || 0).toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Details */}
                  {order.customerDetails && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Customer Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                        {order.customerDetails.name && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Name:</span>
                            <span className="text-sm text-gray-600">{order.customerDetails.name}</span>
                          </div>
                        )}
                        {order.customerDetails.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{order.customerDetails.email}</span>
                          </div>
                        )}
                        {order.customerDetails.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{order.customerDetails.phone}</span>
                          </div>
                        )}
                        {order.customerDetails.deliveryAddress && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{order.customerDetails.deliveryAddress}</span>
                          </div>
                        )}
                        {order.customerDetails.specialInstructions && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">
                              <strong>Special Instructions:</strong> {order.customerDetails.specialInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <FoodBadge variant="secondary" size="sm">
                        Payment: {order.paymentMethod || 'N/A'}
                      </FoodBadge>
                      <FoodBadge variant="secondary" size="sm">
                        Status: {order.paymentStatus || 'Pending'}
                      </FoodBadge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">
                        Total: LKR {(order.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Review Section */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    {order.review ? (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-medium text-green-800">Your Review</h4>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Rating value={order.review.rating} readonly size="sm" />
                          <span className="text-sm text-gray-600">
                            {new Date(order.review.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {order.review.comment && (
                          <p className="text-gray-700 text-sm bg-white p-3 rounded-lg border mt-2">
                            {order.review.comment}
                          </p>
                        )}
                      </div>
                    ) : (order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed') ? (
                      <div className="text-center">
                        {reviewOrderId === order._id ? (
                          <div className="mt-4">
                            <FoodReview
                              orderId={order._id}
                              order={order}
                              onReviewSubmitted={(review) => handleReviewUpdate(order._id, review)}
                              onClose={() => setReviewOrderId(null)}
                            />
                          </div>
                        ) : (
                          <FoodButton
                            onClick={() => setReviewOrderId(order._id)}
                            className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Star className="w-4 h-4 fill-current" />
                            Rate Your Order
                          </FoodButton>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-3 bg-gray-50 rounded-lg">
                        <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-50" />
                        <p>Reviews available after delivery</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </FoodCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFoodOrders;

