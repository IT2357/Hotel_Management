import React from 'react';
import ServiceRequestForm from '../../../components/guestServices/ServiceRequestForm';
import useTitle from '../../../hooks/useTitle';
import useAuth from '../../../hooks/useAuth';

export default function GuestServiceRequestForm() {
  useTitle('Service Request');
  const { user, loading } = useAuth();
  
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Request Guest Services</h1>
        <ServiceRequestForm guest={user} />
      </div>
    </div>
  );
}
