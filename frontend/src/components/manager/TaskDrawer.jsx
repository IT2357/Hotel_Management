import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Users, Clock, MapPin, Sparkles, CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { toast } from "sonner";
import { taskAPI } from "@/services/taskManagementAPI";

const priorityStyles = {
  Low: "border-[#38bdf8]/40 bg-[#102a46] text-[#38bdf8]",
  Normal: "border-[#1b335f] bg-[#132b4f] text-[#f5f7ff]",
  High: "border-[#facc15]/45 bg-[#2a230d] text-[#facc15]",
  Urgent: "border-[#f87171]/45 bg-[#35131f] text-[#f87171]",
};

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

const getStaffKey = (staff) => {
  if (!staff) return null;
  if (staff.staffId) return String(staff.staffId);
  if (staff._id) return String(staff._id);
  if (staff.id) return String(staff.id);
  if (staff.userId) return String(staff.userId);
  if (staff.email) return `email:${String(staff.email).toLowerCase()}`;
  if (staff.name) return `name:${String(staff.name).toLowerCase()}`;
  if (staff.fullName) return `name:${String(staff.fullName).toLowerCase()}`;
  return null;
};

const normalizeStaffRecord = (staff, fallbackRole) => ({
  staffId: staff?.staffId || staff?._id || staff?.id || staff?.userId || null,
  name: staff?.name || staff?.fullName || staff?.assignedName || null,
  email: staff?.email || null,
  phone: staff?.phone || staff?.contactNumber || staff?.mobile || null,
  role: staff?.role || staff?.position || fallbackRole || "Staff Member",
  department: staff?.department,
  match:
    typeof staff?.match === "number"
      ? Math.round(staff.match)
      : typeof staff?.aiMatch === "number"
        ? Math.round(staff.aiMatch)
        : undefined,
  avatar: staff?.avatar || staff?.name || staff?.fullName || staff?.assignedName || undefined,
});

const collectRecommendedStaff = (task) => {
  if (!Array.isArray(task?.recommendedStaff)) {
    return [];
  }

  return task.recommendedStaff
    .filter(Boolean)
    .map((member) => normalizeStaffRecord(member, task?.department))
    .filter((member) => Boolean(member.name));
};

const collectAssignmentHistory = (task) =>
  Array.isArray(task?.rawTask?.assignmentHistory) ? task.rawTask.assignmentHistory : [];

const collectNotes = (task) => {
  const rawNotes = task?.rawTask?.notes;
  if (!rawNotes) return [];

  if (Array.isArray(rawNotes)) {
    return rawNotes
      .filter((note) => note?.content)
      .map((note) => ({ source: note?.author || "Note", content: note.content }));
  }

  return Object.entries(rawNotes)
    .filter(([, value]) => Boolean(value))
    .map(([source, content]) => ({ source, content }));
};

export const TaskDrawer = ({ task, open, onOpenChange, onAssign }) => {
  if (!task) return null;

  const [departmentStaff, setDepartmentStaff] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState("");
  const [assigningStaffId, setAssigningStaffId] = useState(null);
  const [staffReloadToken, setStaffReloadToken] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const lastTaskIdRef = useRef(null); // Track last task id to preserve selection behavior

  const recommendedStaff = useMemo(() => collectRecommendedStaff(task), [task]);
  const assignmentHistory = useMemo(() => collectAssignmentHistory(task), [task]);
  const noteEntries = useMemo(() => collectNotes(task), [task]);
  const taskIdentifier = useMemo(() => task?.id || task?.rawTask?._id || task?.rawTask?.id || null, [task]);

  useEffect(() => {
    let ignore = false;

    if (!open || !task?.department) {
      setDepartmentStaff([]);
      setDepartmentError("");
      return () => {
        ignore = true;
      };
    }

    const fetchDepartmentStaff = async () => {
      setDepartmentLoading(true);

      try {
        const response = await taskAPI.getAvailableStaff(task.department);
        const payload = response?.data?.data || response?.data || response;
        const normalized = Array.isArray(payload)
          ? payload
              .filter(Boolean)
              .map((member) => normalizeStaffRecord(member, task.department))
              .filter((member) => member.name)
          : [];

        if (!ignore) {
          setDepartmentStaff(normalized);
          setDepartmentError("");
        }
      } catch (error) {
        if (!ignore) {
          const message = error?.response?.data?.message || error.message || "Failed to load staff";
          setDepartmentError(message);
          setDepartmentStaff([]);
        }
      } finally {
        if (!ignore) {
          setDepartmentLoading(false);
        }
      }
    };

    fetchDepartmentStaff();

    return () => {
      ignore = true;
    };
  }, [open, task?.department, staffReloadToken]);

  const recommendedIds = useMemo(() => {
    const ids = new Set();
    recommendedStaff.forEach((member) => {
      if (member.staffId) ids.add(String(member.staffId));
    });
    return ids;
  }, [recommendedStaff]);

  const departmentOptions = useMemo(
    () =>
      departmentStaff.filter((member) => {
        if (!member.staffId) return true;
        return !recommendedIds.has(String(member.staffId));
      }),
    [departmentStaff, recommendedIds],
  );

  const autoAssignCandidate = useMemo(() => {
    const preferred = recommendedStaff.find((member) => member.staffId);
    if (preferred) return preferred;
    return departmentStaff.find((member) => member.staffId) || null;
  }, [recommendedStaff, departmentStaff]);

  useEffect(() => {
    if (!open) {
      setSelectedStaff(null);
      lastTaskIdRef.current = null;
      return;
    }

    if (taskIdentifier && taskIdentifier !== lastTaskIdRef.current) {
      lastTaskIdRef.current = taskIdentifier;
      setSelectedStaff(autoAssignCandidate || null);
      return;
    }

    if (!selectedStaff && autoAssignCandidate) {
      setSelectedStaff(autoAssignCandidate);
    }
  }, [open, taskIdentifier, autoAssignCandidate, selectedStaff]);

  const selectedStaffKey = useMemo(() => getStaffKey(selectedStaff), [selectedStaff]);

  const locationLabel = task?.locationLabel || task?.room || "General Area";
  const dueDateLabel = task?.dueDateLabel || formatDateTime(task?.dueDate || task?.rawTask?.dueDate);
  const estimatedDurationLabel = formatDuration(task?.estimatedDuration || task?.rawTask?.estimatedDuration);
  const description = task?.description || task?.rawTask?.description || "No additional notes provided for this task.";
  const priorityKey = resolvePriorityKey(task?.priority || task?.priorityLabel);
  const autoAssignLabel = autoAssignCandidate?.name?.split(" ")[0] || "best match";
  const selectedStaffName = selectedStaff?.name
    ? selectedStaff.name.split(" ")[0]
    : selectedStaff?.email || "Staff";
  const isAssigningSelected = Boolean(selectedStaffKey && assigningStaffId === selectedStaffKey);
  const autoAssignKey = useMemo(() => getStaffKey(autoAssignCandidate), [autoAssignCandidate]);

  const handleAssignStaff = async (staff) => {
    if (!staff?.staffId) {
      toast.error("Staff account incomplete", {
        description: "Only staff members with active accounts can receive assignments.",
      });
      return;
    }

    if (!onAssign) {
      toast.error("Assignment unavailable", {
        description: "No handler was provided to process this assignment.",
      });
      return;
    }

    try {
      const staffKey = getStaffKey(staff) || staff.staffId;
      setAssigningStaffId(staffKey);
      await onAssign(task, staff);
      toast.success("Task assigned", {
        description: `${task?.title || "Task"} is now assigned to ${staff.name}.`,
      });
      onOpenChange(false);
    } catch (error) {
      const message = error?.message || "Failed to assign task";
      toast.error("Unable to assign task", { description: message });
    } finally {
      setAssigningStaffId(null);
    }
  };

  const handleQuickAssign = () => {
    if (!autoAssignCandidate) {
      toast.warning("No available staff", {
        description: "Add or activate staff members in this department to assign the task.",
      });
      return;
    }

    setSelectedStaff(autoAssignCandidate);
    handleAssignStaff(autoAssignCandidate);
  };

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
  };

  const handleConfirmAssign = () => {
    if (!selectedStaff) {
      toast.warning("Select a staff member", {
        description: "Choose a staff member before assigning the task.",
      });
      return;
    }

    handleAssignStaff(selectedStaff);
  };

  const handleRefreshStaff = () => {
    setStaffReloadToken((token) => token + 1);
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

                {recommendedStaff.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#1b335f] bg-[#0f203f] p-3 text-sm text-[#8ba3d0]">
                    No recommendations available yet. Assignments will appear once staff suggestions are generated.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recommendedStaff.map((staff, index) => {
                      const optionKey = getStaffKey(staff);
                      const isSelected = optionKey
                        ? optionKey === selectedStaffKey
                        : selectedStaff === staff;

                      return (
                        <motion.div
                        key={`${staff.name || staff.staffId || index}-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                          className={`rounded-2xl border p-3 transition-all duration-300 hover:border-[#facc15]/60 hover:bg-[#13264a] ${
                            isSelected ? "border-[#facc15] bg-[#13264a]" : "border-transparent bg-[#0f203f]"
                          }`}
                          onClick={() => handleSelectStaff(staff)}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex flex-1 items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staff.avatar || staff.name || "staff")}`} />
                              <AvatarFallback>{staff.name?.[0] || "S"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#f5f7ff]">{staff.name}</p>
                              <p className="text-xs text-[#8ba3d0]">{staff.role || "Staff"}</p>
                              {staff.email && <p className="text-xs text-[#526aab]">{staff.email}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#facc15]">{typeof staff.match === "number" ? `${staff.match}%` : "--"}</p>
                              <p className="text-xs text-[#8ba3d0]">Match</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectStaff(staff);
                            }}
                            variant={isSelected ? "outline" : "default"}
                            className={`flex items-center justify-center gap-2 border border-[#1b335f] text-[#d6e2ff] transition-colors ${
                              isSelected
                                ? "bg-[#1a3561]"
                                : "bg-[#13264a] hover:bg-[#1a3561]"
                            }`}
                          >
                            {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                        {!staff.staffId && (
                          <p className="mt-2 text-xs text-[#8ba3d0]">
                            This recommendation is missing a linked staff account. Invite them to sign in before assigning.
                          </p>
                        )}
                      </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <ManagerSeparator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#38bdf8]" />
                    <h3 className="font-semibold text-[#f5f7ff]">Department Team</h3>
                  </div>
                  {task?.department && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshStaff}
                      className="h-8 rounded-lg border border-transparent px-2 text-xs font-medium text-[#8ba3d0] transition-colors hover:border-[#1b335f] hover:bg-[#13264a]"
                    >
                      Refresh
                    </Button>
                  )}
                </div>

                {departmentLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={`dept-skeleton-${index}`}
                        className="h-16 animate-pulse rounded-2xl border border-[#1b335f]/40 bg-[#0f203f]/80"
                      />
                    ))}
                  </div>
                ) : departmentError ? (
                  <p className="rounded-2xl border border-[#3f1b1b] bg-[#190d18] p-3 text-sm text-[#fca5a5]">
                    {departmentError}
                  </p>
                ) : departmentOptions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#1b335f] bg-[#0f203f] p-3 text-sm text-[#8ba3d0]">
                    No active staff members in {task?.department || "this department"}. Add staff profiles to enable assignment.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {departmentOptions.map((staff, index) => {
                      const optionKey = getStaffKey(staff);
                      const isSelected = optionKey
                        ? optionKey === selectedStaffKey
                        : selectedStaff === staff;

                      return (
                        <div
                          key={staff.staffId || staff.email || staff.name || index}
                          className={`rounded-2xl border p-3 transition-all duration-300 hover:border-[#38bdf8]/50 hover:bg-[#13264a] ${
                            isSelected ? "border-[#38bdf8] bg-[#13264a]" : "border-transparent bg-[#0f203f]"
                          }`}
                          onClick={() => handleSelectStaff(staff)}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex flex-1 items-center gap-3">
                              <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staff.avatar || staff.name || "staff")}`} />
                                <AvatarFallback>{staff.name?.[0] || "S"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[#f5f7ff]">{staff.name}</p>
                                <p className="text-xs text-[#8ba3d0]">{staff.role || task?.department || "Staff"}</p>
                                {staff.email && <p className="text-xs text-[#526aab]">{staff.email}</p>}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelectStaff(staff);
                              }}
                              variant={isSelected ? "outline" : "default"}
                              className={`flex items-center justify-center gap-2 border border-[#1b335f] text-[#d6e2ff] transition-colors ${
                                isSelected ? "bg-[#1a3561]" : "bg-[#13264a] hover:bg-[#1a3561]"
                              }`}
                            >
                              {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </div>
                          {!staff.staffId && (
                            <p className="mt-2 text-xs text-[#8ba3d0]">
                              This staff profile is missing an account. Ask them to activate their login before assignment.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedStaff && (
                <div className="space-y-3 rounded-2xl border border-[#1b335f] bg-[#0f203f] p-4 shadow-[0_12px_30px_rgba(8,14,29,0.45)]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedStaff.avatar || selectedStaff.name || "staff")}`} />
                      <AvatarFallback>{selectedStaff.name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#f5f7ff]">{selectedStaff.name}</p>
                      <p className="text-xs text-[#8ba3d0]">{selectedStaff.role || selectedStaff.department || task?.department || "Team Member"}</p>
                    </div>
                    {typeof selectedStaff.match === "number" && (
                      <div className="ml-auto text-right">
                        <p className="text-sm font-bold text-[#facc15]">{selectedStaff.match}%</p>
                        <p className="text-xs text-[#8ba3d0]">Match</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs text-[#8ba3d0] sm:grid-cols-2">
                    {selectedStaff.email && (
                      <div>
                        <p className="text-[#5f7ac0]">Email</p>
                        <p className="text-[#dfe8ff]">{selectedStaff.email}</p>
                      </div>
                    )}
                    {selectedStaff.phone && (
                      <div>
                        <p className="text-[#5f7ac0]">Phone</p>
                        <p className="text-[#dfe8ff]">{selectedStaff.phone}</p>
                      </div>
                    )}
                    {selectedStaff.department && (
                      <div>
                        <p className="text-[#5f7ac0]">Department</p>
                        <p className="text-[#dfe8ff]">{selectedStaff.department}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#5f7ac0]">Assignment Note</p>
                      <p className="text-[#dfe8ff]">Confirm details before assigning this task.</p>
                    </div>
                  </div>
                  {!selectedStaff.staffId && (
                    <p className="mt-2 rounded-xl border border-dashed border-[#f87171]/60 bg-[#301720] p-3 text-xs text-[#fca5a5]">
                      This teammate is not linked to an active staff account. Pick someone from the department list below, or invite them to finish onboarding so you can assign tasks directly.
                    </p>
                  )}
                </div>
              )}

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
                          Assigned to {entry?.assignedName || entry?.assignedTo?.name || entry?.assignedTo?.fullName || entry?.assignedTo || "staff member"}
                        </p>
                        <p className="text-xs text-[#8ba3d0]">{formatDateTime(entry?.assignedAt)}</p>
                      </div>
                    </div>
                  ))}

                  {noteEntries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#f5f7ff]">Notes</h4>
                      {noteEntries.map((item, index) => (
                        <p key={index} className="text-xs text-[#8ba3d0]">
                          <span className="font-medium text-[#d6e2ff]">{item.source}:</span> {item.content}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border border-[#1b335f] bg-[#0f2145] text-[#d6e2ff] transition-colors hover:bg-[#142b52]"
                >
                  Close
                </Button>
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  {autoAssignCandidate && (
                    <Button
                      variant="outline"
                      onClick={handleQuickAssign}
                      disabled={assigningStaffId !== null}
                      className="flex-1 border border-[#1b335f] bg-[#0f2145] text-[#d6e2ff] transition-colors hover:bg-[#142b52] disabled:opacity-60"
                    >
                      {assigningStaffId === autoAssignKey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Auto assign {autoAssignLabel}
                    </Button>
                  )}
                  <Button
                    onClick={handleConfirmAssign}
                    disabled={!selectedStaff?.staffId || assigningStaffId !== null}
                    className="flex-1 bg-[#facc15] text-[#0b1b3c] transition-colors hover:bg-[#f9c513] disabled:opacity-60"
                  >
                    {isAssigningSelected ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Assign {selectedStaffName}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
