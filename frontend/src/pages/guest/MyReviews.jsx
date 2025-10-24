import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Star, Edit, Trash2, Calendar, MapPin, ThumbsUp, MessageCircle, X, Hotel, CheckCircle } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import bookingService from '../../services/bookingService';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    pros: '',
    cons: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch bookings that need reviews (only completed bookings can be reviewed)
      const response = await bookingService.getUserBookings({
        page: 1,
        limit: 50
      });

      console.log('Pending review bookings response:', response);

      if (response.success && response.data) {
        const bookingsData = response.data.bookings || response.data;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setError('Please log in to view your bookings.');
      } else {
        setError('Failed to load bookings. Please try again.');
      }

      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First fetch bookings
      await fetchBookings();
      
      // Then fetch reviews
      const reviewsResponse = await reviewService.getUserReviews();
      const userReviews = reviewsResponse.data || [];
      setReviews(userReviews);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to process bookings and reviews after both are loaded
useEffect(() => {
  if (bookings.length >= 0 && reviews.length >= 0) {
    // Filter only completed bookings (only completed stays can be reviewed)
    // Use a case-insensitive check because status value casing may vary ('completed' vs 'Completed')
    const completedOnly = bookings.filter(
      (booking) => String(booking.status).toLowerCase() === 'completed'
    );

    // Map and add review status info - the hasReview field is now properly set from backend
    const bookingsWithReviewStatus = completedOnly.map((booking) => ({
      ...booking,
      hasReview: booking.hasReview || false, // Use the hasReview field from backend
      reviewId: booking.reviewId || null,
    }));

    setConfirmedBookings(bookingsWithReviewStatus);
  }
}, [bookings, reviews]);


  const handleWriteReview = (booking) => {
    setExpandedBooking(booking._id);
    setReviewForm({
      rating: 0,
      title: '',
      comment: '',
      pros: '',
      cons: ''
    });
  };

  const handleCancelReview = () => {
    setExpandedBooking(null);
    setReviewForm({
      rating: 0,
      title: '',
      comment: '',
      pros: '',
      cons: ''
    });
  };

  const handleSubmitReview = async (booking) => {
    // Validate required fields
    if (!reviewForm.rating) {
      alert('Please provide a rating.');
      return;
    }
    
    if (!reviewForm.comment.trim()) {
      alert('Please provide a comment.');
      return;
    }
    
    // Validate comment length (minimum 10 characters)
    if (reviewForm.comment.trim().length < 10) {
      alert('Comment must be at least 10 characters long.');
      return;
    }
    
    // Validate comment length (maximum 1000 characters)
    if (reviewForm.comment.trim().length > 1000) {
      alert('Comment must be less than 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        bookingId: booking._id,
        rating: reviewForm.rating,
        title: reviewForm.title || `Review for ${booking.roomId?.title || 'Stay'}`,
        comment: reviewForm.comment,
        pros: reviewForm.pros ? reviewForm.pros.split(',').map(p => p.trim()).filter(p => p) : [],
        cons: reviewForm.cons ? reviewForm.cons.split(',').map(c => c.trim()).filter(c => c) : [],
        isAnonymous: reviewForm.isAnonymous || false
      };


      const response = await reviewService.createReview(reviewData);
      
      // Update the booking's hasReview status in the confirmed bookings list
      setConfirmedBookings(prev => prev.map(b => 
        b._id === booking._id 
          ? { ...b, hasReview: true, reviewId: response.data._id }
          : b
      ));
      
      // Refresh reviews to include the new one
      const reviewsResponse = await reviewService.getUserReviews();
      setReviews(reviewsResponse.data || []);
      
      // Reset form and collapse
      handleCancelReview();
      
      // Show success message
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Handle validation errors from backend
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = error.response.data.errors.join('\n');
        alert(`Validation Error:\n${errorMessages}`);
      } else if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = async (reviewId) => {
    try {
      // Navigate to edit review page or open edit modal
      console.log('Edit review:', reviewId);
    } catch (error) {
      console.error('Error editing review:', error);
      alert('Failed to edit review. Please try again.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewService.deleteReview(reviewId);
        setReviews(prev => prev.filter(review => review.id !== reviewId));
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'published': 'bg-green-50 text-green-800 border-green-200',
      'draft': 'bg-yellow-50 text-yellow-800 border-yellow-200',
      'pending': 'bg-orange-50 text-orange-800 border-orange-200',
      'confirmed': 'bg-blue-50 text-blue-800 border-blue-200',
      'completed': 'bg-emerald-50 text-emerald-800 border-emerald-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 mb-6">
            <h1 className="text-3xl font-bold mb-2">
              My Reviews
            </h1>
            <p className="text-indigo-100">
              Share your experiences and manage your reviews
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Bookings ({confirmedBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Reviews ({reviews.length})
            </button>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={loading}
              className="hover:border-indigo-500 hover:text-indigo-600"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'pending' ? renderPendingReviews() : renderCompletedReviews()}
          </motion.div>
        </AnimatePresence>

        {/* Summary Stats */}
        {(reviews.length > 0 || confirmedBookings.length > 0) && (
          <motion.div 
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {confirmedBookings.filter(b => !b.hasReview).length}
              </div>
              <div className="text-gray-600">Awaiting Review</div>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {confirmedBookings.filter(b => b.hasReview).length}
              </div>
              <div className="text-gray-600">Reviewed Bookings</div>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
              </div>
              <div className="text-gray-600">Average Rating</div>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {reviews.reduce((sum, r) => sum + (r.helpful || 0), 0)}
              </div>
              <div className="text-gray-600">Total Helpful</div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );

  function renderPendingReviews() {
    if (confirmedBookings.length === 0) {
      return (
        <Card className="p-12 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No completed stays yet! 🏨
            </h3>
            <p className="text-gray-600">
              Once you have completed your stays, you can review them here. Only completed bookings can be reviewed.
            </p>
          </motion.div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {confirmedBookings.map((booking, index) => (
          <motion.div
            key={booking._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <Hotel className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {booking.roomId?.title || 'Room'} - Room {booking.roomId?.roomNumber || booking.roomNumber}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            {booking.status}
                          </Badge>
                          {booking.hasReview && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                              Reviewed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Check-in: {formatDate(booking.checkInDate || booking.checkIn)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Check-out: {formatDate(booking.checkOutDate || booking.checkOut)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Booking: #{booking.bookingNumber || booking._id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Guests: {booking.guests || booking.guestCount?.adults || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    {booking.hasReview ? (
                      <div className="text-center">
                        <div className="flex items-center space-x-2 text-green-600 mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Review Completed</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Switch to completed tab to view the review
                            setActiveTab('completed');
                          }}
                          className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                        >
                          View Review
                        </Button>
                      </div>
                    ) : expandedBooking === booking._id ? (
                      <Button
                        onClick={handleCancelReview}
                        variant="outline"
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleWriteReview(booking)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      >
                        Write Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Review Form */}
              <AnimatePresence>
                {expandedBooking === booking._id && !booking.hasReview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t bg-gradient-to-br from-gray-50 to-indigo-50"
                  >
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        Share Your Experience
                      </h4>

                      {/* Star Rating */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate your experience *
                        </label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewForm.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Title */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Review title
                        </label>
                        <input
                          type="text"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Summarize your experience..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Review Comment */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your review * (minimum 10 characters)
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder="Share your experience in detail... (minimum 10 characters)"
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 ${
                            reviewForm.comment.trim().length > 0 && reviewForm.comment.trim().length < 10
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-300 focus:border-indigo-500'
                          }`}
                        />
                        <div className="flex justify-between mt-1 text-sm">
                          <span className={`${
                            reviewForm.comment.trim().length < 10 && reviewForm.comment.trim().length > 0
                              ? 'text-red-500'
                              : reviewForm.comment.trim().length >= 10
                              ? 'text-green-500'
                              : 'text-gray-500'
                          }`}>
                            {reviewForm.comment.trim().length < 10 && reviewForm.comment.trim().length > 0
                              ? `${10 - reviewForm.comment.trim().length} more characters needed`
                              : reviewForm.comment.trim().length >= 10
                              ? 'Minimum length met ✓'
                              : 'Minimum 10 characters required'
                            }
                          </span>
                          <span className="text-gray-400">
                            {reviewForm.comment.length}/1000
                          </span>
                        </div>
                      </div>

                      {/* Pros and Cons */}
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            What you liked (comma separated)
                          </label>
                          <textarea
                            value={reviewForm.pros}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, pros: e.target.value }))}
                            placeholder="Great service, clean room..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Areas for improvement (comma separated)
                          </label>
                          <textarea
                            value={reviewForm.cons}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, cons: e.target.value }))}
                            placeholder="Slow WiFi, small bathroom..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSubmitReview(booking)}
                          disabled={submitting || !reviewForm.rating || !reviewForm.comment.trim() || reviewForm.comment.trim().length < 10}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  function renderCompletedReviews() {
    if (reviews.length === 0) {
      return (
        <Card className="p-12 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No reviews yet 💬
            </h3>
            <p className="text-gray-600">
              Your feedback helps others book better! Write your first review.
            </p>
          </motion.div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              {/* Review Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {review.booking?.roomTitle || 'Stay Review'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Review posted: {formatDate(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Booking: #{review.booking?.bookingNumber || review.booking?._id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    Published
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">{review.title}</h4>
                <p className="text-gray-600 leading-relaxed">{review.comment}</p>
              </div>

              {/* Pros and Cons */}
              {(review.pros?.length > 0 || review.cons?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {review.pros?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">What I liked:</h5>
                      <ul className="space-y-1">
                        {review.pros.map((pro, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-red-700 mb-2">Areas for improvement:</h5>
                      <ul className="space-y-1">
                        {review.cons.map((con, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Review Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" className="hover:border-indigo-500 hover:text-indigo-600">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Helpful ({review.helpful || 0})
                  </Button>
                  <span className="text-sm text-gray-500">
                    Posted {formatDate(review.createdAt)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReview(review._id)}
                    className="hover:border-indigo-500 hover:text-indigo-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteReview(review._id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Management Response */}
              {review.managementResponse && review.managementResponse.hasResponse && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-indigo-800">
                      Response from Management
                    </span>
                    <span className="text-xs text-indigo-600">
                      {formatDate(review.managementResponse.respondedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-700">{review.managementResponse.message}</p>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }
}