//src/pages/auth/LogoutHandler.jsx

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function LogoutHandler() {
  const { logout } = useAuth();

  useEffect(() => {
    logout(); // Trigger logout immediately on mount
  }, [logout]);

  return <Navigate to="/login" replace />;
}

