import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, CheckCircle, MessageSquare, LogOut, User, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GuestLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const topNavItems = [
    { name: 'Dashboard', href: '/guest/dashboard', icon: Home },
    { name: 'Booking', href: '/booking', icon: Calendar },
    { name: 'Food', href: '/menu', icon: Utensils },
    { name: 'Check-in', href: '/guest/check-in', icon: CheckCircle },
    { name: 'Requests', href: '/guest/my-requests', icon: MessageSquare },
  ];

  const bottomNavItems = [
    { name: 'About', href: '/about' },
    { name: 'Food', href: '/menu' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Guest Portal</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {topNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 py-4">
            {bottomNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default GuestLayout;