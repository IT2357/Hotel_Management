import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FavoriteRooms() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading favorite rooms
    setTimeout(() => {
      setFavorites([
        {
          id: 1,
          name: 'Ocean View Suite',
          type: 'Suite',
          price: 250,
          rating: 4.8,
          image: '/api/placeholder/400/300',
          amenities: ['Ocean View', 'Balcony', 'Mini Bar', 'Jacuzzi'],
          description: 'Stunning ocean views with modern amenities'
        },
        {
          id: 2,
          name: 'Executive Deluxe',
          type: 'Deluxe',
          price: 180,
          rating: 4.6,
          image: '/api/placeholder/400/300',
          amenities: ['City View', 'Work Desk', 'Coffee Maker', 'Safe'],
          description: 'Perfect for business travelers'
        },
        {
          id: 3,
          name: 'Garden Villa',
          type: 'Villa',
          price: 320,
          rating: 4.9,
          image: '/api/placeholder/400/300',
          amenities: ['Private Garden', 'Outdoor Shower', 'Fireplace', 'Spa Access'],
          description: 'Luxurious villa with private garden'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(room => room.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Favorite Rooms</h1>
              <p className="text-xl opacity-90">Your saved room preferences and wishlist</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Favorites Yet</h2>
            <p className="text-gray-600 mb-8">Start exploring rooms and add them to your favorites.</p>
            <Link
              to="/rooms"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Explore Rooms</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Room Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl">🏨</div>
                  </div>
                  <button
                    onClick={() => removeFavorite(room.id)}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-300"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Room Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">⭐</span>
                      <span className="text-sm font-semibold text-gray-700">{room.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{room.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-800">
                      ${room.price}
                      <span className="text-sm text-gray-600 font-normal">/night</span>
                    </div>
                    <Link
                      to={`/rooms/${room.id}`}
                      className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}