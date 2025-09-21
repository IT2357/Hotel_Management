import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Logo from '../../assets/images/adminLogo.jpg';
import { BiBell } from 'react-icons/bi'; // For notification icon
import { BiGridAlt } from 'react-icons/bi'; // For Dashboard icon
import NotificationDropdown from '../../components/common/NotificationDropdown';

const ManagerHeader = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow sticky top-0 z-[999] w-full flex items-center justify-between px-4 py-3">
      {/* Left: Dashboard Info  */}
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                setSidebarOpen(prev => !prev);
              }}
              className="mr-2 focus:outline-none"
            >
              <BiGridAlt className="text-indigo-600" />
            </button>
            <span className="text-sm font-medium text-gray-700">Dashboard</span>
          </div>
          <p className="text-xs text-gray-500">Hotel Management System - Manager Overview</p>
        </div>
      </div>



      {/* Center: Search */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <form className="hidden sm:block w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <Link to="/manager/notifications" className="relative">
            <BiBell className="h-6 w-6 text-gray-600 hover:text-indigo-600" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center -mt-1 -mr-1">2</span>
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(prev => !prev)}
            className="focus:outline-none"
          >
            <img
              src="https://i.pravatar.cc/300?u=admin"
              alt="Profile"
              className="h-8 w-8 rounded-full border border-gray-300"
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 text-sm">
              <Link to="/manager/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 hover:bg-indigo-100 text-gray-700">Profile</Link>
              <Link to="/manager/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 hover:bg-indigo-100 text-gray-700">Settings</Link>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 hover:bg-indigo-100 text-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ManagerHeader;