import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import getDashboardPath from "../utils/GetDashboardPath";

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

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      const { user, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      navigate(getDashboardPath(user.role));
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

      const basicUser = { _id: userId, email, role: "guest" };
      localStorage.setItem("user", JSON.stringify(basicUser));
      setUser(basicUser);

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
      const verifiedUser = res.data.data.user;
      const token = res.data.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      setUser(verifiedUser);

      navigate(getDashboardPath(verifiedUser.role));
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
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.getCurrentUser();
      setUser(res.data.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.data.user));
    } catch (err) {
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
    if (token && token !== "undefined" && token !== "null") {
      checkAuth();
    } else {
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
