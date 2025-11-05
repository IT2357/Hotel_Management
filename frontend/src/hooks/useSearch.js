// 📁 frontend/src/hooks/useSearch.js
import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';

const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);
  const cacheRef = useRef({});

  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      console.log('❌ Search term too short:', searchTerm?.length || 0);
      setResults([]);
      return;
    }

    console.log('🔍 Performing search for:', searchTerm);

    // Check cache
    if (cacheRef.current[searchTerm]) {
      console.log('✅ Cache hit for:', searchTerm, 'Results:', cacheRef.current[searchTerm].length);
      setResults(cacheRef.current[searchTerm]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Making API calls for:', searchTerm);

      // Parallel API calls to all three endpoints
      const [usersRes, bookingsRes, roomsRes] = await Promise.allSettled([
        api.get('/admin/users', { params: { search: searchTerm, limit: 5 } }),
        api.get('/bookings/admin/all', { params: { search: searchTerm, limit: 5 } }),
        api.get('/rooms', { params: { search: searchTerm, limit: 5 } })
      ]);

      console.log('� API Responses:', {
        users: usersRes.status,
        bookings: bookingsRes.status,
        rooms: roomsRes.status
      });

      // Extract data safely
      let users = [];
      let bookings = [];
      let rooms = [];

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        users = usersRes.value.data.data?.users || usersRes.value.data.users || [];
        console.log('👤 Users found:', users.length);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.data) {
        bookings = bookingsRes.value.data.data?.bookings || bookingsRes.value.data.bookings || [];
        console.log('📅 Bookings found:', bookings.length);
      }

      if (roomsRes.status === 'fulfilled' && roomsRes.value?.data) {
        rooms = roomsRes.value.data.data || [];
        console.log('🏠 Rooms found:', rooms.length);
      }

      // Format and combine results
      const combinedResults = [
        ...users.map(user => ({
          type: 'user',
          id: user._id,
          title: user.name || 'Unknown',
          subtitle: user.email || '',
          icon: '👤',
          data: user,
          link: `/admin/users/${user._id}`
        })),
        ...bookings.map(booking => ({
          type: 'booking',
          id: booking._id,
          title: `Booking ${booking.bookingNumber || 'N/A'}`,
          subtitle: booking.userId?.name || 'N/A',
          icon: '📅',
          data: booking,
          link: `/admin/bookings/${booking._id}`
        })),
        ...rooms.map(room => ({
          type: 'room',
          id: room._id,
          title: room.title || `Room ${room.roomNumber || 'N/A'}`,
          subtitle: `Type: ${room.type || 'N/A'}`,
          icon: '🏠',
          data: room,
          link: `/admin/rooms/${room._id}`
        }))
      ];

      console.log('✨ Final combined results:', combinedResults.length);
      setResults(combinedResults);
      cacheRef.current[searchTerm] = combinedResults;
    } catch (err) {
      console.error('❌ Search error:', err);
      setError('Failed to perform search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback((searchTerm) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // Debounce for 300ms
  }, [performSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    performSearch
  };
};

export default useSearch;
