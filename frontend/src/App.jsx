import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
import { ProtectedRoute, RedirectIfAuthenticated } from './components/shared/ProtectedRoute.jsx';
import { SnackbarProvider } from 'notistack';
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
import GuestCheckInOutPage from './pages/guest/GuestCheckInOutPage.jsx';
import GuestBookingFlow from './pages/guest/GuestBookingFlow.jsx';
import RoomsPage from './pages/guest/RoomsPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MyBookings from './pages/guest/MyBookings.jsx';
import MyReviews from './pages/guest/MyReviews.jsx';
import FavoriteRooms from './pages/guest/FavoriteRooms.jsx';
import GuestServiceRequestsPage from './pages/guest/GuestServiceRequestsPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';

// Task Management pages
import ManagerTaskDashboard from './pages/manager/ManagerTaskDashboard.jsx';
import TestManagerDashboard from './pages/manager/TestManagerDashboard.jsx';
import AuthTest from './pages/manager/AuthTest.jsx';
import TestPage from './pages/manager/TestPage.jsx';
import ManagerDashboardTest from './pages/manager/ManagerDashboardTest.jsx';
import TaskListPage from './pages/manager/TaskListPage.jsx';
import CreateTaskPage from './pages/manager/CreateTaskPage.jsx';
import TaskAssignmentPage from './pages/manager/TaskAssignmentPage.jsx';
import FeedbackPage from './pages/manager/FeedbackPage.jsx';
import StaffWorkloadPage from './pages/manager/StaffWorkloadPage.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import ManagerHomePage from './pages/manager/ManagerHomePage.jsx';
import ViewReportPage from './pages/manager/ViewReportPage.jsx';
import TestViewReportPage from './pages/manager/TestViewReportPage.jsx';
import SimpleViewReportPage from './pages/manager/SimpleViewReportPage.jsx';
import TaskManagementDashboard from './pages/manager/TaskManagementDashboard.jsx';
import StaffTasks from './pages/staff/StaffTasks.jsx';
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
import DefaultManagerLayout from './layout/manager/DefaultManagerLayout.jsx';

// import ManagerDashboardPage from './pages/ManagerDashboardPage.jsx';
import CheckInPage from './pages/guest/CheckInPage.jsx';
import GuestServiceRequestForm from './pages/guest/components/GuestServiceRequestForm.jsx';
import ServiceRequestManagementPage from './pages/staff/ServiceRequestManagementPage.jsx';
import TaskManagementPage from './pages/staff/TaskManagementPage.jsx';
import RoomStatusPage from './pages/staff/RoomStatusPage.jsx';
import KeyCardManagementPage from './pages/staff/KeyCardManagementPage.jsx';
import SchedulePage from './pages/staff/SchedulePage.jsx';
import Roomspage from './pages/admin/AdminRoomsPage.jsx';
import AdminAddRoom from './pages/admin/AdminAddRooms.jsx';
import AdminEditRoom from './pages/admin/AdminEditRoomsPage.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <SnackbarProvider maxSnack={3}>
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
            path="/guest/my-requests"
            element={
              <ProtectedRoute roles={['guest']}>
                <GuestServiceRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guest/check-in"
            element={
              <ProtectedRoute roles={['guest']}>
                <GuestCheckInOutPage />
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
                <AdminBookingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/invoices"
            element={
              <ProtectedRoute roles={['admin']} permissions={["invoices:read"]}>
                <AdminInvoicesPage />
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
            path="/admin/rooms"
            element={<ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <Roomspage />
                </DefaultAdminLayout>
              </ProtectedRoute>}
          />
          <Route
            path="/admin/add-room"
            element={
                <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminAddRoom />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit-room/:id"
            element={
             <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminEditRoom />
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

          {/* 👨‍💼 Manager Routes - Restructured with Layout */}
          <Route 
            path="/manager/*" 
            element={
              <ProtectedRoute roles={['manager']}>
                <Routes>
                  {/* Manager Home/Dashboard */}
                  <Route 
                    index 
                    element={
                      <DefaultManagerLayout>
                        <ManagerHomePage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  {/* Task Management Section */}
                  <Route 
                    path="dashboard" 
                    element={
                      <DefaultManagerLayout>
                        <ManagerTaskDashboard />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="task-management" 
                    element={
                      <DefaultManagerLayout>
                        <TaskManagementDashboard />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="tasks" 
                    element={
                      <DefaultManagerLayout>
                        <TaskListPage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="tasks/create" 
                    element={
                      <DefaultManagerLayout>
                        <CreateTaskPage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="tasks/assign" 
                    element={
                      <DefaultManagerLayout>
                        <TaskAssignmentPage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="tasks/feedback" 
                    element={
                      <DefaultManagerLayout>
                        <FeedbackPage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="tasks/staff-workload" 
                    element={
                      <DefaultManagerLayout>
                        <StaffWorkloadPage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  {/* Reports Section */}
                  <Route 
                    path="reports/*" 
                    element={
                      <DefaultManagerLayout>
                        <ManagerDashboard />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="reports/view" 
                    element={
                      <DefaultManagerLayout>
                        <ViewReportPage />
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  {/* Settings and Other Pages */}
                  <Route 
                    path="settings" 
                    element={
                      <DefaultManagerLayout>
                        <div className="p-8">Settings Page - Coming Soon</div>
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="notifications" 
                    element={
                      <DefaultManagerLayout>
                        <div className="p-8">Notifications Page - Coming Soon</div>
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="staff-performance" 
                    element={
                      <DefaultManagerLayout>
                        <div className="p-8">Staff Performance Page - Coming Soon</div>
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="feedback" 
                    element={
                      <DefaultManagerLayout>
                        <div className="p-8">Feedback Page - Coming Soon</div>
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="inbox" 
                    element={
                      <DefaultManagerLayout>
                        <div className="p-8">Manager Inbox - Coming Soon</div>
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  <Route 
                    path="staff-messages" 
                    element={
                      <DefaultManagerLayout>
                        <div className="p-8">Staff Messages - Coming Soon</div>
                      </DefaultManagerLayout>
                    } 
                  />
                  
                  {/* Test Routes */}
                  <Route 
                    path="test" 
                    element={
                      <DefaultManagerLayout>
                        <ManagerDashboardTest />
                      </DefaultManagerLayout>
                    } 
                  />
                </Routes>
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

          {/* Guest Service Request Routes */}
          <Route 
            path="/guest/services" 
            element={
              <ProtectedRoute roles={['guest']}>
                <GuestServiceRequestForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/staff/service-requests" 
            element={
              <ProtectedRoute roles={['staff', 'manager']}>
                <ServiceRequestManagementPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Task Management Routes */}
          <Route 
            path="/staff/tasks" 
            element={
              <ProtectedRoute roles={['staff', 'manager']}>
                <TaskManagementPage />
              </ProtectedRoute>
            } 
          />

          {/* New Check-in/Check-out Routes */}
          <Route 
            path="/staff/check-in" 
            element={
              <ProtectedRoute roles={['staff', 'manager']}>
                <CheckInPage />
              </ProtectedRoute>
            } 
          />

          {/* Room Status Route */}
          <Route 
            path="/staff/rooms" 
            element={
              <ProtectedRoute roles={['staff', 'manager']}>
                <RoomStatusPage />
              </ProtectedRoute>
            } 
          />

          {/* Key Card Management Route */}
          <Route 
            path="/staff/key-cards" 
            element={
              <ProtectedRoute roles={['staff', 'manager']}>
                <KeyCardManagementPage />
              </ProtectedRoute>
            } 
          />

          {/* 🚧 Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BookingProvider>
        </SettingsProvider>
      </AuthProvider>
      </SnackbarProvider>
    </BrowserRouter>
  );
};

export default App;
