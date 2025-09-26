import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { 
  BiSolidDashboard, 
  BiListCheck, 
  BiUser, 
  BiCommentDetail, 
  BiBarChartAlt2, 
  BiBell,
  BiCog,
  BiEnvelope,
  BiMessageSquareDetail,
  BiChevronDown,
  BiChevronRight,
  BiTask,
  BiPlus,
  BiFile,
  BiMoney,
  BiTrendingUp,
  BiHome
} from 'react-icons/bi';
import { UserPlus, MessageSquare, BarChart3 } from 'lucide-react';
import Logo from '../../assets/images/adminLogo.jpg';

const ManagerSidebar = ({ sidebarOpen, setSidebarOpen, toggleRef }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const sidebarRef = useRef();
  const [expandedMenus, setExpandedMenus] = useState(['tasks']);

  // Main navigation structure with nested items
  const navigationStructure = [
    {
      section: 'Main',
      items: [
        { 
          label: 'Home', 
          to: '/manager', 
          icon: <BiHome />,
          exact: true
        },
        { 
          label: 'Dashboard', 
          to: '/manager/dashboard', 
          icon: <BiSolidDashboard />
        }
      ]
    },
    {
      section: 'Task Management',
      items: [
        {
          label: 'Tasks',
          icon: <BiListCheck />,
          id: 'tasks',
          children: [
            { 
              label: 'Task Overview', 
              to: '/manager/task-management', 
              icon: <BiTask />
            },
            { 
              label: 'All Tasks', 
              to: '/manager/tasks', 
              icon: <BiListCheck />
            },
            { 
              label: 'Create Task', 
              to: '/manager/tasks/create', 
              icon: <BiPlus />
            },
            { 
              label: 'Assign Tasks', 
              to: '/manager/tasks/assign', 
              icon: <UserPlus />
            },
            { 
              label: 'Staff Workload', 
              to: '/manager/tasks/staff-workload', 
              icon: <BarChart3 />
            },
            { 
              label: 'Task Feedback', 
              to: '/manager/tasks/feedback', 
              icon: <MessageSquare />
            }
          ]
        }
      ]
    },
    {
      section: 'Reports & Analytics',
      items: [
        {
          label: 'Reports',
          icon: <BiBarChartAlt2 />,
          id: 'reports',
          children: [
            { 
              label: 'Reports Home', 
              to: '/manager/reports', 
              icon: <BiBarChartAlt2 />
            },
            { 
              label: 'Booking Reports', 
              to: '/manager/reports/bookings', 
              icon: <BiFile />
            },
            { 
              label: 'Financial Reports', 
              to: '/manager/reports/financial', 
              icon: <BiMoney />
            },
            { 
              label: 'KPI Dashboard', 
              to: '/manager/reports/kpis', 
              icon: <BiTrendingUp />
            }
          ]
        }
      ]
    },
    {
      section: 'Staff & Performance',
      items: [
        { 
          label: 'Staff Performance', 
          to: '/manager/staff-performance', 
          icon: <BiUser />
        },
        { 
          label: 'Feedback & Reviews', 
          to: '/manager/feedback', 
          icon: <BiCommentDetail />
        }
      ]
    },
    {
      section: 'Communication',
      items: [
        { 
          label: 'Notifications', 
          to: '/manager/notifications', 
          icon: <BiBell />,
          badge: 2
        },
        { 
          label: 'Staff Messages', 
          to: '/manager/staff-messages',
          icon: <BiMessageSquareDetail />
        },
        { 
          label: 'Manager Inbox', 
          to: '/manager/inbox',
          icon: <BiEnvelope />
        }
      ]
    },
    {
      section: 'Settings',
      items: [
        { 
          label: 'Settings', 
          to: '/manager/settings',
          icon: <BiCog />
        }
      ]
    }
  ];

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId) => expandedMenus.includes(menuId);

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

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

        {/* Navigation Sections */}
        <nav className="mt-2 space-y-6 px-4">
          {navigationStructure.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Label */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {section.section}
              </div>
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {/* Parent Item (with or without children) */}
                    {item.children ? (
                      <button
                        onClick={() => toggleMenu(item.id)}
                        className="flex items-center w-full rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      >
                        <span className="mr-3 text-gray-400">{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isMenuExpanded(item.id) ? (
                          <BiChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                        ) : (
                          <BiChevronRight className="ml-2 h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    ) : (
                      <NavLink
                        to={item.to}
                        onClick={() => sidebarOpen && window.innerWidth < 1024 && setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center rounded px-3 py-2 text-sm font-medium transition ${
                            (item.exact ? location.pathname === item.to : isActiveRoute(item.to))
                              ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <span className="mr-3 text-gray-400">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    )}

                    {/* Nested Children */}
                    {item.children && isMenuExpanded(item.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <NavLink
                            key={childIndex}
                            to={child.to}
                            onClick={() => sidebarOpen && window.innerWidth < 1024 && setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center rounded px-3 py-2 text-sm font-medium transition ${
                                isActiveRoute(child.to)
                                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`
                            }
                          >
                            <span className="mr-3 text-gray-400 text-xs">{child.icon}</span>
                            <span>{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default ManagerSidebar;
