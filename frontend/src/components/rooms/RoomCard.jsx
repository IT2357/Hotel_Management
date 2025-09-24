import { Button } from "@/components/rooms/ui/button";
import { Heart, Star, Users, Wifi, Car, Coffee, Bath, Ruler, Bed, MapPin, Eye } from "lucide-react";
import { useState } from "react";
import RoomModal from "./ViewDetails";

const amenityIcons = {
  WiFi: Wifi,
  Parking: Car,
  Coffee: Coffee,
  Bathtub: Bath,
};

const getRoomGradient = (roomType) => {
  switch (roomType?.toLowerCase()) {
    case 'luxury suite':
      return 'from-red-500 to-pink-500';
    case 'deluxe room':
      return 'from-blue-500 to-indigo-500';
    case 'standard room':
      return 'from-green-500 to-emerald-500';
    default:
      return 'from-gray-500 to-slate-500';
  }
};

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
      return 'bg-green-50 text-green-800 border-green-200';
    case 'booked':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'cleaning':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
};

const RoomCard = ({
  id,
  name,
  image,
  price,
  maxGuests,
  bedType,
  view,
  amenities = [],
  size,
  status = 'available',
  rating,
  isInComparison = false,
  onWishlist,
  onCompare,
  onViewDetails,
  onBookNow,
  description,
  images = [],
  reviews,
  floor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const gradientClass = getRoomGradient(name);
  const statusStyles = getStatusStyles(status);

  // Transform room data for the modal
  const roomData = {
    id,
    name,
    price,
    maxGuests,
    bedType,
    view,
    amenities,
    size,
    status,
    description,
    floor,
    images: images.length > 0 ? images : [image], // Use images array or fallback to single image
    reviews: reviews || {
      rating: rating || 0,
      count: 0,
      recent: []
    }
  };

  const handleViewDetails = () => {
    setIsModalOpen(true);
    onViewDetails?.(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBookFromModal = (roomId, checkInDate, checkOutDate, guests) => {
    onBookNow?.(roomId, checkInDate, checkOutDate, guests);
    setIsModalOpen(false);
  };

  return (
    <div 
      className="relative group overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-white/5 backdrop-blur-sm border border-white/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-64">
        <img 
          src={image} 
          alt={name} 
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`} 
        />
        
        {/* Status Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium border ${statusStyles} backdrop-blur-sm`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
        
        {/* Compare Button */}
        <button 
          onClick={() => onCompare?.(id)}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
        >
          <Heart className={`w-5 h-5 transition-colors ${isInComparison ? 'fill-red-500 text-red-500' : 'hover:text-red-400'}`} />
        </button>
        
        {/* Price Tag */}
        <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-full font-bold text-white ${isHovered ? 'opacity-100' : 'opacity-90'} transition-opacity`}>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${gradientClass} opacity-90`}></div>
          <span className="relative z-10">${price} <span className="text-sm font-normal">/ night</span></span>
        </div>
        
        {/* View Button (appears on hover) */}
   
      </div>
      
      {/* Room Info */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800">{name}</h3>
          {rating && (
            <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-sm">
              <Star className="w-4 h-4 fill-yellow-400 mr-1" />
              {rating}
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {view} view • {bedType} bed • {maxGuests} {maxGuests > 1 ? 'guests' : 'guest'}
        </p>
        
        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {amenities.slice(0, 3).map((amenity, index) => {
            const Icon = amenityIcons[amenity] || Star;
            return (
              <span key={index} className="flex items-center text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                <Icon className="w-3 h-3 mr-1 text-indigo-500" />
                {amenity}
              </span>
            );
          })}
          {amenities.length > 3 && (
            <span className="text-xs text-gray-500 self-center">+{amenities.length - 3} more</span>
          )}
        </div>
        
        {/* Room Size */}
        {size && (
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Ruler className="w-4 h-4 mr-2" />
            {size} sq.ft
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            className="flex-1 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          <Button 
            className={`flex-1 bg-gradient-to-r ${gradientClass} text-white hover:opacity-90 transition-opacity`}
            onClick={() => onBookNow?.(id)}
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Room Details Modal */}
      <RoomModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        room={roomData}
        onBook={handleBookFromModal}
      />
    </div>
  );
};

export default RoomCard;