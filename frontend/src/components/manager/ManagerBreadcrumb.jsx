import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';

const ManagerBreadcrumb = ({ customBreadcrumbs = null, showBackButton = true, backUrl = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route mapping for breadcrumb labels
  const routeLabels = {
    'manager': 'Manager',
    'dashboard': 'Dashboard',
    'task-management': 'Task Management',
    'tasks': 'Tasks',
    'create': 'Create',
    'assign': 'Assign',
    'feedback': 'Feedback',
    'staff-workload': 'Staff Workload',
    'reports': 'Reports & Analytics',
    'bookings': 'Booking Reports',
    'financial': 'Financial Reports',
    'kpis': 'KPI Dashboard',
    'view': 'View Report',
    'staff-performance': 'Staff Performance',
    'notifications': 'Notifications',
    'settings': 'Settings',
    'inbox': 'Inbox',
    'staff-messages': 'Staff Messages'
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [];

    // Always start with Manager Home
    breadcrumbs.push({
      label: 'Home',
      path: '/manager',
      icon: Home
    });

    let currentPath = '';
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the first 'manager' segment as it's already included
      if (segment === 'manager') return;

      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === pathnames.length - 1;

      breadcrumbs.push({
        label,
        path: isLast ? null : currentPath, // Last item should not be clickable
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleBackClick = () => {
    if (backUrl) {
      navigate(backUrl);
    } else if (breadcrumbs.length > 1) {
      // Navigate to the previous breadcrumb
      const previousBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
      if (previousBreadcrumb?.path) {
        navigate(previousBreadcrumb.path);
      } else {
        navigate(-1);
      }
    } else {
      navigate('/manager');
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => {
            const Icon = breadcrumb.icon;
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
                
                {breadcrumb.path ? (
                  <Link
                    to={breadcrumb.path}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className={`flex items-center ${isLast ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {breadcrumb.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Back Button */}
        {showBackButton && breadcrumbs.length > 1 && (
          <button
            onClick={handleBackClick}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ManagerBreadcrumb;