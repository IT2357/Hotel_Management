import { useState, useRef } from 'react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import { NotificationProvider } from '../../context/NotificationContext';
import { ManagerBreadcrumb } from '../../components/manager';

export default function DefaultManagerLayout({ 
  children, 
  showBreadcrumb = true, 
  customBreadcrumbs = null,
  backUrl = null 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleRef = useRef(null); // Ensure ref is initialized

  return (
    <NotificationProvider>
      <div className="dark:bg-gray-900 dark:text-gray-200 min-h-screen bg-gray-50">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <ManagerSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            toggleRef={toggleRef}
          />

          {/* Content Area */}
          <div className="flex flex-col flex-1">
            <ManagerHeader
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              toggleRef={toggleRef}
            />

            {/* Breadcrumb Navigation */}
            {showBreadcrumb && (
              <ManagerBreadcrumb 
                customBreadcrumbs={customBreadcrumbs}
                backUrl={backUrl}
              />
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}