import { Button } from "@/components/rooms/ui/button";
import { Badge } from "@/components/rooms/ui/badge";
import { Heart, Users, Wifi, Car, Coffee, Bath } from "lucide-react";
import { useState } from "react";

const amenityIcons = {
  WiFi: Wifi,
  Parking: Car,
  Coffee: Coffee,
  Bathtub: Bath,
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
  isInComparison = false, // rely on parent
  viewMode = "grid",
  onWishlist,
  onCompare,
  onViewDetails,
  onBookNow,
}) => {
  // Removed local compareState
  const handleCompareClick = () => onCompare?.(id);

  return (
    <div
      className={`group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-luxury transition-all duration-500 transform hover:-translate-y-2 ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${viewMode === "list" ? "w-64 h-48 flex-shrink-0" : "h-64"}`}>
        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

        {/* Compare Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleCompareClick}
            className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${
              isInComparison ? "bg-primary text-white" : "bg-white/90 text-gray-600 hover:bg-primary hover:text-white"
            }`}
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Price & View Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-accent text-accent-foreground font-medium">{view} View</Badge>
        </div>
        <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-display font-semibold text-lg shadow-luxury">
          ${price}/night
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
        <h3 className="text-xl font-display font-semibold text-foreground mb-2">{name}</h3>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onViewDetails?.(id)}>View Details</Button>
          <Button
  variant="luxury"
  className="flex-1 bg-primary text-white hover:bg-primary-dark hover:text-white transition-all duration-300"
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
