import { useState, useRef } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { NotificationProvider } from '../../context/NotificationContext';

export default function DefaultAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleRef = useRef();

  return (
    <NotificationProvider>
      <div className="dark:bg-gray-900 dark:text-gray-200 h-screen overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <AdminSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            toggleRef={toggleRef}
          />

          {/* Content Area */}
          <div className="flex flex-col flex-1">
            <AdminHeader
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              toggleRef={toggleRef}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 lg:pl-16">
              {children}
            </main>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}