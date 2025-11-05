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
  ChevronDown 
} from 'lucide-react';

export default function ProfileDropdown({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      show: false // Hide for now
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {getUserInitial()}
        </div>
        <span className="hidden md:block text-gray-700 font-medium">
          {user?.name?.split(' ')[0] || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getUserInitial()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user?.name || 'User'}</p>
                  <p className="text-sm text-white/80 truncate">{user?.email || ''}</p>
                  {user?.role && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-gray-700 hover:text-indigo-600"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

