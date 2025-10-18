import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, User, Clock, Flag } from 'lucide-react';
import FoodButton from './FoodButton';
import FoodInput from './FoodInput';
import FoodTextarea from './FoodTextarea';
import { Card, CardContent, CardHeader, CardTitle } from './FoodCard';
import FoodBadge from './FoodBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './FoodDialog';
import { toast } from 'sonner';
import foodService from '../../services/foodService';

const FoodReviewSystem = ({ menuItemId, onReviewSubmit }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');
  
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    isAnonymous: false,
    helpful: true
  });

  // Fetch reviews for the menu item
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await foodService.getMenuItemReviews(menuItemId, {
          sort: sortBy,
          rating: filterRating === 'all' ? undefined : parseInt(filterRating)
        });
        setReviews(response.data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (menuItemId) {
      fetchReviews();
    }
  }, [menuItemId, sortBy, filterRating]);

  // Calculate average rating and stats
  const reviewStats = React.useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }, [reviews]);

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await foodService.submitReview(menuItemId, reviewForm);
      
      setReviews(prev => [response.data, ...prev]);
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
        isAnonymous: false,
        helpful: true
      });
      setShowReviewForm(false);
      
      toast.success('Review submitted successfully!');
      
      if (onReviewSubmit) {
        onReviewSubmit(response.data);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId, isHelpful) => {
    try {
      await foodService.voteReview(reviewId, isHelpful);
      
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { 
              ...review, 
              helpfulVotes: review.helpfulVotes + (isHelpful ? 1 : 0),
              notHelpfulVotes: review.notHelpfulVotes + (isHelpful ? 0 : 1)
            }
          : review
      ));
    } catch (error) {
      console.error('Error voting on review:', error);
      toast.error('Failed to vote on review');
    }
  };

  // Handle report review
  const handleReportReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to report this review?')) {
      return;
    }

    try {
      await foodService.reportReview(reviewId);
      toast.success('Review reported successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
    }
  };

  // Render star rating
  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Render rating distribution bar
  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-4 text-center">{rating}</span>
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-right text-gray-600">{count}</span>
      </div>
    );
  };

  // Filter and sort reviews
  const displayedReviews = React.useMemo(() => {
    let filtered = reviews;
    
    if (filterRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'most_helpful':
          return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return showAllReviews ? filtered : filtered.slice(0, 3);
  }, [reviews, sortBy, filterRating, showAllReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF9933]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating Overview */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#4A4A4A]">
                    {reviewStats.averageRating}
                  </div>
                  <div className="flex items-center justify-center">
                    {renderStars(Math.round(reviewStats.averageRating))}
                  </div>
                  <div className="text-sm text-[#4A4A4A]/70 mt-1">
                    Based on {reviewStats.totalReviews} reviews
                  </div>
                </div>
              </div>
              
              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => 
                  renderRatingBar(
                    rating, 
                    reviewStats.ratingDistribution[rating], 
                    reviewStats.totalReviews
                  )
                )}
              </div>
            </div>

            {/* Review Actions */}
            <div className="space-y-4">
              <FoodButton
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-[#FF9933] hover:bg-[#CC7A29] text-white"
              >
                Write a Review
              </FoodButton>
              
              <div className="text-sm text-[#4A4A4A]/70">
                <p>Share your experience with this dish</p>
                <p>Help other customers make informed decisions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="most_helpful">Most Helpful</option>
          </select>
          
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        
        <div className="text-sm text-[#4A4A4A]/70">
          Showing {displayedReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">No reviews yet</h3>
              <p className="text-[#4A4A4A]/70 mb-4">Be the first to review this dish!</p>
              <FoodButton
                onClick={() => setShowReviewForm(true)}
                className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
              >
                Write First Review
              </FoodButton>
            </CardContent>
          </Card>
        ) : (
          displayedReviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FF9933] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#4A4A4A]">
                          {review.isAnonymous ? 'Anonymous' : review.customerName || 'Customer'}
                        </h4>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-[#4A4A4A]/70">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FoodBadge variant="outline" className="text-xs">
                        {review.helpful ? 'Helpful' : 'Not Helpful'}
                      </FoodBadge>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h5 className="font-semibold text-[#4A4A4A] mb-2">{review.title}</h5>
                  )}
                  
                  <p className="text-[#4A4A4A]/80 mb-4">{review.comment}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleHelpfulVote(review._id, true)}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Helpful ({review.helpfulVotes || 0})
                      </button>
                      <button
                        onClick={() => handleHelpfulVote(review._id, false)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Not Helpful ({review.notHelpfulVotes || 0})
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleReportReview(review._id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <div className="text-center">
          <FoodButton
            variant="outline"
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933]/10"
          >
            {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
          </FoodButton>
        </div>
      )}

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-2">
                {renderStars(reviewForm.rating, true, (rating) => 
                  setReviewForm(prev => ({ ...prev, rating }))
                )}
                <span className="text-sm text-[#4A4A4A]/70 ml-2">
                  {reviewForm.rating} out of 5 stars
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                Review Title *
              </label>
              <FoodInput
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                Your Review *
              </label>
              <FoodTextarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Tell us about your experience with this dish..."
                rows={4}
                maxLength={500}
              />
              <div className="text-right text-sm text-[#4A4A4A]/70 mt-1">
                {reviewForm.comment.length}/500 characters
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reviewForm.isAnonymous}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="w-4 h-4 text-[#FF9933] border-gray-300 rounded focus:ring-[#FF9933]"
                />
                <span className="text-sm text-[#4A4A4A]">Submit anonymously</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reviewForm.helpful}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, helpful: e.target.checked }))}
                  className="w-4 h-4 text-[#FF9933] border-gray-300 rounded focus:ring-[#FF9933]"
                />
                <span className="text-sm text-[#4A4A4A]">This review is helpful to others</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <FoodButton
                type="button"
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                disabled={submitting}
              >
                Cancel
              </FoodButton>
              <FoodButton
                type="submit"
                disabled={submitting}
                className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </FoodButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodReviewSystem;
