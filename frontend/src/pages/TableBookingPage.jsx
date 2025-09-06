import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  Check,
  MapPin,
  Heart,
  Utensils
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import api from '../services/api';

const TableBookingPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: DateTime, 2: Details, 3: Confirmation
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {
      customerInfo: {
        name: '',
        email: '',
        phone: ''
      },
      partySize: 2,
      specialRequests: '',
      dietaryRequirements: [],
      occasion: 'other'
    }
  });

  const watchedValues = watch();

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Time slots for restaurant
  const timeSlots = [
    { time: '11:30', label: '11:30 AM', period: 'lunch' },
    { time: '12:00', label: '12:00 PM', period: 'lunch' },
    { time: '12:30', label: '12:30 PM', period: 'lunch' },
    { time: '13:00', label: '1:00 PM', period: 'lunch' },
    { time: '13:30', label: '1:30 PM', period: 'lunch' },
    { time: '14:00', label: '2:00 PM', period: 'lunch' },
    { time: '18:30', label: '6:30 PM', period: 'dinner' },
    { time: '19:00', label: '7:00 PM', period: 'dinner' },
    { time: '19:30', label: '7:30 PM', period: 'dinner' },
    { time: '20:00', label: '8:00 PM', period: 'dinner' },
    { time: '20:30', label: '8:30 PM', period: 'dinner' },
    { time: '21:00', label: '9:00 PM', period: 'dinner' },
  ];

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate, watchedValues.partySize]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get('/api/bookings/available-slots', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
          partySize: watchedValues.partySize || 2
        }
      });
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      // Fallback to all slots if API fails
      setAvailableSlots(timeSlots.map(slot => ({ time: slot.time, available: true })));
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const bookingData = {
        ...data,
        bookingDate: format(selectedDate, 'yyyy-MM-dd'),
        bookingTime: data.bookingTime
      };

      const response = await api.post('/api/bookings', bookingData);
      
      if (response.data.success) {
        setBookingConfirmed(true);
        setStep(3);
        toast.success('Table booked successfully!');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to book table');
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your table reservation has been confirmed. You'll receive a confirmation email shortly.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <div className="font-medium">{getDateLabel(selectedDate)}</div>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <div className="font-medium">{timeSlots.find(slot => slot.time === watchedValues.bookingTime)?.label}</div>
              </div>
              <div>
                <span className="text-gray-500">Party Size:</span>
                <div className="font-medium">{watchedValues.partySize} people</div>
              </div>
              <div>
                <span className="text-gray-500">Name:</span>
                <div className="font-medium">{watchedValues.customerInfo.name}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/menu'}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            Browse Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reserve Your Table</h1>
          <p className="text-lg text-gray-600 mb-6">
            Experience authentic Sri Lankan cuisine in our cozy restaurant
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNum ? 'bg-amber-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-500">
            <span className={step >= 1 ? 'text-amber-600' : ''}>Date & Time</span>
            <span className={step >= 2 ? 'text-amber-600' : ''}>Details</span>
            <span className={step >= 3 ? 'text-amber-600' : ''}>Confirmation</span>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Step 1: Date & Time Selection */}
            {step === 1 && (
              <motion.div className="p-6 space-y-6" variants={itemVariants}>
                {/* Party Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Party Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setValue('partySize', size)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          watchedValues.partySize === size
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {size} {size === 1 ? 'Guest' : 'Guests'}
                      </button>
                    ))}
                  </div>
                  {watchedValues.partySize > 8 && (
                    <input
                      type="number"
                      {...register('partySize', { min: 1, max: 20 })}
                      className="mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Enter party size"
                    />
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Select Date
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                    {availableDates.map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{getDateLabel(date)}</div>
                        <div className="text-xs opacity-75">{format(date, 'MMM d')}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Select Time
                  </label>
                  
                  {/* Lunch Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                      <Utensils className="w-4 h-4 mr-1" />
                      Lunch (11:30 AM - 3:00 PM)
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(slot => slot.period === 'lunch').map((slot) => {
                        const isAvailable = availableSlots.find(s => s.time === slot.time)?.available !== false;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setValue('bookingTime', slot.time)}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              watchedValues.bookingTime === slot.time
                                ? 'bg-amber-600 text-white'
                                : isAvailable
                                  ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dinner Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      Dinner (6:30 PM - 10:00 PM)
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(slot => slot.period === 'dinner').map((slot) => {
                        const isAvailable = availableSlots.find(s => s.time === slot.time)?.available !== false;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setValue('bookingTime', slot.time)}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              watchedValues.bookingTime === slot.time
                                ? 'bg-amber-600 text-white'
                                : isAvailable
                                  ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!watchedValues.bookingTime}
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Customer Details */}
            {step === 2 && (
              <motion.div className="p-6 space-y-6" variants={itemVariants}>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('customerInfo.name', { required: 'Name is required' })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      placeholder="Enter your full name"
                    />
                    {errors.customerInfo?.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerInfo.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('customerInfo.email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      placeholder="Enter your email"
                    />
                    {errors.customerInfo?.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerInfo.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('customerInfo.phone', { required: 'Phone number is required' })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      placeholder="+94 77 123 4567"
                    />
                    {errors.customerInfo?.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerInfo.phone.message}</p>
                    )}
                  </div>

                  {/* Occasion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occasion
                    </label>
                    <select
                      {...register('occasion')}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    >
                      <option value="other">General Dining</option>
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="business">Business Meeting</option>
                      <option value="date">Date Night</option>
                      <option value="family">Family Gathering</option>
                      <option value="celebration">Celebration</option>
                    </select>
                  </div>
                </div>

                {/* Dietary Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Requirements
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal'].map((dietary) => (
                      <label key={dietary} className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('dietaryRequirements')}
                          value={dietary}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{dietary.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    {...register('specialRequests')}
                    rows={3}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                    placeholder="Any special requests or notes for your reservation..."
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default TableBookingPage;