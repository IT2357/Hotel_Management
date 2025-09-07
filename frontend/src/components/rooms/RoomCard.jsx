import { Button } from "@/components/rooms/ui/button";
import { Badge } from "@/components/rooms/ui/badge";
import { Heart, Users, Wifi, Car, Coffee, Bath } from "lucide-react";
import { useState } from "react";

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Coffee': Coffee,
  'Bathtub': Bath,
};

const RoomCard = ({
  id,
  name,
  image,
  price,
  maxGuests,
  bedType,
 view,
  amenities,
  isWishlisted = false,
  isInComparison = false,
  viewMode = 'grid',
  onWishlist,
  onCompare,
  onViewDetails,
  onBookNow
}) => {
  const [wishlistState, setWishlistState] = useState(isWishlisted);
  const [compareState, setCompareState] = useState(isInComparison);

  const handleWishlistClick = () => {
    const newState = !wishlistState;
    setWishlistState(newState);
    onWishlist?.(id);
  };

  const handleCompareClick = () => {
    const newState = !compareState;
    setCompareState(newState);
    onCompare?.(id);
  };

  return (
    <div className={`group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-luxury transition-all duration-500 transform hover:-translate-y-2 ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      {/* Image Container */}
      <div className={`relative overflow-hidden ${
        viewMode === 'list' ? 'w-64 h-48 flex-shrink-0' : 'h-64'
      }`}>
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Action Button */}
        <div className="absolute top-4 right-4">
          {/* Like/Compare Button */}
          <button
            onClick={handleCompareClick}
            className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${
              compareState ? 'bg-primary text-primary-foreground' : 'bg-white/90 hover:bg-white'
            }`}
          >
            <Heart 
              className={`w-5 h-5 transition-colors duration-300 ${
                compareState ? 'fill-current text-current' : 'text-gray-600 hover:text-primary'
              }`}
            />
          </button>
        </div>

        {/* View Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-accent text-accent-foreground font-medium">
            {view} View
          </Badge>
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-display font-semibold text-lg shadow-luxury">
          ${price}/night
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="mb-4">
          <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Up to {maxGuests} guests</span>
            </div>
            <div className="text-sm">
              {bedType}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-6">
          {amenities.slice(0, 4).map((amenity) => {
            const IconComponent = amenityIcons[amenity];
            return (
              <div
                key={amenity}
                className="flex items-center gap-1 bg-accent-light text-accent px-3 py-1.5 rounded-full text-xs font-medium"
              >
                {IconComponent && <IconComponent className="w-3 h-3" />}
                {amenity}
              </div>
            );
          })}
          {amenities.length > 4 && (
            <div className="flex items-center text-xs text-muted-foreground px-3 py-1.5">
              +{amenities.length - 4} more
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 hover:border-primary hover:text-primary transition-all duration-300"
            onClick={() => onViewDetails?.(id)}
          >
            View Details
          </Button>
          <Button
            variant="luxury"
            className="flex-1"
            onClick={() => onBookNow?.(id)}
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
