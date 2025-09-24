import React, { useEffect } from 'react';
import ServiceRequestManagement from '../../components/guestServices/ServiceRequestManagement'; // Fixed import path

const ServiceRequestManagementPage = () => {
  useEffect(() => {
    document.title = 'Service Requests | Hotel Management';
    return () => {
      document.title = 'Hotel Management';
    };
  }, []);

  return <ServiceRequestManagement />;
};

export default ServiceRequestManagementPage;