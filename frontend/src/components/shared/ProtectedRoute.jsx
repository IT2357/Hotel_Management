import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function ProtectedRoute({ children, roles = [], permissions = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

  // 🧪 Debug Logs
  console.log("🔒 ProtectedRoute");
  console.log("  📍 Path:", location.pathname);
  console.log("  🙋‍♂️ User:", user);
  console.log("  🚦 Loading:", loading);
  console.log("  🎯 Required roles:", roles);
  console.log("  🔑 Required permissions:", permissions);
  if (user) {
    console.log("  🧑‍💼 User role:", user.role);
    console.log("  🎟 User permissions:", user.permissions || []);
  }

  // 🕐 Wait for checkAuth() to complete
  if (loading) {
    console.log("⏳ Still loading auth state...");
    return <div className="text-center py-10">Verifying session...</div>;
  }

  // ❌ If still no user after loading, redirect to login (unless it's public)
  if (!user) {
    console.warn("❗ No authenticated user. Redirecting to login...");
    if (publicRoutes.includes(location.pathname)) {
      return children;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🧑‍⚖️ Role check
  if (roles.length && !roles.includes(user.role)) {
    console.warn(`❗ User role "${user.role}" not allowed. Redirecting to /unauthorized`);
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, requiredRoles: roles }}
        replace
      />
    );
  }

  // 🔑 Permission check
  if (permissions.length) {
    const userPerms = user.permissions || [];
    const hasAll = permissions.every((p) => userPerms.includes(p));
    if (!hasAll) {
      console.warn("❗ Missing required permissions. Redirecting to /unauthorized");
      return (
        <Navigate
          to="/unauthorized"
          state={{ from: location, requiredPermissions: permissions }}
          replace
        />
      );
    }
  }

  console.log("✅ Access granted. Rendering protected content.");
  return children;
}
