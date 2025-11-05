import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';

const KitchenStaffGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is staff with kitchen department
  if (user.role !== 'staff' || user.department !== 'kitchen') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default KitchenStaffGuard;

