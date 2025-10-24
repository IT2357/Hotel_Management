import { Button } from "@/components/rooms/ui/button";
import { Heart, Star, Users, Wifi, Car, Coffee, Bath, Ruler, Bed, MapPin, Eye } from "lucide-react";
import { useState } from "react";
import RoomModal from "./ViewDetails";
import IntegratedBookingFlow from "../booking/IntegratedBookingFlow";
import { useFavorites } from "../../contexts/FavoritesContext";

const amenityIcons = {
  WiFi: Wifi,
  Parking: Car,
  Coffee: Coffee,
  Bathtub: Bath,
};

const getRoomGradient = (roomType) => {
  switch (roomType?.toLowerCase()) {
    case 'luxury suite':
    case 'deluxe':
    case 'deluxe room':
      return 'from-red-500 to-pink-500';
    case 'standard':
    case 'standard room':
      return 'from-blue-500 to-indigo-500';
    case 'economy':
    case 'economy room':
      return 'from-green-500 to-emerald-500';
    case 'guest':
    case 'suite':
    case 'guest suite':
      return 'from-gray-500 to-slate-500';
    default:
      return 'from-indigo-500 to-purple-500';
  }
};

const getRoomBackgroundGradient = (roomType) => {
  switch (roomType?.toLowerCase()) {
    case 'luxury suite':
    case 'deluxe':
    case 'deluxe room':
      return 'from-red-50 to-red-100';
    case 'standard':
    case 'standard room':
      return 'from-blue-50 to-blue-100';
    case 'economy':
    case 'economy room':
      return 'from-green-50 to-green-100';
    case 'guest':
    case 'suite':
    case 'guest suite':
      return 'from-gray-50 to-gray-100';
    default:
      return 'from-indigo-50 to-purple-50';
  }
};

const getRoomBorderColor = (roomType) => {
  switch (roomType?.toLowerCase()) {
    case 'luxury suite':
    case 'deluxe':
    case 'deluxe room':
      return 'border-red-200';
    case 'standard':
    case 'standard room':
      return 'border-blue-200';
    case 'economy':
    case 'economy room':
      return 'border-green-200';
    case 'guest':
    case 'suite':
    case 'guest suite':
      return 'border-gray-200';
    default:
      return 'border-indigo-200';
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
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  
  // Use favorites context
  const { isFavorite, toggleFavorite } = useFavorites();
  const gradientClass = getRoomGradient(name);
  const backgroundGradient = getRoomBackgroundGradient(name);
  const borderColor = getRoomBorderColor(name);
  const statusStyles = getStatusStyles(status);
  
  const isRoomFavorite = isFavorite(id);

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
    images: images.length > 0 ? images : [image],
    reviews: reviews || { rating: rating || 0, count: 0, recent: [] },
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

  const handleDirectBooking = () => {
    setIsBookingFlowOpen(true);
  };

  const handleBookingFlowClose = () => {
    setIsBookingFlowOpen(false);
  };

  const handleToggleFavorite = () => {
    console.log('🔧 Toggle favorite clicked for room ID:', id);
    console.log('🔧 Current favorite status:', isRoomFavorite);
    
    // Validate room ID
    if (!id) {
      console.error('❌ Room ID is missing!');
      return;
    }
    
    const roomData = {
      id,
      name,
      image,
      price,
      maxGuests,
      bedType,
      view,
      amenities,
      size,
      status,
      rating,
      description,
      floor,
      images: images.length > 0 ? images : [image],
      reviews: reviews || { rating: rating || 0, count: 0, recent: [] },
    };

    console.log('🔧 Room data being sent:', roomData);
    
    try {
      const result = toggleFavorite(roomData);
      console.log('🔧 Toggle result:', result);
      
      if (result.success) {
        console.log('✅ Success:', result.message);
      } else {
        console.error('❌ Error:', result.message);
      }
    } catch (error) {
      console.error('❌ Exception in toggleFavorite:', error);
    }
  };

  return (
    <div 
      className={`relative group overflow-hidden rounded-xl transition-all duration-500 
                 hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-indigo-200
                 bg-gradient-to-br ${backgroundGradient} bg-white/30 backdrop-blur-md 
                 border ${borderColor} shadow-md hover:shadow-lg`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-48 rounded-t-xl">
        <img 
          src={image} 
          alt={name} 
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`} 
        />
        
        {/* Wishlist / Favorite Button */}
        <button 
          onClick={(e) => {
            console.log('🔧 Button clicked!', e);
            e.stopPropagation(); // Prevent any parent click handlers
            handleToggleFavorite();
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm hover:scale-110 transition-all duration-200 shadow-sm z-10 cursor-pointer ${
            isRoomFavorite 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-white/80 text-gray-700 hover:bg-white'
          }`}
          title={isRoomFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 transition-colors ${isRoomFavorite ? 'fill-red-500 text-red-500' : 'hover:text-red-400'}`} />
        </button>
        
        {/* Room Type Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${gradientClass} shadow-sm`}>
          {name?.split(' ')[0] || 'Room'}
        </div>
        
        {/* Glassmorphic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Compare Rooms Button */}
        <button 
          onClick={() => onCompare?.(id)}
          className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 backdrop-blur-sm shadow-sm hover:scale-105 ${
            isInComparison 
              ? 'bg-red-50 text-red-800 border-red-200' 
              : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-white'
          }`}
        >
          {isInComparison ? 'In Comparison' : 'Compare'}
        </button>
        
        {/* Price Tag */}
        <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full font-bold text-white shadow-sm`}>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${gradientClass} opacity-95`}></div>
          <span className="relative z-10 text-sm">LKR. {price} <span className="text-xs font-normal">/ night</span></span>
        </div>
      </div>
      
      {/* Room Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{name}</h3>
          {rating && (
            <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium border border-yellow-200 shadow-sm">
              <Star className="w-3 h-3 fill-yellow-400 mr-1" />
              {rating}
            </div>
          )}
        </div>
        
        <p className="text-gray-700 text-sm mb-3 font-medium">
          {view} view • {bedType} bed • {maxGuests} {maxGuests > 1 ? 'guests' : 'guest'}
        </p>
        
        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.slice(0, 3).map((amenity, index) => {
            const Icon = amenityIcons[amenity] || Star;
            return (
              <span key={index} className="flex items-center text-xs bg-white/50 text-gray-600 px-2 py-1 rounded-full backdrop-blur-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 border border-white/50 shadow-sm">
                <Icon className="w-3 h-3 mr-1 text-indigo-500" />
                {amenity}
              </span>
            );
          })}
          {amenities.length > 3 && (
            <span className="text-xs text-gray-500 self-center font-medium">+{amenities.length - 3} more</span>
          )}
        </div>
        
        {/* Room Size */}
        {size && (
          <div className="flex items-center text-sm text-gray-600 mb-4 font-medium">
            <Ruler className="w-4 h-4 mr-2 text-indigo-500" />
            {size} sq.ft
          </div>
        )}
        
                {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
  <Button 
    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg py-2 px-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center text-xs"
    onClick={handleViewDetails}
  >
    <Eye className="w-3 h-3 mr-1" />
    View Details 
  </Button>

  <Button 
    className={`flex-1 bg-gradient-to-r ${gradientClass} text-white hover:opacity-90 transition-opacity py-2 px-2 rounded-lg font-semibold text-xs`}
    onClick={handleDirectBooking}
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

      {/* Integrated Booking Flow */}
      <IntegratedBookingFlow
        isOpen={isBookingFlowOpen}
        onClose={handleBookingFlowClose}
        room={roomData}
        initialStep={3}
        initialBookingData={{}}
      />
    </div>
  );
};

export default RoomCard;
