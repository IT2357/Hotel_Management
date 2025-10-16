import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { useState } from "react";
import { TaskDrawer } from "./TaskDrawer";
import { Package } from "lucide-react";
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
  { id: "pending", title: "Pending", color: "border-warning/50 bg-warning/5" },
  { id: "inProgress", title: "In Progress", color: "border-info/50 bg-info/5" },
  { id: "completed", title: "Completed", color: "border-success/50 bg-success/5" },
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
            className={`glass-card p-4 border-t-4 ${column.color}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-foreground">{column.title}</h3>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-secondary/50 text-foreground">
                {tasks[column.id].length}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 space-y-3"
                >
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
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
