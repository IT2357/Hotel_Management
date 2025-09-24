import React, { useState, useEffect } from 'react';
import useTitle from '../../hooks/useTitle';
import CheckInForm from '../../components/checkin/CheckInForm';
import CurrentGuestsList from '../../components/checkin/CurrentGuestsList';
import { getCurrentGuests, checkOutGuest } from '../../services/checkInOutService';
import { useSnackbar } from 'notistack';

export default function CheckInPage() {
  useTitle('Guest Check-In/Check-Out');
  
  const { enqueueSnackbar } = useSnackbar();
  const [currentGuests, setCurrentGuests] = useState([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(true);

  useEffect(() => {
    fetchCurrentGuests();
  }, []);

  const fetchCurrentGuests = async () => {
    try {
      setIsLoadingGuests(true);
      const response = await getCurrentGuests();
      setCurrentGuests(response.data);
    } catch (error) {
      console.error('Failed to fetch current guests:', error);
      setCurrentGuests([]);
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const handleCheckOut = async (checkInOutId) => {
    try {
      await checkOutGuest(checkInOutId);
      enqueueSnackbar('Guest checked out successfully', { variant: 'success' });
      fetchCurrentGuests(); // Refresh the list
    } catch (error) {
      console.error('Failed to check out guest:', error);
      enqueueSnackbar('Failed to check out guest', { variant: 'error' });
    }
  };

  const handleSelectBooking = (booking) => {
    // Implement booking selection logic
    console.log('Selected booking:', booking);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Guest Check-In/Check-Out</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">New Check-In</h2>
          <CheckInForm onSuccess={fetchCurrentGuests} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Guests</h2>
          <CurrentGuestsList 
            guests={currentGuests}
            isLoading={isLoadingGuests}
            onCheckOut={handleCheckOut}
            onSelectBooking={handleSelectBooking}
          />
        </div>
      </div>
    </div>
  );
}
