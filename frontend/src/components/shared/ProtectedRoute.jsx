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

  //If user is not authenticated and trying to access a protected route
  if (!user) {
    if (publicRoutes.includes(location.pathname)) {
      console.log('Allowing access to public route:', location.pathname);
      return children;
    }
    console.log('Redirecting to /login', { from: location.pathname });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute user:', {
    userId: user._id,
    email: user.email,
    role: user.role,
    passwordResetPending: user.passwordResetPending,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    pathname: location.pathname,
  });

  // Password reset pending - redirect to reset password
  if (user.passwordResetPending && location.pathname !== '/reset-password') {
    console.log('Redirecting to /reset-password', { userId: user._id, email: user.email });
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
    console.log('Redirecting to /verify-email', { userId: user._id, email: user.email });
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
    console.log('Account deactivated', { userId: user._id, email: user.email });
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
    console.log('Redirecting to /pending-approval', { userId: user._id, role: user.role });
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
    console.log('Unauthorized role', { userRole: user.role, requiredRoles: roles });
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission-based access control
  if (permissions.length) {
    const userPerms = user.permissions || [];
    const hasAll = permissions.every((p) => userPerms.includes(p));
    if (!hasAll) {
      console.log('Insufficient permissions', { userPerms, requiredPerms: permissions });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If all checks pass, render the children
  console.log('Allowing access to protected route:', location.pathname);
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

  // Only redirect if user is authenticated, email is verified, active, and no password reset pending
  if (user && user.emailVerified && user.isActive && !user.passwordResetPending) {
    const dashboardPath = getDashboardPath(user.role);
    // Don't redirect to dashboard if user is already on home page or other public pages
    const publicRoutesAfterLogin = ['/', '/about', '/menu', '/gallery', '/reservations', '/blog', '/contact'];

    if (!publicRoutesAfterLogin.includes(location.pathname) && location.pathname !== dashboardPath) {
      console.log('Redirecting authenticated user to dashboard', {
        userId: user._id,
        dashboardPath,
        pathname: location.pathname,
      });
      return <Navigate to={dashboardPath} state={{ from: location }} replace />;
    }
  }

  console.log('Allowing access to non-authenticated route:', location.pathname);
  return children;
}