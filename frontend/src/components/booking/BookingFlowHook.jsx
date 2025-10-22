import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import IntegratedBookingFlow from './IntegratedBookingFlow';

// Hook to handle booking navigation and state
export const useBookingFlow = () => {
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [initialBookingData, setInitialBookingData] = useState({});
  const [initialStep, setInitialStep] = useState(3);

  const openBookingFlow = (room, bookingData = {}, step = 3) => {
    setSelectedRoom(room);
    setInitialBookingData(bookingData);
    setInitialStep(step);
    setIsBookingFlowOpen(true);
  };

  const closeBookingFlow = () => {
    setIsBookingFlowOpen(false);
    setSelectedRoom(null);
    setInitialBookingData({});
    setInitialStep(3);
  };

  const BookingFlowModal = () => (
    <IntegratedBookingFlow
      isOpen={isBookingFlowOpen}
      onClose={closeBookingFlow}
      room={selectedRoom}
      initialStep={initialStep}
      initialBookingData={initialBookingData}
    />
  );

  return {
    openBookingFlow,
    closeBookingFlow,
    BookingFlowModal,
    isBookingFlowOpen
  };
};

// Higher Order Component to wrap components that need booking functionality
export const withBookingFlow = (WrappedComponent) => {
  return (props) => {
    const bookingFlow = useBookingFlow();
    
    return (
      <>
        <WrappedComponent {...props} {...bookingFlow} />
        <bookingFlow.BookingFlowModal />
      </>
    );
  };
};

export default IntegratedBookingFlow;