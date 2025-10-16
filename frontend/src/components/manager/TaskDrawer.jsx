import { motion, AnimatePresence } from "framer-motion";
import { X, User, Clock, MapPin, Sparkles, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { toast } from "sonner";

const priorityColors = {
  Low: "bg-info/20 text-info border-info/50",
  Normal: "bg-secondary/20 text-foreground border-border",
  High: "bg-warning/20 text-warning border-warning/50",
  Urgent: "bg-destructive/20 text-destructive border-destructive/50",
};

const suggestedStaff = [
  { name: "Maria Rodriguez", role: "Housekeeping Lead", match: 95, avatar: "Maria" },
  { name: "Sarah Williams", role: "Senior Housekeeper", match: 88, avatar: "Sarah" },
  { name: "Emily Davis", role: "Housekeeper", match: 82, avatar: "Emily" },
];

export const TaskDrawer = ({ task, open, onOpenChange, onApprove }) => {
  if (!task) return null;

  const handleApprove = () => {
    const staffName = task.suggestedStaff || suggestedStaff[0].name;

    toast.success("Task Assigned Successfully!", {
      description: `${task.title} has been assigned to ${staffName}`,
      duration: 3000,
    });

    if (onApprove) {
      onApprove(task.id, staffName);
    }

    onOpenChange(false);
  };

  const handleReassign = () => {
    toast.info("Reassignment Panel", {
      description: "Opening staff selection panel...",
      duration: 2000,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[500px] glass-card border-l border-border/50 z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>
                  <p className="text-sm text-muted-foreground">{task.department}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="hover:bg-secondary/80"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ManagerBadge className={`${priorityColors[task.priority]} text-sm`}>
                {task.priority} Priority
              </ManagerBadge>

              <ManagerSeparator />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {task.room ? `Room ${task.room}` : "General Area"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Today, 2:30 PM</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Estimated: 30 minutes</span>
                </div>
              </div>

              <ManagerSeparator />

              <div className="glass-card p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Guest Request</h3>
                <p className="text-sm text-muted-foreground">
                  Guest has requested immediate room cleaning with special attention to bathroom amenities.
                  Additional towels and fresh linens needed.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">AI Staff Recommendations</h3>
                </div>

                <div className="space-y-2">
                  {suggestedStaff.map((staff, index) => (
                    <motion.div
                      key={staff.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-3 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar}`} />
                          <AvatarFallback>{staff.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{staff.match}%</p>
                          <p className="text-xs text-muted-foreground">Match</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <ManagerSeparator />

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Assignment History</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-full bg-success/20">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Task Created</p>
                      <p className="text-xs text-muted-foreground">Today at 2:15 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  className="flex-1 gold-gradient text-background hover:opacity-90"
                >
                  <User className="w-4 h-4 mr-2" />
                  Approve Suggestion
                </Button>
                <Button
                  onClick={handleReassign}
                  variant="outline"
                  className="flex-1 border-border/50 hover:bg-secondary/80"
                >
                  Reassign
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
