import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Logo from '../../assets/images/adminLogo.jpg';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { ChevronDown, ChevronRight } from 'lucide-react';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const sidebarRef = useRef();
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // New state for modal
  const [openSubmenus, setOpenSubmenus] = useState({
    'Food Management': true // Default open for food management
  });

  const links = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: '🏠' },
    { label: 'User Management', to: '/admin/users', icon: '👥' },
    { label: 'Invitations', to: '/admin/invitations', icon: '✉️' },
    { label: 'Notifications', to: '/admin/notifications', icon: '🔔' },
    { label: 'Bookings', to: '/admin/bookings', icon: '📅' },
    { label: 'Invoices', to: '/admin/invoices', icon: '🧾' },
    { label: 'Refunds', to: '/admin/refunds', icon: '💸' },
    { label: 'Reports', to: '/admin/reports', icon: '📊' },
    { label: 'Rooms', to: '/admin/rooms', icon: '🛏️' },
    { 
      label: 'Food Management', 
      to: '/admin/food', 
      icon: '🍽️',
      submenu: [
        { label: 'Overview', to: '/admin/food', icon: '📊' },
        { label: 'Menu Items', to: '/admin/food/menu', icon: '📋' },
        { label: 'Food Orders', to: '/admin/food/orders', icon: '🛒' },
        { label: 'AI Menu Generator', to: '/admin/food/ai-menu', icon: '🤖' }
      ]
    },
    { label: 'Settings', to: '/admin/settings', icon: '⚙️' }
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

  // Handle the confirm logout action
  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  // Toggle submenu
  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Check if current path matches submenu item
  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'));
  };

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
        className={`fixed top-0 left-0 z-[1000] h-full max-w-xs w-72 bg-indigo-950 text-white transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:transform-none shadow-2xl`}
      >
        {/* Logo & Title */}
        <div className="flex-shrink-0 flex items-center gap-3 p-6 border-b border-white/10">
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
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 text-sm text-white/70">
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
        <nav className="flex-1 mt-6 px-6 space-y-2">
          {links.map(({ label, to, icon, submenu }) => {
            // If link has submenu
            if (submenu) {
              const isOpen = openSubmenus[label];
              const isActive = isSubmenuActive(submenu);
              
              return (
                <div key={label} className="space-y-1">
                  {/* Parent Link */}
                  <button
                    onClick={() => toggleSubmenu(label)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg'
                        : 'text-white/90 hover:bg-indigo-800'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{icon}</span>
                      {label}
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {/* Submenu Items */}
                  {isOpen && (
                    <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {submenu.map((subItem) => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          onClick={() => sidebarOpen && window.innerWidth < 1024 && setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                            ${isActive
                              ? 'bg-indigo-500/50 text-white shadow-md transform scale-102'
                              : 'text-white/80 hover:bg-indigo-700/50 hover:text-white'
                            }`
                          }
                        >
                          <span className="text-xs">{subItem.icon}</span>
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular link without submenu
            return (
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
            );
          })}
        </nav>
        {/* Logout Button */}
        <div className="p-6">
          <button
            onClick={() => setIsLogoutModalOpen(true)} // Open modal on click
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-red-400 bg-red-900/50 hover:bg-red-800/50 transition-all duration-300 transform hover:scale-102"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      
      {/* The Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmButtonText="Logout"
      />
    </>
  );
};

export default AdminSidebar;