import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useBookingSettings, useFinancialSettings } from '../../hooks/useSettings';
import { 
  validateBookingDates, 
  validateGuestCount, 
  calculateBookingCost, 
  formatCurrency,
  getCancellationPolicy 
} from '../../utils/bookingValidation';
import Input from '../ui/input';
import { Button } from '../ui/Button';
import Card from '../ui/card';

const EnhancedBookingForm = ({ roomId, roomRate = 100, onSubmit }) => {
  const bookingSettings = useBookingSettings();
  const financialSettings = useFinancialSettings();
  
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  });
  
  const [errors, setErrors] = useState({});
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set default dates based on settings
  useEffect(() => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);
    
    setFormData(prev => ({
      ...prev,
      checkIn: format(tomorrow, 'yyyy-MM-dd'),
      checkOut: format(dayAfter, 'yyyy-MM-dd')
    }));
  }, []);

  // Calculate cost whenever dates or guests change
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      try {
        const cost = calculateBookingCost(
          formData.checkIn, 
          formData.checkOut, 
          roomRate, 
          financialSettings
        );
        setCostBreakdown(cost);
      } catch (error) {
        setCostBreakdown(null);
      }
    }
  }, [formData.checkIn, formData.checkOut, roomRate, financialSettings]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate dates
    const dateValidation = validateBookingDates(
      formData.checkIn, 
      formData.checkOut, 
      bookingSettings
    );
    if (!dateValidation.isValid) {
      newErrors.dates = dateValidation.errors;
    }
    
    // Validate guest count
    const guestValidation = validateGuestCount(formData.guests, bookingSettings);
    if (!guestValidation.isValid) {
      newErrors.guests = guestValidation.errors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const bookingData = {
        ...formData,
        roomId,
        costBreakdown,
        settings: {
          cancellationPolicy: getCancellationPolicy(bookingSettings),
          checkInTime: bookingSettings.defaultCheckInTime,
          checkOutTime: bookingSettings.defaultCheckOutTime
        }
      };
      
      await onSubmit(bookingData);
    } catch (error) {
      console.error('Booking submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Book Your Stay</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date
            </label>
            <Input
              type="date"
              value={formData.checkIn}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              max={format(addDays(new Date(), bookingSettings.maxAdvanceBooking), 'yyyy-MM-dd')}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date
            </label>
            <Input
              type="date"
              value={formData.checkOut}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              min={formData.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              className="w-full"
            />
          </div>
        </div>

        {/* Date Errors */}
        {errors.dates && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            {errors.dates.map((error, index) => (
              <p key={index} className="text-sm text-red-600">{error}</p>
            ))}
          </div>
        )}

        {/* Guest Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests (Max: {bookingSettings.maxGuestsPerRoom})
          </label>
          <Input
            type="number"
            min="1"
            max={bookingSettings.maxGuestsPerRoom}
            value={formData.guests}
            onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
            className="w-full"
          />
          {errors.guests && (
            <div className="mt-1">
              {errors.guests.map((error, index) => (
                <p key={index} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Any special requests or requirements..."
          />
        </div>

        {/* Cost Breakdown */}
        {costBreakdown && (
          <Card className="bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{costBreakdown.nights} night{costBreakdown.nights !== 1 ? 's' : ''} × {formatCurrency(roomRate, costBreakdown.currency)}</span>
                <span>{formatCurrency(costBreakdown.subtotal, costBreakdown.currency)}</span>
              </div>
              
              {costBreakdown.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({financialSettings.taxRate}%)</span>
                  <span>{formatCurrency(costBreakdown.tax, costBreakdown.currency)}</span>
                </div>
              )}
              
              {costBreakdown.serviceFee > 0 && (
                <div className="flex justify-between">
                  <span>Service Fee ({financialSettings.serviceFee}%)</span>
                  <span>{formatCurrency(costBreakdown.serviceFee, costBreakdown.currency)}</span>
                </div>
              )}
              
              <hr className="my-2" />
              
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(costBreakdown.total, costBreakdown.currency)}</span>
              </div>
              
              {costBreakdown.depositRequired && (
                <div className="flex justify-between text-indigo-600">
                  <span>Deposit Required</span>
                  <span>{formatCurrency(costBreakdown.deposit, costBreakdown.currency)}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Booking Policies */}
        <Card className="bg-blue-50 p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Booking Policies</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Check-in: {bookingSettings.defaultCheckInTime}</p>
            <p>• Check-out: {bookingSettings.defaultCheckOutTime}</p>
            <p>• Cancellation: {getCancellationPolicy(bookingSettings)}</p>
            {!bookingSettings.allowGuestBooking && (
              <p>• Registration required for booking</p>
            )}
            {bookingSettings.requireApproval && (
              <p>• Booking subject to admin approval</p>
            )}
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !costBreakdown}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? 'Processing...' : `Book Now - ${costBreakdown ? formatCurrency(costBreakdown.total, costBreakdown.currency) : 'Calculate Cost'}`}
        </Button>
      </form>
    </Card>
  );
};

export default EnhancedBookingForm;
