import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/rooms/ui/dialog";
import { Button } from "@/components/rooms/ui/button";
import { Badge } from "@/components/rooms/ui/badge";
import { Card, CardContent } from "@/components/rooms/ui/card";
import { Calendar } from "@/components/rooms/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/rooms/ui/popover";
import { 
  X, 
  Users, 
  Maximize, 
  Star, 
  Wifi, 
  Coffee, 
  Car, 
  Bath,
  CalendarIcon,
  MapPin,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Coffee': Coffee,
  'Bathtub': Bath,
};

const RoomModal = ({ isOpen, onClose, room, onBook }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState();
  const [checkOutDate, setCheckOutDate] = useState();
  const [guests, setGuests] = useState(2);

  if (!room) return null;

  // Defaults for safety
  const reviews = room.reviews || { rating: 0, count: 0, recent: [] };
  const images = room.images || [];
  const amenities = room.amenities || [];

  const handleBookNow = () => {
    if (checkInDate && checkOutDate && onBook) {
      onBook(room.id, checkInDate, checkOutDate, guests);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (images.length > 0 ? (prev + 1) % images.length : 0));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (images.length > 0 ? (prev - 1 + images.length) % images.length : 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-display font-bold text-foreground mb-2">
                {room.name || "Unnamed Room"}
              </DialogTitle>
              <div className="flex items-center gap-4 text-muted-foreground">
                {reviews && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-medium">{reviews.rating}</span>
                    <span>({reviews.count} reviews)</span>
                  </div>
                )}
                {room.floor && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{room.floor}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              ${room.price || 0}/night
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-6">
          {/* Image Gallery */}
          <div className="relative mb-6">
            <div className="relative h-80 rounded-xl overflow-hidden">
              <img
                src={images[currentImageIndex] || "/placeholder.jpg"}
                alt={`${room.name || "Room"} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Room Details Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Specifications */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-lg mb-4">Room Specifications</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {room.size && (
                      <div className="flex items-center gap-2">
                        <Maximize className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>Size:</strong> {room.size} m²
                        </span>
                      </div>
                    )}
                    {room.maxGuests && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>Max Guests:</strong> {room.maxGuests}
                        </span>
                      </div>
                    )}
                    {room.bedType && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>Bed:</strong> {room.bedType}
                        </span>
                      </div>
                    )}
                    {room.view && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>View:</strong> {room.view}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {room.description && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Why You'll Love This Room</h3>
                    <p className="text-muted-foreground leading-relaxed">{room.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Amenities</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {amenities.map((amenity) => {
                        const IconComponent = amenityIcons[amenity];
                        return (
                          <div key={amenity} className="flex items-center gap-3">
                            {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
                            <span className="text-sm">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Reviews */}
              {reviews.recent?.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                      {reviews.recent.map((review, index) => (
                        <div key={index} className="border-l-2 border-primary pl-4">
                          <p className="text-sm text-muted-foreground mb-1">"{review.comment}"</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{review.name}</span>
                            <span>•</span>
                            <span>{review.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Booking */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-lg mb-4">Book This Room</h3>
                  
                  <div className="space-y-4">
                    {/* Check-in Date */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Check-in Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !checkInDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkInDate ? format(checkInDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={checkInDate}
                            onSelect={setCheckInDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Check-out Date */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Check-out Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !checkOutDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={checkOutDate}
                            onSelect={setCheckOutDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Guests</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        {Array.from({ length: room.maxGuests || 1 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num} Guest{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Booking Button */}
                    <Button
                      variant="luxury"
                      size="lg"
                      className="w-full"
                      onClick={handleBookNow}
                      disabled={!checkInDate || !checkOutDate}
                    >
                      Book Now - ${room.price || 0}/night
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      You'll receive a mobile QR for check-in & room access
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomModal;
