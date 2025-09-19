import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading reviews
    setTimeout(() => {
      setReviews([
        {
          id: 1,
          roomName: 'Ocean View Suite',
          rating: 5,
          comment: 'Absolutely stunning room with breathtaking ocean views. The service was exceptional and the amenities were top-notch. Would definitely recommend!',
          date: '2024-01-10',
          status: 'published'
        },
        {
          id: 2,
          roomName: 'Executive Deluxe',
          rating: 4,
          comment: 'Great room for business travelers. Clean, comfortable, and well-equipped. The only minor issue was the WiFi speed, but overall very satisfied.',
          date: '2024-01-05',
          status: 'published'
        },
        {
          id: 3,
          roomName: 'Garden Villa',
          rating: 5,
          comment: 'This villa exceeded all expectations! The private garden was beautiful and the outdoor shower was a unique touch. Perfect for a romantic getaway.',
          date: '2023-12-28',
          status: 'pending'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  const getStatusColor = (status) => {
    return status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">My Reviews</h1>
              <p className="text-xl opacity-90">Share your experiences and read your feedback</p>
            </div>
            <Link
              to="/guest/dashboard"
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-300 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Reviews Yet</h2>
            <p className="text-gray-600 mb-8">You haven't written any reviews yet. Share your experiences!</p>
            <Link
              to="/rooms"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Explore & Review</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-8 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-3xl mr-4">🏨</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{review.roomName}</h3>
                          <div className="flex items-center mt-1">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(review.status)}`}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4 italic">
                      "{review.comment}"
                    </p>

                    <div className="text-sm text-gray-500">
                      Reviewed on {new Date(review.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 md:ml-8 flex flex-col gap-3">
                    <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      Edit Review
                    </button>
                    <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      Delete Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Write New Review Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center">
            <div className="text-4xl mb-4">✍️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Write a New Review</h2>
            <p className="text-gray-600 mb-8">Share your experience with other guests</p>
            <Link
              to="/rooms"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Find Rooms to Review</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}