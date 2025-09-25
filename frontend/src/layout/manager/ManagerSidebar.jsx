import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { 
  BiSolidDashboard, 
  BiListCheck, 
  BiUser, 
  BiCommentDetail, 
  BiBarChartAlt2, 
  BiBell
} from 'react-icons/bi';
import Logo from '../../assets/images/adminLogo.jpg';

const ManagerSidebar = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const sidebarRef = useRef();

  const links = [
    { label: 'Dashboard', to: '/manager/dashboard', icon: <BiSolidDashboard /> },
    { label: 'Task Management', to: '/manager/tasks', icon: <BiListCheck /> },
    { label: 'Staff Performance', to: '/manager/staff-performance', icon: <BiUser /> },
    { label: 'Feedback & Reviews', to: '/manager/feedback', icon: <BiCommentDetail /> },
    { label: 'Reports & Analytics', to: '/manager/reports', icon: <BiBarChartAlt2 /> },
    { label: 'Notifications', to: '/manager/notifications', icon: <BiBell /> },
    { label: 'Staff Messages', to: '/manager/staff-messages' },
    { label: 'Manager Inbox', to: '/manager/inbox'},
    { label: 'Settings', to: '/manager/settings' },
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
          }}
        ></div>
      )}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white text-gray-900 shadow-lg transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none`}
      >
        {/* Logo & Title */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <img src={Logo} alt="Logo" className="h-8" />
          <div>
            <h2 className="text-xl font-semibold text-blue-600">HMS</h2>
            <p className="text-sm text-gray-500">Manager Portal</p>
          </div>
        </div>

        {/* Main Menu */}
        <div className="px-4 py-2 text-xs text-gray-500">Main Menu</div>
        <nav className="mt-2 space-y-1 px-4">
          {links.map(({ label, to, icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => sidebarOpen && window.innerWidth < 1024 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="mr-3">{icon}</span>
              <span>{label}</span>
              {label === 'Notifications' && (
                <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-1">2</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default ManagerSidebar;
