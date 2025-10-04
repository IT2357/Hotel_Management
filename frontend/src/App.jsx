import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ProtectedRoute, RedirectIfAuthenticated } from './components/shared/ProtectedRoute.jsx';
import { SnackbarProvider } from 'notistack';
import PageTransition from './components/shared/PageTransition.jsx';
import HomePage from './pages/HomePage.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Gallery from './pages/Gallery.jsx';
import Blog from './pages/Blog.jsx';
import FoodPage from './pages/FoodPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import RestaurantMenuPage from './pages/RestaurantMenuPage.jsx';
import FoodOrderingPage from './pages/FoodOrderingPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
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
import GuestDashboardPage from './pages/ModernGuestDashboard.jsx';
import GuestCheckInOutPage from './pages/guest/GuestCheckInOutPage.jsx';
import GuestBookingFlow from './pages/guest/GuestBookingFlow.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MyBookings from './pages/guest/MyBookings.jsx';
import MyReviews from './pages/guest/MyReviews.jsx';
import FavoriteRooms from './pages/guest/FavoriteRooms.jsx';
import GuestServiceRequestsPage from './pages/guest/GuestServiceRequestsPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';

// Task Management pages
import ManagerTaskDashboard from './pages/manager/ManagerTaskDashboard.jsx';
import TaskListPage from './pages/manager/TaskListPage.jsx';
import CreateTaskPage from './pages/manager/CreateTaskPage.jsx';
import TaskAssignPage from './pages/manager/TaskAssignPage.jsx';
import FeedbackPage from './pages/manager/FeedbackPage.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import ManagerHomePage from './pages/manager/ManagerHomePage.jsx';
import ViewReportPage from './pages/manager/ViewReportPage.jsx';
import SimpleViewReportPage from './pages/manager/SimpleViewReportPage.jsx';
import StaffTasks from './pages/staff/StaffTasks.jsx';
import AdminInvitationPage from './pages/admin/AdminInvitationPage.jsx';
import AdminNotificationPage from './pages/admin/NotificationManagementPage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminInvoicesPage from './pages/admin/AdminInvoicesPage.jsx';
import AdminRefundManagementPage from './pages/admin/AdminRefundManagementPage.jsx';
import AdminRoomsPage from './pages/admin/AdminRoomsPage.jsx';
import AdminAddRooms from './pages/admin/AdminAddRooms.jsx';
import AdminEditRoomsPage from './pages/admin/AdminEditRoomsPage.jsx';
import FoodManagementPage from './pages/admin/FoodManagementPage.jsx';
import FoodOrderManagementPage from './pages/admin/food/orders/FoodOrderManagementPage.jsx';
import FoodMenuManagementPage from './pages/admin/food/orders/menu/FoodMenuManagementPage.jsx';
import MenuUploadPage from './pages/admin/MenuUploadPage.jsx';
import EnhancedMenuReviewPage from './pages/admin/EnhancedMenuReviewPage.jsx';
import MenuExtractorPage from './pages/admin/MenuExtractorPage.jsx';
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
import DefaultAdminLayout from './layout/admin/DefaultAdminLayout.jsx';
import GuestLayout from './layout/guest/GuestLayout.jsx';

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

const AppContent = () => {
  const location = useLocation();

  const wrapWithTransition = (element) => (
    <PageTransition key={location.pathname}>
      {element}
    </PageTransition>
  );

  return (
    <SnackbarProvider maxSnack={3}>
      <AuthProvider>
        <SettingsProvider>
          <BookingProvider>
            <CartProvider>
              <AnimatePresence mode="wait">
              <Routes>
        {/* 🏠 Home Page */}
        <Route path="/" element={wrapWithTransition(<HomePage />)} />

        {/* 🔒 Booking Routes */}
        <Route path="/booking" element={wrapWithTransition(<GuestBookingFlow />)} />
          <Route path="/booking/guest" element={wrapWithTransition(<GuestBookingFlow />)} />
          <Route path="/rooms" element={wrapWithTransition(<RoomsPage />)} />
          <Route path="/about" element={wrapWithTransition(<About />)} />
          <Route path="/contact" element={wrapWithTransition(<Contact />)} />
          <Route path="/gallery" element={wrapWithTransition(<Gallery />)} />
          <Route path="/blog" element={wrapWithTransition(<Blog />)} />
          <Route path="/food" element={wrapWithTransition(<FoodPage />)} />
          <Route path="/menu" element={wrapWithTransition(<MenuPage />)} />
          <Route path="/restaurant-menu" element={wrapWithTransition(<RestaurantMenuPage />)} />
          <Route path="/cart" element={wrapWithTransition(<CartPage />)} />
          <Route path="/checkout" element={wrapWithTransition(<CheckoutPage />)} />
          <Route path="/food-ordering" element={wrapWithTransition(<FoodOrderingPage />)} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                {wrapWithTransition(<LoginPage />)}
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                {wrapWithTransition(<RegisterPage />)}
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/verify-email"
            element={
                wrapWithTransition(<OTPVerificationPage />)
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectIfAuthenticated>
                {wrapWithTransition(<ForgotPasswordPage />)}
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/reset-password"
            element={
              <RedirectIfAuthenticated>
                {wrapWithTransition(<ResetPasswordPage />)}
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/accept-invitation"
            element={
              <RedirectIfAuthenticated>
                {wrapWithTransition(<InviteRegisterPage />)}
              </RedirectIfAuthenticated>
            }
          />

          {/* 🔐 Protected Routes */}
          <Route
            path="/guest/dashboard"
            element={wrapWithTransition(
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <GuestDashboardPage />
                </GuestLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/guest/my-bookings"
            element={wrapWithTransition(
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <MyBookings />
                </GuestLayout>
              </ProtectedRoute>
            )}
          />
  

          <Route
            path="/guest/my-requests"
            element={wrapWithTransition(
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <GuestServiceRequestsPage />
                </GuestLayout>
              </ProtectedRoute>
            )}
          />


          <Route
            path="/guest/check-in"
            element={wrapWithTransition(
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <GuestCheckInOutPage />
                </GuestLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/guest/favorite-rooms"
            element={wrapWithTransition(
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <FavoriteRooms />
                </GuestLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/guest/reviews"
            element={wrapWithTransition(
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <MyReviews />
                </GuestLayout>
              </ProtectedRoute>
            )}
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
            path="/admin/rooms"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminRoomsPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/add-room"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminAddRooms />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/edit-room/:id"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <AdminEditRoomsPage />
                </DefaultAdminLayout>
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

          {/* 🍽️ Admin Food Management Routes */}
          <Route
            path="/admin/food/menu"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <FoodManagementPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/food/orders"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <FoodOrderManagementPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/menu-upload"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <MenuUploadPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/menu-extractor"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <MenuExtractorPage />
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

          {/* Guest Service Request Routes */}
          <Route
            path="/guest/services"
            element={
              <ProtectedRoute roles={['guest']}>
                <GuestLayout>
                  <GuestServiceRequestForm />
                </GuestLayout>
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
        </AnimatePresence>
        </CartProvider>
      </BookingProvider>
      </SettingsProvider>
    </AuthProvider>
    </SnackbarProvider>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
