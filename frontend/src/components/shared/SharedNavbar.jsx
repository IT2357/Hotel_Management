import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, LogIn, LogOut, ArrowLeft, Settings, ChevronDown } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import NotificationDropdown from '../../components/common/NotificationDropdown.jsx';

export default function SharedNavbar({ showBackButton = false, backPath = '/' }) {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation items for guests (not logged in)
  const guestNavigationItems = [
    { name: 'Home', href: '/', scrollTo: 'home' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Menu', href: '/menu' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '#contact', scrollTo: 'contact' },
  ];

  // Navigation items for authenticated users
  const authenticatedNavigationItems = [
    { name: 'Home', href: '/', scrollTo: 'home' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Menu', href: '/menu' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Dashboard', href: '/user/dashboard' },
  ];

  const navigationItems = user ? authenticatedNavigationItems : guestNavigationItems;

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-lg border-b border-indigo-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => navigate(backPath)}
                className="p-2 text-gray-700 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl tracking-wider">V</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">VALDOR</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              item.scrollTo ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-indigo-50"
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.scrollTo === 'home') {
                      navigate('/');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate('/');
                      setTimeout(() => {
                        const element = document.getElementById(item.scrollTo);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }
                  }}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-indigo-50"
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Authentication Buttons */}
            {user ? (
              <div className="hidden lg:flex items-center space-x-3">
                {/* Notifications Bell for authenticated users */}
                <NotificationDropdown />
                {/* ✅ Simple Profile Dropdown (Dashboard + Logout Only) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium rounded-lg hover:bg-indigo-50"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:block">{user.name?.split(' ')[0] || 'User'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <Link
                        to="/guest/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden lg:block px-6 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all font-medium rounded-lg shadow-md hover:shadow-lg"
              >
                Login
              </Link>
            )}

            {!user && (
              <Link
                to="/login"
                state={{ from: '/food-ordering' }}
                className="hidden lg:block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-200/50 transition-all duration-300"
              >
                Order Food
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-white border-t border-indigo-200/50 py-4"
          >
            {/* Authentication Section for Mobile */}
            <div className="px-4 pb-4 border-b border-indigo-200/50 mb-4">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">
                      Welcome, {user.name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>

            <div className="space-y-2 px-4">
              {navigationItems.map((item) => (
                item.scrollTo ? (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      if (item.scrollTo === 'home') {
                        navigate('/');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        navigate('/');
                        setTimeout(() => {
                          const element = document.getElementById(item.scrollTo);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 100);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              {!user && (
                <Link
                  to="/login"
                  state={{ from: '/food-ordering' }}
                  className="block px-4 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl transition-colors font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Order Food
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
