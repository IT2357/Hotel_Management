import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Star, Edit, Trash2, Calendar, MapPin, ThumbsUp, MessageCircle } from 'lucide-react';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, this would call: reviewService.getUserReviews()
      // const response = await reviewService.getUserReviews();
      // setReviews(response.data);

      // For now using mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockReviews = [
        {
          id: 1,
          roomTitle: "Deluxe Ocean View Suite",
          roomNumber: "501",
          bookingId: "BK2025001",
          stayDate: "2025-01-15",
          rating: 5,
          title: "Exceptional Stay",
          comment: "Absolutely loved our stay at Grand Hotel! The ocean view suite was breathtaking, and the service was impeccable. The staff went above and beyond to make our anniversary special. Highly recommend!",
          pros: ["Amazing view", "Excellent service", "Clean and spacious", "Great amenities"],
          cons: [],
          helpful: 12,
          createdAt: "2025-01-20",
          status: "published",
          response: {
            hasResponse: true,
            message: "Thank you for your wonderful review! We're thrilled to hear you enjoyed your anniversary stay. We look forward to welcoming you back soon!",
            respondedAt: "2025-01-21",
            respondedBy: "Hotel Management"
          }
        },
        {
          id: 2,
          roomTitle: "Executive Business Room",
          roomNumber: "301",
          bookingId: "BK2025002",
          stayDate: "2025-01-10",
          rating: 4,
          title: "Great for Business",
          comment: "Perfect room for business travelers. Clean, modern, and well-equipped. The work desk was great and the location was convenient. Only minor issue was the WiFi signal could be stronger.",
          pros: ["Modern design", "Good location", "Comfortable bed", "Work-friendly"],
          cons: ["Weak WiFi", "Small bathroom"],
          helpful: 8,
          createdAt: "2025-01-12",
          status: "published",
          response: null
        },
        {
          id: 3,
          roomTitle: "Garden Villa",
          roomNumber: "GV1",
          bookingId: "BK2024008",
          stayDate: "2024-12-20",
          rating: 5,
          title: "Magical Experience",
          comment: "Our stay in the Garden Villa was absolutely magical! The private garden and traditional Sri Lankan architecture created such a peaceful atmosphere. The staff was incredibly attentive and made us feel like royalty.",
          pros: ["Beautiful garden", "Private setting", "Authentic experience", "Excellent staff"],
          cons: [],
          helpful: 15,
          createdAt: "2024-12-25",
          status: "published",
          response: {
            hasResponse: true,
            message: "We're delighted you enjoyed the authentic Sri Lankan experience in our Garden Villa! Thank you for sharing your wonderful feedback.",
            respondedAt: "2024-12-26",
            respondedBy: "Hotel Management"
          }
        },
        {
          id: 4,
          roomTitle: "Standard Room",
          roomNumber: "201",
          bookingId: "BK2024005",
          stayDate: "2024-08-10",
          rating: 3,
          title: "Basic but Comfortable",
          comment: "The room was clean and comfortable for a short stay. Good value for money. However, the amenities were quite basic and the room felt a bit dated compared to the photos.",
          pros: ["Clean", "Good value", "Comfortable bed"],
          cons: ["Basic amenities", "Feels dated", "Small room"],
          helpful: 5,
          createdAt: "2024-08-15",
          status: "draft",
          response: null
        }
      ];

      setReviews(mockReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (reviewId) => {
    const review = reviews.find(r => r.id === reviewId);
    setEditingReview(review);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        // In production, this would call: await reviewService.deleteReview(reviewId);
        setReviews(prev => prev.filter(review => review.id !== reviewId));
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review. Please try again.');
      }
    }
  };

  const handlePublishReview = async (reviewId) => {
    try {
      // In production, this would call: await reviewService.publishReview(reviewId);
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, status: 'published' }
          : review
      ));
    } catch (error) {
      console.error('Error publishing review:', error);
      alert('Failed to publish review. Please try again.');
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
      'published': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            My Reviews
          </h1>
          <p className="text-gray-600">
            Manage your reviews and see responses from our team
          </p>
          <div className="mt-4">
            <Button
              onClick={fetchReviews}
              variant="outline"
              size="sm"
              disabled={loading}
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

        {/* Empty State */}
        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Share your experiences by writing reviews for your stays.
            </p>
            <Button>
              Write Your First Review
            </Button>
          </Card>
        ) : (
          /* Reviews List */
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {review.roomTitle} - Room {review.roomNumber}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Stay: {formatDate(review.stayDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Booking: #{review.bookingId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(review.status)}>
                      {review.status}
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
                {(review.pros.length > 0 || review.cons.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {review.pros.length > 0 && (
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
                    {review.cons.length > 0 && (
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
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful ({review.helpful})
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {review.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishReview(review.id)}
                      >
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReview(review.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Management Response */}
                {review.response && review.response.hasResponse && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Response from {review.response.respondedBy}
                      </span>
                      <span className="text-xs text-blue-600">
                        {formatDate(review.response.respondedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">{review.response.message}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {reviews.length}
            </div>
            <div className="text-gray-600">Total Reviews</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {reviews.filter(r => r.status === 'published').length}
            </div>
            <div className="text-gray-600">Published</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {reviews.filter(r => r.status === 'draft').length}
            </div>
            <div className="text-gray-600">Drafts</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {reviews.reduce((sum, r) => sum + r.helpful, 0)}
            </div>
            <div className="text-gray-600">Total Helpful</div>
          </Card>
        </div>
      </div>
    </div>
  );
}