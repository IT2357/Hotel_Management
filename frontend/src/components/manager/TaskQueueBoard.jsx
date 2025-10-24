import { motion, AnimatePresence } from "framer-motion";
import { TaskQueueCard } from "./TaskQueueCard";
import { useState, useMemo, useEffect } from "react";
import { TaskDrawer } from "./TaskDrawer";
import { AlertCircle, CheckCircle2, Clock, Flame, Filter, ListChecks, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import {
  ManagerSelect,
  ManagerSelectContent,
  ManagerSelectItem,
  ManagerSelectTrigger,
  ManagerSelectValue,
} from "@/components/manager/ManagerSelect";

const SORT_OPTIONS = [
  { value: "priority", label: "Priority First", icon: Flame },
  { value: "dueDate", label: "Due Date", icon: Clock },
  { value: "aiMatch", label: "AI Match Score", icon: Zap },
  { value: "recent", label: "Most Recent", icon: TrendingUp },
];

const VIEW_TABS = [
  { id: "pending", label: "Pending", icon: Clock, count: 0, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { id: "awaitingAssignment", label: "🍽️ Need Assignment", icon: ListChecks, count: 0, color: "text-orange-400", bg: "bg-orange-500/10" }, // ✅ New tab
  { id: "inProgress", label: "In Progress", icon: AlertCircle, count: 0, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "completed", label: "Completed", icon: CheckCircle2, count: 0, color: "text-green-400", bg: "bg-green-500/10" },
];

const priorityOrder = { Urgent: 0, High: 1, Normal: 2, Low: 3 };

export const TaskQueueBoard = ({
  tasksByStatus,
  onTaskAssign,
  onTaskCancel,
  isLoading = false,
  emptyMessage = "No tasks available",
  pendingTaskForAssignment = null,
  onClearPendingTask = null,
}) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [sortBy, setSortBy] = useState("priority");

  const groupedTasks = useMemo(() => ({
    pending: tasksByStatus?.pending || [],
    awaitingAssignment: tasksByStatus?.awaitingAssignment || [], // ✅ New column
    inProgress: tasksByStatus?.inProgress || [],
    completed: tasksByStatus?.completed || [],
  }), [tasksByStatus]);

  const sortTasks = (tasks, sortMethod) => {
    const sorted = [...tasks];
    switch (sortMethod) {
      case "priority":
        return sorted.sort((a, b) => {
          const aPriority = priorityOrder[a.priorityLabel] ?? 2;
          const bPriority = priorityOrder[b.priorityLabel] ?? 2;
          return aPriority - bPriority;
        });
      case "dueDate":
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case "aiMatch":
        return sorted.sort((a, b) => (b.aiMatch || 0) - (a.aiMatch || 0));
      case "recent":
        return sorted.reverse();
      default:
        return sorted;
    }
  };

  const activeTasks = useMemo(() => {
    return sortTasks(groupedTasks[activeTab] || [], sortBy);
  }, [groupedTasks, activeTab, sortBy]);

  const tabs = useMemo(() => {
    return VIEW_TABS.map(tab => ({
      ...tab,
      count: groupedTasks[tab.id]?.length || 0,
    }));
  }, [groupedTasks]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleAssign = async (task, staff) => {
    if (onTaskAssign) {
      await onTaskAssign(task, staff);
    }
  };

  const handleQuickAssign = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const totalTasks = useMemo(() => {
    return Object.values(groupedTasks).reduce((sum, tasks) => sum + tasks.length, 0);
  }, [groupedTasks]);

  const urgentCount = useMemo(() => {
    return activeTasks.filter(task => 
      task.priorityLabel?.toLowerCase() === "urgent"
    ).length;
  }, [activeTasks]);

  // Auto-open drawer when a new task is created and pending for assignment
  useEffect(() => {
    if (pendingTaskForAssignment) {
      setSelectedTask(pendingTaskForAssignment);
      setDrawerOpen(true);
      setActiveTab("pending"); // Switch to pending tab
      if (onClearPendingTask) {
        onClearPendingTask();
      }
    }
  }, [pendingTaskForAssignment, onClearPendingTask]);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-white rounded-xl border-2 border-cyan-200 p-5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
              <ListChecks className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Tasks</p>
              <p className="text-3xl font-black text-gray-900">{totalTasks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-white rounded-xl border-2 border-yellow-200 p-5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Awaiting</p>
              <p className="text-3xl font-black text-gray-900">{groupedTasks.pending.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">In Progress</p>
              <p className="text-3xl font-black text-gray-900">{groupedTasks.inProgress.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-white rounded-xl border-2 border-rose-200 p-5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
              <Flame className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Urgent</p>
              <p className="text-3xl font-black text-gray-900">{urgentCount}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* View Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Tab Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-2 w-full lg:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colorMap = {
              pending: { active: "bg-yellow-600 text-white border-yellow-600", inactive: "bg-white text-gray-600 border-gray-300" },
              awaitingAssignment: { active: "bg-orange-600 text-white border-orange-600", inactive: "bg-white text-gray-600 border-gray-300" }, // ✅ Added for workflow tasks
              inProgress: { active: "bg-blue-600 text-white border-blue-600", inactive: "bg-white text-gray-600 border-gray-300" },
              completed: { active: "bg-green-600 text-white border-green-600", inactive: "bg-white text-gray-600 border-gray-300" },
            };
            const colors = colorMap[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-lg font-bold text-sm transition-all duration-200 whitespace-nowrap border-2 shadow-sm hover:shadow-md ${
                  isActive ? colors.active : colors.inactive + " hover:border-gray-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
                <span className={`px-2.5 py-1 rounded-md text-xs font-black ${
                  isActive ? "bg-white/20" : "bg-gray-100"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border-2 border-gray-200 shadow-sm">
          <Filter className="h-5 w-5 text-indigo-600" />
          <ManagerSelect value={sortBy} onValueChange={setSortBy}>
            <ManagerSelectTrigger className="w-[200px] border-none bg-transparent text-gray-900 font-bold">
              <ManagerSelectValue placeholder="Sort by..." />
            </ManagerSelectTrigger>
            <ManagerSelectContent className="border-gray-300 bg-white text-gray-900">
              {SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <ManagerSelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2.5 font-semibold">
                      <Icon className="h-4 w-4 text-indigo-600" />
                      {option.label}
                    </div>
                  </ManagerSelectItem>
                );
              })}
            </ManagerSelectContent>
          </ManagerSelect>
        </div>
      </div>

      {/* Task Queue */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div
                key={`skeleton-${index}`}
                className="animate-pulse rounded-xl bg-white border-2 border-gray-200 p-6 shadow-md"
              >
                <div className="h-2 w-full bg-gray-200 rounded mb-4" />
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                    <div className="h-20 w-full rounded-lg bg-gray-100 mt-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTasks.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activeTasks.map((task, index) => (
                <TaskQueueCard
                  key={task.id}
                  task={task}
                  onAssign={handleQuickAssign}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center mb-5 shadow-sm">
              <ListChecks className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {VIEW_TABS.find(t => t.id === activeTab)?.label} Tasks
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              {emptyMessage}
            </p>
          </motion.div>
        )}
      </div>

      {/* Task Assignment Drawer */}
      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAssign={handleAssign}
        onCancel={onTaskCancel}
      />
    </div>
  );
};
