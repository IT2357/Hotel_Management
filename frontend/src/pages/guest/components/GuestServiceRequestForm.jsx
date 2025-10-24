import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import ServiceRequestForm from '../../../components/guestServices/ServiceRequestForm';
import useTitle from '../../../hooks/useTitle';
import useAuth from '../../../hooks/useAuth';

export default function GuestServiceRequestForm() {
  useTitle('Service Request');
  const { user, loading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) { setFetching(false); return; }
      try {
        setFetching(true);
        const res = await axios.get('/api/check-in-out/guest/status', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true
        });
        setCheckInStatus(res.data);
      } catch (err) {
        if (err?.response?.status !== 404) {
          enqueueSnackbar('Failed to load check-in status', { variant: 'error' });
        }
        setCheckInStatus(null);
      } finally {
        setFetching(false);
      }
    };
    fetchStatus();
  }, [user, enqueueSnackbar]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
            <p>Please log in to submit service requests.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (fetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
          <div className="text-center">Loading your stay details...</div>
        </div>
      </div>
    );
  }

  // Only allow submitting requests when guest is checked in
  if (!checkInStatus || checkInStatus.status !== 'checked_in') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Service Requests Unavailable</h1>
            <p className="text-gray-600">You can request services only during an active stay. Please check in to your reserved room first.</p>
            <div className="mt-6">
              <a href="/guest/check-in-out" className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Go to Check-in</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Request Guest Services</h1>
        <ServiceRequestForm guest={user} room={checkInStatus?.room} />
      </div>
    </div>
  );
}
