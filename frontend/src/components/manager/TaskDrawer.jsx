import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Users, Clock, MapPin, Sparkles, CheckCircle2, Calendar, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerSeparator } from "@/components/manager/ManagerSeparator";
import { toast } from "sonner";
import { taskAPI } from "@/services/taskManagementAPI";

const priorityStyles = {
  Low: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-300",
  Normal: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-2 border-blue-300",
  High: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-2 border-orange-300",
  Urgent: "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-2 border-red-400",
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

export const TaskDrawer = ({ task, open, onOpenChange, onAssign, onCancel }) => {
  if (!task) return null;

  const [departmentStaff, setDepartmentStaff] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState("");
  const [assigningStaffId, setAssigningStaffId] = useState(null);
  const [staffReloadToken, setStaffReloadToken] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l-4 border-cyan-200 bg-gradient-to-br from-white via-gray-50 to-cyan-50/30 shadow-2xl md:w-[580px]"
          >
            <div className="space-y-6 p-6 text-gray-800">
              <div className="flex items-start justify-between border-b-2 border-gray-200 pb-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">{task?.title || "Task Details"}</h2>
                      <p className="text-sm font-semibold text-cyan-600">{task?.department || "General"}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <ManagerBadge className={`${priorityStyles[priorityKey] || priorityStyles.Normal} text-sm font-bold px-4 py-2 rounded-xl shadow-md`}>
                {(task?.priorityLabel || task?.priority || "Normal") + " Priority"}
              </ManagerBadge>

              <ManagerSeparator />

              <div className="space-y-3 bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-md">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <span className="text-sm font-bold text-gray-900">{locationLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Due Date</p>
                    <span className="text-sm font-bold text-gray-900">{dueDateLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Estimated Duration</p>
                    <span className="text-sm font-bold text-gray-900">{estimatedDurationLabel}</span>
                  </div>
                </div>
              </div>

              <ManagerSeparator />

              <div className="space-y-3 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-md">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  Task Description
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 text-lg">AI Staff Recommendations</h3>
                </div>

                {recommendedStaff.length === 0 ? (
                  <p className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
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
                          className={`rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                            isSelected ? "border-yellow-400 bg-yellow-50 shadow-lg" : "border-gray-200 bg-white hover:border-yellow-300"
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
                              <p className="text-sm font-bold text-gray-900">{staff.name}</p>
                              <p className="text-xs font-semibold text-cyan-600">{staff.role || "Staff"}</p>
                              {staff.email && <p className="text-xs text-gray-500">{staff.email}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-yellow-600">{typeof staff.match === "number" ? `${staff.match}%` : "--"}</p>
                              <p className="text-xs font-bold text-gray-600">Match</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectStaff(staff);
                            }}
                            variant={isSelected ? "outline" : "default"}
                            className={`flex items-center justify-center gap-2 border-2 transition-all rounded-xl shadow-sm ${
                              isSelected
                                ? "bg-yellow-500 text-white border-yellow-600 shadow-md"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-yellow-50 hover:border-yellow-400"
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-black text-gray-900 text-lg">Department Team</h3>
                  </div>
                  {task?.department && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshStaff}
                      className="h-8 rounded-xl border-2 border-gray-300 px-3 text-xs font-bold text-gray-700 transition-all hover:border-cyan-400 hover:bg-cyan-50 shadow-sm"
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
                        className="h-16 animate-pulse rounded-2xl border-2 border-gray-200 bg-gray-100"
                      />
                    ))}
                  </div>
                ) : departmentError ? (
                  <p className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 font-medium">
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
                          className={`rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                            isSelected ? "border-cyan-400 bg-cyan-50 shadow-lg" : "border-gray-200 bg-white hover:border-cyan-300"
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
                                <p className="text-sm font-bold text-gray-900">{staff.name}</p>
                                <p className="text-xs font-semibold text-cyan-600">{staff.role || task?.department || "Staff"}</p>
                                {staff.email && <p className="text-xs text-gray-500">{staff.email}</p>}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelectStaff(staff);
                              }}
                              variant={isSelected ? "outline" : "default"}
                              className={`flex items-center justify-center gap-2 border-2 transition-all rounded-xl shadow-sm ${
                                isSelected ? "bg-cyan-500 text-white border-cyan-600 shadow-md" : "bg-white text-gray-700 border-gray-300 hover:bg-cyan-50 hover:border-cyan-400"
                              }`}
                            >
                              {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </div>
                          {!staff.staffId && (
                            <p className="mt-2 text-xs text-gray-600 bg-gray-100 rounded-lg p-2">
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
                <div className="space-y-3 rounded-2xl border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedStaff.avatar || selectedStaff.name || "staff")}`} />
                      <AvatarFallback>{selectedStaff.name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-black text-gray-900">{selectedStaff.name}</p>
                      <p className="text-xs font-bold text-cyan-600">{selectedStaff.role || selectedStaff.department || task?.department || "Team Member"}</p>
                    </div>
                    {typeof selectedStaff.match === "number" && (
                      <div className="ml-auto text-right">
                        <p className="text-lg font-black text-yellow-600">{selectedStaff.match}%</p>
                        <p className="text-xs font-bold text-gray-600">Match</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs text-gray-700 sm:grid-cols-2">
                    {selectedStaff.email && (
                      <div>
                        <p className="text-gray-500 font-bold">Email</p>
                        <p className="text-gray-900 font-semibold">{selectedStaff.email}</p>
                      </div>
                    )}
                    {selectedStaff.phone && (
                      <div>
                        <p className="text-gray-500 font-bold">Phone</p>
                        <p className="text-gray-900 font-semibold">{selectedStaff.phone}</p>
                      </div>
                    )}
                    {selectedStaff.department && (
                      <div>
                        <p className="text-gray-500 font-bold">Department</p>
                        <p className="text-gray-900 font-semibold">{selectedStaff.department}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 font-bold">Assignment Note</p>
                      <p className="text-gray-900 font-semibold">Confirm details before assigning this task.</p>
                    </div>
                  </div>
                  {!selectedStaff.staffId && (
                    <p className="mt-2 rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-3 text-xs text-red-600 font-medium">
                      This teammate is not linked to an active staff account. Pick someone from the department list below, or invite them to finish onboarding so you can assign tasks directly.
                    </p>
                  )}
                </div>
              )}

              <ManagerSeparator />

              <div className="space-y-3">
                <h3 className="font-black text-gray-900 text-lg">Assignment History</h3>
                <div className="space-y-3">
                  {assignmentHistory.length === 0 && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-[#0f3a32] p-1">
                        <CheckCircle2 className="h-3 w-3 text-[#34d399]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Task Created</p>
                        <p className="text-xs text-gray-600">{formatDateTime(task?.rawTask?.createdAt)}</p>
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
                        <p className="text-xs text-gray-600">{formatDateTime(entry?.assignedAt)}</p>
                      </div>
                    </div>
                  ))}

                  {noteEntries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">Notes</h4>
                      {noteEntries.map((item, index) => (
                        <p key={index} className="text-xs text-gray-700">
                          <span className="font-bold text-gray-900">{item.source}:</span> {item.content}
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
                  className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-bold shadow-sm transition-all"
                >
                  Close
                </Button>
                {task?.assignedStaffName && task?.statusKey !== "completed" && task?.statusKey !== "inProgress" && onCancel && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setIsCancelling(true);
                      try {
                        await onCancel(task, "Staff did not accept task");
                        onOpenChange(false);
                      } catch (error) {
                        console.error("Cancel failed:", error);
                      } finally {
                        setIsCancelling(false);
                      }
                    }}
                    disabled={isCancelling || assigningStaffId !== null}
                    className="flex-1 border-2 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 disabled:opacity-60 rounded-xl font-bold shadow-sm transition-all"
                  >
                    {isCancelling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {isCancelling ? "Cancelling..." : "Cancel Assignment"}
                  </Button>
                )}
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  {autoAssignCandidate && (
                    <Button
                      variant="outline"
                      onClick={handleQuickAssign}
                      disabled={assigningStaffId !== null}
                      className="flex-1 border-2 border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 hover:from-yellow-200 hover:to-amber-200 disabled:opacity-60 rounded-xl font-bold shadow-md transition-all"
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
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
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
