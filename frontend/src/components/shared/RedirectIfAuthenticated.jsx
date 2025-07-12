// 📁 src/components/shared/RedirectIfAuthenticated.jsx
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'guest':
        return '/guest/dashboard';
      default:
        return '/';
    }
  };

  if (loading) {
    return <div className="text-center py-10">Verifying session...</div>;
  }

  if (user) {
    const redirectPath = getDashboardPath(user.role);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
}
