import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Logo from '../../assets/images/adminLogo.jpg';
import Card from '../../components/ui/Card';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const sidebarRef = useRef();

  const links = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: '🏠' },
    { label: 'User Management', to: '/admin/users', icon: '👥' },
    { label: 'Invitations', to: '/admin/invitations', icon: '✉️' },
    { label: 'Notifications', to: '/admin/notifications', icon: '🔔' },
    { label: 'Bookings', to: '/admin/bookings', icon: '📅' },
    { label: 'Refunds', to: '/admin/refunds', icon: '💸' },
    { label: 'Reports', to: '/admin/reports', icon: '📊' },
    { label: 'Settings', to: '/admin/settings', icon: '⚙️' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !(toggleRef.current && toggleRef.current.contains(event.target))
      ) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, setSidebarOpen, toggleRef]);

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
          }}
        ></div>
      )}
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-full max-w-xs w-72 bg-indigo-950 text-white transition-transform duration-300 ease-in-out overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:transform-none shadow-2xl`}
      >
        {/* Logo & Title */}
        <div className="flex items-center gap-3 p-6 border-b border-white/10">
          <img src={Logo} alt="Logo" className="h-10 rounded-full" />
          <span className="text-xl font-bold text-white">
            Admin Panel
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden ml-auto p-2 rounded-full hover:bg-white/10 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Breadcrumbs */}
        <div className="px-6 py-4 border-b border-white/10 text-sm text-white/70">
          <NavLink to="/admin/dashboard" className="hover:text-white transition font-medium">
            Home
          </NavLink>
          {pathnames.map((segment, index) => {
            const routeTo = '/' + pathnames.slice(0, index + 1).join('/');
            const label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <span key={segment}>
                {' / '}
                <NavLink
                  to={routeTo}
                  className="hover:text-white transition font-medium"
                  onClick={(e) => {
                    if (sidebarOpen && window.innerWidth < 1024) {
                      e.preventDefault();
                      setSidebarOpen(false);
                      setTimeout(() => window.location.href = routeTo, 300);
                    }
                  }}
                >
                  {label}
                </NavLink>
              </span>
            );
          })}
        </div>
        {/* Navigation */}
        <nav className="mt-6 px-6 space-y-2 pb-6">
          {links.map(({ label, to, icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => sidebarOpen && window.innerWidth < 1024 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg transform scale-105'
                  : 'text-white/90 hover:bg-indigo-800 hover:scale-102'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;