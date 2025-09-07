import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/shared/ProtectedRoute.jsx';
import RedirectIfAuthenticated from './components/shared/RedirectIfAuthenticated.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import InviteRegisterPage from './pages/auth/InviteRegisterPage.jsx';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';
import ForgotPasswordPage from './pages//auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import LogoutHandler from "./pages/auth/LogoutHandler.jsx";
import UnauthorizedPage from './pages/auth/UnauthorizedPage.jsx';
import NotFoundPage from './pages/auth/NotFoundPage.jsx';
import GuestDashboardPage from './pages/guest/GuestDashboardPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminInvitationPage from './pages/admin/AdminInvitationPage.jsx';
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
// import ManagerDashboardPage from './pages/ManagerDashboardPage.jsx';
// import UserManagementPage from './pages/UserManagementPage.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 🔒 Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                <RegisterPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/verify-email"
            element={
              <RedirectIfAuthenticated>
                <OTPVerificationPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectIfAuthenticated>
                <ForgotPasswordPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/reset-password"
            element={
              <RedirectIfAuthenticated>
                <ResetPasswordPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/invite"
            element={
              <RedirectIfAuthenticated>
                <InviteRegisterPage />
              </RedirectIfAuthenticated>
            }
          />


          {/* 🔐 Protected Routes */}            
          <Route path="/guest/dashboard" element={
              // <ProtectedRoute roles={['guest']}>
                <GuestDashboardPage />
              // </ProtectedRoute>
            }
          />

          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles={['staff']}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 🏢 Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/invitations" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminInvitationPage />
                </ProtectedRoute>
              } 
            />

          <Route
            path="/logout"
            element={
              <ProtectedRoute>
                <LogoutHandler />
              </ProtectedRoute>
            }
          />

          {/*
          // 🎯 Role-Specific Routes
          <Route element={<ProtectedRoute roles={['staff', 'manager', 'admin']} />}>
            <Route path="/staff-portal" element={<StaffPortalPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['manager', 'admin']} />}>
            <Route path="/manager-dashboard" element={<ManagerDashboardPage />} />
          </Route>

          // 🛡️ Admin-Specific Routes
          <Route 
            element={
              <ProtectedRoute 
                roles={['admin']} 
                permissions={['manage-users']} 
              />
            }
          >
            <Route path="/admin/users" element={<UserManagementPage />} />
          </Route>

          
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageUsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bookings" 
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageBookingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/rooms" 
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageRoomsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute roles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            } 
          />

          */}

          {/* 🚧 Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
