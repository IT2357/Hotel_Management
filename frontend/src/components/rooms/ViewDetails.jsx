import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/rooms/ui/dialog";
import { Button } from "@/components/rooms/ui/button";
import { Badge } from "@/components/rooms/ui/badge";
import { Card, CardContent } from "@/components/rooms/ui/card";
import Label from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import Calendar from '../../components/ui/Calendar';
import IntegratedBookingFlow from '../booking/IntegratedBookingFlow';
import roomService from '../../services/roomService';
import { 
  X, 
  Users, 
  Maximize, 
  Star, 
  Wifi, 
  Coffee, 
  Car, 
  Bath,
  MapPin,
  CheckCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Coffee': Coffee,
  'Bathtub': Bath,
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

const RoomModal = ({ isOpen, onClose, room, onBook }) => {
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomId: room?.id || '',
    specialRequests: '',
    foodPlan: 'None',
    selectedMeals: []
  });
  
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeCalendar, setActiveCalendar] = useState(null); // 'checkIn' or 'checkOut'

  // Fetch existing bookings for this room
  useEffect(() => {
    const fetchRoomBookings = async () => {
      if (!room?.id) return;
      
      setIsLoadingBookings(true);
      try {
        const response = await roomService.getRoomBookings(room.id);
        if (response.success) {
          setBookedDates(response.data);
        }
      } catch (error) {
        console.error('Error fetching room bookings:', error);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    if (isOpen && room?.id) {
      fetchRoomBookings();
    }
  }, [isOpen, room?.id]);

  // Helper function to check if a date is booked
  const isDateBooked = (date) => {
    if (!date || !bookedDates.length) return false;
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return bookedDates.some(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      // Check if the date falls within any booking period
      return checkDate >= checkIn && checkDate < checkOut;
    });
  };

  const handleInputChange = (field, value) => {
    console.log(`Field changed - ${field}:`, value);
    
    // Special handling for date fields to ensure proper formatting
    if (field === 'checkIn' || field === 'checkOut') {
      if (!value) {
        // If value is empty, set it as is
        setBookingData(prev => ({
          ...prev,
          [field]: value
        }));
        return;
      }
      
      // Ensure the date is in YYYY-MM-DD format
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', value);
        return;
      }
      
      const formattedDate = date.toISOString().split('T')[0];
      console.log(`Formatted ${field}:`, formattedDate);
      
      setBookingData(prev => ({
        ...prev,
        [field]: formattedDate
      }));
      return;
    }
    
    // For non-date fields
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle calendar date selection
  const handleCalendarDateSelect = (date) => {
    if (activeCalendar === 'checkIn') {
      handleInputChange('checkIn', date);
      // If checkout is before checkin, clear it
      if (bookingData.checkOut && new Date(bookingData.checkOut) <= new Date(date)) {
        handleInputChange('checkOut', '');
      }
    } else if (activeCalendar === 'checkOut') {
      handleInputChange('checkOut', date);
    }
    setShowCalendar(false);
    setActiveCalendar(null);
  };

  // Open calendar for specific input
  const openCalendar = (type) => {
    setActiveCalendar(type);
    setShowCalendar(true);
  };
   const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const calculateTotalCost = () => {
    const nights = calculateNights();
    const roomCost = nights * (room.price || 0);
    // You can add additional charges here if needed
    const taxes = roomCost * 0.12; // 12% tax as example
    const serviceCharge = roomCost * 0.10; // 10% service charge as example
    return {
      nights,
      roomCost,
      taxes,
      serviceCharge,
      total: roomCost + taxes + serviceCharge
    };
  };

   const gradientClass = getRoomGradient(room?.name);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!room) return null;

  // Defaults for safety
  const reviews = room.reviews || { rating: 0, count: 0, recent: [] };
  const images = room.images || [];
  const amenities = room.amenities || [];

  const handleBookNow = () => {
    // Always open booking flow and pass the current booking data
    // This ensures dates are pre-filled if they were entered in ViewDetails
    const currentBookingData = {
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests,
      roomId: room?.id || '',
      specialRequests: bookingData.specialRequests,
      foodPlan: bookingData.foodPlan,
      selectedMeals: bookingData.selectedMeals
    };
    
    console.log('ViewDetails - Current booking data:', bookingData);
    console.log('ViewDetails - Passing to booking flow:', currentBookingData);
    
    // Update the bookingData state to be passed to the flow
    setBookingData(currentBookingData);
    setIsBookingFlowOpen(true);
    
    // DON'T close ViewDetails modal - let IntegratedBookingFlow handle the entire flow
    // The IntegratedBookingFlow will manage its own lifecycle and close when needed
    // Keeping ViewDetails open ensures state is maintained
    // onClose(); // ← REMOVED: This was causing the booking flow to break after meal selection!
  };

  const handleBookingFlowClose = () => {
    setIsBookingFlowOpen(false);
    // When booking flow closes, also close the ViewDetails modal
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (images.length > 0 ? (prev + 1) % images.length : 0));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (images.length > 0 ? (prev - 1 + images.length) % images.length : 0));
  };

  return (
    <Dialog open={isOpen && !isBookingFlowOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-100/80 backdrop-blur-xl glassmorphic-modal custom-scrollbar"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          border: '1.5px solid rgba(255, 255, 255, 0.18)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.12) 100%)',
          backdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.35);
            border-radius: 8px;
            transition: background 0.2s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(180,180,200,0.45);
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.35) transparent;
          }
          .custom-scrollbar:hover {
            scrollbar-color: rgba(180,180,200,0.45) transparent;
          }
        `}</style>
        
        {/* Accessible description for screen readers */}
        <DialogDescription id="room-modal-desc" className="sr-only">
          Detailed information and booking options for the selected room.
        </DialogDescription>
        
        {/* Enhanced Header with better spacing */}
        <DialogHeader className="px-6 py-4 border-b border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-display font-bold text-white mb-2">
                {room.name || "Unnamed Room"}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-4 text-white">
                {reviews && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-semibold text-base">{reviews.rating}</span>
                    <span className="text-sm">({reviews.count} reviews)</span>
                  </div>
                )}
                {room.floor && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{room.floor}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="bg-primary text-white text-base px-3 py-1">
                LKR {room.price || 0}/night
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content Area with improved layout */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Section - Image and Details */}
          <div className="flex-1 px-6 py-4">
            {/* Image Gallery with enhanced positioning */}
            <div className="relative mb-6">
              <div className="relative h-64 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-xl"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-xl"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-200",
                          index === currentImageIndex ? "bg-white shadow-lg" : "bg-white/60"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Room Details with improved spacing */}
            <div className="space-y-5">
              {/* Specifications */}
              <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold text-lg mb-4 text-center">Room Specifications</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {room.size && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Maximize className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>Size:</strong> {room.size} m²
                        </span>
                      </div>
                    )}
                    {room.maxGuests && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>Max Guests:</strong> {room.maxGuests}
                        </span>
                      </div>
                    )}
                    {room.bedType && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>Bed:</strong> {room.bedType}
                        </span>
                      </div>
                    )}
                    {room.view && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
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
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <CardContent className="p-5">
                    <h3 className="font-display font-semibold text-lg mb-3 text-center">Why You'll Love This Room</h3>
                    <p className="text-muted-foreground leading-relaxed text-center">{room.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <CardContent className="p-5">
                    <h3 className="font-display font-semibold text-lg mb-4 text-center">Amenities</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {amenities.map((amenity) => {
                        const IconComponent = amenityIcons[amenity];
                        return (
                          <div key={amenity} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                            {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
                            <span className="text-sm font-medium">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Reviews */}
              {reviews.recent?.length > 0 && (
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <CardContent className="p-5">
                    <h3 className="font-display font-semibold text-lg mb-4 text-center">Recent Reviews</h3>
                    <div className="space-y-3">
                      {reviews.recent.map((review, index) => (
                        <div key={index} className="border-l-4 border-primary pl-4 py-2 bg-gray-50 rounded-r-lg">
                          <p className="text-sm text-muted-foreground mb-1 italic">"{review.comment}"</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold">{review.name}</span>
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
          </div>

          {/* Right Section - Booking Panel */}
          <div className="lg:w-80 lg:min-w-80 border-l border-white/20">
            <div className="sticky top-0 h-full">
              <Card className="h-full bg-white rounded-none lg:rounded-l-2xl shadow-2xl border-0 lg:border border-gray-100">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="text-center mb-6">
                    <h3 className="font-display font-bold text-xl mb-1">Book This Room</h3>
                    <p className="text-muted-foreground text-sm">Secure your perfect stay</p>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {/* Calendar Toggle */}
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                      </button>
                    </div>

                    {/* Calendar Component */}
                    {showCalendar && (
                      <div className="mb-6">
                        <Calendar
                          selectedDate={activeCalendar === 'checkIn' ? bookingData.checkIn : 
                                       activeCalendar === 'checkOut' ? bookingData.checkOut : null}
                          onDateSelect={handleCalendarDateSelect}
                          bookedDates={bookedDates}
                          minDate={activeCalendar === 'checkOut' ? bookingData.checkIn : undefined}
                          disabled={isLoadingBookings}
                        />
                        <div className="mt-3 text-center">
                          <p className="text-sm text-gray-600 mb-2">
                            {activeCalendar === 'checkIn' && 'Select your check-in date'}
                            {activeCalendar === 'checkOut' && 'Select your check-out date'}
                            {!activeCalendar && 'Click on a date input below to select dates'}
                          </p>
                          {activeCalendar && (
                            <button
                              onClick={() => {
                                setActiveCalendar(null);
                                setShowCalendar(false);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Date Inputs */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="checkIn" className="text-sm font-semibold mb-2 block">Check-in Date</Label>
                        <div className="relative">
                          <Input
                            id="checkIn"
                            type="date"
                            value={bookingData.checkIn}
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              if (selectedDate && isDateBooked(new Date(selectedDate))) {
                                alert('This date is already booked. Please select another date.');
                                return;
                              }
                              handleInputChange('checkIn', selectedDate);
                            }}
                            onFocus={() => showCalendar && openCalendar('checkIn')}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full h-10 text-sm"
                            disabled={isLoadingBookings}
                          />
                          {showCalendar && (
                            <button
                              type="button"
                              onClick={() => openCalendar('checkIn')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              📅
                            </button>
                          )}
                        </div>
                        {bookedDates.length > 0 && (
                          <div className="mt-1">
                            <div className="flex items-center gap-2 text-xs text-red-600">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>Some dates are unavailable due to existing bookings</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="checkOut" className="text-sm font-semibold mb-2 block">Check-out Date</Label>
                        <div className="relative">
                          <Input
                            id="checkOut"
                            type="date"
                            value={bookingData.checkOut}
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              if (selectedDate && isDateBooked(new Date(selectedDate))) {
                                alert('This date is already booked. Please select another date.');
                                return;
                              }
                              handleInputChange('checkOut', selectedDate);
                            }}
                            onFocus={() => showCalendar && openCalendar('checkOut')}
                            min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                            className="w-full h-10 text-sm"
                            disabled={isLoadingBookings || !bookingData.checkIn}
                          />
                          {showCalendar && bookingData.checkIn && (
                            <button
                              type="button"
                              onClick={() => openCalendar('checkOut')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              📅
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="text-sm font-semibold block mb-2">Number of Guests</label>
                      <select
                        value={bookingData.guests}
                        onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                        className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                      >
                        {Array.from({ length: room.maxGuests || 1 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num} Guest{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  {calculateNights() > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="text-base font-semibold text-gray-800 mb-3">Booking Summary</h4>
                      
                      {/* Stay Duration */}
                      <div className="mb-3 pb-3 border-b border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stay Duration</span>
                          <span className="text-sm font-medium">
                            {calculateNights()} Night{calculateNights() > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {bookingData.checkIn && bookingData.checkOut && (
                            <>
                              {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Room × {calculateNights()} night{calculateNights() > 1 ? 's' : ''}
                          </span>
                          <span className="text-sm">LKR {calculateTotalCost().roomCost.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Taxes (12%)</span>
                          <span className="text-sm">LKR {calculateTotalCost().taxes.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Service Charge (10%)</span>
                          <span className="text-sm">LKR {calculateTotalCost().serviceCharge.toLocaleString()}</span>
                        </div>
                        
                        <div className="border-t border-blue-200 pt-2 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-gray-800">Total Cost</span>
                            <span className="text-lg font-bold text-primary">
                              LKR {calculateTotalCost().total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking Action */}
                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={handleBookNow}
                      disabled={calculateNights() === 0}
                      className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${gradientClass} text-white hover:opacity-90 transition-opacity rounded-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {calculateNights() > 0 
                        ? `Book Now - LKR ${calculateTotalCost().total.toLocaleString()}`
                        : 'Select Dates to Book'
                      }
                    </Button>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      You'll receive a mobile QR for check-in & room access
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Integrated Booking Flow */}
      <IntegratedBookingFlow
        isOpen={isBookingFlowOpen}
        onClose={handleBookingFlowClose}
        room={room}
        initialStep={3}
        initialBookingData={bookingData}
      />
    </Dialog>
  );
};

export default RoomModal;
