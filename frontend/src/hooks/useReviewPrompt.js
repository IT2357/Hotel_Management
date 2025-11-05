import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useReviewPrompt = () => {
  const [pendingReview, setPendingReview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const handleShowReview = (data) => {
      // data: { orderId, orderType, items, timestamp }
      console.log('Review prompt triggered:', data);
      setPendingReview(data);
      setShowModal(true);
      
      // Save to localStorage for reminder
      const pending = JSON.parse(localStorage.getItem('pendingReviews') || '[]');
      if (!pending.find(r => r.orderId === data.orderId)) {
        pending.push(data);
        localStorage.setItem('pendingReviews', JSON.stringify(pending));
      }
    };

    socket.on('showReview', handleShowReview);
    
    return () => {
      socket.off('showReview', handleShowReview);
      socket.disconnect();
    };
  }, []);

  const dismissReview = (orderId) => {
    setShowModal(false);
    setPendingReview(null);
    
    // Remove from pending
    const pending = JSON.parse(localStorage.getItem('pendingReviews') || '[]');
    localStorage.setItem('pendingReviews', 
      JSON.stringify(pending.filter(r => r.orderId !== orderId))
    );
  };

  const getPendingReviews = () => {
    return JSON.parse(localStorage.getItem('pendingReviews') || '[]');
  };

  return { 
    pendingReview, 
    showModal, 
    setShowModal, 
    dismissReview,
    getPendingReviews
  };
};

export default useReviewPrompt;

