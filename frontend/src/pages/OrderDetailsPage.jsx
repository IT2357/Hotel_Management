import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Star,
  MessageSquare,
  Calendar,
  DollarSign,
  Receipt
} from 'lucide-react';
import { FoodButton } from '../components/ui/food/FoodButton';
import { FoodCard, FoodCardContent, FoodCardHeader, FoodCardTitle } from '../components/ui/food/FoodCard';
import { FoodBadge } from '../components/ui/food/FoodBadge';
import { toast } from 'sonner';
import api from '../services/api';
import Rating from '../components/ui/Rating';
import FoodReview from '../components/food/FoodReview';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/food/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const handleReviewSubmitted = (review) => {
    setOrder(prevOrder => ({
      ...prevOrder,
      review
    }));
    setReviewMode(false);
    toast.success('Review submitted successfully!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5" />;
      case 'Preparing':
        return <ChefHat className="h-5 w-5" />;
      case 'Delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Order not found</h3>
          <FoodButton onClick={() => navigate('/my-orders')}>
            Back to Orders
          </FoodButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <FoodButton
              onClick={() => navigate('/my-orders')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </FoodButton>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Details</h1>
            <p className="text-lg opacity-90">Order #{order._id.slice(-8).toUpperCase()}</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FoodCard variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <FoodCardHeader className="bg-gradient-to-r from-orange-100 to-red-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <FoodCardTitle className="text-xl font-bold text-gray-800 mb-2">
                        Order Summary
                      </FoodCardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Receipt className="h-4 w-4" />
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <FoodBadge variant={getStatusColor(order.status)} size="lg">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </FoodBadge>
                  </div>
                </FoodCardHeader>

                <FoodCardContent className="p-6">
                  {/* Order Items */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 text-lg">Order Items</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                            <ChefHat className="h-8 w-8 text-orange-600" style={{ display: item.foodId?.imageUrl ? 'none' : 'block' }} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-lg">{item.name}</p>
                            <p className="text-sm text-gray-600">LKR {item.price.toFixed(2)} each</p>
                            <FoodBadge variant="secondary" size="sm">
                              Qty: {item.quantity}
                            </FoodBadge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800 text-lg">LKR {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-800">Total Amount</span>
                      <span className="text-2xl font-bold text-orange-600">LKR {order.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </FoodCardContent>
              </FoodCard>
            </motion.div>

            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FoodCard variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <FoodCardHeader>
                  <FoodCardTitle className="text-xl font-bold text-gray-800">
                    Order Timeline
                  </FoodCardTitle>
                </FoodCardHeader>
                <FoodCardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Order Placed</p>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    
                    {order.status !== 'Cancelled' && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            ['Preparing', 'Delivered'].includes(order.status) 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            <ChefHat className={`w-5 h-5 ${
                              ['Preparing', 'Delivered'].includes(order.status) 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Order Being Prepared</p>
                            {['Preparing', 'Delivered'].includes(order.status) && (
                              <p className="text-sm text-gray-600">Your food is being prepared with care</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            order.status === 'Delivered' 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            <Package className={`w-5 h-5 ${
                              order.status === 'Delivered' 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Order Delivered</p>
                            {order.status === 'Delivered' && (
                              <p className="text-sm text-gray-600">Enjoy your meal!</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {order.status === 'Cancelled' && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Order Cancelled</p>
                          <p className="text-sm text-gray-600">This order has been cancelled</p>
                        </div>
                      </div>
                    )}
                  </div>
                </FoodCardContent>
              </FoodCard>
            </motion.div>
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Customer Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <FoodCard variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <FoodCardHeader>
                  <FoodCardTitle className="text-lg font-bold text-gray-800">
                    Order Information
                  </FoodCardTitle>
                </FoodCardHeader>
                <FoodCardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Type:</strong> {order.isTakeaway ? 'Takeaway' : 'Dine-in'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Payment:</strong> {order.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Status:</strong> {order.paymentStatus}
                    </span>
                  </div>

                  {order.customerDetails && (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-3">Customer Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{order.customerDetails.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{order.customerDetails.phone}</span>
                          </div>
                          {order.customerDetails.deliveryAddress && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                              <span className="text-sm">{order.customerDetails.deliveryAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {order.customerDetails?.specialInstructions && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-2">Special Instructions</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {order.customerDetails.specialInstructions}
                      </p>
                    </div>
                  )}
                </FoodCardContent>
              </FoodCard>
            </motion.div>

            {/* Review Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <FoodCard variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <FoodCardHeader>
                  <FoodCardTitle className="text-lg font-bold text-gray-800">
                    Order Review
                  </FoodCardTitle>
                </FoodCardHeader>
                <FoodCardContent className="p-6">
                  {order.review ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Rating value={order.review.rating} readonly size="sm" />
                        <span className="text-sm text-gray-600">
                          {new Date(order.review.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {order.review.comment && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700">{order.review.comment}</p>
                        </div>
                      )}
                      <FoodBadge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Review Submitted
                      </FoodBadge>
                    </div>
                  ) : order.status === 'Delivered' ? (
                    <div className="text-center space-y-4">
                      {reviewMode ? (
                        <FoodReview
                          orderId={order._id}
                          order={order}
                          onReviewSubmitted={handleReviewSubmitted}
                          onClose={() => setReviewMode(false)}
                        />
                      ) : (
                        <>
                          <p className="text-gray-600 text-sm mb-4">
                            How was your experience with this order?
                          </p>
                          <FoodButton
                            onClick={() => setReviewMode(true)}
                            className="w-full"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Write a Review
                          </FoodButton>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Reviews available after delivery</p>
                    </div>
                  )}
                </FoodCardContent>
              </FoodCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <FoodCard variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <FoodCardContent className="p-6 space-y-3">
                  <FoodButton
                    onClick={() => navigate('/menu')}
                    variant="outline"
                    className="w-full"
                  >
                    Order Again
                  </FoodButton>
                  <FoodButton
                    onClick={() => navigate('/my-orders')}
                    className="w-full"
                  >
                    View All Orders
                  </FoodButton>
                </FoodCardContent>
              </FoodCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;