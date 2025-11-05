import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import FoodButton from './FoodButton';
import FoodSelect from './FoodSelect';
import FoodLabel from './FoodLabel';

const TakeawayTimePicker = ({ 
  selectedTime, 
  onTimeChange, 
  className = '',
  disabled = false 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate available time slots
  useEffect(() => {
    const slots = [];
    const now = new Date();
    
    // Generate slots for the next 4 hours
    for (let i = 0; i < 16; i++) {
      const slotTime = new Date(now.getTime() + (i * 15 * 60000)); // 15-minute intervals
      const minutes = slotTime.getMinutes();
      
      // Round to nearest 15 minutes
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      slotTime.setMinutes(roundedMinutes);
      
      const timeString = slotTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const minutesFromNow = Math.ceil((slotTime.getTime() - now.getTime()) / 60000);
      
      slots.push({
        value: minutesFromNow.toString(),
        label: `${timeString} (${minutesFromNow} min)`,
        time: slotTime,
        minutesFromNow,
        isAvailable: minutesFromNow >= 15, // Minimum 15 minutes
        isPopular: minutesFromNow >= 30 && minutesFromNow <= 60 // Popular slots
      });
    }
    
    setAvailableSlots(slots);
  }, [currentTime]);

  const getSlotStatus = (slot) => {
    if (slot.minutesFromNow < 15) {
      return {
        status: 'unavailable',
        message: 'Minimum 15 minutes required',
        color: 'text-red-500'
      };
    }
    
    if (slot.isPopular) {
      return {
        status: 'popular',
        message: 'Popular choice',
        color: 'text-green-600'
      };
    }
    
    return {
      status: 'available',
      message: 'Available',
      color: 'text-gray-600'
    };
  };

  const handleTimeChange = (value) => {
    onTimeChange(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#FF9933] rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">Select Pickup Time</h3>
        <p className="text-sm text-[#4A4A4A]/70">
          Choose when you'd like to pick up your order
        </p>
      </div>

      {/* Current time display */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-sm text-[#4A4A4A]/70 mb-1">Current Time</div>
        <div className="text-lg font-semibold text-[#4A4A4A]">
          {currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>

      {/* Time slot selection */}
      <div className="space-y-3">
        <FoodLabel htmlFor="pickup-time">Available Time Slots</FoodLabel>
        <FoodSelect
          id="pickup-time"
          value={selectedTime}
          onChange={(e) => handleTimeChange(e.target.value)}
          disabled={disabled}
          className="w-full"
        >
          <option value="">Select pickup time</option>
          {availableSlots.map((slot) => {
            const status = getSlotStatus(slot);
            return (
              <option
                key={slot.value}
                value={slot.value}
                disabled={!slot.isAvailable}
                className={status.color}
              >
                {slot.label} {status.message && `- ${status.message}`}
              </option>
            );
          })}
        </FoodSelect>
      </div>

      {/* Quick selection buttons */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-[#4A4A4A]">Quick Select</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: '15', label: '15 min', popular: false },
            { value: '30', label: '30 min', popular: true },
            { value: '45', label: '45 min', popular: false },
            { value: '60', label: '1 hour', popular: true }
          ].map((option) => (
            <FoodButton
              key={option.value}
              onClick={() => handleTimeChange(option.value)}
              disabled={disabled || !availableSlots.find(s => s.value === option.value)?.isAvailable}
              className={`text-xs py-2 ${
                selectedTime === option.value
                  ? 'bg-[#FF9933] hover:bg-[#CC7A29] text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } ${option.popular ? 'ring-2 ring-green-200' : ''}`}
            >
              {option.label}
              {option.popular && (
                <span className="ml-1 text-xs">⭐</span>
              )}
            </FoodButton>
          ))}
        </div>
      </div>

      {/* Selected time info */}
      {selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FF9933]/10 border border-[#FF9933]/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#FF9933]" />
            <div>
              <div className="font-medium text-[#4A4A4A]">
                Pickup scheduled for {availableSlots.find(s => s.value === selectedTime)?.label}
              </div>
              <div className="text-sm text-[#4A4A4A]/70">
                Your order will be ready for pickup at this time
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kitchen status */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Kitchen Status
            </h4>
            <p className="text-xs text-blue-700">
              Our kitchen is currently operating normally. 
              Peak hours (12:00-14:00, 19:00-21:00) may have longer preparation times.
            </p>
          </div>
        </div>
      </div>

      {/* Warning for very short times */}
      {selectedTime && parseInt(selectedTime) < 30 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                Short Preparation Time
              </h4>
              <p className="text-xs text-yellow-700">
                Please note that orders with less than 30 minutes preparation time 
                may have limited menu options or longer wait times.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TakeawayTimePicker;
