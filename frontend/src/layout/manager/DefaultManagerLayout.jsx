import { useState, useRef } from 'react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import { NotificationProvider } from '../../context/NotificationContext';

export default function DefaultManagerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleRef = useRef(null); // Ensure ref is initialized

  return (
    <NotificationProvider>
      <div className="dark:bg-gray-900 dark:text-gray-200 h-screen overflow-hidden">
        <div className="flex h-full">
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

            {/* Main Content Area */}
            <main className="">
              {children}
            </main>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}