import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Users, Bed, Maximize, MapPin, Wifi, Car, Coffee, Bath, X } from 'lucide-react';
import { Button } from '@/components/rooms/ui/button';
import { Badge } from '@/components/rooms/ui/badge';
import roomService from '@/services/roomService';
import { useToast } from '@/hooks/use-toast';

const amenityIcons = {
  WiFi: Wifi,
  Parking: Car,
  Coffee: Coffee,
  Bathtub: Bath,
};

const CompareRoomsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomIds = searchParams.get('rooms')?.split(',') || [];
    if (roomIds.length === 0) {
      navigate('/guest/dashboard');
      return;
    }
    fetchRooms(roomIds);
  }, [searchParams, navigate]);

  const fetchRooms = async (roomIds) => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      const allRooms = response.data?.data || response.data || [];
      
      const selectedRooms = allRooms.filter(room => roomIds.includes(room._id));
      setRooms(selectedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load room comparison data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (roomId) => {
    navigate(`/book-room/${roomId}`);
  };

  const removeRoom = (roomId) => {
    const updatedRooms = rooms.filter(room => room._id !== roomId);
    if (updatedRooms.length === 0) {
      navigate('/guest/dashboard');
      return;
    }
    setRooms(updatedRooms);
    const newParams = new URLSearchParams();
    newParams.set('rooms', updatedRooms.map(r => r._id).join(','));
    navigate(`/compare-rooms?${newParams.toString()}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/guest/dashboard')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compare Rooms</h1>
                <p className="text-gray-600">Comparing {rooms.length} selected rooms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Room Cards Overview */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <motion.div
                  key={room._id}
                  className="relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative h-48">
                    <img
                      src={room.images?.[0]?.url || 'https://source.unsplash.com/random/600x400?hotel,room'}
                      alt={room.title || room.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeRoom(room._id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-500/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{room.title || room.name}</h3>
                    <div className="text-2xl font-bold text-indigo-600 mb-3">
                      ${room.basePrice || room.price}<span className="text-sm text-gray-500">/night</span>
                    </div>
                    <Button
                      onClick={() => handleBookNow(room._id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Book Now
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 pr-4 font-semibold text-gray-900">Features</th>
                    {rooms.map((room) => (
                      <th key={room._id} className="text-center py-4 px-4 font-semibold text-gray-900 min-w-[200px]">
                        {room.title || room.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Price */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">Price per night</td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4 text-center">
                        <div className="text-xl font-bold text-indigo-600">
                          ${room.basePrice || room.price}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Bed Type */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Bed className="w-4 h-4" />
                        Bed Type
                      </div>
                    </td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4 text-center">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          {room.bedType || 'Not specified'}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* Room Size */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Maximize className="w-4 h-4" />
                        Size
                      </div>
                    </td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4 text-center">
                        <span className="text-gray-900 font-medium">
                          {room.size ? `${room.size} sq.ft` : 'Not specified'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Max Guests */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Max Guests
                      </div>
                    </td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4 text-center">
                        <span className="text-gray-900 font-medium">
                          {(room.occupancy?.adults || 0) + (room.occupancy?.children || 0)} guests
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* View */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        View
                      </div>
                    </td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4 text-center">
                        <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                          {room.view || 'City'} View
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Rating
                      </div>
                    </td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-gray-900">
                            {room.reviewSummary?.averageRating || 'N/A'}
                          </span>
                          {room.reviewSummary?.totalReviews && (
                            <span className="text-xs text-gray-500">
                              ({room.reviewSummary.totalReviews})
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Amenities */}
                  <tr>
                    <td className="py-4 pr-4 font-medium text-gray-700">Amenities</td>
                    {rooms.map((room) => (
                      <td key={room._id} className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(room.amenities || []).slice(0, 6).map((amenity) => {
                            const IconComponent = amenityIcons[amenity];
                            return (
                              <div
                                key={amenity}
                                className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {IconComponent && <IconComponent className="w-3 h-3" />}
                                {amenity}
                              </div>
                            );
                          })}
                          {(room.amenities || []).length > 6 && (
                            <div className="text-xs text-gray-500 px-2 py-1">
                              +{room.amenities.length - 6} more
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0 border-t border-gray-200/50">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/guest/dashboard')}
                className="px-8"
              >
                Back to Rooms
              </Button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareRoomsPage;
