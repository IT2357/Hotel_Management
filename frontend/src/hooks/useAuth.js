// 📁 src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

export default function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw && raw !== "undefined" && raw !== "null"
        ? JSON.parse(raw)
        : null;
    } catch (err) {
      console.warn("Failed to parse user from localStorage:", err);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getDashboardPath = (role) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "manager":
        return "/manager/dashboard";
      case "staff":
        return "/staff/dashboard";
      case "guest":
        return "/guest/dashboard";
      default:
        return "/";
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      const { user, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      const redirectPath = getDashboardPath(user.role);
      navigate(redirectPath);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      const { userId, email } = res.data.data;

      const basicUser = { _id: userId, email, role: "guest" }; // Include role for consistency
      localStorage.setItem("user", JSON.stringify(basicUser));
      setUser(basicUser);
      console.log("Registered user stored:", basicUser); // Debugging

      navigate("/verify-email", {
        state: { email, userId },
      });
      return basicUser;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (data) => {
    try {
      const res = await authService.verifyEmail(data);
      const verifiedUser = res.data.data.user; // Adjust based on actual response structure
      const token = res.data.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      console.log("Verified user:", verifiedUser); // Debugging

      const redirectPath = getDashboardPath(verifiedUser.role);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || "Email verification failed");
      throw err;
    }
  };

  const resendOTP = async (data) => {
    try {
      await authService.resendOTP(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined") {
      console.warn("No valid token found. Skipping auth check.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.getCurrentUser();
      setUser(res.data.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.data.user));
    } catch (err) {
      console.error("Auth check failed:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        logout();
      } else {
        try {
          const raw = localStorage.getItem("user");
          if (raw && raw !== "undefined") {
            setUser(JSON.parse(raw));
          }
        } catch (e) {
          console.warn("Failed to restore user from localStorage:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    console.log("Initial token:", token, "Initial user:", storedUser);
    if (token && token !== "undefined" && token !== "null") {
      checkAuth();
    } else {
      console.log("No token yet — likely pre-verification");
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    resendOTP,
    checkAuth,
    isAuthenticated: !!user,
  };
}
