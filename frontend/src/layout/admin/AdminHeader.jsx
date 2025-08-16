import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Logo from '../../assets/images/adminLogo.jpg';
import NotificationDropdown from '../../components/common/NotificationDropdown';

const AdminHeader = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-[999] w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        {/* Left: Sidebar toggle, logo & title */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <button
            ref={toggleRef}
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(prev => !prev);
            }}
            className="lg:hidden p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
          >
            <svg className="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/" className="inline-flex items-center lg:hidden max-w-[150px] sm:max-w-none">
            <img src={Logo} alt="Logo" className="h-8 w-auto shrink-0" />
            <span className="ml-2 text-base sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400 truncate">
              Admin Panel
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <form className="hidden sm:block w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300">
                <svg className="h-4 w-4" viewBox="0 0 20 20">
                  <path d="M9 2a7 7 0 105.33 12.06l3.6 3.6a1 1 0 001.42-1.42l-3.6-3.6A7 7 0 009 2z" />
                </svg>
              </div>
            </div>
          </form>

          <button
            className="sm:hidden p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={() => setShowSearch(prev => !prev)}
          >
            <svg className="h-6 w-6" viewBox="0 0 20 20">
              <path d="M9 2a7 7 0 105.33 12.06l3.6 3.6a1 1 0 001.42-1.42l-3.6-3.6A7 7 0 009 2z" />
            </svg>
          </button>

          {showSearch && (
            <form className="absolute top-16 left-4 right-4 sm:hidden bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg z-50">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-4 pr-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none"
              />
            </form>
          )}
        </div>

        {/* Right: Notifications & profile */}
        <div className="flex items-center gap-2 relative flex-shrink-0">
          <NotificationDropdown />

          <div className="relative">
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className="focus:outline-none"
            >
              <img
                src="https://i.pravatar.cc/300?u=admin"
                alt="Profile"
                className="h-8 w-8 rounded-full border border-gray-300 dark:border-gray-600"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 text-sm">
                <Link to="/admin/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 text-gray-700 dark:text-gray-200">Profile</Link>
                <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 text-gray-700 dark:text-gray-200">Settings</Link>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 text-gray-700 dark:text-gray-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
