import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
import { ProtectedRoute, RedirectIfAuthenticated } from './components/shared/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import InviteRegisterPage from './pages/auth/InviteRegisterPage.jsx';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LogoutHandler from './pages/auth/LogoutHandler.jsx';
import UnauthorizedPage from './pages/auth/UnauthorizedPage.jsx';
import NotFoundPage from './pages/auth/NotFoundPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx'; // Import the new ProfilePage
import GuestDashboardPage from './pages/guest/GuestDashboardPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MyBookings from './pages/guest/MyBookings.jsx';
import MyReviews from './pages/guest/MyReviews.jsx';
import FavoriteRooms from './pages/guest/FavoriteRooms.jsx';
import GuestBookingFlow from './pages/guest/GuestBookingFlow.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminInvitationPage from './pages/admin/AdminInvitationPage.jsx';
import AdminNotificationPage from './pages/admin/NotificationManagementPage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminInvoicesPage from './pages/admin/AdminInvoicesPage.jsx';
import AdminRefundManagementPage from './pages/admin/AdminRefundManagementPage.jsx';
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
import DefaultAdminLayout from './layout/admin/DefaultAdminLayout.jsx';
// import ManagerDashboardPage from './pages/ManagerDashboardPage.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <BookingProvider>
            <Routes>
          {/* 🔒 Booking Routes */}
          <Route path="/booking" element={<GuestBookingFlow />} />
          <Route path="/booking/guest" element={<GuestBookingFlow />} />
          <Route path="/rooms" element={<RoomsPage />} />
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
                <OTPVerificationPage />
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
            path="/accept-invitation"
            element={
              <RedirectIfAuthenticated>
                <InviteRegisterPage />
              </RedirectIfAuthenticated>
            }
          />

          {/* 🔐 Protected Routes */}
          <Route
            path="/guest/dashboard"
            element={
              <ProtectedRoute roles={['guest']}>
                <GuestDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guest/my-bookings"
            element={
              <ProtectedRoute roles={['guest']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guest/my-reviews"
            element={
              <ProtectedRoute roles={['guest']}>
                <MyReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guest/favorites"
            element={
              <ProtectedRoute roles={['guest']}>
                <FavoriteRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
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
                <DefaultAdminLayout>
                  <AdminDashboardPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/invitations"
            element={
              <ProtectedRoute roles={['admin']} permissions={["invitations:read"]}>
                <AdminInvitationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={['admin']} permissions={["notification:read"]}>
                  <AdminNotificationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']} permissions={["users:read"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute roles={['admin']} permissions={["bookings:read"]}>
                <DefaultAdminLayout>
                  <AdminBookingsPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/invoices"
            element={
              <ProtectedRoute roles={['admin']} permissions={["invoices:read"]}>
                <DefaultAdminLayout>
                  <AdminInvoicesPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['admin']} permissions={["reports:read"]}>
                <DefaultAdminLayout>
                  <AdminReportsPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['admin']} permissions={["settings:read"]}>
                <DefaultAdminLayout>
                  <AdminSettingsPage />
                  </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/refunds"
            element={
              <ProtectedRoute roles={['admin']} permissions={["refunds:read"]}>
                <AdminRefundManagementPage />
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

          */}

          {/* 🚧 Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BookingProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
