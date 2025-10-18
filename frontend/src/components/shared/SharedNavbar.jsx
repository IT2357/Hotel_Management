import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, LogIn, LogOut, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export default function SharedNavbar({ showBackButton = false, backPath = '/' }) {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
                <Link
                  to="/user/dashboard"
                  className="text-gray-700 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-indigo-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
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
