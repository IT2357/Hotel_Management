import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import getDashboardPath from "../utils/GetDashboardPath";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null
  });

  const navigate = useNavigate();

  // Safe localStorage access
  const getLocalStorageUser = () => {
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
  };

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = getLocalStorageUser();
    
    if (token && user) {
      setState(prev => ({ ...prev, user, loading: false }));
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (credentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const res = await authService.login(credentials);
      const { user, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      setState(prev => ({ ...prev, user, loading: false }));
      navigate(getDashboardPath(user.role));
      
      return user;
    } catch (err) {
      const error = err.response?.data?.message || "Login failed";
      setState(prev => ({ ...prev, error, loading: false }));
      throw error;
    }
  };

  const register = async (userData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const res = await authService.register(userData);
      const { userId, email } = res.data.data;
      const basicUser = { _id: userId, email, role: "guest" };

      localStorage.setItem("user", JSON.stringify(basicUser));
      setState(prev => ({ ...prev, user: basicUser, loading: false }));
      
      navigate("/verify-email", { state: { email, userId } });
      return basicUser;
    } catch (err) {
      const error = err.response?.data?.message || "Registration failed";
      setState(prev => ({ ...prev, error, loading: false }));
      throw error;
    }
  };

  const verifyEmail = async (data) => {
    try {
      const res = await authService.verifyEmail(data);
      const { user: verifiedUser, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      
      setState(prev => ({ ...prev, user: verifiedUser, error: null }));
      navigate(getDashboardPath(verifiedUser.role));
    } catch (err) {
      const error = err.response?.data?.message || "Email verification failed";
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const resendOTP = async (data) => {
    try {
      await authService.resendOTP(data);
    } catch (err) {
      const error = err.response?.data?.message || "Failed to resend OTP";
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setState(prev => ({ ...prev, user: null }));
    navigate("/login", { replace: true });
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined") {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await authService.getCurrentUser();
      const user = res.data.data.user;
      
      localStorage.setItem("user", JSON.stringify(user));
      setState(prev => ({ ...prev, user, loading: false }));
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      } else {
        const user = getLocalStorageUser();
        if (user) {
          setState(prev => ({ ...prev, user, loading: false }));
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    }
  }, [logout]);

  // Provide the auth state and methods
  const value = {
    ...state,
    isAuthenticated: !!state.user,
    login,
    register,
    verifyEmail,
    resendOTP,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}