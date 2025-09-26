import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Calendar, Users, MapPin, Clock } from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bookingData.checkIn && bookingData.checkOut && bookingData.guests) {
      navigate('/rooms', {
        state: {
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          roomType: bookingData.roomType
        }
      });
    }
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-indigo-800 mb-4">
            Book Your Stay
          </h1>
          <p className="text-gray-600 text-lg">
            Find the perfect room for your next visit
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Search & Book
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    value={bookingData.checkIn}
                    onChange={(e) => handleInputChange('checkIn', e.target.value)}
                    min={today}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    value={bookingData.checkOut}
                    onChange={(e) => handleInputChange('checkOut', e.target.value)}
                    min={bookingData.checkIn || today}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Select
                    value={bookingData.guests}
                    onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                    className="pl-10"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                    <option value={5}>5+ Guests</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type (Optional)
                </label>
                <Select
                  value={bookingData.roomType}
                  onChange={(e) => handleInputChange('roomType', e.target.value)}
                >
                  <option value="">Any Room Type</option>
                  <option value="Standard">Standard Room</option>
                  <option value="Deluxe">Deluxe Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Executive">Executive Suite</option>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Search Available Rooms
              </Button>
            </form>
          </Card>

          {/* Quick Info */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Booking Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-800">Check-in Time</p>
                  <p className="text-sm text-gray-600">2:00 PM</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-800">Check-out Time</p>
                  <p className="text-sm text-gray-600">12:00 PM</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-800">Location</p>
                  <p className="text-sm text-gray-600">123 Hotel Street, City, State</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-indigo-800 mb-2">Need Help?</h3>
              <p className="text-sm text-indigo-600">
                Contact our reservation team for assistance with your booking.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}