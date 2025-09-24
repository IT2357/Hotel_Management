//src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api", // Fallback to /api for Vite proxy
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API Base URL:", api.defaults.baseURL);

// Attach token to every request
api.interceptors.request.use((config) => {
  console.log("Making request to:", config.url, "with baseURL:", config.baseURL);
  const token = localStorage.getItem("token");
  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("🔐 Unauthorized - token may be invalid or expired.");
      // Optional: redirect to login or trigger logout
    }
    return Promise.reject(err);
  }
);

export default api;
