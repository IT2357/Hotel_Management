import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { useMemo, useState } from "react";
import { TaskDrawer } from "./TaskDrawer";
import { Package, Clock, User, CheckCircle } from "lucide-react";

const columns = [
  {
    id: "pending",
    title: "Pending",
    accent: "text-rose-200",
    chipBg: "bg-gradient-to-br from-rose-500/40 via-pink-500/35 to-fuchsia-500/30 border border-rose-300/60 shadow-lg shadow-rose-400/30",
    shellClass: "border border-rose-400/50 bg-gradient-to-br from-rose-950/70 via-pink-950/60 to-slate-900/80 hover:border-rose-300/70 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300",
    icon: <Clock className="h-5 w-5 text-rose-200" />,
    badge: "Queued",
    badgeClass: "bg-gradient-to-r from-rose-500/60 to-pink-500/50 text-rose-50 border border-rose-300/60 shadow-md text-[10px] font-bold uppercase tracking-wide px-3 py-1"
  },
  {
    id: "inProgress",
    title: "In Progress",
    accent: "text-sky-200",
    chipBg: "bg-gradient-to-br from-sky-500/40 via-blue-500/35 to-indigo-500/30 border border-sky-300/60 shadow-lg shadow-sky-400/30",
    shellClass: "border border-sky-400/50 bg-gradient-to-br from-sky-950/70 via-blue-950/60 to-slate-900/80 hover:border-sky-300/70 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300",
    icon: <User className="h-5 w-5 text-sky-200" />,
    badge: "Active",
    badgeClass: "bg-gradient-to-r from-sky-500/60 to-blue-500/50 text-sky-50 border border-sky-300/60 shadow-md text-[10px] font-bold uppercase tracking-wide px-3 py-1"
  },
  {
    id: "completed",
    title: "Completed",
    accent: "text-lime-200",
    chipBg: "bg-gradient-to-br from-lime-500/40 via-green-500/35 to-emerald-500/30 border border-lime-300/60 shadow-lg shadow-lime-400/30",
    shellClass: "border border-lime-400/50 bg-gradient-to-br from-lime-950/70 via-green-950/60 to-slate-900/80 hover:border-lime-300/70 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300",
    icon: <CheckCircle className="h-5 w-5 text-lime-200" />,
    badge: "Done",
    badgeClass: "bg-gradient-to-r from-lime-500/60 to-green-500/50 text-lime-50 border border-lime-300/60 shadow-md text-[10px] font-bold uppercase tracking-wide px-3 py-1"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column, columnIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.1 }}
            className={`space-y-4 rounded-2xl p-5 shadow-xl transition-all duration-300 ${column.shellClass}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${column.chipBg}`}>
                  {column.icon}
                </div>
                <div>
                  <h3 className={`text-base font-bold ${column.accent}`}>{column.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">{groupedTasks[column.id].length} tasks</p>
                </div>
              </div>
              <span className={`rounded-lg ${column.badgeClass}`}>
                {column.badge}
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={`${column.id}-skeleton-${index}`}
                      className="animate-pulse rounded-xl border border-slate-700/60 bg-slate-800/50 p-4"
                    >
                      <div className="h-4 w-3/4 rounded bg-slate-700/70" />
                      <div className="mt-3 h-3 w-1/2 rounded bg-slate-700/50" />
                      <div className="mt-4 h-12 rounded-lg bg-slate-700/30" />
                    </div>
                  ))}
                </div>
              ) : groupedTasks[column.id].length > 0 ? (
                groupedTasks[column.id].map((task, index) => (
                  <motion.div
                    key={task.id || `${column.id}-${index}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TaskCard task={task} onClick={() => handleTaskClick(task)} />
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 py-14 text-center">
                  <div className="mx-auto w-16 h-16 rounded-xl bg-slate-800/40 flex items-center justify-center border border-slate-700/40">
                    <Package className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
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
