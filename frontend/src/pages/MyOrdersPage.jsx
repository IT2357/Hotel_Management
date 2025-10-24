import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Star,
  MessageSquare
} from 'lucide-react';
import FoodButton, { FoodButton as FoodButtonNamed } from '../components/food/FoodButton';
import FoodCard, { Card, CardContent, CardHeader, CardTitle } from '../components/food/FoodCard';
import FoodBadge, { FoodBadge as FoodBadgeNamed } from '../components/food/FoodBadge';
import SharedNavbar from '../components/shared/SharedNavbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import Rating from '../components/ui/Rating';
import FoodReview from '../components/food/FoodReview';

const MyOrdersPage = () => {
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
      const response = await api.get('/food/orders/customer'); // Correct endpoint
      console.log('Orders response:', response.data); // Debug log
      setOrders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load your orders');
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
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Preparing':
        return <ChefHat className="h-4 w-4" />;
      case 'Delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Preparing':
        return 'primary';
      case 'Delivered':
        return 'success';
      case 'Cancelled':
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <SharedNavbar showBackButton={true} backPath="/" />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-6 pt-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Food Orders</h1>
            <p className="text-lg opacity-90">Track your delicious orders</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
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
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <FoodCard variant="elevated" className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            LKR {order.totalPrice.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {order.isTakeaway ? 'Takeaway' : 'Dine-in'}
                          </div>
                        </div>
                      </div>
                      <FoodBadge variant={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </FoodBadge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.foodId?.imageUrl ? (
                                  <img
                                    src={item.foodId.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                ) : null}
                                <ChefHat className="h-6 w-6 text-indigo-600" style={{ display: item.foodId?.imageUrl ? 'none' : 'block' }} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">LKR {(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-sm text-gray-600">LKR {item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Details */}
                    {order.customerDetails && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">Customer Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{order.customerDetails.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{order.customerDetails.phone}</span>
                          </div>
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
                      <div className="flex items-center gap-4">
                        <FoodBadge variant="secondary" size="sm">
                          Payment: {order.paymentMethod}
                        </FoodBadge>
                        <FoodBadge variant="secondary" size="sm">
                          Status: {order.paymentStatus}
                        </FoodBadge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">
                          Total: LKR {order.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Review Section */}
                    <div className="pt-4 border-t border-gray-200">
                      {order.review ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
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
                            <p className="text-gray-700 text-sm bg-white p-3 rounded border">
                              {order.review.comment}
                            </p>
                          )}
                        </div>
                      ) : order.status === 'Delivered' ? (
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
                              className="flex items-center gap-2 mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <Star className="w-4 h-4" />
                              Rate Your Order
                            </FoodButton>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-sm">
                          <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-50" />
                          Reviews available after delivery
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
    </div>
  );
};

export default MyOrdersPage;