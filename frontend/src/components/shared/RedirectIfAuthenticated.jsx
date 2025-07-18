import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import getDashboardPath from '../../utils/GetDashboardPath';

export default function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center py-10">Verifying session...</div>;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} state={{ from: location }} replace />;
  }

  return children;
}
