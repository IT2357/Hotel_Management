import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import getDashboardPath from '../../utils/GetDashboardPath';

export default function RedirectIfAuthenticated({ children }) {
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

  if (user && user.emailVerified) {
    return <Navigate to={getDashboardPath(user.role)} state={{ from: location }} replace />;
  }

  return children;
}
