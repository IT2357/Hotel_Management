import React, { useState, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/rooms/ui/dialog";
import { Button } from "@/components/rooms/ui/button";
import { Badge } from "@/components/rooms/ui/badge";
import { Card, CardContent } from "@/components/rooms/ui/card";
import Label from '../ui/Label';
import { Input } from '../ui/Input';
import Textarea from '../ui/Textarea';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Wifi,
  Coffee,
  Car,
  Bath,
  ChefHat,
  UtensilsCrossed
} from "lucide-react";
import BookingMenuSelector from './BookingMenuSelector';
import DailyMealSelector from './DailyMealSelector';
import { cn } from "@/lib/utils";
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import { AuthContext } from '../../context/AuthContext';
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

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Coffee': Coffee,
  'Bathtub': Bath,
};

const IntegratedBookingFlow = ({ 
  isOpen, 
  onClose, 
  room, 
  initialStep = 3, 
  initialBookingData = null 
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    checkIn: initialBookingData?.checkIn || '',
    checkOut: initialBookingData?.checkOut || '',
    guests: initialBookingData?.guests || 1,
    roomId: room?.id || '',
    specialRequests: initialBookingData?.specialRequests || '',
    foodPlan: initialBookingData?.foodPlan || 'None',
    selectedMeals: initialBookingData?.selectedMeals || [],
    ...initialBookingData
  });

  // Update booking data ONLY when modal first opens (not on every initialBookingData change)
  // This prevents resetting selectedMeals when ViewDetails updates its state
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open
    
    console.log('IntegratedBookingFlow - Modal opened, initialBookingData:', initialBookingData);
    if (initialBookingData && Object.keys(initialBookingData).length > 0) {
      console.log('IntegratedBookingFlow - Initializing booking data with initial data');
      setBookingData(prev => {
        // CRITICAL: Only update if prev is empty/default state
        // If prev already has selectedMeals, preserve them!
        const hasExistingMeals = prev.selectedMeals && prev.selectedMeals.length > 0;
        
        const newData = {
          ...prev,
          checkIn: initialBookingData.checkIn || prev.checkIn,
          checkOut: initialBookingData.checkOut || prev.checkOut,
          guests: initialBookingData.guests || prev.guests,
          specialRequests: initialBookingData.specialRequests || prev.specialRequests,
          foodPlan: initialBookingData.foodPlan || prev.foodPlan,
          roomId: room?.id || prev.roomId,
          // CRITICAL: Preserve existing selectedMeals, only use initialBookingData.selectedMeals if we don't have any
          selectedMeals: hasExistingMeals ? prev.selectedMeals : (initialBookingData.selectedMeals || prev.selectedMeals)
        };
        console.log('IntegratedBookingFlow - New booking data (hasExistingMeals:', hasExistingMeals, '):', newData);
        return newData;
      });
    }
  }, [isOpen, room?.id]); // ← REMOVED initialBookingData from dependencies!

  // Log when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('IntegratedBookingFlow - Modal opened with:');
      console.log('- isOpen:', isOpen);
      console.log('- room:', room);
      console.log('- initialStep:', initialStep);
      console.log('- initialBookingData:', initialBookingData);
      console.log('- current bookingData:', bookingData);
    }
  }, [isOpen, room, initialStep, initialBookingData, bookingData]);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    bankDetails: ''
  });

  const [bookingResult, setBookingResult] = useState(null);
  
  // Menu selector state
  const [showMenuSelector, setShowMenuSelector] = useState(false);

  // Check authentication
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      console.log('User not authenticated, storing redirect and navigating to login');
      // Store redirect information for after login
      sessionStorage.setItem('redirectAfterLogin', '/rooms');
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        room: room,
        initialStep: initialStep,
        initialBookingData: initialBookingData
      }));
      
      // Close modal and redirect to login
      onClose();
      navigate('/login');
      return;
    }
  }, [isOpen, isAuthenticated, onClose, navigate, room, initialStep, initialBookingData]);

  // Debug: Log when showMenuSelector changes
  useEffect(() => {
    console.log('🎯 showMenuSelector changed to:', showMenuSelector);
  }, [showMenuSelector]);
  

  // Calculate functions using unified engine
  const calculateNights = () => {
    return calcNights(bookingData.checkIn, bookingData.checkOut);
  };

  const calculateTotalCost = () => {
    const result = calculateBookingCost({
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      roomPrice: room?.price || room?.pricePerNight || room?.basePrice || 0,
      guests: bookingData.guests,
      foodPlan: bookingData.foodPlan,
      selectedMeals: bookingData.selectedMeals // Day-by-day meals from DailyMealSelector
    });
    
    // Debug log if food cost is 0 but meals are selected
    if (bookingData.selectedMeals?.length > 0 && result.foodCost === 0) {
      console.warn('⚠️ Food cost is 0 but meals are selected!', {
        mealsCount: bookingData.selectedMeals.length,
        firstMeal: bookingData.selectedMeals[0],
        result
      });
    }
    
    return result;
  };

  // Handle menu items selection
  const handleMenuItemsSelected = (items) => {
    console.log('Menu items selected:', items);
    setBookingData(prev => ({
      ...prev,
      selectedMeals: items
    }));
    setShowMenuSelector(false);
  };

  // Open menu selector
  const openMenuSelector = () => {
    if (bookingData.foodPlan === 'None') {
      toast.error('Please select a food plan first');
      return;
    }
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('Please select check-in and check-out dates first');
      return;
    }
    console.log('📅 Opening meal selector with:', {
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      foodPlan: bookingData.foodPlan
    });
    console.log('🔓 Setting showMenuSelector to TRUE');
    setShowMenuSelector(true);
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        throw new Error('You must be logged in to make a booking. Please log in and try again.');
      }

      // Check if booking service is available
      if (!bookingService || typeof bookingService.createBooking !== 'function') {
        throw new Error('Booking service is not available. Please try again later.');
      }

      // Determine room properties based on room object structure
      const roomId = room?.id || room?._id || room?.roomId;
      const roomPrice = room?.price || room?.pricePerNight || room?.basePrice || 0;
      const roomName = room?.name || room?.title || room?.roomTitle || 'Unknown Room';

      console.log('Room data received:', room);
      console.log('Creating booking with unified calculations...');

      // ✅ CRITICAL: Verify meal structure before sending to backend
      // Each meal should have: { day, date, mealType, items: [{ foodId, name, price, quantity }], totalCost }
      if (bookingData.foodPlan !== 'None' && bookingData.selectedMeals?.length > 0) {
        console.log('🔍 Verifying meal structure before submission:', {
          mealsCount: bookingData.selectedMeals.length,
          firstMeal: bookingData.selectedMeals[0],
          allMealsCosts: bookingData.selectedMeals.map(m => ({
            day: m.day,
            mealType: m.mealType,
            itemsCount: m.items?.length,
            totalCost: m.totalCost
          }))
        });
      }

      // Use the unified booking payload creator
      // This will validate and ensure all meals have totalCost calculated
      const bookingPayload = createBookingPayload({
        roomId: roomId,
        roomPrice: roomPrice,
        roomTitle: roomName,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        foodPlan: bookingData.foodPlan,
        selectedMeals: bookingData.selectedMeals, // Day-by-day meal structure
        specialRequests: bookingData.specialRequests,
        paymentMethod: paymentData.paymentMethod || 'cash',
        source: 'integrated_booking_flow'
      });

      console.log('✅ Submitting booking with validated payload:', bookingPayload);
      console.log('📊 Booking Summary:', {
        room: roomName,
        nights: bookingPayload.nights,
        roomCost: bookingPayload.costBreakdown.roomCost,
        foodPlan: bookingData.foodPlan,
        mealsCount: bookingPayload.selectedMeals?.length || 0,
        foodCost: bookingPayload.costBreakdown.foodCost,
        totalCost: bookingPayload.totalAmount,
        mealsValidated: bookingPayload.metadata.mealsValidated
      });
      
      // Use the booking service to create booking
      const data = await bookingService.createBooking(bookingPayload);
      console.log('✅ Booking created successfully:', data);

      if (data && data.success) {
        console.log('🎯 Moving to payment step with booking:', data.data.bookingNumber);
        setBookingResult(data.data);
        setStep(5); // Move to payment step
      } else {
        throw new Error(data?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.message.includes('not authenticated') || error.message.includes('logged in')) {
        errorMessage = 'You must be logged in to make a booking. Please log in and try again.';
      } else if (error.message.includes('service') || error.message.includes('available')) {
        errorMessage = 'Booking service is temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // For development/testing - provide a fallback mock booking if service fails
      if (process.env.NODE_ENV === 'development' && error.message.includes('service')) {
        console.warn('Using fallback mock booking for development');
        setBookingResult({
          bookingNumber: 'BK' + Date.now().toString() + Math.random().toString(36).substr(2, 3).toUpperCase(),
          status: 'Pending Approval',
          totalAmount: calculateTotalCost().total,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          roomTitle: room?.name || room?.title || 'Room',
          paymentMethod: 'cash',
          holdUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        setStep(5);
        return;
      }
      
      window.alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment processing
  const processPayment = async () => {
    setProcessingPayment(true);
    try {
      // Check if we have a booking result
      if (!bookingResult || !bookingResult.bookingNumber) {
        throw new Error('No booking found to process payment. Please try creating the booking again.');
      }

      // Check if payment service is available
      if (!paymentService || typeof paymentService.processBookingPayment !== 'function') {
        throw new Error('Payment service is not available. Please try again later.');
      }

      console.log('Processing payment with data:', {
        bookingNumber: bookingResult?.bookingNumber,
        paymentMethod: paymentData.paymentMethod,
        paymentData: paymentData
      });

      // Use the payment service to process booking payment
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
            totalAmount: calculateTotalCost().total
          }));
          
          // Submit to PayHere (this will redirect the page)
          await paymentService.submitToPayHere(data.data.data.paymentSession);
          
          // Note: User will be redirected to PayHere, so we won't reach here
          // The return URL will handle the post-payment flow
        } else {
          // For cash/bank payments, update booking result and show confirmation
          const updatedBookingResult = {
            ...data.data.data,
            paymentMethod: paymentData.paymentMethod
          };
          setBookingResult(updatedBookingResult);
          setStep(6); // Move to confirmation step
        }
      } else {
        console.error('Payment failed:', data);
        window.alert(data.data?.message || data.message || 'Payment update failed.');
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Extract backend error message if available
      const backendError = error.response?.data?.message || error.response?.data?.error;
      
      // Provide more specific error messages
      let errorMessage = 'Payment processing failed. Please try again.';
      
      if (backendError) {
        errorMessage = `Payment failed: ${backendError}`;
      } else if (error.message.includes('No booking found')) {
        errorMessage = 'No booking found to process payment. Please try creating the booking again.';
      } else if (error.message.includes('service') || error.message.includes('available')) {
        errorMessage = 'Payment service is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('already')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      window.alert(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'checkIn' || field === 'checkOut') {
      if (!value) {
        setBookingData(prev => ({ ...prev, [field]: value }));
        return;
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) return;
      
      const formattedDate = date.toISOString().split('T')[0];
      setBookingData(prev => ({ ...prev, [field]: formattedDate }));
      return;
    }
    
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  // Progress Bar Component
  const ProgressBar = () => {
    const steps = [
      { id: 3, title: 'Details', icon: Calendar },
      { id: 4, title: 'Confirm', icon: CheckCircle },
      { id: 5, title: 'Payment', icon: CreditCard },
      { id: 6, title: 'Complete', icon: CheckCircle }
    ];

    return (
      <div className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = step === stepItem.id;
            const isCompleted = step > stepItem.id;
            
            return (
              <React.Fragment key={stepItem.id}>
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-primary text-white shadow-lg scale-110" :
                    isCompleted ? "bg-green-500 text-white" :
                    "bg-white/50 text-gray-400"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-xs mt-2 font-medium",
                    isActive ? "text-primary" :
                    isCompleted ? "text-green-600" :
                    "text-gray-500"
                  )}>
                    {stepItem.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors duration-300",
                    step > stepItem.id ? "bg-green-500" : "bg-gray-200"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Step 3: Booking Details
  const renderBookingDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Booking Details</h2>
      </div>

      {/* Room Summary */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <img 
              src={room?.images?.[0] || "/placeholder.jpg"} 
              alt={room?.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{room?.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                {room?.floor && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{room.floor}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Up to {room?.maxGuests} guests</span>
                </div>
              </div>
            </div>
            <Badge className="bg-primary text-white">
              LKR {room?.price}/night
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Stay Duration</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkIn" className="text-sm font-semibold mb-2 block">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={bookingData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="checkOut" className="text-sm font-semibold mb-2 block">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={bookingData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
          </div>

          {calculateNights() > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {calculateNights()} night{calculateNights() > 1 ? 's' : ''} stay
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guests & Additional Options */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Number of Guests</Label>
              <select
                value={bookingData.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: room?.maxGuests || 1 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} Guest{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Food Plan</Label>
              <select
                value={bookingData.foodPlan}
                onChange={(e) => handleInputChange('foodPlan', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="None">No Food Plan</option>
                <option value="Breakfast">Breakfast Only</option>
                <option value="Half Board">Half Board (Breakfast + Dinner)</option>
                <option value="Full Board">Full Board (Breakfast + Lunch + Dinner)</option>
                <option value="A la carte">A la carte (Choose Your Own)</option>
              </select>
              
              {bookingData.foodPlan !== 'None' && (
                <p className="text-sm text-gray-500 mt-1 italic">
                  💡 Price depends on menu items you select
                </p>
              )}
              
              {bookingData.foodPlan !== 'None' && (
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={openMenuSelector}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    {bookingData.selectedMeals.length > 0 
                      ? `${bookingData.selectedMeals.length} meals selected - Click to modify`
                      : 'Browse & Select Menu Items'}
                  </Button>
                  
                  {bookingData.selectedMeals.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                        <ChefHat className="w-4 h-4" />
                        <span>Selected Meals ({bookingData.selectedMeals.length} meals)</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {bookingData.selectedMeals.map((meal, idx) => {
                          const mealCost = meal.totalCost || (meal.items?.reduce((sum, item) => 
                            sum + (item.price * item.quantity), 0) || 0);
                          
                          return (
                            <div key={idx} className="border-l-2 border-green-400 pl-2">
                              <div className="text-xs font-semibold text-green-700 mb-1">
                                Day {meal.day} - {meal.mealType?.charAt(0).toUpperCase() + meal.mealType?.slice(1)}
                                <span className="float-right">LKR {mealCost.toLocaleString()}</span>
                              </div>
                              <div className="space-y-0.5">
                                {meal.items?.map((item, itemIdx) => (
                                  <div key={itemIdx} className="text-xs text-green-600 flex justify-between">
                                    <span>{item.name}</span>
                                    <span>×{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-green-300 text-sm font-bold text-green-800">
                        Total Meals Cost: LKR {calculateTotalCost().foodCost.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Special Requests</Label>
              <textarea
                placeholder="Any special requests or preferences..."
                value={bookingData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="w-full p-2 border rounded-md h-20 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      {calculateNights() > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Room × {calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                <span>LKR {calculateTotalCost().roomCost.toLocaleString()}</span>
              </div>
              {calculateTotalCost().foodCost > 0 && (
                <div className="flex justify-between">
                  <span>{bookingData.foodPlan} Meal Plan ({bookingData.selectedMeals?.length || 0} meals)</span>
                  <span>LKR {calculateTotalCost().foodCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes (12%)</span>
                <span>LKR {calculateTotalCost().taxes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (10%)</span>
                <span>LKR {calculateTotalCost().serviceCharge.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">LKR {calculateTotalCost().total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show reminder if meals are selected */}
      {bookingData.selectedMeals && bookingData.selectedMeals.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">
              Meals selected! Review your booking details above and continue when ready.
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => setStep(4)}
          disabled={calculateNights() === 0}
          className={`px-8 py-3 transition-all ${
            bookingData.selectedMeals && bookingData.selectedMeals.length > 0
              ? 'bg-green-600 hover:bg-green-700 animate-pulse'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          Continue to Confirmation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Step 4: Confirmation
  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Confirm Your Booking</h2>
        <Button variant="outline" onClick={() => setStep(3)} className="bg-white/20 text-white border-white/30">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
          
          {/* Final Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Room Details</h4>
              <p className="text-lg">{room?.name}</p>
              <p className="text-gray-600">{room?.floor}</p>
              <p className="text-gray-600">Up to {room?.maxGuests} guests</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Stay Details</h4>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{bookingData.guests} Guest{bookingData.guests > 1 ? 's' : ''}</span>
              </div>
              {bookingData.foodPlan !== 'None' && (
                <p className="text-sm text-gray-600 mt-1">Food Plan: {bookingData.foodPlan}</p>
              )}
            </div>
          </div>

          {/* Food Items Breakdown */}
          {bookingData.foodPlan !== 'None' && bookingData.selectedMeals.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <ChefHat className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Food Plan: {bookingData.foodPlan}</h4>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {bookingData.selectedMeals.map((meal, mealIdx) => {
                  // Calculate meal cost if not present
                  const mealCost = meal.totalCost || (meal.items?.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0) || 0);
                  
                  return (
                    <div key={mealIdx} className="bg-white/60 px-3 py-2 rounded border border-green-100">
                      <div className="font-medium text-green-700 mb-2 text-sm">
                        Day {meal.day} - {meal.mealType?.charAt(0).toUpperCase() + meal.mealType?.slice(1)} 
                        <span className="float-right text-green-600">LKR {mealCost.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        {meal.items?.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-center text-xs text-gray-600 pl-2">
                            <span>{item.name} × {item.quantity}</span>
                            <span>LKR {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bookingData.specialRequests && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold mb-1 text-amber-900">💬 Special Requests</h4>
              <p className="text-sm text-amber-700">{bookingData.specialRequests}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span>Room × {calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                <span>LKR {calculateTotalCost().roomCost.toLocaleString()}</span>
              </div>
              {calculateTotalCost().foodCost > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{bookingData.foodPlan} Meal Plan ({bookingData.selectedMeals?.length || 0} meals)</span>
                  <span>LKR {calculateTotalCost().foodCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes (12%)</span>
                <span>LKR {calculateTotalCost().taxes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (10%)</span>
                <span>LKR {calculateTotalCost().serviceCharge.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold pt-3 border-t-2 border-gray-300">
              <span>Total Amount:</span>
              <span className="text-green-600 bg-green-50 px-4 py-2 rounded-lg border-2 border-green-200">
                LKR {calculateTotalCost().total.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleBookingSubmit}
          disabled={loading}
          className="px-8 py-3 bg-primary hover:bg-primary/90"
        >
          {loading ? 'Creating Booking...' : 'Create Booking'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Step 5: Payment (comprehensive like GuestBookingFlow)
  const renderPayment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Payment</h2>
        <Button variant="outline" onClick={() => setStep(4)} className="bg-white/20 text-white border-white/30">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
          
          <div className="space-y-4">
            {/* Booking Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm">
                <p>Booking Number: <span className="font-mono">{bookingResult?.bookingNumber}</span></p>
                <p>Room: {bookingResult?.roomTitle || room?.name}</p>
                <p>Check-in: {bookingResult?.checkIn ? new Date(bookingResult.checkIn).toLocaleDateString() : new Date(bookingData.checkIn).toLocaleDateString()}</p>
                <p>Check-out: {bookingResult?.checkOut ? new Date(bookingResult.checkOut).toLocaleDateString() : new Date(bookingData.checkOut).toLocaleDateString()}</p>
                <p>Guests: {bookingResult?.guests || bookingData.guests}</p>
                <p className="font-semibold mt-2">Total Amount: LKR {calculateTotalCost().total.toLocaleString()}</p>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-semibold mb-2 block">Payment Method</Label>
              <select
                id="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={(e) => handlePaymentChange('paymentMethod', e.target.value)}
                className="w-full p-3 border rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="card">💳 Credit/Debit Card</option>
                <option value="bank">🏦 Bank Transfer</option>
                <option value="cash">💵 Pay at Hotel</option>
              </select>
            </div>

            {/* Payment Method Information Cards */}
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

            {/* Bank Transfer Details */}
            {paymentData.paymentMethod === 'bank' && (
              <div className="border-t pt-4">
                <Label htmlFor="bankDetails" className="text-sm font-medium mb-1 block">Bank Transfer Details</Label>
                <textarea
                  id="bankDetails"
                  placeholder="Please provide your bank details for transfer (Account number, Bank name, etc.)..."
                  value={paymentData.bankDetails}
                  onChange={(e) => handlePaymentChange('bankDetails', e.target.value)}
                  rows={3}
                  className="w-full p-3 border rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}

            {/* Cash Payment Instructions */}
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

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(4)} className="bg-white/20 text-white border-white/30">
          Back to Booking Details
        </Button>
        <Button
          onClick={processPayment}
          disabled={
            processingPayment ||
            (paymentData.paymentMethod === 'bank' && !paymentData.bankDetails)
          }
          className="px-8 py-3 bg-primary hover:bg-primary/90"
        >
          {processingPayment ? 'Processing...' : 
           paymentData.paymentMethod === 'cash' ? 'Submit Booking Request' : 
           paymentData.paymentMethod === 'card' ? 'Proceed to PayHere Payment' : 'Complete Payment'}
        </Button>
      </div>
    </div>
  );

  // Step 6: Booking Confirmation (comprehensive like GuestBookingFlow)
  const renderBookingConfirmation = () => (
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
            <p className="text-white/80 mb-4">
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
            <p className="text-white/80 mb-4">
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
            <p className="text-white/80 mb-4">
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
            <p className="text-white/80 mb-4">
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
            <p className="text-white/80 mb-4">
              Your booking has been confirmed! Payment will be collected when you arrive at the hotel.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                <strong>Payment at Hotel:</strong> Please bring a valid ID and the total amount of LKR {calculateTotalCost().total.toLocaleString()} when you check-in.
              </p>
            </div>
          </>
        ) : bookingResult?.status === 'Confirmed' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-white/80 mb-4">
              Your payment has been processed successfully and your booking is confirmed.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Submitted!</h2>
            <p className="text-white/80 mb-4">
              Your booking has been successfully created. Please proceed with payment instructions.
            </p>
          </>
        )}
      </div>

      {/* Booking Confirmation Card */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
          
          {bookingResult && (
            <div className="space-y-4">
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
                  <span>{bookingResult.roomTitle || room?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Check-in:</span>
                  <span>
                    {bookingResult.checkIn
                      ? new Date(bookingResult.checkIn).toLocaleDateString()
                      : new Date(bookingData.checkIn).toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Check-out:</span>
                  <span>
                    {bookingResult.checkOut
                      ? new Date(bookingResult.checkOut).toLocaleDateString()
                      : new Date(bookingData.checkOut).toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guests:</span>
                  <span>{bookingResult.guests || bookingData.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Method:</span>
                  <span className="capitalize">
                    {bookingResult.paymentMethod === 'card' ? 'Credit/Debit Card' :
                      bookingResult.paymentMethod === 'bank' ? 'Bank Transfer' : 
                      paymentData.paymentMethod === 'cash' ? 'Pay at Hotel' : 'Pay at Hotel'}
                  </span>
                </div>
              </div>

              {/* Hold Information */}
              {bookingResult.status !== 'Confirmed' && bookingResult.holdUntil && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-800 text-sm">
                  Your booking is currently On Hold to secure the room while you complete payment or await approval.
                  Hold expires on <strong>{new Date(bookingResult.holdUntil).toLocaleString()}</strong>.
                </div>
              )}

              {/* Cost Breakdown */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Room × {calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                      <span>LKR {calculateTotalCost().roomCost.toLocaleString()}</span>
                    </div>
                    {calculateTotalCost().foodCost > 0 && (
                      <div className="flex justify-between">
                        <span>{bookingData.foodPlan} Meal Plan ({bookingData.selectedMeals?.length || 0} meals)</span>
                        <span>LKR {calculateTotalCost().foodCost.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Taxes (12%)</span>
                      <span>LKR {calculateTotalCost().taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge (10%)</span>
                      <span>LKR {calculateTotalCost().serviceCharge.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-primary">LKR {calculateTotalCost().total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Instructions based on method */}
              {(paymentData.paymentMethod === 'cash' || bookingResult.paymentMethod === 'cash') && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 text-blue-600 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">💵 Pay at Hotel Instructions</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <p>• Your booking requires admin approval before confirmation</p>
                        <p>• Pay the full amount at the hotel reception upon arrival</p>
                        <p>• Bring a valid ID for verification</p>
                        <p>• Present your booking number: <strong className="font-mono">{bookingResult.bookingNumber}</strong></p>
                        <p>• You'll receive an email confirmation once approved</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">📋 What Happens Next?</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>1. Our team will review your booking request within 2-4 hours</p>
                  <p>2. You'll receive an email notification about the approval status</p>
                  <p>3. Once approved, your room will be reserved until check-in</p>
                  <p>4. {paymentData.paymentMethod === 'cash' ? 'Bring the total amount in cash or card for payment at reception' : 'Payment confirmation will be sent via email'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => {
            navigate('/guest/my-bookings');
            onClose();
          }}
          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
        >
          View My Bookings
        </Button>
        <Button 
          onClick={() => {
            navigate('/');
            onClose();
          }}
          className="bg-white text-primary hover:bg-white/90"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 3:
        return renderBookingDetails();
      case 4:
        return renderConfirmation();
      case 5:
        return renderPayment();
      case 6:
        return renderBookingConfirmation();
      default:
        return renderBookingDetails();
    }
  };

  if (!room) return null;

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Only allow closing if meal selector is not open
          if (!showMenuSelector) {
            onClose();
          } else {
            // If meal selector is open, just close that instead
            console.log('Meal selector is open, preventing parent dialog close');
          }
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-xl"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1.5px solid rgba(255, 255, 255, 0.18)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.8) 0%, rgba(168,85,247,0.8) 100%)',
            backdropFilter: 'blur(16px) saturate(180%)',
            zIndex: 9999, // Ensure booking flow appears above ViewDetails modal
          }}
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking on meal selector
            if (showMenuSelector) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing when meal selector is open
            if (showMenuSelector) {
              e.preventDefault();
              setShowMenuSelector(false);
            }
          }}
        >
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-white mb-4">
              Complete Your Booking
            </DialogTitle>
            <DialogDescription className="sr-only">
              Follow the steps to complete your hotel room booking with optional meal plans
            </DialogDescription>
            <ProgressBar />
          </DialogHeader>

          <div className="p-6">
            {renderCurrentStep()}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Menu Selector Modal - Rendered via portal outside Dialog for proper layering */}
      {showMenuSelector && typeof document !== 'undefined' && ReactDOM.createPortal(
        <DailyMealSelector
          checkIn={bookingData.checkIn}
          checkOut={bookingData.checkOut}
          foodPlan={bookingData.foodPlan}
          onMealsSelected={(meals) => {
            console.log('✅ Daily meals selected from DailyMealSelector:', meals);
            console.log('🔍 First meal structure:', meals[0]);
            
            // Keep the meal structure as-is - it already has totalCost calculated
            // The booking calculations expect this structure: { day, mealType, items[], totalCost }
            
            // Ensure each item has foodId for backend compatibility
            // Also ensure totalCost is preserved
            const mealsWithFoodIds = meals.map(meal => {
              const mealCost = meal.totalCost || (meal.items?.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0) || 0);
              
              return {
                ...meal,
                totalCost: mealCost, // Explicitly set totalCost
                items: meal.items.map(item => ({
                  ...item,
                  foodId: item.foodId || item._id
                }))
              };
            });
            
            const totalItems = mealsWithFoodIds.reduce((sum, meal) => sum + meal.items.length, 0);
            const totalCost = mealsWithFoodIds.reduce((sum, meal) => sum + (meal.totalCost || 0), 0);
            
            console.log('📦 Meals for booking:', {
              mealsCount: mealsWithFoodIds.length,
              totalItems,
              totalCost,
              firstMeal: mealsWithFoodIds[0],
              meals: mealsWithFoodIds
            });
            
            setBookingData(prev => {
              const updated = {
                ...prev,
                selectedMeals: mealsWithFoodIds
              };
              console.log('🎯 Updated bookingData.selectedMeals:', updated.selectedMeals);
              return updated;
            });
            setShowMenuSelector(false);
            
            // Show success message with clear instruction
            toast.success(
              `✅ ${totalItems} meal items added! Total: LKR ${totalCost.toLocaleString()}`, 
              { duration: 4000 }
            );
            
            // Scroll to top to show updated cost summary
            setTimeout(() => {
              const dialogContent = document.querySelector('[role="dialog"]');
              if (dialogContent) {
                dialogContent.scrollTop = 0;
              }
            }, 100);
          }}
          onClose={() => {
            console.log('🚪 Closing meal selector');
            setShowMenuSelector(false);
          }}
        />,
        document.body
      )}
    </>
  );
};

export default IntegratedBookingFlow;