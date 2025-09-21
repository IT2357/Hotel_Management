import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import getDashboardPath from "../utils/GetDashboardPath";

export const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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

  const login = useCallback(async (credentials) => {
    setState(prev => ({ ...prev, error: null }));
    try {
      const res = await authService.login(credentials);
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({ ...prev, user, loading: false }));
      navigate("/");
      return user;
    } catch (err) {
      console.error('AuthContext login error:', {
        message: err.message,
        response: err.response?.data,
        redirectTo: err.response?.data?.redirectTo,
        userData: err.response?.data?.data?.user,
      });
      const error = err.response?.data?.message || err.message || 'Login failed';
      if (err.response?.data?.requiresVerification) {
        const userData = err.response?.data?.data?.user || {
          _id: null,
          email: credentials.email,
        };
        const basicUser = {
          _id: userData._id,
          email: userData.email,
          role: 'guest',
          emailVerified: false,
        };
        localStorage.setItem('user', JSON.stringify(basicUser));
        setState(prev => ({ ...prev,
          user: basicUser,
          loading: false,
        }));
        navigate('/verify-email', {
          state: { email: basicUser.email, userId: basicUser._id },
          replace: true,
        });
        return basicUser;
      }
      if (err.response?.data?.redirectTo === '/reset-password') {
        navigate('/reset-password', {
          state: {
            email: err.response?.data?.data?.user?.email,
            userId: err.response?.data?.data?.user?._id,
          },
          replace: true,
        });
        throw new Error('Password change required');
      }
      setState(prev => ({ ...prev, error, loading: false }));
      throw new Error(error);
    }
  }, [navigate]);

  const register = useCallback(async (userData) => {
    setState(prev => ({ ...prev, error: null }));

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
      throw err; // Throw original error object
    }
  }, [navigate]);

  const verifyEmail = useCallback(async (data) => {
    try {
      const res = await authService.verifyEmail(data);
      const { user: verifiedUser, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(verifiedUser));

      setState(prev => ({ ...prev, user: verifiedUser, error: null }));
      await checkAuth();
      navigate(getDashboardPath(verifiedUser.role));
    } catch (err) {
      const error = err.response?.data?.message || "Email verification failed";
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  }, [navigate]);

  const resendOTP = async (data) => {
    try {
      await authService.resendOTP(data);
    } catch (err) {
      const error = err.response?.data?.message || "Failed to resend OTP";
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await authService.updateUserPassword(userId, newPassword);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setState(prev => ({ ...prev, user: null, loading: false }));
      navigate("/login", { state: { message: "Password updated successfully. Please log in." }, replace: true });
      return res;
    } catch (err) {
      const error = err.response?.data?.message || "Failed to update password";
      setState(prev => ({ ...prev, loading: false, error }));
      throw err;
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
    isAuthenticated: !!state.user && state.user.emailVerified && state.user.isActive && !state.user.passwordResetPending,
    login,
    register,
    verifyEmail,
    resendOTP,
    logout,
    checkAuth,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
