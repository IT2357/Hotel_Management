import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
import { TaskQueueBoard } from "@/components/manager/TaskQueueBoard";
import { Button } from "@/components/manager/ManagerButton";
import { RotateCw, Plus, Sparkles } from "lucide-react";
import ManagerPageHeader from "@/components/manager/ManagerPageHeader";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS } from "./managerStyles";
import { TaskCreateDialog } from "@/components/manager/TaskCreateDialog";
import { DEPARTMENT_OPTIONS, PRIORITY_OPTIONS, FILTER_INITIAL_STATE } from "./taskManagement/constants";
import { useTaskManagement } from "./taskManagement/useTaskManagement";

/**
 * Manager Task Management Page - Guest Request Workflow
 * 
 * WORKFLOW:
 * 1. Guest creates a service request (food order, room cleaning, maintenance, etc.)
 * 2. Request appears in "Awaiting Assignment" column (Pending status)
 * 3. Manager reviews request details and assigns to appropriate staff member
 * 4. Staff receives notification and accepts the task
 * 5. Task moves to "Staff Working" column (In Progress status) when staff starts
 * 6. Staff completes the task
 * 7. Task moves to "Completed" column
 * 
 * This page allows managers to:
 * - View all guest requests and tasks across departments
 * - Filter by status, department, and priority
 * - Assign tasks to available staff members
 * - Track task progress in real-time
 * - Create manual tasks for general maintenance or operations
 */

const ManagerTaskManagementPage = () => {
  const { user } = useAuth();
  const [filters] = useState(FILTER_INITIAL_STATE);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Use custom hook for task management logic
  const {
    boardData,
    isLoading,
    isRefreshing,
    isAiAssigning,
    pendingTaskForAssignment,
    setPendingTaskForAssignment,
    handleRefresh,
    handleTaskAssign,
    handleTaskCancel,
    handleAiAutoAssign,
    handleTaskCreate,
  } = useTaskManagement(filters);

  const handleSidebarToggle = useCallback((isCollapsed) => {
    toast.info(isCollapsed ? "Sidebar collapsed" : "Sidebar expanded", {
      duration: 1500,
    });
  }, []);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "tasks") {
      toast.success("You're already in Task Management", {
        duration: 1500,
      });
      return false;
    }

    if (item.id === "dashboard" || item.id === "staff" || item.id === "feedback" || item.id === "profile" || item.id === "reports") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We're polishing the manager experience.",
      duration: 1800,
    });

    return false;
  }, []);

  const displayName = useMemo(
    () =>
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.email ||
      "Manager",
    [user]
  );

  const createDepartmentOptions = useMemo(
    () => DEPARTMENT_OPTIONS.filter((option) => option.value !== "all"),
    [],
  );

  const createPriorityOptions = useMemo(
    () => PRIORITY_OPTIONS.filter((option) => option.value !== "all"),
    [],
  );

  return (
    <ManagerLayout
      activeItem="tasks"
      onSidebarToggle={handleSidebarToggle}
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={MANAGER_CONTENT_CLASS}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} space-y-6`}>
        <ManagerPageHeader
          title="Smart Task Management"
          subtitle={`${displayName}, intelligently assign tasks with AI-powered staff matching and priority-driven workflow.`}
          accentChips={["AI-Powered", "Smart Assignment", "Real-Time Tracking"]}
          actions={(
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleAiAutoAssign}
                disabled={isAiAssigning || boardData.pending.length === 0}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-xl transition-all duration-300 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Sparkles className={`mr-2 h-4 w-4 ${isAiAssigning ? "animate-pulse" : ""}`} />
                {isAiAssigning ? "AI Assigning..." : "AI Assign All"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-900 shadow-xl transition-all duration-300 hover:from-cyan-300 hover:to-blue-300 hover:-translate-y-0.5 disabled:opacity-70"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-600/30 bg-slate-700/40 text-slate-100 shadow-lg transition-all duration-300 hover:border-slate-500/60 hover:bg-slate-600/50 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          )}
          footerChips={[
            <span key="pending">Pending: {boardData.pending.length}</span>,
            <span key="awaiting">🍽️ Need Assignment: {boardData.awaitingAssignment.length}</span>,
            <span key="inprogress">In Progress: {boardData.inProgress.length}</span>,
            <span key="completed">Completed: {boardData.completed.length}</span>,
          ]}
        />

        <TaskQueueBoard
          tasksByStatus={boardData}
          onTaskAssign={handleTaskAssign}
          onTaskCancel={handleTaskCancel}
          isLoading={isLoading}
          emptyMessage="No guest requests or tasks available"
          pendingTaskForAssignment={pendingTaskForAssignment}
          onClearPendingTask={() => setPendingTaskForAssignment(null)}
        />
      </div>
      <TaskCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleTaskCreate}
        departmentOptions={createDepartmentOptions}
        priorityOptions={createPriorityOptions}
      />
    </ManagerLayout>
  );
};

export default ManagerTaskManagementPage;
