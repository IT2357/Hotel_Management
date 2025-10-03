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

  // Initialize auth state and hydrate full user (with role-specific profile)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const cachedUser = getLocalStorageUser();

    if (token) {
      (async () => {
        try {
          // Inline minimal hydration to avoid TDZ on checkAuth
          const res = await authService.getCurrentUser();
          const user = res.data.data.user;
          localStorage.setItem("user", JSON.stringify(user));
          setState(prev => ({ ...prev, user }));
        } catch (err) {
          // If token invalid, just clear local user silently here
          setState(prev => ({ ...prev, user: cachedUser || null }));
        } finally {
          setState(prev => ({ ...prev, loading: false }));
        }
      })();
    } else {
      setState(prev => ({ ...prev, user: cachedUser, loading: false }));
    }
  }, []);

  // const login = async (credentials) => {
  //   setState(prev => ({ ...prev, error: null }));
  
  //   try {
  //     const res = await authService.login(credentials);
  //     const { user, token } = res.data.data;
  
  //     // Store token and user data
  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(user));
  //     setState(prev => ({ ...prev, user, loading: false }));
      
  //     // Return the user object - let ProtectedRoute handle navigation
  //     return user;
  
  //   } catch (err) {
  //     // Handle backend error structure with cause property
  //     const backendError = err.response?.data;
  //     const requiresVerification = backendError?.requiresVerification;

  //     if (requiresVerification) {
  //       const userData = backendError?.data?.user || {
  //         _id: null,
  //         email: credentials.email
  //       };
  //       const basicUser = {
  //         _id: userData._id,
  //         email: userData.email,
  //         role: "guest",
  //         emailVerified: false
  //       };
  //       localStorage.setItem("user", JSON.stringify(basicUser));
  const login = async (credentials) => {
    setState(prev => ({ ...prev, error: null }));
    try {
      const res = await authService.login(credentials);
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      // Hydrate full user with role-specific profile to support permission checks
      await checkAuth();

      // Handle redirect after successful login
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || getDashboardPath(user.role);
      sessionStorage.removeItem('redirectAfterLogin'); // Clean up
      navigate(redirectPath);

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
  };


  const register = async (userData) => {
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
  };

  const verifyEmail = async (data) => {
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

  const updateUserPassword = async (userId, newPassword) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await authService.updateUserPassword(userId, newPassword);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setState(prev => ({ ...prev, user: null, loading: false }));
      debouncedNavigate("/login", { state: { message: "Password updated successfully. Please log in." }, replace: true });
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