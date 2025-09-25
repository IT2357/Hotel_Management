// Placeholder for import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, Users, Wifi, Car, Utensils, MapPin, Heart, Eye } from 'lucide-react';
import React, { useState } from 'react';

export default function RoomCard({
  room,
  checkIn,
  checkOut,
  guests,
  onBookNow,
  onViewDetails,
  onToggleFavorite,
  isFavorite = false
}) {
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
  };

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = getNights();
    return room.pricePerNight * nights;
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': Wifi,
      'Parking': Car,
      'Restaurant': Utensils,
      'Ocean View': MapPin,
      'City View': MapPin,
      'Balcony': MapPin,
      'Mini Bar': Utensils,
      'Jacuzzi': MapPin
    };
    return icons[amenity] || Star;
  };

  const handleBookNow = () => {
    if (onBookNow) {
      onBookNow(room);
    } else {
      navigate('/booking/guest', {
        state: {
          roomId: room.id || room._id,
          roomDetails: room,
          checkIn,
          checkOut,
          guests
        }
      });
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(room);
    } else {
      // Default behavior - could open modal or navigate to detail page
      console.log('View details for room:', room.title);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(room);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition duration-300">
      <div className="relative">
        {/* Room Image */}
        <div className="relative">
          {imageLoading && (
            <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          )}

          {room.images && room.images.length > 0 ? (
            <img
              src={room.images[0]}
              alt={room.title}
              className={`w-full h-48 object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No Image Available</span>
            </div>
          )}

          {/* Favorite Button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          </Button>

          {/* Availability Status */}
          {!room.available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge className="bg-red-500 text-white">
                Not Available
              </Badge>
            </div>
          )}

          {/* Room Type Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-indigo-600">
              {room.type || 'Standard'}
            </Badge>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-white px-3 py-1 rounded-full text-sm font-medium">
              {formatPrice(room.pricePerNight)}/night
            </div>
          </div>
        </div>

        {/* Room Details */}
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                {room.title}
              </h3>
              <p className="text-sm text-gray-600">
                Room {room.roomNumber}
              </p>
            </div>

            {/* Rating */}
            {room.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">{room.rating}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-2">
            {room.description}
          </p>

          {/* Room Info */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Up to {room.capacity} guests
              </span>
            </div>

            {room.size && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">
                  {room.size} sq ft
                </span>
              </div>
            )}
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

          {/* Total Price (if dates provided) */}
          {checkIn && checkOut && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-800">
                  {getNights()} night{getNights() !== 1 ? 's' : ''} total
                </span>
                <span className="text-lg font-semibold text-indigo-800">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBookNow}
              className="flex-1"
              disabled={!room.available}
            >
              {room.available ? 'Book Now' : 'Not Available'}
            </Button>
            <Button variant="outline" onClick={handleViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}