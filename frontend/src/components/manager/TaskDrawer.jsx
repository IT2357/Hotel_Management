import { motion, AnimatePresence } from "framer-motion";
import { X, User, Clock, MapPin, Sparkles, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { toast } from "sonner";

const priorityStyles = {
  Low: "border-[#38bdf8]/40 bg-[#102a46] text-[#38bdf8]",
  Normal: "border-[#1b335f] bg-[#132b4f] text-[#f5f7ff]",
  High: "border-[#facc15]/45 bg-[#2a230d] text-[#facc15]",
  Urgent: "border-[#f87171]/45 bg-[#35131f] text-[#f87171]",
};

const fallbackRecommendedStaff = [
  { name: "Maria Rodriguez", role: "Housekeeping Lead", match: 95, avatar: "Maria" },
  { name: "Sarah Williams", role: "Senior Housekeeper", match: 88, avatar: "Sarah" },
  { name: "Emily Davis", role: "Housekeeper", match: 82, avatar: "Emily" },
];

const resolvePriorityKey = (priority) => {
  if (!priority) return "Normal";
  const normalized = String(priority).toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "medium" || normalized === "normal") return "Normal";
  if (normalized === "high") return "High";
  if (normalized === "urgent" || normalized === "critical") return "Urgent";
  return "Normal";
};

const formatDateTime = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleString();
};

const formatDuration = (minutes) => {
  if (!minutes || Number(minutes) <= 0) return "Estimate pending";
  const total = Math.round(Number(minutes));
  if (total < 60) return `${total} minutes`;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!remainder) return `${hours} hours`;
  return `${hours}h ${remainder}m`;
};

export const TaskDrawer = ({ task, open, onOpenChange, onApprove }) => {
  if (!task) return null;

  const recommendedStaff = task?.recommendedStaff?.length ? task.recommendedStaff : fallbackRecommendedStaff;
  const assignmentHistory = task?.rawTask?.assignmentHistory || [];
  const notes = task?.rawTask?.notes || [];
  const locationLabel = task?.locationLabel || task?.room || "General Area";
  const dueDateLabel = task?.dueDateLabel || formatDateTime(task?.dueDate || task?.rawTask?.dueDate);
  const estimatedDurationLabel = formatDuration(task?.estimatedDuration || task?.rawTask?.estimatedDuration);
  const description = task?.description || task?.rawTask?.description || "No additional notes provided for this task.";
  const priorityKey = resolvePriorityKey(task?.priority || task?.priorityLabel);

  const handleApprove = () => {
    const staffName = task?.assignedStaffName || task?.suggestedStaff || recommendedStaff[0]?.name || "Preferred staff";

    toast.success("Task Assigned Successfully!", {
      description: `${task?.title || "Task"} has been assigned to ${staffName}`,
      duration: 3000,
    });

    if (onApprove) {
      onApprove(task, staffName);
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
            className="fixed inset-0 z-50 bg-[#030711]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-[#1b2d54] bg-[#06122b]/95 shadow-[0_-12px_40px_rgba(8,12,24,0.6)] md:w-[500px]"
          >
            <div className="space-y-6 p-6 text-[#d6e2ff]">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <h2 className="text-2xl font-bold text-[#f5f7ff]">{task?.title || "Task Details"}</h2>
                  <p className="text-sm text-[#8ba3d0]">{task?.department || "General"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-[#a6b8e3] hover:bg-[#132444]"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <ManagerBadge className={`${priorityStyles[priorityKey] || priorityStyles.Normal} text-sm`}>
                {(task?.priorityLabel || task?.priority || "Normal") + " Priority"}
              </ManagerBadge>

              <ManagerSeparator />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#a6b8e3]">
                  <MapPin className="h-4 w-4 text-[#5f7ac0]" />
                  <span className="text-[#dfe8ff]">{locationLabel}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#a6b8e3]">
                  <Calendar className="h-4 w-4 text-[#5f7ac0]" />
                  <span className="text-[#dfe8ff]">{dueDateLabel}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#a6b8e3]">
                  <Clock className="h-4 w-4 text-[#5f7ac0]" />
                  <span className="text-[#dfe8ff]">Estimated: {estimatedDurationLabel}</span>
                </div>
              </div>

              <ManagerSeparator />

              <div className="space-y-2 rounded-2xl border border-[#1b335f] bg-[#0e1f42] p-4 shadow-[0_12px_30px_rgba(8,14,29,0.55)]">
                <h3 className="text-sm font-semibold text-[#f5f7ff]">Task Description</h3>
                <p className="text-sm text-[#8ba3d0]">{description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#facc15]" />
                  <h3 className="font-semibold text-[#f5f7ff]">AI Staff Recommendations</h3>
                </div>

                <div className="space-y-2">
                  {recommendedStaff.map((staff, index) => (
                    <motion.div
                      key={`${staff.name}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="cursor-pointer rounded-2xl border border-transparent bg-[#0f203f] p-3 transition-all duration-300 hover:border-[#facc15]/60 hover:bg-[#13264a]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staff.avatar || staff.name)}`} />
                          <AvatarFallback>{staff.name?.[0] || "S"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#f5f7ff]">{staff.name}</p>
                          <p className="text-xs text-[#8ba3d0]">{staff.role || "Available staff"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#facc15]">{staff.match ? `${staff.match}%` : "--"}</p>
                          <p className="text-xs text-[#8ba3d0]">Match</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <ManagerSeparator />

              <div className="space-y-3">
                <h3 className="font-semibold text-[#f5f7ff]">Assignment History</h3>
                <div className="space-y-3">
                  {assignmentHistory.length === 0 && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-[#0f3a32] p-1">
                        <CheckCircle2 className="h-3 w-3 text-[#34d399]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#f5f7ff]">Task Created</p>
                        <p className="text-xs text-[#8ba3d0]">{formatDateTime(task?.rawTask?.createdAt)}</p>
                      </div>
                    </div>
                  )}

                  {assignmentHistory.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-[#0f3a32] p-1">
                        <CheckCircle2 className="h-3 w-3 text-[#34d399]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#f5f7ff]">
                          Assigned to {entry?.assignedTo?.name || entry?.assignedTo?.fullName || "staff member"}
                        </p>
                        <p className="text-xs text-[#8ba3d0]">{formatDateTime(entry?.assignedAt)}</p>
                      </div>
                    </div>
                  ))}

                  {notes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#f5f7ff]">Notes</h4>
                      {notes.map((item, index) => (
                        <p key={index} className="text-xs text-[#8ba3d0]">{item?.content}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  className="flex-1 bg-[#facc15] text-[#0b1b3c] transition-colors hover:bg-[#f9c513]"
                >
                  <User className="mr-2 h-4 w-4" />
                  Approve Suggestion
                </Button>
                <Button
                  onClick={handleReassign}
                  variant="outline"
                  className="flex-1 border border-[#1b335f] bg-[#0f2145] text-[#d6e2ff] transition-colors hover:bg-[#142b52]"
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
