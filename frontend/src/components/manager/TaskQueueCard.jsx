import { motion } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle2, MapPin, Calendar, Timer, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";

const priorityConfig = {
  Urgent: {
    gradient: "from-red-50 to-rose-50",
    border: "border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    badge: "bg-red-600 text-white",
    accentBar: "bg-red-500"
  },
  High: {
    gradient: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    badge: "bg-orange-600 text-white",
    accentBar: "bg-orange-500"
  },
  Normal: {
    gradient: "from-sky-50 to-blue-50",
    border: "border-sky-200",
    icon: Clock,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-100",
    badge: "bg-sky-600 text-white",
    accentBar: "bg-sky-500"
  },
  Low: {
    gradient: "from-gray-50 to-slate-50",
    border: "border-gray-200",
    icon: Clock,
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
    badge: "bg-gray-600 text-white",
    accentBar: "bg-gray-500"
  }
};

const statusConfig = {
  pending: {
    label: "Awaiting Assignment",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    border: "border-yellow-200",
    icon: Clock
  },
  inProgress: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-100",
    border: "border-blue-200",
    icon: Timer
  },
  completed: {
    label: "Completed",
    color: "text-green-700",
    bg: "bg-green-100",
    border: "border-green-200",
    icon: CheckCircle2
  }
};

export const TaskQueueCard = ({ task, onAssign, index = 0 }) => {
  const resolvePriorityKey = (priority) => {
    if (!priority) return "Normal";
    const normalized = String(priority).toLowerCase();
    if (normalized === "low") return "Low";
    if (normalized === "medium" || normalized === "normal") return "Normal";
    if (normalized === "high") return "High";
    if (normalized === "urgent" || normalized === "critical") return "Urgent";
    return "Normal";
  };

  const priorityKey = resolvePriorityKey(task?.priority || task?.priorityLabel);
  const config = priorityConfig[priorityKey];
  const PriorityIcon = config.icon;
  
  const statusKey = task?.statusKey || "pending";
  const status = statusConfig[statusKey];
  const StatusIcon = status.icon;

  const suggestedStaff = task?.suggestedStaff || task?.assignedStaffName || "No assignment";
  const aiMatch = Number.isFinite(task?.aiMatch) ? task.aiMatch : task?.matchScore || 0;
  const locationLabel = task?.room || task?.locationLabel;

  const formatTimeAgo = (date) => {
    if (!date) return null;
    const now = new Date();
    const target = new Date(date);
    const diffMs = target - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs < 0) {
      return <span className="text-rose-400 font-bold">Overdue</span>;
    }
    if (diffHours < 1) {
      return <span className="text-amber-400 font-bold">{diffMins}m remaining</span>;
    }
    if (diffHours < 24) {
      return <span className={diffHours < 4 ? "text-amber-400 font-bold" : "text-cyan-400"}>{diffHours}h {diffMins}m</span>;
    }
    return <span className="text-slate-400">{Math.floor(diffHours / 24)}d</span>;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`relative bg-white rounded-xl border-2 ${config.border} shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden`}
    >
      {/* Colored Top Bar */}
      <div className={`h-2 ${config.accentBar}`} />

      {/* Content */}
      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-4">
          {/* Priority Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            <PriorityIcon className={`h-6 w-6 ${config.iconColor}`} />
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2">
                {task?.title || "Untitled Task"}
              </h3>
              <ManagerBadge className={`${config.badge} text-xs font-bold px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm`}>
                {priorityKey}
              </ManagerBadge>
            </div>

            {/* Meta Information */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium border border-gray-200">
                {task?.department || "General"}
              </span>
              {locationLabel && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                  <MapPin className="h-3 w-3" />
                  {locationLabel}
                </span>
              )}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${status.bg} ${status.color} border ${status.border} font-medium`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {task?.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* AI Recommendation Section */}
        {statusKey === "pending" && (
          <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-indigo-600 font-bold mb-1 uppercase tracking-wider">✨ AI Recommended</p>
                <p className="text-sm text-gray-900 font-bold truncate">{suggestedStaff}</p>
              </div>
              {aiMatch > 0 && (
                <div className="flex-shrink-0 text-center px-3 py-1 rounded-lg bg-indigo-600">
                  <p className="text-[10px] text-indigo-100 font-bold uppercase">Match</p>
                  <p className="text-lg font-black text-white">{aiMatch}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
          {/* Time Information */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {task?.dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {formatTimeAgo(task.dueDate)}
                </span>
              </div>
            )}
            {task?.estimatedDuration && (
              <div className="flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{task.estimatedDuration}h</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {statusKey === "pending" && (
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-bold px-5 py-2.5 shadow-md hover:shadow-lg rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onAssign?.(task);
              }}
            >
              Assign Task
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
