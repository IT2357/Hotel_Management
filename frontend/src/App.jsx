import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ProtectedRoute, RedirectIfAuthenticated } from './components/shared/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import PaymentCancelPage from './pages/PaymentCancelPage.jsx';
import PayHereRedirectPage from './pages/PayHereRedirectPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import InviteRegisterPage from './pages/auth/InviteRegisterPage.jsx';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LogoutHandler from './pages/auth/LogoutHandler.jsx';
import UnauthorizedPage from './pages/auth/UnauthorizedPage.jsx';
import NotFoundPage from './pages/auth/NotFoundPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

// Modern Restaurant Pages
import ModernRestaurantMenu from './pages/ModernRestaurantMenu.jsx';
import ModernGuestDashboard from './pages/ModernGuestDashboard.jsx';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminInvitationPage from './pages/admin/AdminInvitationPage.jsx';
import AdminNotificationPage from './pages/admin/NotificationManagementPage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminRefundManagementPage from './pages/admin/AdminRefundManagementPage.jsx';
import FoodMenuManagement from './pages/admin/FoodMenuManagement.jsx';
import FoodOrderManagementPage from './pages/admin/food/orders/FoodOrderManagementPage.jsx';
import MenuUploadPage from './pages/admin/MenuUploadPage.jsx';
import EnhancedMenuReviewPage from './pages/admin/EnhancedMenuReviewPage.jsx';
import MenuExtractorPage from './pages/admin/MenuExtractorPage.jsx';
import ValampuriMenuGenerator from './pages/admin/ValampuriMenuGenerator.jsx';
import AdminRoomsPage from './pages/admin/AdminRoomsPage.jsx';
import AdminAddRoomPage from './pages/admin/AdminAddRooms.jsx';

// Auth Test Page
import AuthTestPage from './pages/AuthTestPage.jsx';

console.log('App.jsx: Imports loaded successfully');

// Legacy Pages (keeping for compatibility)
import GuestDashboardPage from './pages/guest/GuestDashboardPage.jsx';
import StaffDashboardPage from './pages/staff/StaffDashboardPage.jsx';
import RestaurantMenuPage from './pages/RestaurantMenuPage.jsx';
import FoodOrderingPage from './pages/FoodOrderingPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import About from './pages/About.jsx';
import Blog from './pages/Blog.jsx';
import Gallery from './pages/Gallery.jsx';
import Contact from './pages/Contact.jsx';
import DefaultAdminLayout from './layout/admin/DefaultAdminLayout.jsx';
import AdminEditRoomsPage from './pages/admin/AdminEditRoomsPage.jsx';
// import ManagerDashboardPage from './pages/ManagerDashboardPage.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
          {/* 🔒 Public Routes */}
          <Route path="/" element={<HomePage />} />

          {/* VALDORA Menu - Main menu route */}
          <Route path="/menu" element={<MenuPage />} />

          {/* VALDORA Cart */}
          <Route path="/cart" element={<CartPage />} />

          {/* VALDORA About */}
          <Route path="/about" element={<About />} />

          {/* VALDORA Gallery */}
          <Route path="/gallery" element={<Gallery />} />

          {/* VALDORA Blog */}
          <Route path="/blog" element={<Blog />} />

          {/* VALDORA Contact */}
          <Route path="/contact" element={<Contact />} />

          {/* VALDORA Checkout */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Payment Success/Cancel */}
          <Route path="/food/order/success" element={<PaymentSuccessPage />} />
          <Route path="/food/order/cancel" element={<PaymentCancelPage />} />
          <Route path="/payhere-redirect" element={<PayHereRedirectPage />} />

          {/* Auth Test Suite */}
          <Route path="/auth-test" element={<AuthTestPage />} />

          {/* Modern Restaurant Menu (Alternative) */}
          <Route path="/modern-menu" element={<ModernRestaurantMenu />} />

          {/* Legacy Routes (keeping for compatibility) */}
          <Route path="/legacy-menu" element={<RestaurantMenuPage />} />
          <Route path="/food-ordering" element={<FoodOrderingPage />} />
          <Route path="/dashboard/my-orders" element={<MyOrdersPage />} />
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

          {/* Modern Guest Dashboard */}
          <Route
            path="/guest/dashboard"
            element={
              <ProtectedRoute roles={['guest']}>
                <ModernGuestDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy Guest Dashboard */}
          <Route
            path="/legacy/guest/dashboard"
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
            path="/admin/food/menu"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <FoodMenuManagement />
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
            path="/admin/menu-review/:id"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <EnhancedMenuReviewPage />
                </DefaultAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/valampuri-generator"
            element={
              <ProtectedRoute roles={['admin']}>
                <DefaultAdminLayout>
                  <ValampuriMenuGenerator />
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
                  <AdminAddRoomPage />
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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
