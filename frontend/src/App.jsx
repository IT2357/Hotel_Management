import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ReactQueryProvider } from './context/QueryProvider.jsx';
import { FavoritesProvider } from './contexts/FavoritesContext.jsx';
import { ProtectedRoute, RedirectIfAuthenticated } from './components/shared/ProtectedRoute.jsx';
import { SnackbarProvider } from 'notistack';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';
import PageTransition from './components/shared/PageTransition.jsx';
import NotificationDropdown from './components/common/NotificationDropdown.jsx';
import GlobalChatbot from './components/common/GlobalChatbot.jsx';
import { useReviewPrompt } from './hooks/useReviewPrompt.js';
import FoodReview from './components/food/FoodReview.jsx';
import HomePage from './pages/HomePage.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import FoodPage from './pages/FoodPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
// Removed imports for missing files: Gallery, Blog, RestaurantMenuPage
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
import UserProfile from './pages/GuestDashboard.jsx';
import GuestDashboardPage from './pages/guest/GuestDashboardPage.jsx';
import GuestCheckInOutPage from './pages/guest/GuestCheckInOutPage.jsx';
import GuestBookingFlow from './pages/guest/GuestBookingFlow.jsx';
import RoomsPage from './pages/guest/RoomsPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MyBookings from './pages/guest/MyBookings.jsx';
import BookingReceipts from './pages/guest/BookingReceipts.jsx';
import BookingSuccess from './pages/guest/BookingSuccess.jsx';
import BookingCancelled from './pages/guest/BookingCancelled.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import PaymentCancelPage from './pages/PaymentCancelPage.jsx';
import MyReviews from './pages/guest/MyReviews.jsx';
import FavoriteRooms from './pages/guest/FavoriteRooms.jsx';
import GuestServiceRequestsPage from './pages/guest/GuestServiceRequestsPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';

// Task Management pages
import ManagerHomePage from './pages/manager/ManagerHomePage.jsx';
import ManagerTaskManagementPage from './pages/manager/ManagerTaskManagementPage.jsx';
import ManagerStaffAnalyticsPage from './pages/manager/ManagerStaffAnalyticsPage.jsx';
import ManagerFeedbackPage from './pages/manager/ManagerFeedbackPage.jsx';
import ManagerProfilePage from './pages/manager/ManagerProfilePage.jsx';
import ManagerReportsPage from './pages/manager/ManagerReportsPage.jsx';
import ManagerMessagingPage from './pages/manager/ManagerMessagingPage.jsx';
import ManagerChatPage from './pages/manager/ManagerChatPage.jsx';
import StaffTasks from './pages/staff/StaffTasks.jsx';
import AdminInvitationPage from './pages/admin/AdminInvitationPage.jsx';
import AdminNotificationPage from './pages/admin/NotificationManagementPage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminInvoicesPage from './pages/admin/AdminInvoicesPage.jsx';
import AdminRefundManagementPage from './pages/admin/AdminRefundManagementPage.jsx';
import AdminRoomsPage from './pages/admin/AdminRoomsPage.jsx';
import AdminAddRooms from './pages/admin/AdminAddRooms.jsx';
import AdminEditRoomsPage from './pages/admin/AdminEditRoomsPage.jsx';
import FoodManagementPage from './pages/admin/FoodManagementPage.jsx';
import EnhancedFoodManagementPage from './pages/admin/EnhancedFoodManagementPage.jsx';
import CompleteAIMenuGenerator from './pages/admin/CompleteAIMenuGenerator.jsx';
import FoodOrderManagementPage from './pages/admin/food/orders/FoodOrderManagementPage.jsx';
import FoodMenuManagementPage from './pages/admin/food/orders/menu/FoodMenuManagementPage.jsx';
import EnhancedFoodMenuManagementPage from './pages/admin/EnhancedFoodMenuManagementPage.jsx';
import AdminFoodOffersPage from './pages/admin/food/AdminFoodOffersPage.jsx';
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
import DefaultAdminLayout from './layout/admin/DefaultAdminLayout.jsx';

// Food ordering pages for guests
import FoodOrderingPage from './pages/FoodOrderingPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import FoodOrderHistoryPage from './pages/food/FoodOrderHistoryPage.jsx';
import GuestMenuPage from './pages/guest/GuestMenuPage.jsx';
import FoodCategoryManagementPage from './pages/admin/food/categories/FoodCategoryManagementPage.jsx';

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
import AdminviewPage from './pages/admin/AdminViewRooms.jsx';
// import CompareModal from './components/rooms/CompareModal.jsx';
import CompareRooms from './pages/guest/CompareRoomsPage.jsx';
// import StaffNotificationsPage from './pages/staff/StaffNotificationsPage.jsx';

// Helper component for transitions
const wrapWithTransition = (component) => (
  <PageTransition>{component}</PageTransition>
);

// Guest Layout wrapper
const GuestLayout = ({ children }) => (
  <div className="guest-layout">
    {children}
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hasToken = () => {
    const token = localStorage.getItem('token');
    return token && token !== 'undefined' && token !== 'null';
  };
  return (
    <SnackbarProvider maxSnack={3}>
      <NotificationProvider>
        <AuthProvider>
          <SettingsProvider>
            <BookingProvider>
              <CartProvider>
              <ReactQueryProvider>
                <FavoritesProvider>
                  <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="colored" />
                  <Toaster position="top-right" richColors closeButton />
                  <GlobalChatbot />
                  <AnimatePresence mode="wait">
                    <Routes>
                      {/* Home Page */}
                      <Route path="/" element={wrapWithTransition(<HomePage />)} />

                          {/* Booking Routes */}
                          <Route path="/booking" element={wrapWithTransition(<GuestBookingFlow />)} />
                          <Route path="/booking/guest" element={wrapWithTransition(<GuestBookingFlow />)} />
                          <Route path="/rooms" element={wrapWithTransition(<RoomsPage />)} />
                          
                          {/* Payment Routes */}
                          <Route path="/payment/success" element={wrapWithTransition(<PaymentSuccessPage />)} />
                          <Route path="/payment/cancel" element={wrapWithTransition(<PaymentCancelPage />)} />
                          
                          <Route path="/about" element={wrapWithTransition(<About />)} />
                          <Route path="/contact" element={wrapWithTransition(<Contact />)} />
                          <Route path="/menu" element={wrapWithTransition(<GuestMenuPage />)} />
                          <Route path="/food" element={wrapWithTransition(<FoodOrderingPage />)} />
                          {/* Removed routes for missing files: Gallery, Blog, MenuPage, RestaurantMenuPage */}
                          <Route path="/my-orders" element={wrapWithTransition(<MyOrdersPage />)} />
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

                        {/* Protected Routes */}
                        <Route
                          path="/guest/dashboard"
                          element={wrapWithTransition(
                            <ProtectedRoute roles={['guest']}>
                              <UserProfile />
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
                          path="/guest/receipts"
                          element={wrapWithTransition(
                            <ProtectedRoute roles={['guest']}>
                              <GuestLayout>
                                <BookingReceipts />
                              </GuestLayout>
                            </ProtectedRoute>
                          )}
                        />

                        {/* PayHere return URLs */}
                        <Route
                          path="/booking/success"
                          element={wrapWithTransition(
                            <ProtectedRoute roles={['guest']}>
                              <GuestLayout>
                                <BookingSuccess />
                              </GuestLayout>
                            </ProtectedRoute>
                          )}
                        />

                        <Route
                          path="/booking/cancelled"
                          element={wrapWithTransition(
                            <ProtectedRoute roles={['guest']}>
                              <GuestLayout>
                                <BookingCancelled />
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
                            path="/guest/food-orders"
                            element={wrapWithTransition(
                              <ProtectedRoute roles={['guest']}>
                                <GuestLayout>
                                  <FoodOrderHistoryPage />
                                </GuestLayout>
                              </ProtectedRoute>
                            )}
                          />

                          <Route
                            path="/guest/menu"
                            element={wrapWithTransition(
                              <ProtectedRoute roles={['guest']}>
                                <GuestLayout>
                                  <GuestMenuPage />
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

                          {/* Admin Routes */}
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

                          {/* Admin Reports Page - REMOVED: Placeholder functionality */}
                          {/* <Route
                            path="/admin/reports"
                            element={
                              <ProtectedRoute roles={['admin']} permissions={["reports:read"]}>
                                <DefaultAdminLayout>
                                  <AdminReportsPage />
                                </DefaultAdminLayout>
                              </ProtectedRoute>
                            }
                          /> */}

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
                            path="/admin/view-room/:id"
                            element={
                              <ProtectedRoute roles={['admin']}>
                                <DefaultAdminLayout>
                                  <AdminviewPage />
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

                          {/* Admin Food Management Routes */}
                          <Route
                            path="/admin/food"
                            element={
                              <ProtectedRoute roles={['admin']}>
                                <DefaultAdminLayout>
                                  <EnhancedFoodManagementPage />
                                </DefaultAdminLayout>
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/admin/food/menu"
                            element={
                              <ProtectedRoute roles={['admin']}>
                                <DefaultAdminLayout>
                                  <EnhancedFoodMenuManagementPage />
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
                            path="/admin/food/ai-menu"
                            element={
                              <ProtectedRoute roles={['admin']}>
                                <CompleteAIMenuGenerator />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/admin/food/categories"
                            element={
                              <ProtectedRoute roles={['admin']}>
                                <DefaultAdminLayout>
                                  <FoodCategoryManagementPage />
                                </DefaultAdminLayout>
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/admin/food/offers"
                            element={
                              <ProtectedRoute roles={['admin']}>
                                <DefaultAdminLayout>
                                  <AdminFoodOffersPage />
                                </DefaultAdminLayout>
                              </ProtectedRoute>
                            }
                          />

                          {/* Manager Routes - Restructured with Layout */}
                          <Route
                            path="/manager"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerHomePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/tasks"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerTaskManagementPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/staff"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerStaffAnalyticsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/feedback"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerFeedbackPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/profile"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerProfilePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/reports"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerReportsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/messaging"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerMessagingPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/manager/chat"
                            element={
                              <ProtectedRoute roles={['manager']}>
                                <ManagerChatPage />
                              </ProtectedRoute>
                            }
                          />

                          {/* Staff Task Routes */}
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

                          {/* Error Routes */}
                          <Route path="/unauthorized" element={<UnauthorizedPage />} />
                          <Route path="*" element={<NotFoundPage />} />

                          {/* Compare Rooms Route */}
                          <Route
                            path="/compare-rooms"
                            element={
                              <ProtectedRoute roles={['guest']}>
                                <CompareRooms />
                              </ProtectedRoute>
                            }
                          />

                          {/* Staff Notifications Page - REMOVED: Functionality now integrated into StaffDashboardPage */}
                          {/* <Route
                            path="/staff/notifications"
                            element={
                              <ProtectedRoute roles={['staff']}>
                                <StaffNotificationsPage />
                              </ProtectedRoute>
                            }
                          /> */}
                        </Routes>
                        
                        {/* Global Review Prompt Modal - Auto-shows when order delivered */}
                        <GlobalReviewModal />
                  </AnimatePresence>
                </FavoritesProvider>
                </ReactQueryProvider>
              </CartProvider>
            </BookingProvider>
          </SettingsProvider>
        </AuthProvider>
      </NotificationProvider>
    </SnackbarProvider>
  );
};

// Global Review Modal Component
const GlobalReviewModal = () => {
  const { pendingReview, showModal, dismissReview } = useReviewPrompt();
  
  if (!pendingReview) return null;
  
  return (
    <FoodReview
      isOpen={showModal}
      onClose={() => dismissReview(pendingReview.orderId)}
      orderId={pendingReview.orderId}
      orderDetails={pendingReview.items}
    />
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