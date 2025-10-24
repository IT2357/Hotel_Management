import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  ShoppingBag, 
  Bed, 
  LayoutDashboard,
  ChevronDown,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import foodService from '../../services/foodService';
import bookingService from '../../services/bookingService';

export default function EnhancedProfileDropdown({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    totalBookings: 0,
    activeBookings: 0
  });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user stats when dropdown opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats();
    }
  }, [isOpen, user]);

  const fetchUserStats = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Fetch food orders
      if (user?.role?.toLowerCase() === 'guest' || !user?.role) {
        const [ordersResponse, bookingsResponse] = await Promise.all([
          foodService.getUserOrders().catch(() => ({ data: { data: [] } })),
          bookingService.getMyBookings().catch(() => ({ data: { bookings: [] } }))
        ]);

        const orders = ordersResponse.data?.data || [];
        const bookings = bookingsResponse.data?.bookings || [];

        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const activeOrders = orders.filter(o => 
          ['pending', 'preparing', 'ready'].includes(o.status?.toLowerCase())
        ).length;
        const completedOrders = orders.filter(o => 
          o.status?.toLowerCase() === 'completed'
        ).length;
        const activeBookings = bookings.filter(b =>
          ['confirmed', 'checked-in'].includes(b.status?.toLowerCase())
        ).length;

        setStats({
          totalOrders: orders.length,
          activeOrders,
          totalSpent,
          completedOrders,
          totalBookings: bookings.length,
          activeBookings
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase();
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'manager':
        return '/manager';
      case 'guest':
        return '/guest/dashboard';
      default:
        return '/user/dashboard';
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: getDashboardPath(),
      show: true
    },
    {
      label: 'My Profile',
      icon: User,
      path: '/profile',
      show: true
    },
    {
      label: 'My Orders',
      icon: ShoppingBag,
      path: '/my-orders',
      show: user?.role?.toLowerCase() === 'guest' || !user?.role
    },
    {
      label: 'My Bookings',
      icon: Bed,
      path: '/guest/my-bookings',
      show: user?.role?.toLowerCase() === 'guest' || !user?.role
    }
  ];

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
          {getUserInitial()}
        </div>
        <span className="hidden md:block text-gray-700 dark:text-gray-200 font-medium">
          {user?.name?.split(' ')[0] || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* User Info Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {getUserInitial()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{user?.name || 'User'}</p>
                  <p className="text-sm text-white/90 truncate">{user?.email || ''}</p>
                  {user?.role && (
                    <span className="inline-block mt-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats - Only for Guests */}
            {(user?.role?.toLowerCase() === 'guest' || !user?.role) && (
              <div className="px-5 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                {loading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-16 bg-white/50 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <>
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Quick Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-indigo-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Orders</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-green-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          LKR {stats.totalSpent.toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-purple-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeOrders}</p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-orange-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Avg Order</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          LKR {stats.totalOrders > 0 ? Math.round(stats.totalSpent / stats.totalOrders).toLocaleString() : 0}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  >
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 rounded-lg flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 group"
            >
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-medium">Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

