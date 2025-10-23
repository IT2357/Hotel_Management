import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { useMemo, useState } from "react";
import { TaskDrawer } from "./TaskDrawer";
import { Package, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const columns = [
  {
    id: "pending",
    title: "Pending",
    icon: Clock,
    iconClass: "h-4 w-4 text-blue-600",
    iconBg: "bg-blue-50",
    badgeClass: "bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold",
    shellClass: "rounded-xl bg-gray-50 border border-gray-200 p-3",
  },
  {
    id: "inProgress",
    title: "In Progress",
    icon: AlertCircle,
    iconClass: "h-4 w-4 text-yellow-600",
    iconBg: "bg-yellow-50",
    badgeClass: "bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold",
    shellClass: "rounded-xl bg-gray-50 border border-gray-200 p-3",
  },
  {
    id: "completed",
    title: "Completed",
    icon: CheckCircle,
    iconClass: "h-4 w-4 text-green-600",
    iconBg: "bg-green-50",
    badgeClass: "bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold",
    shellClass: "rounded-xl bg-gray-50 border border-gray-200 p-3",
  },
  {
    id: "cancelled",
    title: "Cancelled",
    icon: XCircle,
    iconClass: "h-4 w-4 text-red-600",
    iconBg: "bg-red-50",
    badgeClass: "bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold",
    shellClass: "rounded-xl bg-gray-50 border border-gray-200 p-3",
  },
];

export const KanbanBoard = ({
  tasksByStatus,
  onTaskAssign,
  onTaskSelect,
  isLoading = false,
  emptyMessage = "No tasks yet",
}) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groupedTasks = useMemo(() => ({
    pending: tasksByStatus?.pending || [],
    inProgress: tasksByStatus?.inProgress || [],
    completed: tasksByStatus?.completed || [],
    cancelled: tasksByStatus?.cancelled || [],
  }), [tasksByStatus]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
    onTaskSelect?.(task);
  };

  const handleAssign = async (task, staff) => {
    if (onTaskAssign) {
      await onTaskAssign(task, staff);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {columns.map((column, columnIndex) => {
          const Icon = column.icon;
          const taskCount = groupedTasks[column.id]?.length || 0;

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.1 }}
              className={column.shellClass}
            >
              {/* Column Header - exactly like image */}
              <div className="flex items-center gap-2 mb-3 bg-white rounded-lg p-2.5 border border-gray-200">
                <div className={`w-7 h-7 rounded-md ${column.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={column.iconClass} />
                </div>
                <span className="text-sm font-medium text-gray-900 flex-1">
                  {column.title}
                </span>
                <span className={column.badgeClass}>
                  {taskCount}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[0, 1].map((index) => (
                      <div
                        key={`${column.id}-skeleton-${index}`}
                        className="animate-pulse rounded-lg bg-white p-3 border border-gray-200"
                      >
                        <div className="h-3 w-3/4 rounded bg-gray-200 mb-2" />
                        <div className="h-2 w-1/2 rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                ) : taskCount > 0 ? (
                  groupedTasks[column.id].map((task, index) => (
                    <motion.div
                      key={task.id || `${column.id}-${index}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <TaskCard task={task} onClick={() => handleTaskClick(task)} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-6 text-center bg-white rounded-lg border border-gray-200"
                  >
                    <Icon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                      {column.id === "completed" ? "No tasks in completed" : column.id === "cancelled" ? "No tasks in cancelled" : "No tasks"}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAssign={handleAssign}
      />
    </>
  );
};
