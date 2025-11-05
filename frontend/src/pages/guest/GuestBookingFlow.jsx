import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import RoomCard from '../../components/booking/RoomCard';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/common/Alert';
import { Calendar, Users, ChefHat } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import BookingMenuSelector from '../../components/booking/BookingMenuSelector';
import DailyMealSelector from '../../components/booking/DailyMealSelector';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import { 
  calculateBookingCost, 
  calculateNights as calcNights,
  formatBookingCurrency,
  createBookingPayload
} from '../../utils/bookingCalculations';
import { 
  BOOKING_STATUS, 
  getStatusBadgeClass, 
  getStatusDisplayText 
} from '../../types/bookingTypes';

const GuestBookingFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { user, isAuthenticated } = useContext(AuthContext);

  // Check if guest booking is allowed
  useEffect(() => {
    if (settings.allowGuestBooking === false && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, message: 'Please login to book a room' } });
    }
  }, [settings.allowGuestBooking, isAuthenticated, navigate, location.pathname]);

  // If guest booking is not allowed and user is not authenticated, don't render anything
  if (settings.allowGuestBooking === false && !isAuthenticated) {
    return null;
  }

  const [step, setStep] = useState(1);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(location.state?.roomId ? {
    roomId: location.state.roomId,
    title: location.state.roomTitle,
    type: location.state.roomType,
    pricePerNight: location.state.pricePerNight
  } : null);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomId: location.state?.roomId || '',
    specialRequests: '',
    foodPlan: 'None',
    selectedMeals: []
  });
  const [selectedFoodItems, setSelectedFoodItems] = useState([]);
  const [showMenuSelector, setShowMenuSelector] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    bankDetails: ''
  });
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);


  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      // Store redirect URL for after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      // Redirect to login with return URL
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="min-h-[80vh]">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
            {bookingResult && bookingResult.status !== 'Confirmed' && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-800 text-sm">
                Your booking is currently On Hold to secure the room while you complete payment or await approval.
                {bookingResult.holdUntil && (
                  <>
                    {' '}Hold expires on <strong>{new Date(bookingResult.holdUntil).toLocaleString()}</strong>.
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderProgressBar = () => {
    const steps = [
      { number: 1, title: 'Search Rooms', description: 'Select dates and guests' },
      { number: 2, title: 'Select Room', description: 'Choose your perfect room' },
      { number: 3, title: 'Booking Details', description: 'Add preferences and confirm' },
      { number: 4, title: 'Confirmation', description: 'Review and confirm booking' },
      { number: 5, title: 'Payment', description: 'Complete your payment' },
      { number: 6, title: 'Complete', description: 'Booking completed' }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((stepInfo, index) => (
            <React.Fragment key={stepInfo.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    stepInfo.number < step
                      ? 'bg-green-500 text-white'
                      : stepInfo.number === step
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepInfo.number < step ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepInfo.number
                  )}
                </div>
                <div className="text-center mt-2">
                  <div className={`text-xs font-medium ${stepInfo.number <= step ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {stepInfo.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 hidden md:block">
                    {stepInfo.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors ${
                    stepInfo.number < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const calculateNights = () => {
    return calcNights(bookingData.checkIn, bookingData.checkOut);
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    
    const costData = calculateBookingCost({
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      roomPrice: selectedRoom.basePrice || selectedRoom.pricePerNight || selectedRoom.pricing?.roomRate || 0,
      guests: bookingData.guests,
      foodPlan: bookingData.foodPlan,
      selectedMeals: selectedFoodItems // NEW: Day-by-day meals from DailyMealSelector
    });
    
    return costData.total;
  };

  // Get detailed cost breakdown for display
  const getDetailedCostBreakdown = () => {
    if (!selectedRoom) {
      return {
        nights: 0,
        roomCost: 0,
        foodCost: 0,
        subtotal: 0,
        taxes: 0,
        serviceCharge: 0,
        total: 0,
        breakdown: [],
        selectedFoodItems: [],
        selectedMeals: []
      };
    }
    
    return calculateBookingCost({
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      roomPrice: selectedRoom.basePrice || selectedRoom.pricePerNight || selectedRoom.pricing?.roomRate || 0,
      guests: bookingData.guests,
      foodPlan: bookingData.foodPlan,
      selectedMeals: selectedFoodItems // NEW: Day-by-day meals from DailyMealSelector
    });
  };

  // Calculate food total
  const calculateFoodTotal = () => {
    if (selectedFoodItems.length === 0) return 0;
    const nights = calculateNights();
    return selectedFoodItems.reduce((total, item) => {
      return total + (item.price * item.quantity * nights * bookingData.guests);
    }, 0);
  };

  // Handle food items selected from menu
  const handleFoodItemsSelected = (items) => {
    setSelectedFoodItems(items);
    setShowMenuSelector(false);
  };

  const decodeJWT = (token) => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut) {
      fetchAvailableRooms();
    }
  }, [bookingData.checkIn, bookingData.checkOut]);

  // Debug payment data changes
  useEffect(() => {
    console.log('Payment data updated:', paymentData);
  }, [paymentData]);

  const fetchAvailableRooms = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return;

    setLoading(true);
    console.log('Fetching rooms for:', bookingData.checkIn, bookingData.checkOut, bookingData.guests);
    try {
      const response = await fetch(`/api/rooms/available?checkIn=${bookingData.checkIn}&checkOut=${bookingData.checkOut}&guests=${bookingData.guests}`);
      const data = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        console.log('Available rooms data:', data.data);
        console.log('First room ID:', data.data[0]?.roomId);
        setAvailableRooms(data.data);
      } else {
        console.error('API Error:', data.message);
        setAvailableRooms([]);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      const mockRooms = [
        {
          roomId: 'mock1',
          title: 'Deluxe Ocean View Suite',
          roomNumber: '101',
          type: 'Suite',
          capacity: 3,
          basePrice: 25000,
          pricing: {
            nights: calculateNights(),
            roomRate: 25000,
            subtotal: 25000 * calculateNights(),
            tax: (25000 * calculateNights()) * 0.1,
            serviceFee: (25000 * calculateNights()) * 0.05,
            total: (25000 * calculateNights()) * 1.15,
            currency: 'LKR',
            breakdown: {
              roomCost: 25000 * calculateNights(),
              taxes: (25000 * calculateNights()) * 0.1,
              serviceFees: (25000 * calculateNights()) * 0.05,
              extraGuests: 0
            }
          },
          images: ['/api/placeholder/800/600'],
          amenities: ['WiFi', 'Ocean View', 'Balcony', 'Mini Bar'],
          description: 'Experience luxury in our spacious ocean view suite'
        }
      ];
      console.log('Using mock data for testing');
      setAvailableRooms(mockRooms);
    } finally {
      setLoading(false);
    }
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

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setBookingData(prev => ({
      ...prev,
      roomId: room.roomId
    }));
  };

  const handleBookingSubmit = async () => {
    // Validate food plan selection
    if (bookingData.foodPlan !== 'None' && selectedFoodItems.length === 0) {
      window.alert(`Please select food items for your ${bookingData.foodPlan} plan or choose "No Food Plan"`);
      return;
    }

    setLoading(true);
    try {
      // Use the unified booking payload creator with accurate calculations
      const bookingPayload = createBookingPayload({
        roomId: selectedRoom.roomId,
        roomPrice: selectedRoom.basePrice || selectedRoom.pricePerNight || selectedRoom.pricing?.roomRate || 0,
        roomTitle: selectedRoom.title || selectedRoom.name,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        foodPlan: bookingData.foodPlan,
        selectedFoodItems: selectedFoodItems,
        selectedMeals: bookingData.selectedMeals,
        specialRequests: bookingData.specialRequests,
        paymentMethod: paymentData.paymentMethod || 'cash',
        source: 'guest_booking_flow'
      });

      console.log('Submitting booking with accurate calculations:', bookingPayload);

      // Use the booking service instead of direct fetch
      const data = await bookingService.createBooking(bookingPayload);
      console.log('Booking response:', data);

      if (data && data.success) {
        setBookingResult(data.data);
        setStep(4); // Move to confirmation/review step
      } else {
        window.alert(data?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      window.alert(error?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Search Available Rooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="checkIn">Check-in Date</Label>
          <Input
            id="checkIn"
            type="date"
            value={bookingData.checkIn}
            onChange={(e) => handleInputChange('checkIn', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <Label htmlFor="checkOut">Check-out Date</Label>
          <Input
            id="checkOut"
            type="date"
            value={bookingData.checkOut}
            onChange={(e) => handleInputChange('checkOut', e.target.value)}
            min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="guests">Number of Guests</Label>
        <Select
          value={bookingData.guests}
          onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
        >
          <option value={1}>1 Guest</option>
          <option value={2}>2 Guests</option>
          <option value={3}>3 Guests</option>
          <option value={4}>4 Guests</option>
          <option value={5}>5+ Guests</option>
        </Select>
      </div>
      {calculateNights() > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-lg font-semibold">
            {calculateNights()} Night{calculateNights() > 1 ? 's' : ''}
          </p>
          <p className="text-gray-600">
            {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Button
          onClick={() => {
            console.log('Current booking data:', bookingData);
            const isDisabled = !bookingData.checkIn || !bookingData.checkOut || loading;
            console.log('Button disabled:', isDisabled, {
              hasCheckIn: !!bookingData.checkIn,
              hasCheckOut: !!bookingData.checkOut,
              loading: loading
            });
            if (!isDisabled) {
              setStep(2);
            }
          }}
          disabled={!bookingData.checkIn || !bookingData.checkOut || loading}
          className="w-full"
        >
          {loading ? 'Searching...' : 'Search Available Rooms'}
        </Button>
        {(!bookingData.checkIn || !bookingData.checkOut) && (
          <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
            <p className="font-medium">Please select:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {!bookingData.checkIn && <li>Check-in date</li>}
              {!bookingData.checkOut && <li>Check-out date</li>}
            </ul>
            <div className="mt-2 p-2 bg-white rounded border border-red-100 text-xs">
              <p className="font-medium">Debug Info:</p>
              <p>Check-in: {bookingData.checkIn || 'Not selected'}</p>
              <p>Check-out: {bookingData.checkOut || 'Not selected'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => {
    console.log('RenderStep2 - selectedRoom:', selectedRoom);
    console.log('RenderStep2 - availableRooms:', availableRooms);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Select a Room</h2>
          <Button variant="outline" onClick={() => setStep(1)}>
            Back to Search
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        ) : availableRooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No rooms available for the selected dates.</p>
              <Button onClick={() => setStep(1)}>Modify Search</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableRooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                isSelected={String(selectedRoom?.roomId) === String(room.roomId)}
                onSelect={handleRoomSelect}
                calculateNights={calculateNights}
              />
            ))}
         
          </div>
        )}
        {selectedRoom && (
          <div className="flex justify-between items-center pt-6 border-t">
            <div>
              <p className="text-lg font-semibold">Selected: {selectedRoom.title}</p>
              <p className="text-gray-600">
                {calculateNights()} nights • {bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => setStep(3)}>
              Continue to Booking Details
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
    const costBreakdown = getDetailedCostBreakdown();
    
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Details</h2>
        <Button variant="outline" onClick={() => setStep(2)}>
          Back to Room Selection
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Room Details</h4>
              <p className="text-lg">{selectedRoom?.title}</p>
              <p className="text-gray-600">Room {selectedRoom?.roomNumber}</p>
              <p className="text-gray-600">{selectedRoom?.type}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Stay Details</h4>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} />
                <span>
                  {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>{bookingData.guests} Guest{bookingData.guests > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cost Breakdown Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="space-y-2">
            {costBreakdown.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">{formatBookingCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-green-600">
                  {formatBookingCurrency(costBreakdown.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Options</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="foodPlan">Food Plan</Label>
              <Select
                value={bookingData.foodPlan}
                onChange={(e) => {
                  handleInputChange('foodPlan', e.target.value);
                  // Clear selected items if changing to None
                  if (e.target.value === 'None') {
                    setSelectedFoodItems([]);
                  }
                }}
              >
                <option value="None">No Food Plan</option>
                <option value="Breakfast">Breakfast Plan (Select Items)</option>
                <option value="Half Board">Half Board (Breakfast + Dinner)</option>
                <option value="Full Board">Full Board (All Meals)</option>
                <option value="A la carte">A la carte (Choose Anything)</option>
              </Select>
              
              {/* Menu Selector Button */}
              {bookingData.foodPlan !== 'None' && (
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={() => setShowMenuSelector(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    {selectedFoodItems.length > 0 ? 'Edit Food Selection' : 'Browse Menu & Select Items'}
                  </Button>
                  
                  {/* Selected Items Summary */}
                  {selectedFoodItems.length > 0 && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold mb-2 text-blue-900">
                        Selected Items ({selectedFoodItems.length})
                      </h4>
                      <div className="space-y-1 text-sm">
                        {selectedFoodItems.slice(0, 3).map(item => (
                          <div key={item._id} className="flex justify-between text-blue-800">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-medium">LKR {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        {selectedFoodItems.length > 3 && (
                          <p className="text-blue-600 italic">+ {selectedFoodItems.length - 3} more items</p>
                        )}
                      </div>
                      <div className="border-t border-blue-300 mt-2 pt-2 flex justify-between font-bold text-blue-900">
                        <span>Total Food Cost ({calculateNights()} nights × {bookingData.guests} guests):</span>
                        <span className="text-green-600">
                          LKR {calculateFoodTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Validation Warning */}
                  {selectedFoodItems.length === 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⚠️ Please select food items for your {bookingData.foodPlan} plan
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any special requests or preferences..."
                value={bookingData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* DailyMealSelector Modal */}
      {showMenuSelector && (
        <DailyMealSelector
          checkIn={bookingData.checkIn}
          checkOut={bookingData.checkOut}
          foodPlan={bookingData.foodPlan}
          onMealsSelected={(meals) => {
            console.log('✅ Daily meals selected (Guest Flow):', meals);
            setSelectedFoodItems(meals);
            setShowMenuSelector(false);
          }}
          onClose={() => setShowMenuSelector(false)}
        />
      )}
      <div className="flex justify-end">
        <Button
          onClick={handleBookingSubmit}
          disabled={loading}
          className="px-8 py-3"
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
    );
  };

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Submitted!</h2>
        <p className="text-gray-600">Your booking has been successfully created. Please proceed to payment.</p>
      </div>
      {bookingResult && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="font-medium">Booking Number:</span>
                <span className="font-mono">{bookingResult.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={bookingResult.requiresApproval ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                  {bookingResult.status}
                </Badge>
              </div>
              {bookingResult.status !== 'Confirmed' && (
                <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                  A temporary hold has been placed on your room to secure availability.
                  {bookingResult.holdUntil && (
                    <>
                      {' '}This hold will expire on <strong>{new Date(bookingResult.holdUntil).toLocaleString()}</strong> unless approved/paid.
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                  }).format(bookingResult?.totalAmount || calculateTotal())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Food Items Breakdown */}
      {bookingData.foodPlan !== 'None' && selectedFoodItems.length > 0 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Your {bookingData.foodPlan} Plan Items
            </h3>
            <div className="space-y-3">
              {selectedFoodItems.map(item => (
                <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} portion{item.quantity > 1 ? 's' : ''} × {calculateNights()} night{calculateNights() > 1 ? 's' : ''} × {bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    LKR {(item.price * item.quantity * calculateNights() * bookingData.guests).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Food Cost:</span>
                  <span className="text-green-600">LKR {calculateFoodTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => setStep(3)}>
          Back to Booking Details
        </Button>
        <Button onClick={() => setStep(5)}>
          Proceed to Payment
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment</h2>
        <Button variant="outline" onClick={() => setStep(3)}>
          Back to Booking Details
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm">
                <p>Booking Number: <span className="font-mono">{bookingResult?.bookingNumber}</span></p>
                <p>Room: {bookingResult?.roomTitle || selectedRoom?.title}</p>
                <p>Check-in: {bookingResult?.checkIn ? new Date(bookingResult.checkIn).toLocaleDateString() : new Date(bookingData.checkIn).toLocaleDateString()}</p>
                <p>Check-out: {bookingResult?.checkOut ? new Date(bookingResult.checkOut).toLocaleDateString() : new Date(bookingData.checkOut).toLocaleDateString()}</p>
                <p>Guests: {bookingResult?.guests || bookingData.guests}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  id="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={(e) => {
                    const newPaymentMethod = e.target.value;
                    console.log('Payment method changed to:', newPaymentMethod);
                    setPaymentData({ ...paymentData, paymentMethod: newPaymentMethod });
                  }}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="bank">🏦 Bank Transfer</option>
                  <option value="cash">💵 Pay at Hotel</option>
                </Select>
              </div>
            </div>
            {paymentData.paymentMethod === 'card' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-green-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Instant Confirmation</h4>
                    <p className="text-sm text-green-700">
                      Your booking will be confirmed immediately after successful payment processing.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {paymentData.paymentMethod === 'bank' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-yellow-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Pending Admin Approval</h4>
                    <p className="text-sm text-yellow-700">
                      Your booking will be pending admin approval. You'll receive a confirmation once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {paymentData.paymentMethod === 'cash' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-blue-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Pay at Check-in</h4>
                    <p className="text-sm text-blue-700">
                      Your booking requires admin approval. Pay the full amount at the hotel reception upon arrival.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {paymentData.paymentMethod === 'card' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 text-green-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-1">Secure Payment via PayHere</h4>
                    <p className="text-sm text-green-700 mb-3">
                      You will be redirected to PayHere's secure payment gateway to complete your payment. Your booking will be confirmed immediately after successful payment.
                    </p>
                    <div className="bg-white/60 p-3 rounded border border-green-300">
                      <p className="text-xs font-semibold text-green-900 mb-2">✅ Accepted Cards:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">VISA</span>
                        <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded font-medium">MASTERCARD</span>
                        <span className="px-2 py-1 bg-blue-800 text-white text-xs rounded font-medium">AMEX</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {paymentData.paymentMethod === 'bank' && (
              <div className="border-t pt-4">
                <Label htmlFor="bankDetails">Bank Transfer Details</Label>
                <Textarea
                  id="bankDetails"
                  placeholder="Please provide your bank details for transfer (Account number, Bank name, etc.)..."
                  value={paymentData.bankDetails}
                  onChange={(e) => setPaymentData({ ...paymentData, bankDetails: e.target.value })}
                  rows={3}
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}
            {paymentData.paymentMethod === 'cash' && (
              <div className="border-t pt-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Instructions</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• Your booking will be confirmed after admin approval</p>
                    <p>• Pay the full amount at the hotel reception</p>
                    <p>• Bring a valid ID for verification</p>
                    <p>• You'll receive a booking reference number via email</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          Back to Booking Details
        </Button>
        <Button
          onClick={processPayment}
          disabled={
            processingPayment ||
            !paymentData.paymentMethod ||
            // Only disable if booking is confirmed AND payment method is card/bank (not cash)
            (bookingResult?.status === 'Confirmed' && paymentData.paymentMethod !== 'cash') ||
            (bookingResult?.status === 'Approved - Payment Processing') ||
            (paymentData.paymentMethod === 'bank' && !paymentData.bankDetails)
          }
          className="px-8 py-3"
        >
          {processingPayment ? 'Processing...' : 
           paymentData.paymentMethod === 'cash' ? 'Submit Booking Request' : 
           paymentData.paymentMethod === 'card' ? 'Proceed to PayHere Payment' : 'Complete Payment'}
        </Button>
        {/* Debug info - remove in production */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Payment Method: {paymentData.paymentMethod}</p>
          <p>Processing: {processingPayment.toString()}</p>
          <p>Booking Status: {bookingResult?.status}</p>
          <p>Booking Payment Method: {bookingResult?.paymentMethod}</p>
          <p>Button Disabled: {(processingPayment ||
            !paymentData.paymentMethod ||
            // Only disable if booking is confirmed AND payment method is card/bank (not cash)
            (bookingResult?.status === 'Confirmed' && paymentData.paymentMethod !== 'cash') ||
            (bookingResult?.status === 'Approved - Payment Processing') ||
            (paymentData.paymentMethod === 'card' &&
              (!paymentData.cardNumber ||
                !paymentData.cardholderName ||
                !paymentData.expiryMonth ||
                !paymentData.expiryYear ||
                !paymentData.cvv)) ||
            (paymentData.paymentMethod === 'bank' && !paymentData.bankDetails) ||
            (paymentData.paymentMethod === 'cash' && false)).toString()}</p>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center">
        {bookingResult?.status === 'On Hold' && bookingResult?.paymentMethod !== 'cash' ? (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Payment Received - Awaiting Approval</h2>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully. Your booking is now awaiting admin approval.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong> An administrator will review your booking within the next hour.
                You will receive an email notification once your booking is approved.
              </p>
            </div>
          </>
        ) : bookingResult?.status === 'On Hold' && bookingResult?.paymentMethod === 'cash' ? (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Booking Request Submitted - Pay at Hotel</h2>
            <p className="text-gray-600 mb-4">
              Your booking request has been submitted successfully. Payment will be collected at the hotel upon check-in.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Next Steps:</strong> An administrator will review your booking within the next hour.
                Once approved, you can check-in and pay at the hotel reception.
              </p>
            </div>
          </>
        ) : bookingResult?.status === 'Approved - Payment Pending' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Approved!</h2>
            <p className="text-gray-600 mb-4">
              Your booking has been approved! Payment will be collected at the hotel upon check-in.
            </p>
          </>
        ) : bookingResult?.status === 'Approved - Payment Processing' ? (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Booking Approved - Payment Processing</h2>
            <p className="text-gray-600 mb-4">
              Your booking has been approved and payment is being processed. We'll notify you once payment is confirmed.
            </p>
          </>
        ) : bookingResult?.status === 'Confirmed' && bookingResult?.paymentMethod === 'cash' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your booking has been confirmed! Payment will be collected when you arrive at the hotel.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                <strong>Payment at Hotel:</strong> Please bring a valid ID and the total amount of {bookingResult?.totalPrice ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(bookingResult.totalPrice) : 'N/A'} when you check-in.
              </p>
            </div>
          </>
        ) : bookingResult?.status === 'Confirmed' ? (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">
              {bookingResult?.paymentMethod === 'cash' ? 'Booking Request Submitted - Pay at Hotel' : 'Payment Recorded - Awaiting Approval'}
            </h2>
            <p className="text-gray-600 mb-4">
              {bookingResult?.paymentMethod === 'cash'
                ? 'Your booking request has been submitted successfully. Payment will be collected at the hotel upon check-in.'
                : 'Your payment information has been recorded. Your booking is now awaiting admin approval.'
              }
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Next Steps:</strong> An administrator will review your booking within the next hour.
                {bookingResult?.paymentMethod === 'cash'
                  ? ' Once approved, you can check-in and pay at the hotel reception.'
                  : ' You will receive an email notification once your booking is approved or if more information is needed.'
                }
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              {bookingResult?.paymentMethod === 'card' ? 'Payment Successful!' : 'Booking Submitted!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {bookingResult?.paymentMethod === 'card'
                ? 'Your payment has been processed successfully.'
                : 'Your booking has been confirmed! Payment is due when you arrive at the hotel.'}
            </p>
          </>
        )}
      </div>
      {bookingResult && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Booking Number:</span>
                <span className="font-mono text-indigo-600">{bookingResult.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusBadgeClass(bookingResult.status)}>
                  {getStatusDisplayText(bookingResult.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Room:</span>
                <span>{bookingResult.roomTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Check-in:</span>
                <span>
                  {bookingResult.checkIn
                    ? new Date(bookingResult.checkIn).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Check-out:</span>
                <span>
                  {bookingResult.checkOut
                    ? new Date(bookingResult.checkOut).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Guests:</span>
                <span>{bookingResult.guests || bookingResult.guestCount?.adults || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment Method:</span>
                <span className="capitalize">
                  {bookingResult.paymentMethod === 'card' ? 'Credit/Debit Card' :
                    bookingResult.paymentMethod === 'bank' ? 'Bank Transfer' : 'Pay at Hotel'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/guest/my-bookings')}>
          View My Bookings
        </Button>
        <Button onClick={() => navigate('/')}>
          Go to Homepage
        </Button>
      </div>
    </div>
  );

  const processPayment = async () => {
  setProcessingPayment(true);
  try {
    // Debug logging
    console.log('Processing payment with data:', {
      bookingNumber: bookingResult?.bookingNumber,
      paymentMethod: paymentData.paymentMethod,
      paymentData: paymentData
    });

    // Check if payment is already being processed or completed
    // For cash payments, allow processing even if booking is 'Confirmed' (auto-approved)
    if ((bookingResult?.status === 'Confirmed' && paymentData.paymentMethod !== 'cash') ||
        bookingResult?.status === 'Approved - Payment Processing') {
      throw new Error('Payment is already being processed or has been completed for this booking.');
    }

    // Use the payment service instead of direct fetch
    const data = await paymentService.processBookingPayment(bookingResult.bookingNumber, {
      paymentMethod: paymentData.paymentMethod
    });

    console.log('Payment response:', data);

    if (data.data && data.data.success) {
      console.log('Payment processed successfully, updating booking result:', data.data.data);
      
      // For card payments, submit to PayHere
      if (paymentData.paymentMethod === 'card' && data.data.data.paymentSession) {
        console.log('Card payment detected - redirecting to PayHere with session:', data.data.data.paymentSession);
        
        // Store booking info for potential return
        sessionStorage.setItem('pendingPaymentBooking', JSON.stringify({
          bookingNumber: bookingResult.bookingNumber,
          totalAmount: data.data.data.amount
        }));
        
        // Submit to PayHere (this will redirect the page)
        await paymentService.submitToPayHere(data.data.data.paymentSession);
        
        // Note: User will be redirected to PayHere, so we won't reach here
        // The return URL will handle the post-payment flow
      } else {
        // For cash/bank payments, update booking result and show confirmation
        setBookingResult(data.data.data);
        setStep(6);
      }
    } else {
      console.error('Payment failed:', data);
      window.alert(data.data?.message || data.message || 'Payment update failed.');
    }
  } catch (error) {
    console.error('Payment processing failed:', error);
    window.alert(error.message || 'Payment processing failed. Please try again.');
  } finally {
    setProcessingPayment(false);
  }
};

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="min-h-[80vh]">
        <CardContent className="p-6">
          {renderProgressBar()}
          <div className="mt-8">
            {renderCurrentStep()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestBookingFlow;