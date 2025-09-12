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
    <header className="bg-white sticky top-0 z-[10] w-full shadow-lg rounded-b-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 p-[20px] border-b border-gray-200">
        {/* Left: Sidebar toggle, logo & title */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <button
            ref={toggleRef}
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(prev => !prev);
            }}
            className="lg:hidden p-2 rounded-full bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/" className="inline-flex items-center lg:hidden">
            <img src={Logo} alt="Logo" className="h-8 w-auto rounded-full" />
            <span className="ml-2 text-lg font-bold text-gray-800">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>
          <button
            className="sm:hidden p-2 rounded-full text-gray-700 hover:bg-gray-100"
            onClick={() => setShowSearch(prev => !prev)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {showSearch && (
            <div className="absolute top-16 left-4 right-4 sm:hidden">
              <div className="bg-white shadow-xl rounded-xl border-0 p-4">
                <input
                  type="text"
                  placeholder="🔍 Search..."
                  className="w-full pl-4 pr-4 py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Notifications & profile */}
        <div className="flex items-center gap-2 relative flex-shrink-0">
        <NotificationDropdown />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(prev => !prev)}
            className="focus:outline-none transition-transform duration-200 transform hover:scale-105"
          >
            <img
              src="https://i.pravatar.cc/300?u=admin"
              alt="Profile"
              className="h-9 w-9 rounded-full ring-2 ring-indigo-500 ring-offset-2 ring-offset-white transition-all duration-200"
            />
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 text-base font-medium animate-fade-in-up"
            >
              <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                <img
                  src="https://i.pravatar.cc/300?u=admin"
                  alt="Profile"
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="text-gray-900 font-semibold">Admin</p>
                  <p className="text-gray-500 text-sm">View profile</p>
                </div>
              </div>
              <Link
                to="/admin/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </Link>
              <Link
                to="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-b-2xl transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
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

