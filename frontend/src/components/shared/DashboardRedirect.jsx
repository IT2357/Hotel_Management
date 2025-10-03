import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import getDashboardPath from '../../utils/GetDashboardPath';

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const path = getDashboardPath(user.role);
      navigate(path, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default DashboardRedirect;