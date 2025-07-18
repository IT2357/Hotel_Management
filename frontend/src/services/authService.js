import api from "./api";

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
