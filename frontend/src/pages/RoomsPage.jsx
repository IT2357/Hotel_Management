import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/ui/card';
import { Button } from '../components/ui/Button';
import Input from '../components/ui/input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import { Calendar, Users, Star, Wifi, Car, Utensils, MapPin } from 'lucide-react';

export default function RoomsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    minCapacity: 1,
    maxPrice: '',
    amenities: []
  });

  // Get search parameters from navigation state
  const searchParams = location.state || {};

  useEffect(() => {
    // Only fetch rooms if we have search parameters
    if (searchParams.checkIn && searchParams.checkOut) {
      fetchAvailableRooms();
    } else {
      // Set empty rooms array when no search parameters
      setRooms([]);
      setLoading(false);
    }
  }, [searchParams.checkIn, searchParams.checkOut, searchParams.guests]);

  const fetchAvailableRooms = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        checkIn: searchParams.checkIn || '',
        checkOut: searchParams.checkOut || '',
        guests: searchParams.guests || 1
      });

      const response = await fetch(`/api/rooms/available?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (room) => {
    navigate('/booking/guest', {
      state: {
        roomId: room._id,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
        roomDetails: room
      }
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredRooms = rooms.filter(room => {
    if (filters.type && room.type !== filters.type) return false;
    if (filters.minCapacity && room.capacity < filters.minCapacity) return false;
    if (filters.maxPrice && room.basePrice > filters.maxPrice) return false;
    return true;
  });

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
      'Restaurant': Utensils
    };
    return icons[amenity] || Star;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-800 mb-4">
            Available Rooms
          </h1>
          <p className="text-gray-600 text-lg">
            Choose from our selection of comfortable rooms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Filter Rooms
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option key="all" value="">All Types</option>
                    <option key="standard" value="Standard">Standard</option>
                    <option key="deluxe" value="Deluxe">Deluxe</option>
                    <option key="suite" value="Suite">Suite</option>
                    <option key="executive" value="Executive">Executive Suite</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Capacity
                  </label>
                  <Select
                    value={filters.minCapacity}
                    onChange={(e) => handleFilterChange('minCapacity', parseInt(e.target.value))}
                  >
                    <option key={1} value={1}>1 Person</option>
                    <option key={2} value={2}>2 People</option>
                    <option key={3} value={3}>3 People</option>
                    <option key={4} value={4}>4+ People</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price per Night
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter max price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Room Listings */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} available
                {searchParams.checkIn && searchParams.checkOut && (
                  <> for {new Date(searchParams.checkIn).toLocaleDateString()} - {new Date(searchParams.checkOut).toLocaleDateString()}</>
                )}
              </p>
            </div>

            {filteredRooms.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No rooms available
                </h3>
                <p className="text-gray-600 mb-4">
                  {!searchParams.checkIn || !searchParams.checkOut
                    ? "Please select check-in and check-out dates to search for available rooms."
                    : "Try adjusting your filters or dates to find available rooms."
                  }
                </p>
                {!searchParams.checkIn || !searchParams.checkOut ? (
                  <Button onClick={() => navigate('/booking')}>
                    Search for Rooms
                  </Button>
                ) : null}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRooms.map((room) => (
                  <Card key={room._id} className="overflow-hidden hover:shadow-lg transition duration-300">
                    <div className="relative">
                      {room.images && room.images.length > 0 ? (
                        <img
                          src={room.images[0].url}
                          alt={room.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No Image Available</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {formatPrice(room.basePrice)}/night
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {room.title}
                      </h3>

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
                          <span className="text-sm text-gray-600">
                            {room.roomNumber}
                          </span>
                        </div>
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {room.amenities.slice(0, 3).map((amenity, index) => {
                            const IconComponent = getAmenityIcon(amenity);
                            return (
                              <div key={`${room._id}-${amenity}-${index}`} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                                <IconComponent className="h-3 w-3 text-gray-600" />
                                <span className="text-xs text-gray-600">{amenity}</span>
                              </div>
                            );
                          })}
                          {room.amenities.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{room.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() => handleBookNow(room)}
                        className="w-full"
                      >
                        Book Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}