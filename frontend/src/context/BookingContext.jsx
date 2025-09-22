// 📁 frontend/src/context/BookingContext.jsx
import { createContext, useState, useCallback } from 'react';
import bookingService from '../services/bookingService.js';

export const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [state, setState] = useState({
    // Booking data
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,

    // Statistics
    stats: {
      totalBookings: 0,
      pendingApprovals: 0,
      confirmed: 0,
      totalRevenue: 0
    },

    // Filters
    filters: {
      page: 1,
      limit: 20,
      status: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    },

    // Pagination
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalBookings: 0
    }
  });

  // Fetch all bookings (admin)
  const fetchBookings = useCallback(async (filters = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await bookingService.getAllBookings(filters);
      if (response.success) {
        setState(prev => ({
          ...prev,
          bookings: response.data.bookings || [],
          pagination: response.data.pagination || prev.pagination,
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch bookings',
        loading: false
      }));
    }
  }, []);

  // Fetch booking statistics
  const fetchBookingStats = useCallback(async (period = '30') => {
    try {
      const response = await bookingService.getBookingStats(period);
      if (response.success) {
        setState(prev => ({
          ...prev,
          stats: response.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
    }
  }, []);

  // Update booking status
  const updateBookingStatus = useCallback(async (bookingId, status, data = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await bookingService.updateBookingStatus(bookingId, status, data);
      if (response.success) {
        // Refresh bookings and stats
        await fetchBookings(state.filters);
        await fetchBookingStats();
        return response.data;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update booking status',
        loading: false
      }));
      throw error;
    }
  }, [fetchBookings, fetchBookingStats, state.filters]);

  // Get user bookings
  const getUserBookings = useCallback(async (filters = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await bookingService.getUserBookings(filters);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch user bookings',
        loading: false
      }));
      throw error;
    }
  }, []);

  // Create new booking
  const createBooking = useCallback(async (bookingData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await bookingService.createBooking(bookingData);
      if (response.success) {
        setState(prev => ({
          ...prev,
          currentBooking: response.data,
          loading: false
        }));
        // Refresh stats after creating booking
        await fetchBookingStats();
        return response.data;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to create booking',
        loading: false
      }));
      throw error;
    }
  }, [fetchBookingStats]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId, reason = '') => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await bookingService.cancelBooking(bookingId, reason);
      if (response.success) {
        // Refresh bookings and stats
        await fetchBookings(state.filters);
        await fetchBookingStats();
        return response.data;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to cancel booking',
        loading: false
      }));
      throw error;
    }
  }, [fetchBookings, fetchBookingStats, state.filters]);

  // Get booking details
  const getBookingDetails = useCallback(async (bookingId) => {
    try {
      const response = await bookingService.getBookingDetails(bookingId);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      throw error;
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set current booking
  const setCurrentBooking = useCallback((booking) => {
    setState(prev => ({ ...prev, currentBooking: booking }));
  }, []);

  const value = {
    // State
    ...state,

    // Actions
    fetchBookings,
    fetchBookingStats,
    updateBookingStatus,
    getUserBookings,
    createBooking,
    cancelBooking,
    getBookingDetails,
    updateFilters,
    clearError,
    setCurrentBooking
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}