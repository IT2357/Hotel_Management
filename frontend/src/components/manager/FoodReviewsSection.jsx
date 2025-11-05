import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  Filter, 
  Calendar,
  TrendingDown,
  AlertTriangle,
  User,
  Package,
  Flag,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import FoodButton from '../food/FoodButton';
import FoodBadge from '../food/FoodBadge';
import FoodCard, { FoodCardContent, FoodCardHeader, FoodCardTitle } from '../food/FoodCard';
import api from '../../services/api';

const FoodReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    weeklyReviews: 0,
    monthlyReviews: 0,
    lowRatedItems: 0
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all food orders with reviews
      const response = await api.get('/food/orders');
      const orders = response.data?.data || [];
      
      // Extract reviews from orders
      const reviewsData = orders
        .filter(order => order.review && order.status === 'Delivered')
        .map(order => ({
          ...order.review,
          orderId: order._id,
          orderNumber: order.orderNumber || order._id.slice(-6).toUpperCase(),
          customerName: order.customerDetails?.name || order.userId?.name || 'Guest',
          orderDate: order.createdAt,
          items: order.items,
          orderType: order.orderType
        }))
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setReviews(reviewsData);
      
      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;
      const weeklyCount = reviewsData.filter(r => new Date(r.submittedAt) >= weekAgo).length;
      const monthlyCount = reviewsData.filter(r => new Date(r.submittedAt) >= monthAgo).length;
      const lowRated = reviewsData.filter(r => r.rating < 3).length;

      setStats({
        averageRating: avgRating,
        totalReviews: reviewsData.length,
        weeklyReviews: weeklyCount,
        monthlyReviews: monthlyCount,
        lowRatedItems: lowRated
      });
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    const matchesSearch = !searchTerm || 
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesSearch;
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <FoodCard className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <FoodCardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-600">Average Rating</p>
          </FoodCardContent>
        </FoodCard>

        <FoodCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <FoodCardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">
                {stats.totalReviews}
              </span>
            </div>
            <p className="text-xs text-gray-600">Total Reviews</p>
          </FoodCardContent>
        </FoodCard>

        <FoodCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <FoodCardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                {stats.weeklyReviews}
              </span>
            </div>
            <p className="text-xs text-gray-600">This Week</p>
          </FoodCardContent>
        </FoodCard>

        <FoodCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <FoodCardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">
                {stats.monthlyReviews}
              </span>
            </div>
            <p className="text-xs text-gray-600">This Month</p>
          </FoodCardContent>
        </FoodCard>

        <FoodCard className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <FoodCardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {stats.lowRatedItems}
              </span>
            </div>
            <p className="text-xs text-gray-600">Low Rated (&lt;3⭐)</p>
          </FoodCardContent>
        </FoodCard>
      </div>

      {/* Filters */}
      <FoodCard>
        <FoodCardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Rating Filter */}
            <div className="flex gap-2">
              <FoodButton
                onClick={() => setFilterRating('all')}
                variant={filterRating === 'all' ? 'default' : 'outline'}
                className={filterRating === 'all' ? 'bg-orange-500 text-white' : ''}
              >
                All
              </FoodButton>
              {[5, 4, 3, 2, 1].map((rating) => (
                <FoodButton
                  key={rating}
                  onClick={() => setFilterRating(rating.toString())}
                  variant={filterRating === rating.toString() ? 'default' : 'outline'}
                  className={filterRating === rating.toString() ? 'bg-orange-500 text-white' : ''}
                >
                  {rating}⭐
                </FoodButton>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </FoodCardContent>
      </FoodCard>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <FoodCard>
          <FoodCardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <FoodButton onClick={fetchReviews} className="mt-4">
              Try Again
            </FoodButton>
          </FoodCardContent>
        </FoodCard>
      ) : filteredReviews.length === 0 ? (
        <FoodCard>
          <FoodCardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews found</p>
          </FoodCardContent>
        </FoodCard>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReviews.map((review) => (
              <motion.div
                key={review.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FoodCard className="hover:shadow-lg transition-shadow">
                  <FoodCardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                          <p className="text-sm text-gray-500">
                            Order #{review.orderNumber} • {formatDate(review.submittedAt)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm font-medium text-gray-700">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <FoodBadge variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'danger'}>
                          {review.orderType || 'Dine-in'}
                        </FoodBadge>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 text-sm">"{review.comment}"</p>
                      </div>
                    )}

                    {/* Order Items */}
                    <button
                      onClick={() => setExpandedReview(expandedReview === review.orderId ? null : review.orderId)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <Package className="w-4 h-4" />
                      {review.items?.length || 0} item(s) ordered
                      {expandedReview === review.orderId ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {expandedReview === review.orderId && review.items && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pl-6 space-y-1"
                      >
                        {review.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            • {item.name} x{item.quantity}
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <FoodButton
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Flag
                      </FoodButton>
                    </div>
                  </FoodCardContent>
                </FoodCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FoodReviewsSection;

