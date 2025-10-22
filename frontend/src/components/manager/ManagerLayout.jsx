import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManagerNavbar } from "./ManagerNavbar";
import { Sidebar } from "./Sidebar";

const DEFAULT_BACKGROUND = "bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30";

const menuRoutes = {
  dashboard: "/manager",
  tasks: "/manager/tasks",
  staff: "/manager/staff",
  feedback: "/manager/feedback",
  reports: "/manager/reports",
  profile: "/manager/profile",
};

const mergeClasses = (...values) => values.filter(Boolean).join(" ");

const ManagerLayout = ({
  children,
  activeItem = "dashboard",
  onSidebarToggle,
  onMenuItemSelect,
  contentClassName,
  backgroundClassName = DEFAULT_BACKGROUND,
  defaultCollapsed = false,
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggleSidebar = useCallback(() => {
    setIsCollapsed((previous) => {
      const next = !previous;
      if (onSidebarToggle) {
        onSidebarToggle(next);
      }
      return next;
    });
  }, [onSidebarToggle]);

  const handleMenuItemClick = useCallback(
    (item) => {
      if (onMenuItemSelect) {
        const shouldContinue = onMenuItemSelect(item);
        if (shouldContinue === false) {
          return;
        }
      }

      const target = menuRoutes[item.id];
      if (target) {
        navigate(target);
      }
    },
    [navigate, onMenuItemSelect]
  );

  return (
    <div className={mergeClasses("min-h-screen", backgroundClassName)}>
      <ManagerNavbar onToggleSidebar={handleToggleSidebar} />

      <div className="mt-[88px] flex w-full">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={handleToggleSidebar}
          activeItem={activeItem}
          onItemClick={handleMenuItemClick}
        />

        <main className={mergeClasses("flex-1 overflow-y-auto p-6", contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
