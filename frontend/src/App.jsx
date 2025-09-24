import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
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
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';

// Task Management pages
import ManagerTaskDashboard from './pages/manager/ManagerTaskDashboard.jsx';
import TestManagerDashboard from './pages/manager/TestManagerDashboard.jsx';
import AuthTest from './pages/manager/AuthTest.jsx';
import TestPage from './pages/manager/TestPage.jsx';
import ManagerDashboardTest from './pages/manager/ManagerDashboardTest.jsx';
import TaskListPage from './pages/manager/TaskListPage.jsx';
import CreateTaskPage from './pages/manager/CreateTaskPage.jsx';
import TaskAssignPage from './pages/manager/TaskAssignPage.jsx';
import FeedbackPage from './pages/manager/FeedbackPage.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import ManagerHomePage from './pages/manager/ManagerHomePage.jsx';
import ViewReportPage from './pages/manager/ViewReportPage.jsx';
import TestViewReportPage from './pages/manager/TestViewReportPage.jsx';
import SimpleViewReportPage from './pages/manager/SimpleViewReportPage.jsx';
import StaffTasks from './pages/staff/StaffTasks.jsx';
import AdminInvitationPage from './pages/admin/AdminInvitationPage.jsx';
import AdminNotificationPage from './pages/admin/NotificationManagementPage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminRefundManagementPage from './pages/admin/AdminRefundManagementPage.jsx';
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
import DefaultAdminLayout from './layout/admin/DefaultAdminLayout.jsx';

// import ManagerDashboardPage from './pages/ManagerDashboardPage.jsx';

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
            path="/invite"
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
              <ProtectedRoute roles={['admin']}>
                <AdminInvitationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminNotificationPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminBookingsPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminReportsPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminSettingsPage />
                  </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/refunds"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminRefundManagementPage />
              </ProtectedRoute>
            }
          />

          {/* 👨‍💼 Manager Routes */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute roles={['manager']}>
                <ManagerHomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute roles={['manager']}>
                <ManagerTaskDashboard />
              </ProtectedRoute>
            }
          />

          {/* 📊 Manager Reports Routes */}
          <Route
            path="/manager/reports/view"
            element={
              <ProtectedRoute roles={['manager']}>
                <ViewReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/reports/*"
            element={
              <ProtectedRoute roles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* 👨‍💼 Manager Task Management Routes */}
          <Route
            path="/manager/tasks/dashboard"
            element={
              <ProtectedRoute roles={['manager']}>
                <ManagerTaskDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/test"
            element={
              <ManagerDashboardTest />
            }
          />

          <Route
            path="/manager/tasks"
            element={
              <ProtectedRoute roles={['manager']}>
                <TaskListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/tasks/create"
            element={
              <ProtectedRoute roles={['manager']}>
                <CreateTaskPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/tasks/assign"
            element={
              <ProtectedRoute roles={['manager']}>
                <TaskAssignPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/tasks/feedback"
            element={
              <ProtectedRoute roles={['manager']}>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />

          {/* 👨‍🔧 Staff Task Routes */}
          <Route
            path="/staff/tasks"
            element={
              <ProtectedRoute roles={['staff']}>
                <StaffTasks />
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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
