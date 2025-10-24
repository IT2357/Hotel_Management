import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const Calendar = ({ 
  selectedDate, 
  onDateSelect, 
  bookedDates = [], 
  minDate,
  maxDate,
  disabled = false,
  className = ""
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to check if a date is booked
  const isDateBooked = (date) => {
    if (!bookedDates.length) return false;
    
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

  // Helper function to check if date is disabled
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (checkDate < today) return true;
    
    // Check min/max date constraints
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (checkDate < min) return true;
    }
    
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0, 0, 0, 0);
      if (checkDate > max) return true;
    }
    
    return false;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Generate 42 days (6 weeks)
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const days = generateCalendarDays();

  const handleDateClick = (date) => {
    if (disabled) return;
    
    const isBooked = isDateBooked(date);
    const isDisabled = isDateDisabled(date);
    
    if (isBooked || isDisabled) return;
    
    onDateSelect(date.toISOString().split('T')[0]);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return selected.getTime() === check.getTime();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return today.getTime() === check.getTime();
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isBookedDate = isDateBooked(date);
          const isDisabledDate = isDateDisabled(date);
          const isSelectedDate = isSelected(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={disabled || isBookedDate || isDisabledDate}
              className={cn(
                "h-10 w-full text-sm rounded-lg transition-all duration-200 hover:bg-gray-100",
                {
                  // Selected date
                  "bg-blue-500 text-white hover:bg-blue-600": isSelectedDate,
                  
                  // Booked dates - red background
                  "bg-red-500 text-white cursor-not-allowed hover:bg-red-500": isBookedDate,
                  
                  // Disabled dates
                  "text-gray-300 cursor-not-allowed hover:bg-transparent": isDisabledDate && !isBookedDate,
                  
                  // Current month dates
                  "text-gray-900": isCurrentMonthDate && !isSelectedDate && !isBookedDate && !isDisabledDate,
                  
                  // Other month dates
                  "text-gray-400": !isCurrentMonthDate && !isSelectedDate && !isBookedDate,
                  
                  // Today's date
                  "ring-2 ring-blue-300": isTodayDate && !isSelectedDate && !isBookedDate,
                  
                  // Hover states
                  "hover:bg-blue-50": !isSelectedDate && !isBookedDate && !isDisabledDate && isCurrentMonthDate,
                }
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span className="text-gray-600">Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-300 rounded"></div>
          <span className="text-gray-600">Today</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;