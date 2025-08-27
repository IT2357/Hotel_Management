// frontend/src/components/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import getDashboardPath from '../../utils/GetDashboardPath';

export function ProtectedRoute({ children, roles = [], permissions = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/verify-email', '/reset-password'];

  // Wait for auth check to complete
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-gray-700">Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access a protected route
  if (!user) {
    // Allow access to public routes
    if (publicRoutes.includes(location.pathname)) {
      return children;
    }
    // Redirect to login for protected routes
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  console.log("ProtectedRoute user:", user);
  // If user exists, check their status
  // Password reset pending - redirect to reset password
  if (user.passwordResetPending && location.pathname !== '/reset-password') {
    return (
      <Navigate
        to="/reset-password"
        state={{ from: location, email: user.email, userId: user._id }}
        replace
      />
    );
  }

  // Email not verified - redirect to verify email
  if (!user.emailVerified && location.pathname !== '/verify-email') {
    return (
      <Navigate
        to="/verify-email"
        state={{ from: location, email: user.email, userId: user._id }}
        replace
      />
    );
  }

  // Account not active - show error
  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Account Deactivated</h2>
          <p className="text-gray-700">
            Your account has been deactivated. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Pending approval for non-guest roles
  if (user.role !== "guest" && !user.isApproved && location.pathname !== '/pending-approval') {
    return (
      <Navigate
        to="/pending-approval"
        state={{ from: location }}
        replace
      />
    );
  }

  // Role-based access control
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission-based access control
  if (permissions.length) {
    const userPerms = user.permissions || [];
    const hasAll = permissions.every((p) => userPerms.includes(p));
    if (!hasAll) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If all checks pass, render the children
  return children;
}

export function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-gray-700">Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Only redirect if user is authenticated and email is verified
  if (user && user.emailVerified && user.isActive) {
    // Don't redirect if already on the dashboard
    const dashboardPath = getDashboardPath(user.role);
    if (location.pathname !== dashboardPath) {
      return <Navigate to={dashboardPath} state={{ from: location }} replace />;
    }
  }

  return children;
}