//src/services/api.js
import axios from "axios";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: "/api", // Use /api for Vite proxy
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API Base URL:", api.defaults.baseURL);

// Attach token to every request
api.interceptors.request.use((config) => {
  console.log("Making request to:", config.url, "with baseURL:", config.baseURL);
  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token);
  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization header set with token");
  } else {
    console.log("No valid token found");
  }
  
  // Handle FormData - remove Content-Type to let browser set it with boundary
  if (config.data instanceof FormData) {
    console.log("🔍 Detected FormData - removing Content-Type header");
    delete config.headers['Content-Type'];
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
