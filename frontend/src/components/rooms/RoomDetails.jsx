import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Badge from '../ui/Badge';
import { Calendar, Users, Wifi, Car, Utensils, MapPin, Star, Heart, Share2, Phone } from 'lucide-react';
import roomService from '../../services/roomService';

export default function RoomDetails() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since the API might not be fully ready
      // In production, this should call: roomService.getRoomDetails(roomId, checkIn, checkOut)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockRoomData = {
        _id: roomId,
        title: 'Deluxe Ocean View Suite',
        description: 'Experience luxury in our spacious ocean view suite featuring premium amenities and breathtaking views of the Indian Ocean. Perfect for couples or small families seeking comfort and elegance.',
        roomNumber: '501',
        type: 'Suite',
        capacity: 3,
        pricePerNight: 25000,
        images: [
          '/api/placeholder/800/600',
          '/api/placeholder/800/600',
          '/api/placeholder/800/600',
          '/api/placeholder/800/600'
        ],
        amenities: ['WiFi', 'Ocean View', 'Balcony', 'Mini Bar', 'Air Conditioning', 'Room Service', 'Safe', 'TV'],
        policies: {
          checkIn: '14:00',
          checkOut: '12:00',
          cancellation: 'Free cancellation up to 24 hours before check-in',
          smoking: 'Non-smoking room'
        },
        features: [
          'King Size Bed',
          'Sitting Area',
          'Work Desk',
          'Coffee Machine',
          'Hair Dryer',
          'Iron & Ironing Board'
        ],
        rating: 4.8,
        reviewCount: 127
      };

      setRoom(mockRoomData);
    } catch (error) {
      setError('Failed to load room details');
      console.error('Error fetching room details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
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
    navigate('/booking/guest', {
      state: {
        roomId: roomId,
        roomTitle: room.title,
        roomType: room.type,
        pricePerNight: room.pricePerNight
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Room Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested room could not be found.'}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-indigo-800 mb-2">{room.title}</h1>
              <p className="text-gray-600">Room {room.roomNumber} • {room.type}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{room.rating}</span>
              <span>({room.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Up to {room.capacity} guests</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <img
              src={room.images[0]}
              alt={room.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {room.images.slice(1, 5).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${room.title} ${index + 2}`}
                className="w-full h-44 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About This Room</h2>
              <p className="text-gray-600 leading-relaxed">{room.description}</p>
            </Card>

            {/* Amenities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-3">
                {room.amenities.map((amenity) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div key={amenity} className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4 text-indigo-600" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Room Features</h2>
              <div className="grid grid-cols-2 gap-3">
                {room.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Policies */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Policies</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{room.policies.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{room.policies.checkOut}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">{room.policies.cancellation}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">{room.policies.smoking}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {formatPrice(room.pricePerNight)}
                </div>
                <div className="text-gray-600">per night</div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guests
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                  </select>
                </div>

                <Button className="w-full" size="lg" onClick={handleBookNow}>
                  Book Now
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>You won't be charged yet</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center space-x-2 text-indigo-600 mb-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Need Help?</span>
                </div>
                <p className="text-center text-sm text-gray-600">
                  Call us at <a href="tel:+94112345678" className="font-medium">+94 11 234 5678</a>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}