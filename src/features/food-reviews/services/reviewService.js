import axios from 'axios';

const API_URL = '/api/food-reviews';

// Submit a food review
const submitReview = async (reviewData) => {
  const res = await axios.post(`${API_URL}/submit`, reviewData);
  return res.data;
};

// Get review for a specific order
const getReviewByOrderId = async (orderId) => {
  const res = await axios.get(`${API_URL}/fetch/${orderId}`);
  return res.data;
};

// Get review analytics (admin only)
const getAnalytics = async () => {
  const res = await axios.get(`${API_URL}/analytics`);
  return res.data;
};

// Check if review exists for an order
const checkReviewExists = async (orderId) => {
  try {
    await getReviewByOrderId(orderId);
    return true;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return false;
    }
    throw err;
  }
};

export default {
  submitReview,
  getReviewByOrderId,
  getAnalytics,
  checkReviewExists
};