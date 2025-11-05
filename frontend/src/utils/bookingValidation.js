import { format, addDays, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';
import { formatCurrency } from './currencyUtils';

// Booking validation utility that uses settings
export const validateBookingDates = (checkIn, checkOut, settings = {}) => {
  const errors = [];
  
  const maxAdvanceBooking = settings.maxAdvanceBooking || 365;
  const minimumStay = settings.minimumStay || 1;
  const maximumStay = settings.maximumStay || 30;
  
  const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  const today = new Date();
  
  // Check if dates are valid
  if (!checkInDate || isNaN(checkInDate.getTime())) {
    errors.push('Please select a valid check-in date');
    return { isValid: false, errors };
  }
  
  if (!checkOutDate || isNaN(checkOutDate.getTime())) {
    errors.push('Please select a valid check-out date');
    return { isValid: false, errors };
  }
  
  // Check if check-in is not in the past
  if (isBefore(checkInDate, today)) {
    errors.push('Check-in date cannot be in the past');
  }
  
  // Check if check-out is after check-in
  if (!isAfter(checkOutDate, checkInDate)) {
    errors.push('Check-out date must be after check-in date');
  }
  
  // Check maximum advance booking
  const maxBookingDate = addDays(today, maxAdvanceBooking);
  if (isAfter(checkInDate, maxBookingDate)) {
    errors.push(`Bookings can only be made up to ${maxAdvanceBooking} days in advance`);
  }
  
  // Check stay duration
  const stayDuration = differenceInDays(checkOutDate, checkInDate);
  
  if (stayDuration < minimumStay) {
    errors.push(`Minimum stay is ${minimumStay} ${minimumStay === 1 ? 'night' : 'nights'}`);
  }
  
  if (stayDuration > maximumStay) {
    errors.push(`Maximum stay is ${maximumStay} nights`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    stayDuration
  };
};

export const validateGuestCount = (guestCount, settings = {}) => {
  const errors = [];
  const maxGuestsPerRoom = settings.maxGuestsPerRoom || 4;
  
  if (!guestCount || guestCount < 1) {
    errors.push('At least one guest is required');
  } else if (guestCount > maxGuestsPerRoom) {
    errors.push(`Maximum ${maxGuestsPerRoom} guests allowed per room`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateBookingTime = (time, type, settings = {}) => {
  const errors = [];
  const defaultCheckInTime = settings.defaultCheckInTime || '15:00';
  const defaultCheckOutTime = settings.defaultCheckOutTime || '11:00';
  
  if (type === 'checkin') {
    // You could add specific check-in time validation here
    // For now, we'll just ensure it's a valid time format
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      errors.push('Please enter a valid check-in time');
    }
  } else if (type === 'checkout') {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      errors.push('Please enter a valid check-out time');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    defaultTime: type === 'checkin' ? defaultCheckInTime : defaultCheckOutTime
  };
};

export const calculateBookingCost = (checkIn, checkOut, roomRate, settings = {}) => {
  const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  
  const nights = differenceInDays(checkOutDate, checkInDate);
  const subtotal = nights * roomRate;
  
  const taxRate = (settings.taxRate || 0) / 100;
  const serviceFeeRate = (settings.serviceFee || 0) / 100;
  
  const tax = subtotal * taxRate;
  const serviceFee = subtotal * serviceFeeRate;
  const total = subtotal + tax + serviceFee;
  
  const depositRequired = settings.depositRequired !== false;
  const depositAmount = settings.depositAmount || 100;
  const depositType = settings.depositType || 'fixed';
  
  let deposit = 0;
  if (depositRequired) {
    deposit = depositType === 'percentage' 
      ? (total * depositAmount / 100)
      : depositAmount;
  }
  
  return {
    nights,
    subtotal,
    tax,
    serviceFee,
    total,
    deposit,
    depositRequired,
    currency: settings.currency || 'LKR'
  };
};

export const getCancellationPolicy = (settings = {}) => {
  return settings.cancellationPolicy || '24 hours before check-in';
};

export default {
  validateBookingDates,
  validateGuestCount,
  validateBookingTime,
  calculateBookingCost,
  formatCurrency,
  getCancellationPolicy
};
