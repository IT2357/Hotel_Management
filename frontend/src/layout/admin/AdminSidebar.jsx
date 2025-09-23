import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Logo from '../../assets/images/adminLogo.jpg';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const sidebarRef = useRef();

  const links = [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'User Management', to: '/admin/users' },
    { label: 'Invitations', to: '/admin/invitations' },
    { label: 'Notifications', to: '/admin/notifications' },
    { label: 'Bookings', to: '/admin/bookings' },
    { label: 'Refunds', to: '/admin/refunds' },
    { label: 'Reports', to: '/admin/reports' },
    { label: 'Settings', to: '/admin/settings' },
    { label: 'Rooms', to: '/admin/rooms' },
    { label: 'Food Orders', to: '/admin/food/orders' },
    { label: 'Food Menu', to: '/admin/food/menu' }
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
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
          }}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:transform-none`}
      >
        {/* Logo & Title */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <img src={Logo} alt="Logo" className="h-8" />
          <span className="hidden lg:block text-lg font-semibold text-indigo-400">
            Admin Panel
          </span>
          <button onClick={() => setSidebarOpen(false)} className="text-white lg:hidden ml-auto">✕</button>
        </div>

        {/* Breadcrumbs */}
        <div className="px-4 py-3 border-b border-gray-700 text-xs text-gray-400">
          <NavLink to="/admin/dashboard" className="text-indigo-300 hover:text-white">Home</NavLink>
          {pathnames.map((segment, index) => {
            const routeTo = '/' + pathnames.slice(0, index + 1).join('/');
            const label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <span key={segment}>
                {' / '}
                <NavLink
                  to={routeTo}
                  className="hover:text-white transition"
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
        <nav className="mt-4 space-y-2 px-4">
          {links.map(({ label, to }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => sidebarOpen && window.innerWidth < 1024 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `block rounded px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
