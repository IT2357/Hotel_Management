//src/pages/auth/UnauthorizedPage.jsx

import { useLocation, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function UnauthorizedPage() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-yellow-700">Access Denied</h1>
        <p className="text-gray-700">
          You don’t have permission to access: <code className="font-mono text-sm">{location.pathname}</code>
        </p>

        {!user ? (
          <p>
            Please <Link to="/login" className="text-indigo-600 underline">sign in</Link> first to continue.
          </p>
        ) : (
          <p>
            Your role <strong>({user.role})</strong> doesn’t have sufficient privileges.
            {user.role === 'admin' && location.state?.requiredPermissions?.length > 0 && (
              <span> Missing permissions: <code className="font-mono">{location.state.requiredPermissions.join(', ')}</code></span>
            )}
          </p>
        )}

        <Link
          to="/"
          className="inline-block mt-4 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
