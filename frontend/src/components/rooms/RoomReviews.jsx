import React, { useState, useEffect } from 'react';
import Card from '../ui/card';
import Button from '../ui/button';
import Badge from '../ui/badge';
import Spinner from '../ui/Spinner';
import { Star, ThumbsUp, MessageCircle, Calendar, User, Flag } from 'lucide-react';

export default function RoomReviews({ roomId, roomTitle }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest

  useEffect(() => {
    fetchReviews();
  }, [roomId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Mock reviews data - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockReviews = [
        {
          id: 1,
          user: {
            name: 'Sarah Johnson',
            avatar: '/api/placeholder/40/40',
            isVerified: true
          },
          rating: 5,
          title: 'Perfect stay for our honeymoon!',
          content: 'We stayed in this beautiful suite for our honeymoon and it exceeded all expectations. The ocean view was breathtaking, the room was spacious and clean, and the staff was incredibly attentive. The bed was extremely comfortable and we loved the little touches like the welcome champagne.',
          date: '2025-01-15',
          helpful: 12,
          pros: ['Amazing ocean view', 'Spacious room', 'Excellent service', 'Comfortable bed'],
          cons: ['None'],
          response: {
            content: 'Thank you for choosing us for your honeymoon! We\'re thrilled you enjoyed the ocean view and our service. We hope to welcome you back for future anniversaries!',
            date: '2025-01-16',
            author: 'Hotel Management'
          }
        },
        {
          id: 2,
          user: {
            name: 'Michael Chen',
            avatar: '/api/placeholder/40/40',
            isVerified: true
          },
          rating: 4,
          title: 'Great room, minor issues with WiFi',
          content: 'The room itself was fantastic - clean, modern, and well-maintained. The balcony was perfect for morning coffee. However, the WiFi signal was a bit weak in the room. Everything else was perfect.',
          date: '2025-01-10',
          helpful: 8,
          pros: ['Clean and modern', 'Great balcony', 'Comfortable furniture'],
          cons: ['Weak WiFi signal'],
          response: null
        },
        {
          id: 3,
          user: {
            name: 'Emily Rodriguez',
            avatar: '/api/placeholder/40/40',
            isVerified: true
          },
          rating: 5,
          title: 'Family-friendly and comfortable',
          content: 'Perfect for our family of 4. The room was spacious enough for all of us, and the kids loved the view. The staff was very accommodating with extra towels and amenities. Will definitely book again!',
          date: '2025-01-05',
          helpful: 15,
          pros: ['Family-friendly', 'Spacious', 'Great for kids', 'Accommodating staff'],
          cons: ['None'],
          response: {
            content: 'We\'re so glad your family enjoyed the stay! Thank you for the kind words about our staff. We look forward to hosting you again!',
            date: '2025-01-06',
            author: 'Hotel Management'
          }
        },
        {
          id: 4,
          user: {
            name: 'David Wilson',
            avatar: '/api/placeholder/40/40',
            isVerified: false
          },
          rating: 3,
          title: 'Decent room but expected more',
          content: 'The room was clean and the location was good. However, for the price point, I expected more luxury touches. The amenities were basic and the room felt a bit dated compared to the photos.',
          date: '2024-12-28',
          helpful: 5,
          pros: ['Clean', 'Good location'],
          cons: ['Basic amenities', 'Feels dated', 'Not worth the price'],
          response: null
        },
        {
          id: 5,
          user: {
            name: 'Lisa Park',
            avatar: '/api/placeholder/40/40',
            isVerified: true
          },
          rating: 4,
          title: 'Excellent service, beautiful view',
          content: 'The highlight was definitely the ocean view and the exceptional service from the housekeeping staff. Room was spotless every day. The only minor issue was that the air conditioning was a bit noisy at night.',
          date: '2024-12-20',
          helpful: 9,
          pros: ['Beautiful ocean view', 'Excellent housekeeping', 'Great service'],
          cons: ['Noisy air conditioning'],
          response: null
        }
      ];

      setReviews(mockReviews);
    } catch (error) {
      setError('Failed to load reviews');
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.rating === parseInt(filter);
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length * 100) : 0
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Reviews Unavailable</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchReviews} variant="outline">Try Again</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Reviews Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Guest Reviews</h2>
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-semibold">{averageRating}</span>
              <span>({reviews.length} reviews)</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Rating Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Breakdown</h3>
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center space-x-3">
              <span className="text-sm font-medium w-8">{rating}</span>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No reviews available yet.' : `No ${filter}-star reviews found.`}
            </p>
          </Card>
        ) : (
          sortedReviews.map((review) => (
            <Card key={review.id} className="p-6">
              {/* Review Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={review.user.avatar}
                    alt={review.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">{review.user.name}</span>
                      {review.user.isVerified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
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

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
                <p className="text-gray-600 leading-relaxed">{review.content}</p>
              </div>

              {/* Pros and Cons */}
              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {review.pros.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">What they liked:</h5>
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
                  {review.cons.length > 0 && review.cons[0] !== 'None' && (
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
                <Button variant="outline" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful ({review.helpful})
                </Button>
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>

              {/* Management Response */}
              {review.response && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-800">{review.response.author}</span>
                    <span className="text-xs text-blue-600">
                      {new Date(review.response.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">{review.response.content}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {sortedReviews.length > 0 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}