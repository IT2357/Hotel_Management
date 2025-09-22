import { X, Star, Users, Bed, Eye, Square, Wifi, Car, Coffee, Bath } from "lucide-react";
import { Button } from "@/components/rooms/ui/button";
import { Badge } from "@/components/rooms/ui/badge";

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Coffee': Coffee,
 'Bathtub': Bath,
};

const CompareModal = ({ isOpen, onClose, rooms }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl shadow-luxury max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Compare Rooms</h2>
            <p className="text-muted-foreground">Compare {rooms.length} selected rooms</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Comparison Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <td className="py-4 pr-4 font-display font-semibold text-foreground">Features</td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <div className="font-display font-semibold text-foreground">{room.name}</div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Price */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      Price per night
                    </div>
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <div className="text-lg font-display font-bold text-primary">${room.price}</div>
                    </td>
                  ))}
                </tr>

                {/* Bed Type */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4" />
                      Bed Type
                    </div>
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        {room.bedType}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Room Size */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      Size (m²)
                    </div>
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <span className="text-foreground font-medium">{room.size} m²</span>
                    </td>
                  ))}
                </tr>

                {/* Max Guests */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Max Guests
                    </div>
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <span className="text-foreground font-medium">{room.maxGuests} guests</span>
                    </td>
                  ))}
                </tr>

                {/* View */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </div>
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <Badge variant="outline" className="border-primary text-primary">
                        {room.view} View
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Rating
                    </div>
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">{room.reviews.rating}</span>
                        <span className="text-xs text-muted-foreground">({room.reviews.count})</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Amenities */}
                <tr>
                  <td className="py-4 pr-4 font-medium text-muted-foreground">
                    Amenities
                  </td>
                  {rooms.map((room) => (
                    <td key={room.id} className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {room.amenities.slice(0, 6).map((amenity) => {
                          const IconComponent = amenityIcons[amenity];
                          return (
                            <div
                              key={amenity}
                              className="flex items-center gap-1 bg-accent-light text-accent px-2 py-1 rounded-full text-xs"
                            >
                              {IconComponent && <IconComponent className="w-3 h-3" />}
                              {amenity}
                            </div>
                          );
                        })}
                        {room.amenities.length > 6 && (
                          <div className="text-xs text-muted-foreground px-2 py-1">
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

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close Comparison
            </Button>
            <Button
  variant="luxury"
  onClick={() => onBook(room.id)}
  className="bg-primary text-white hover:bg-primary-dark hover:text-white transition-all duration-300"
>
  Book Now
</Button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
