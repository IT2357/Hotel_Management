import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Star, Send, MessageSquare, CheckCircle, X } from 'lucide-react';
import Rating from '../ui/rating';

const FoodReview = ({ orderId, order, onReviewSubmitted, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if review already exists
    if (order?.review) {
      setExistingReview(order.review);
      setRating(order.review.rating);
      setComment(order.review.comment || '');
    }
    setIsLoading(false);
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/food/orders/${orderId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setExistingReview(data.data);
        if (onReviewSubmitted) {
          onReviewSubmitted(data.data);
        }
        alert('Review submitted successfully!');
        if (onClose) onClose();
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canReview = order?.status === 'Delivered' && !existingReview;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Review Submitted</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Your Rating:</span>
            <Rating value={existingReview.rating} readonly size="sm" />
          </div>

          {existingReview.comment && (
            <div>
              <span className="text-sm text-gray-600">Your Comment:</span>
              <p className="mt-1 text-gray-800 bg-white p-3 rounded border">
                {existingReview.comment}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Submitted on {new Date(existingReview.submittedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          {order?.status !== 'Delivered' ? 'Order Not Delivered Yet' : 'Review Already Submitted'}
        </h3>
        <p className="text-gray-500">
          {order?.status !== 'Delivered'
            ? 'You can only review orders that have been delivered.'
            : 'You have already submitted a review for this order.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Rate Your Order</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you rate your overall experience?
          </label>
          <div className="flex items-center gap-4">
            <Rating
              value={rating}
              onChange={setRating}
              size="lg"
            />
            <span className="text-sm text-gray-500">
              {rating === 0 ? 'Select rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Comment Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Share your feedback (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience... What did you like? What could be improved?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {comment.length}/500 characters
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Order #{orderId.slice(-8)}</p>
            <p>Total: ${order?.totalPrice?.toFixed(2)}</p>
            <p>Items: {order?.items?.length || 0}</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

FoodReview.propTypes = {
  orderId: PropTypes.string.isRequired,
  order: PropTypes.shape({
    status: PropTypes.string,
    totalPrice: PropTypes.number,
    items: PropTypes.array,
    review: PropTypes.shape({
      rating: PropTypes.number,
      comment: PropTypes.string
    })
  }),
  onReviewSubmitted: PropTypes.func,
  onClose: PropTypes.func
};

export default FoodReview;