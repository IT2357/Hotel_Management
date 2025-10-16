import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { useState } from "react";
import { TaskDrawer } from "./TaskDrawer";
import { Package, Clock, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const initialTasks = {
  pending: [
    { id: "1", title: "Room 307 Cleaning", department: "Housekeeping", priority: "High", suggestedStaff: "Maria Rodriguez", aiMatch: 95, room: "307" },
    { id: "2", title: "Pool Maintenance", department: "Maintenance", priority: "Normal", suggestedStaff: "John Smith", aiMatch: 88 },
    { id: "3", title: "Guest Request - Extra Towels", department: "Front Desk", priority: "Urgent", suggestedStaff: "Lisa Chen", aiMatch: 92, room: "512" },
  ],
  inProgress: [
    { id: "4", title: "Kitchen Equipment Check", department: "Kitchen", priority: "Normal", suggestedStaff: "Carlos Martinez", aiMatch: 90 },
    { id: "5", title: "Room 205 AC Repair", department: "Maintenance", priority: "High", suggestedStaff: "Mike Johnson", aiMatch: 87, room: "205" },
  ],
  completed: [
    { id: "6", title: "Lobby Cleaning", department: "Housekeeping", priority: "Normal", suggestedStaff: "Sarah Williams", aiMatch: 94 },
    { id: "7", title: "Room 410 Setup", department: "Housekeeping", priority: "Low", suggestedStaff: "Emily Davis", aiMatch: 89, room: "410" },
  ],
};

const columns = [
  {
    id: "pending",
    title: "Pending",
    accent: "text-[#facc15]",
    chipBg: "bg-[#2a2f45]",
    shellClass: "border-[#1b335f] bg-gradient-to-b from-[#14284d] via-[#112244] to-[#0b1c36]",
    icon: <Clock className="h-4 w-4 text-[#facc15]" />,
  },
  {
    id: "inProgress",
    title: "In Progress",
    accent: "text-[#f97316]",
    chipBg: "bg-[#2a230f]",
    shellClass: "border-[#5f4a1b] bg-gradient-to-b from-[#251f14] via-[#1b160f] to-[#0f0d09]",
    icon: <User className="h-4 w-4 text-[#f97316]" />,
  },
  {
    id: "completed",
    title: "Completed",
    accent: "text-[#34d399]",
    chipBg: "bg-[#123338]",
    shellClass: "border-[#2f6f64] bg-gradient-to-b from-[#163f44] via-[#12353d] to-[#0d2933]",
    icon: <CheckCircle className="h-4 w-4 text-[#34d399]" />,
  },
];

export const KanbanBoard = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleApprove = (taskId, staffName) => {
    // Move task from pending to inProgress
    setTasks((prev) => {
      const newTasks = { ...prev };
      // Find and remove task from pending
      const taskIndex = newTasks.pending.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        const [movedTask] = newTasks.pending.splice(taskIndex, 1);
        // Add to inProgress
        newTasks.inProgress.push(movedTask);
        toast.success("Task moved to In Progress", {
          description: `${movedTask.title} is now being handled by ${staffName}`,
        });
      }
      return newTasks;
    });
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
            className={`space-y-4 rounded-3xl border-2 p-4 text-[#d6e2ff] shadow-[0_18px_46px_rgba(8,14,29,0.6)] ${column.shellClass}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${column.chipBg}`}>
                  {column.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#f5f7ff]">{column.title}</h3>
                  <p className="text-xs text-[#8ba3d0]">{tasks[column.id].length} tasks</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${column.accent}`}>
                {column.title === "Pending" ? "Queued" : column.title === "In Progress" ? "Active" : "Completed"}
              </span>
            </div>

            <div className="space-y-3">
              {tasks[column.id].length > 0 ? (
                tasks[column.id].map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TaskCard task={task} onClick={() => handleTaskClick(task)} />
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-[#1f355d]" />
                  <p className="text-sm text-[#8ba3d0]">No tasks yet</p>
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
        onApprove={handleApprove}
      />
    </>
  );
};
