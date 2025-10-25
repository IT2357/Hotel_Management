import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare, 
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  User,
  Image as ImageIcon,
  Send,
  X
} from 'lucide-react';
import FoodButton from './FoodButton';
import FoodBadge from './FoodBadge';
import { toast } from 'sonner';
import foodService from '../../services/foodService';

const MenuItemReviews = ({ menuItemId, menuItem }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'helpful', 'rating'
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    photos: []
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews
  useEffect(() => {
    if (menuItemId) {
      fetchReviews();
    }
  }, [menuItemId, sortBy, filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await foodService.getMenuItemReviews(menuItemId, {
        rating: filter !== 'all' ? filter : undefined,
        sortBy
      });
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Calculate review statistics
  const stats = React.useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;
    
    const distribution = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return { average, total, distribution };
  }, [reviews]);

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error('Please provide a title and comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await foodService.submitMenuItemReview(menuItemId, reviewForm);
      
      setReviews([response.data, ...reviews]);
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
        photos: []
      });
      setShowReviewForm(false);
      
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Vote on review
  const handleVote = async (reviewId, isHelpful) => {
    try {
      await foodService.voteReview(reviewId, isHelpful);
      // Update local state
      setReviews(reviews.map(r => 
        r._id === reviewId 
          ? { ...r, helpfulCount: r.helpfulCount + (isHelpful ? 1 : -1) }
          : r
      ));
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Stats Header */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center md:border-r md:border-orange-200 md:pr-8">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {stats.average.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(stats.average)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600">Based on {stats.total} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <button
                  key={rating}
                  onClick={() => setFilter(filter === rating.toString() ? 'all' : rating.toString())}
                  className={`w-full flex items-center gap-3 hover:bg-white/50 rounded-lg p-2 transition-colors ${
                    filter === rating.toString() ? 'bg-white' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Write Review Button */}
        <div className="mt-6 pt-6 border-t border-orange-200">
          <FoodButton
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Write a Review
          </FoodButton>
        </div>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border-2 border-orange-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Write Your Review</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewForm.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-gray-600">
                    {reviewForm.rating} / 5
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Sum up your experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Tell us what you think about this dish..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <FoodButton
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </FoodButton>
                <FoodButton
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </FoodButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {filter === 'all' ? 'All Reviews' : `${filter} Star Reviews`}
          </span>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">Be the first to review this dish!</p>
            <FoodButton
              onClick={() => setShowReviewForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Write the First Review
            </FoodButton>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.userName?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.userName || 'Guest'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {review.title}
                  </h4>
                )}

                {/* Review Comment */}
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {review.comment}
                </p>

                {/* Review Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleVote(review._id, true)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpfulCount || 0})</span>
                    </button>
                  </div>
                  
                  {review.verifiedPurchase && (
                    <FoodBadge variant="success" size="sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified Purchase
                    </FoodBadge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MenuItemReviews;


