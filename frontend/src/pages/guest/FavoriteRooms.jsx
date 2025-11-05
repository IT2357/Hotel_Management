import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Heart, Star, Users, MapPin, Calendar, Wifi, Car, Utensils } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function FavoriteRooms() {
  const navigate = useNavigate();
  const { favorites, removeFromFavorites, refreshFavorites } = useFavorites();
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavoriteRooms();
  }, [favorites]);

  const fetchFavoriteRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Transform the data to match the expected format
      const transformedFavorites = favorites.map(room => ({
        _id: room.id,
        title: room.name,
        description: room.description || `Beautiful ${room.name} with ${room.view} view`,
        pricePerNight: room.price,
        capacity: room.maxGuests,
        roomNumber: room.floor ? `${room.floor}01` : "101",
        type: room.bedType || "Standard",
        rating: room.rating || 4.5,
        images: room.images || [room.image],
        amenities: room.amenities || ["WiFi", "Air Conditioning"],
        available: room.status === 'available',
        addedAt: room.addedAt
      }));

      setFavoriteRooms(transformedFavorites);
    } catch (error) {
      console.error('Error fetching favorite rooms:', error);
      setError('Failed to load favorite rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (roomId) => {
    try {
      const result = removeFromFavorites(roomId);
      if (result.success) {
        console.log('Room removed from favorites');
        // The favorites will be updated automatically through the context
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
    }
  };

  const handleBookNow = (room) => {
    navigate('/booking/guest', {
      state: {
        roomId: room._id,
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        guests: 1,
        roomDetails: room
      }
    });
  };

  const handleViewRoom = (roomId) => {
    navigate(`/rooms/${roomId}`);
  };

  const formatPrice = (price) => {
    return `LKR ${new Intl.NumberFormat('en-US').format(price)}`;
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': Wifi,
      'Ocean View': MapPin,
      'Balcony': MapPin,
      'Mini Bar': Utensils,
      'Jacuzzi': Star,
      'Work Desk': MapPin,
      'City View': MapPin,
      'Coffee Machine': Utensils,
      'Garden Access': Car,
      'Private Pool': Star,
      'Kitchen': Utensils,
      'Parking': Car,
      'TV': Star,
      'Air Conditioning': Star
    };
    return icons[amenity] || Star;
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
            My Favorite Rooms
          </h1>
          <p className="text-gray-600">
            Your saved rooms for quick booking
          </p>
          <div className="mt-4">
            <Button
              onClick={() => {
                refreshFavorites();
                fetchFavoriteRooms();
              }}
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
        {favoriteRooms.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Favorite Rooms Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing rooms and save your favorites for quick access later.
            </p>
            <Button onClick={() => navigate('/rooms')}>
              Browse Rooms
            </Button>
          </Card>
        ) : (
          /* Favorite Rooms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {favoriteRooms.map((room) => (
              <Card key={room._id} className="overflow-hidden hover:shadow-lg transition duration-300">
                <div className="relative">
                  <img
                    src={room.images[0]}
                    alt={room.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemoveFavorite(room._id)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge className={room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {room.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {room.title}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatPrice(room.pricePerNight)}
                      </div>
                      <div className="text-sm text-gray-600">per night</div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {room.description}
                  </p>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Up to {room.capacity} guests
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Room {room.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {room.rating}
                      </span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities.slice(0, 4).map((amenity) => {
                        const IconComponent = getAmenityIcon(amenity);
                        return (
                          <div key={amenity} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                            <IconComponent className="h-3 w-3 text-gray-600" />
                            <span className="text-xs text-gray-600">{amenity}</span>
                          </div>
                        );
                      })}
                      {room.amenities.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{room.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRoom(room._id)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleBookNow(room)}
                      disabled={!room.available}
                      className="flex-1"
                    >
                      {room.available ? 'Book Now' : 'Unavailable'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {favoriteRooms.length}
            </div>
            <div className="text-gray-600">Total Favorites</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {favoriteRooms.filter(room => room.available).length}
            </div>
            <div className="text-gray-600">Available Now</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatPrice(favoriteRooms.reduce((sum, room) => sum + room.pricePerNight, 0))}
            </div>
            <div className="text-gray-600">Total Value</div>
          </Card>
        </div>
      </div>
    </div>
  );
}