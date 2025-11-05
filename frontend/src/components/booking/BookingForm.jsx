// Placeholder for import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { Calendar, Users, MapPin, Clock, CreditCard } from 'lucide-react';

export default function BookingForm({ roomId, roomDetails, onSubmit, onCancel }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
    foodPlan: 'None',
    selectedMeals: []
  });
  const [loading, setLoading] = useState(false);

  const foodOptions = [
    { value: 'None', label: 'No Meal Plan', price: 0 },
    { value: 'Breakfast', label: 'Breakfast Only', price: 2500 },
    { value: 'Half Board', label: 'Breakfast + Dinner', price: 7500 },
    { value: 'Full Board', label: 'All Meals', price: 12000 },
    { value: 'À la carte', label: 'À la carte Dining', price: 0 }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default navigation behavior
        navigate('/booking/guest', {
          state: {
            roomId: roomId,
            roomDetails: roomDetails,
            bookingData: formData
          }
        });
      }
    } catch (error) {
      console.error('Error submitting booking form:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const getSelectedFoodPlan = () => {
    return foodOptions.find(option => option.value === formData.foodPlan);
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!roomDetails || !formData.checkIn || !formData.checkOut) return 0;

    const nights = calculateNights();
    const roomTotal = roomDetails.pricePerNight * nights;
    const foodPlan = getSelectedFoodPlan();
    const foodTotal = foodPlan ? foodPlan.price * nights : 0;

    return roomTotal + foodTotal;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Complete Your Booking
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                min={today}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                min={formData.checkIn || today}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Select
              value={formData.guests}
              onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
              className="pl-10"
              required
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
            Meal Plan
          </label>
          <Select
            value={formData.foodPlan}
            onChange={(e) => handleInputChange('foodPlan', e.target.value)}
          >
            {foodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {option.price > 0 && `(+LKR ${option.price.toLocaleString()}/night)`}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
          </label>
          <Textarea
            value={formData.specialRequests}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            rows={4}
            placeholder="Any special requests or requirements..."
          />
        </div>

        {/* Booking Summary */}
        {roomDetails && formData.checkIn && formData.checkOut && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Booking Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{roomDetails.title}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  LKR {roomDetails.pricePerNight?.toLocaleString()}/night
                </span>
              </div>

              {getSelectedFoodPlan() && getSelectedFoodPlan().price > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {getSelectedFoodPlan().label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    +LKR {getSelectedFoodPlan().price.toLocaleString()}/night
                  </span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-lg font-semibold text-gray-800">
                  <span>
                    Total ({calculateNights()} night{calculateNights() !== 1 ? 's' : ''})
                  </span>
                  <span>
                    LKR {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Booking
              </>
            )}
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}