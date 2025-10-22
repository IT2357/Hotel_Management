// axios instance for API calls
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/food', // proxy to backend
  headers: {
    'Content-Type': 'application/json',
  },
});


// Fetch all categories
export const getCategories = async () => {
  const res = await api.get('/categories');
  return res.data.data;
};

export default api;
