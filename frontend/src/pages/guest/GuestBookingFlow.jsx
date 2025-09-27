import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import RoomCard from '../../components/booking/RoomCard';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/label';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/common/Alert';
import { Calendar, Users } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import { menuService } from '../../services/menuService';

const FoodSelectionCards = ({ mealType, day, selectedFood, setSelectedFood, guests }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const response = await menuService.getMenuItemsByCategory(mealType);
        if (response.success) {
          setMenuItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, [mealType]);

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedFood(prev => {
      const newSelected = { ...prev };
      if (!newSelected[day]) newSelected[day] = {};
      if (!newSelected[day][mealType]) newSelected[day][mealType] = {};
      if (quantity > 0) {
        newSelected[day][mealType][itemId] = quantity;
      } else {
        delete newSelected[day][mealType][itemId];
        if (Object.keys(newSelected[day][mealType]).length === 0) {
          delete newSelected[day][mealType];
        }
        if (Object.keys(newSelected[day]).length === 0) {
          delete newSelected[day];
        }
      }
      return newSelected;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
      {menuItems.map((item) => {
        const currentQuantity = selectedFood[day]?.[mealType]?.[item._id] || 0;
        return (
          <div key={item._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={item.image || '/api/placeholder/80/80'}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h6 className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{item.name}</h6>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                <p className="text-sm font-semibold text-green-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(item.price)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleQuantityChange(item._id, Math.max(0, currentQuantity - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-800 dark:text-gray-100">
                {currentQuantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item._id, currentQuantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GuestBookingFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useContext(AuthContext);

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
              <p className="text-gray-600 dark:text-gray-300">Checking authentication...</p>
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

  const [step, setStep] = useState(1);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(location.state?.roomId ? {
    roomId: location.state.roomId,
    title: location.state.roomTitle,
    type: location.state.roomType,
    pricePerNight: location.state.pricePerNight
  } : null);
  const isRoomPreSelected = !!location.state?.roomId;

  const getNextStep = (currentStep) => {
    if (isRoomPreSelected && currentStep === 1) return 3;
    if (isRoomPreSelected && currentStep === 3) return 4;
    if (isRoomPreSelected && currentStep === 4) return 5;
    if (isRoomPreSelected && currentStep === 5) return 6;
    return currentStep + 1;
  };

  const getPrevStep = (currentStep) => {
    if (isRoomPreSelected && currentStep === 3) return 1;
    if (isRoomPreSelected && currentStep === 4) return 3;
    if (isRoomPreSelected && currentStep === 5) return 4;
    if (isRoomPreSelected && currentStep === 6) return 5;
    return currentStep - 1;
  };
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomId: location.state?.roomId || '',
    specialRequests: '',
    foodPlan: 'None',
    selectedMeals: []
  });
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
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedFood, setSelectedFood] = useState({}); // {day: {mealType: {itemId: quantity}}}

  const renderProgressBar = () => {
    const allSteps = [
      { number: 1, title: 'Search Rooms', description: 'Select dates and guests' },
      { number: 2, title: 'Select Room', description: 'Choose your perfect room' },
      { number: 3, title: 'Booking Details', description: 'Add preferences and confirm' },
      { number: 4, title: 'Confirmation', description: 'Review and confirm booking' },
      { number: 5, title: 'Payment', description: 'Complete your payment' },
      { number: 6, title: 'Complete', description: 'Booking completed' }
    ];

    const steps = isRoomPreSelected ? allSteps.filter(s => s.number !== 2) : allSteps;

    return (
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200"></div>
          {/* Active progress line */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((stepInfo, index) => (
            <React.Fragment key={stepInfo.number}>
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg ${
                    stepInfo.number < step
                      ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-green-200'
                      : stepInfo.number === step
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-200 animate-pulse'
                      : 'bg-white dark:bg-gray-900 border-2 border-gray-300 text-gray-500 shadow-gray-100'
                  }`}
                >
                  {stepInfo.number < step ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepInfo.number
                  )}
                </div>
                <div className="text-center mt-3">
                  <div className={`text-sm font-semibold transition-colors ${
                    stepInfo.number <= step ? 'text-indigo-700' : 'text-gray-500'
                  }`}>
                    {stepInfo.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 hidden md:block max-w-24">
                    {stepInfo.description}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const calculateTotal = () => {
    if (!selectedRoom || !selectedRoom.pricing) return 0;

    const nights = calculateNights();
    if (nights === 0) return 0;

    const basePrice = selectedRoom.basePrice || selectedRoom.pricing?.roomRate || 0;
    const roomSubtotal = basePrice * nights;

    // Calculate food cost
    const foodCost = Object.values(selectedFood).reduce((dayTotal, dayMeals) => {
      return dayTotal + Object.values(dayMeals).reduce((mealTotal, mealItems) => {
        return mealTotal + Object.entries(mealItems).reduce((itemTotal, [itemId, quantity]) => {
          // Find item price - this is simplified, in real app you'd have item data
          return itemTotal + (quantity * 1000); // Placeholder price
        }, 0);
      }, 0);
    }, 0);

    const subtotal = roomSubtotal + foodCost;
    const tax = subtotal * 0.1; // 10% tax
    const serviceFee = subtotal * 0.05; // 5% service fee
    const total = subtotal + tax + serviceFee;

    return total;
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

  // Fetch rooms when entering step 2 if not already fetched
  useEffect(() => {
    if (step === 2 && availableRooms.length === 0 && bookingData.checkIn && bookingData.checkOut) {
      fetchAvailableRooms();
    }
  }, [step]);

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
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFoodOptionChange = async (option) => {
    setBookingData(prev => ({
      ...prev,
      foodPlan: option,
      selectedMeals: option === 'None' ? [] : prev.selectedMeals
    }));

    if (option !== 'None') {
      await fetchMenuItems(option);
    } else {
      setMenuItems([]);
    }
  };

  const fetchMenuItems = async (category) => {
    setLoadingMenu(true);
    try {
      const response = await menuService.getMenuItemsByCategory(category);
      if (response.success) {
        setMenuItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleMealSelection = (itemId, checked) => {
    setBookingData(prev => ({
      ...prev,
      selectedMeals: checked
        ? [...prev.selectedMeals, menuItems.find(item => item._id === itemId)]
        : prev.selectedMeals.filter(meal => meal._id !== itemId)
    }));
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setBookingData(prev => ({
      ...prev,
      roomId: room.roomId
    }));
  };

  const handleBookingSubmit = async () => {
    setLoading(true);
    try {
      // Set appropriate check-in and check-out times based on hotel policy
      const checkInDate = new Date(bookingData.checkIn);
      checkInDate.setHours(14, 0, 0, 0); // 14:00 (2 PM) check-in

      const checkOutDate = new Date(bookingData.checkOut);
      checkOutDate.setHours(12, 0, 0, 0); // 12:00 (noon) check-out

      const bookingPayload = {
        ...bookingData,
        roomId: selectedRoom.roomId,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        totalAmount: calculateTotal(),
        nights: calculateNights(),
        status: 'Pending Approval',
        roomBasePrice: selectedRoom.basePrice || selectedRoom.pricing?.roomRate || 0,
        selectedFood: selectedFood,
        guests: bookingData.guests || 1,
        specialRequests: bookingData.specialRequests || '',
        paymentMethod: paymentData.paymentMethod || 'cash'
      };

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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Search Available Rooms
        </h2>
        <p className="text-gray-600 dark:text-gray-300">Find the perfect room for your stay</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="checkIn" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Check-in Date
            </Label>
            <Input
              id="checkIn"
              type="date"
              value={bookingData.checkIn}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOut" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Check-out Date
            </Label>
            <Input
              id="checkOut"
              type="date"
              value={bookingData.checkOut}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
              className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="guests" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Number of Guests
          </Label>
          <Select
            value={bookingData.guests}
            onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
            className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
          >
            <option value={1}>1 Guest</option>
            <option value={2}>2 Guests</option>
            <option value={3}>3 Guests</option>
            <option value={4}>4 Guests</option>
            <option value={5}>5+ Guests</option>
          </Select>
        </div>

        {calculateNights() > 0 && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {calculateNights()} Night{calculateNights() > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button
            onClick={() => setStep(getNextStep(1))}
            disabled={!bookingData.checkIn || !bookingData.checkOut || loading}
            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Searching...
              </div>
            ) : (
              'Search Available Rooms'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    console.log('RenderStep2 - selectedRoom:', selectedRoom);
    console.log('RenderStep2 - availableRooms:', availableRooms);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Select Your Room
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Choose the perfect accommodation for your stay</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setStep(getPrevStep(2))}
            className="border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
          >
            ← Back to Search
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Finding available rooms...</p>
          </div>
        ) : availableRooms.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No Rooms Available</h3>
              <p className="text-gray-500 mb-6">No rooms are available for the selected dates. Try different dates or modify your search.</p>
              <Button
                onClick={() => setStep(1)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Modify Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">Selected: {selectedRoom.title}</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {calculateNights()} nights • {bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Continue to Details →
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Booking Details
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Customize your stay with food options and special requests</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setStep(getPrevStep(3))}
          className="border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
        >
          ← Back to {isRoomPreSelected ? 'Search' : 'Rooms'}
        </Button>
      </div>

      {/* Booking Summary */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Booking Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Room Details
              </h4>
              <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{selectedRoom?.title}</p>
                <p className="text-gray-600 dark:text-gray-300">Room {selectedRoom?.roomNumber}</p>
                <p className="text-gray-600 dark:text-gray-300">{selectedRoom?.type}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Stay Details
              </h4>
              <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm">
                    {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm">{bookingData.guests} Guest{bookingData.guests > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Total Amount:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                {selectedRoom && new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'LKR'
                }).format(calculateTotal())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Options */}
      <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            Food Options
          </h3>

          <div className="space-y-6">
            <div>
              <Label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Choose Your Meal Plan</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'None', label: 'No Food', icon: '🚫', desc: 'Self-catering' },
                  { value: 'Breakfast', label: 'Breakfast', icon: '🥐', desc: 'Morning meal' },
                  { value: 'Lunch', label: 'Lunch', icon: '🍽️', desc: 'Midday meal' },
                  { value: 'Dinner', label: 'Dinner', icon: '🍽️', desc: 'Evening meal' }
                ].map((option) => (
                  <label key={option.value} className="relative">
                    <input
                      type="radio"
                      name="foodOption"
                      value={option.value}
                      checked={bookingData.foodPlan === option.value}
                      onChange={(e) => handleFoodOptionChange(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      bookingData.foodPlan === option.value
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {bookingData.foodPlan !== 'None' && (
              <div className="border-t pt-6">
                <Label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Select Menu Items</Label>
                {loadingMenu ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Loading delicious options...</p>
                  </div>
                ) : menuItems.length > 0 ? (
                  <div className="grid gap-3 max-h-80 overflow-y-auto">
                    {menuItems.map((item) => (
                      <label key={item._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={bookingData.selectedMeals.some(meal => meal._id === item._id)}
                            onChange={(e) => handleMealSelection(item._id, e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-medium text-gray-800 dark:text-gray-100">{item.name}</span>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'LKR'
                          }).format(item.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No menu items available for this category.</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              <Label htmlFor="specialRequests" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                Special Requests
              </Label>
              <Textarea
                id="specialRequests"
                placeholder="Any special dietary requirements, allergies, or preferences..."
                value={bookingData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="w-full h-24 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleBookingSubmit}
          disabled={loading}
          className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Booking...</span>
            </div>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-8">
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce">
          <div className="w-full h-full bg-yellow-400 rounded-full animate-ping"></div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
          Booking Confirmed!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Your booking has been successfully created. Please proceed to payment to secure your reservation.
        </p>
      </div>

      {bookingResult && (
        <Card className="max-w-2xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Booking Created Successfully
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Booking Number:</span>
                  <span className="font-mono text-indigo-600 font-bold">{bookingResult.bookingNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Status:</span>
                  <Badge className={`${
                    bookingResult.status === 'Confirmed'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : bookingResult.status === 'On Hold'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  } border`}>
                    {bookingResult.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Room:</span>
                  <span className="font-medium">{bookingResult.roomTitle}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Total Amount:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'LKR'
                    }).format(bookingResult?.totalAmount || calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {bookingResult.status !== 'Confirmed' && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Room on Hold</h4>
                    <p className="text-sm text-blue-700">
                      A temporary hold has been placed on your room to secure availability.
                      {bookingResult.holdUntil && (
                        <>
                          {' '}This hold will expire on <strong>{new Date(bookingResult.holdUntil).toLocaleString()}</strong> unless approved/paid.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => setStep(getPrevStep(4))}
          className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
        >
          ← Back to Details
        </Button>
        <Button
          onClick={() => setStep(getNextStep(4))}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Proceed to Payment →
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment</h2>
        <Button variant="outline" onClick={() => setStep(getPrevStep(5))}>
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
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Card Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      placeholder="John Doe"
                      value={paymentData.cardholderName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryMonth">Expiry Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        id="expiryMonth"
                        value={paymentData.expiryMonth}
                        onChange={(e) => setPaymentData({ ...paymentData, expiryMonth: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = i + 1;
                          return (
                            <option key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          );
                        })}
                      </Select>
                      <Select
                        id="expiryYear"
                        value={paymentData.expiryYear}
                        onChange={(e) => setPaymentData({ ...paymentData, expiryYear: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year.toString().slice(-2)}>
                              {year.toString().slice(-2)}
                            </option>
                          );
                        })}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
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
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
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
            (paymentData.paymentMethod === 'card' &&
              (!paymentData.cardNumber ||
                !paymentData.cardholderName ||
                !paymentData.expiryMonth ||
                !paymentData.expiryYear ||
                !paymentData.cvv)) ||
            (paymentData.paymentMethod === 'bank' && !paymentData.bankDetails) ||
            (paymentData.paymentMethod === 'cash' && false) // Cash payment doesn't require additional fields
          }
          className="px-8 py-3"
        >
          {processingPayment ? 'Processing...' : paymentData.paymentMethod === 'cash' ? 'Submit Booking Request' : 'Complete Payment'}
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
                <Badge className={
                  bookingResult.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                  bookingResult.status === 'Approved - Payment Pending' ? 'bg-green-100 text-green-800' :
                  bookingResult.status === 'Approved - Payment Processing' ? 'bg-blue-100 text-blue-800' :
                  bookingResult.status === 'On Hold' ? 'bg-blue-100 text-blue-800' :
                  bookingResult.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {bookingResult.status === 'Confirmed' ? 'Confirmed' :
                   bookingResult.status === 'Approved - Payment Pending' ? 'Approved (Pay at Hotel)' :
                   bookingResult.status === 'Approved - Payment Processing' ? 'Approved (Payment Processing)' :
                   bookingResult.status || 'Pending'}
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
      <div className="flex gap-6 justify-center">
        <Button
          variant="outline"
          onClick={() => navigate('/guest/my-bookings')}
          className="px-8 py-3 border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 font-semibold"
        >
          📋 View My Bookings
        </Button>
        <Button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          🏠 Go to Homepage
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
      setBookingResult(data.data.data);
      setStep(6);
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

  // Step background images
  const stepBackgrounds = {
    1: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', // Hotel lobby/search
    2: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200', // Hotel room selection
    3: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', // Booking details/form
    4: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200', // Confirmation
    5: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=1200', // Payment
    6: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200'  // Success/completion
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${stepBackgrounds[step] || stepBackgrounds[1]}')`
        }}
      />
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 container mx-auto p-4 md:p-8 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-4xl bg-white dark:bg-gray-900/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="p-6 md:p-8">
            {renderProgressBar()}
            <div className="mt-8">
              {renderCurrentStep()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestBookingFlow;