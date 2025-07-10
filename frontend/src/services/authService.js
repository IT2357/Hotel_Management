// 📁 src/services/authService.js
import axios from "axios";

// Create reusable axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// (Optional) Global response interceptor for 401 errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized - invalid or expired token.");
      // Optionally trigger logout or redirect here
    }
    return Promise.reject(err);
  }
);

// Export all API methods
const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  register: (userData) => api.post("/auth/register", userData),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendOTP: (data) => api.post("/auth/resend-otp", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  getCurrentUser: () => api.get("/auth/me"),
  checkInvitation: (token) => api.get(`/auth/check-invitation?token=${token}`),
  registerWithInvite: (data) => api.post("/auth/register-with-invite", data),
};

export default authService;
