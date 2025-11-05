/**
 * Custom Hook: useTaskManagement
 * Manages all task-related state and operations for the manager task page
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { taskAPI } from "@/services/taskManagementAPI";
import { INITIAL_BOARD_STATE } from "./constants";
import { mapStatusToApiValue, transformTaskForBoard } from "./utils";

export const useTaskManagement = (filters) => {
  const [boardData, setBoardData] = useState(INITIAL_BOARD_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingTaskForAssignment, setPendingTaskForAssignment] = useState(null);
  const [isAiAssigning, setIsAiAssigning] = useState(false);

  /**
   * Load tasks from API
   */
  const loadTasks = useCallback(async (currentFilters, showToast = false) => {
    setIsLoading(true);

    try {
      const params = {
        status: mapStatusToApiValue(currentFilters.status),
        department: currentFilters.department === "all" ? undefined : currentFilters.department,
        priority: currentFilters.priority === "all" ? undefined : currentFilters.priority,
        search: currentFilters.search?.trim() || undefined,
      };

      const response = await taskAPI.getAllTasks(params);
      const payload = response?.data || response;
      const tasks = Array.isArray(payload)
        ? payload
        : payload?.tasks
          || payload?.data?.tasks
          || [];

      const nextBoard = { pending: [], awaitingAssignment: [], inProgress: [], completed: [] };
      tasks.forEach((task) => {
        const normalized = transformTaskForBoard(task);
        if (normalized && nextBoard[normalized.statusKey]) {
          nextBoard[normalized.statusKey].push(normalized);
        }
      });

      setBoardData(nextBoard);
      if (showToast) {
        toast.success("Task board updated", { description: "Latest data synced from server." });
      }
    } catch (error) {
      console.error("Failed to load tasks", error);
      toast.error("Unable to fetch tasks", {
        description: error?.response?.data?.message || error.message || "Please check your connection or try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh tasks manually
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadTasks(filters, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [filters, loadTasks]);

  /**
   * Assign task to staff member
   */
  const handleTaskAssign = useCallback(async (task, staff) => {
    if (!task?.rawTask?._id) {
      throw new Error("Task identifier is missing.");
    }

    if (!staff?.staffId) {
      throw new Error("Please select a staff member to assign this task.");
    }

    try {
      await taskAPI.assignTask(task.rawTask._id, { staffId: staff.staffId });
      await loadTasks(filters);
      
      toast.success("Task Assigned Successfully", {
        description: `${task.title} has been assigned to ${staff.name}. The task will move to "In Progress" when staff starts working on it.`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Unable to assign task", error);
      const message = error?.response?.data?.message || error.message || "Failed to assign task";
      throw new Error(message);
    }
  }, [filters, loadTasks]);

  /**
   * Cancel/unassign task
   */
  const handleTaskCancel = useCallback(async (task, reason) => {
    if (!task?.rawTask?._id) {
      toast.error("Task identifier is missing");
      return;
    }

    try {
      await taskAPI.cancelTask(task.rawTask._id, reason || "Staff did not accept task");
      await loadTasks(filters);
      
      toast.success("Task Unassigned", {
        description: `${task.title} has been returned to the pending queue and is now available for reassignment.`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Unable to cancel task", error);
      const message = error?.response?.data?.message || error.message || "Failed to cancel task";
      toast.error("Failed to cancel task", {
        description: message,
        duration: 3000,
      });
    }
  }, [filters, loadTasks]);

  /**
   * AI auto-assign all pending tasks
   */
  const handleAiAutoAssign = useCallback(async () => {
    const pendingTasks = boardData.pending;
    
    if (pendingTasks.length === 0) {
      toast.info("No Pending Tasks", {
        description: "All tasks are already assigned or there are no tasks waiting for assignment.",
        duration: 3000,
      });
      return;
    }

    const assignableTasks = pendingTasks.filter(
      (task) => task.recommendedStaff && task.recommendedStaff.length > 0
    );

    if (assignableTasks.length === 0) {
      toast.warning("No Staff Recommendations", {
        description: "AI couldn't find suitable staff for pending tasks. Please assign manually.",
        duration: 3000,
      });
      return;
    }

    setIsAiAssigning(true);
    
    const results = {
      success: [],
      failed: [],
      total: assignableTasks.length,
    };

    toast.info("AI Assignment Started", {
      description: `Processing ${assignableTasks.length} task(s)...`,
      duration: 2000,
    });

    for (const task of assignableTasks) {
      try {
        const bestStaff = task.recommendedStaff[0];
        
        if (!bestStaff?.staffId) {
          results.failed.push({
            task: task.title,
            reason: "No valid staff ID found",
          });
          continue;
        }

        await taskAPI.assignTask(task.rawTask._id, { staffId: bestStaff.staffId });
        
        results.success.push({
          task: task.title,
          staff: bestStaff.name,
          match: bestStaff.match,
        });
      } catch (error) {
        console.error(`Failed to assign task ${task.title}:`, error);
        results.failed.push({
          task: task.title,
          reason: error?.response?.data?.message || error.message || "Unknown error",
        });
      }
    }

    await loadTasks(filters);
    setIsAiAssigning(false);

    if (results.success.length > 0 && results.failed.length === 0) {
      toast.success("AI Assignment Complete!", {
        description: `Successfully assigned ${results.success.length} task(s) to optimal staff members.`,
        duration: 5000,
      });
    } else if (results.success.length > 0 && results.failed.length > 0) {
      toast.warning("Partial Assignment Complete", {
        description: `Assigned ${results.success.length} task(s). ${results.failed.length} task(s) failed.`,
        duration: 5000,
      });
    } else {
      toast.error("AI Assignment Failed", {
        description: `Could not assign any tasks. Please try manual assignment.`,
        duration: 5000,
      });
    }
  }, [boardData.pending, filters, loadTasks]);

  /**
   * Create new task
   */
  const handleTaskCreate = useCallback(
    async (values) => {
      if (!values.title?.trim()) {
        throw new Error("Task title is required");
      }
      if (!values.description?.trim()) {
        throw new Error("Task description is required");
      }
      if (!values.location) {
        throw new Error("Task location is required");
      }

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        department: values.department,
        priority: values.priority,
        status: "Pending",
        location: values.location,
        category: values.department?.toLowerCase() || "general",
      };

      if (values.dueDate) {
        const parsedDueDate = new Date(values.dueDate);
        if (!Number.isNaN(parsedDueDate.getTime())) {
          payload.dueDate = parsedDueDate.toISOString();
        }
      }

      const estimatedDuration = Number(values.estimatedDuration);
      if (Number.isFinite(estimatedDuration) && estimatedDuration > 0) {
        payload.estimatedDuration = Math.round(estimatedDuration);
      }

      if (values.roomNumber?.trim()) {
        payload.roomNumber = values.roomNumber.trim();
      }

      if (values.managerNote?.trim()) {
        payload.notes = { manager: values.managerNote.trim() };
      }

      if (values.autoCreateFollowUp === true) {
        payload.autoCreateFollowUp = true;
      }

      try {
        const response = await taskAPI.createTask(payload);
        const createdTask = response?.data?.task || response?.data || response;
        
        toast.success("Task Created Successfully", {
          description: `${payload.title} has been added. Opening assignment dialog...`,
          duration: 3000,
        });
        
        await loadTasks(filters);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (createdTask) {
          const transformedTask = transformTaskForBoard(createdTask);
          if (transformedTask) {
            setPendingTaskForAssignment(transformedTask);
          } else {
            toast.info("Task created", {
              description: "Click on the task card to assign it to a staff member.",
            });
          }
        }
      } catch (error) {
        console.error("Unable to create task", error);
        const message = error?.response?.data?.message || error.message || "Failed to create task";
        toast.error("Failed to create task", {
          description: message,
        });
        throw new Error(message);
      }
    },
    [filters, loadTasks],
  );

  // Load tasks when filters change
  useEffect(() => {
    loadTasks(filters);
  }, [filters, loadTasks]);

  return {
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
  };
};
