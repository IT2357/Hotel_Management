/**
 * Home Page Utility Functions
 * Helper functions for calculations and formatting
 */

export const formatLastUpdated = (lastUpdated) => {
  if (!lastUpdated) return "Awaiting first sync";

  const diffMs = Date.now() - lastUpdated.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just refreshed";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

export const computeMetrics = (snapshot) => {
  const backlog = Math.max(snapshot.totalTasks - snapshot.inProgress - snapshot.completed, 0);
  const completionRate = snapshot.totalTasks
    ? Math.round((snapshot.completed / snapshot.totalTasks) * 100)
    : 0;
  const ratingStatus =
    snapshot.avgRating >= 4.6
      ? "Excellent"
      : snapshot.avgRating >= 4
      ? "Good"
      : "Needs attention";
  const capacityRatio = snapshot.staffOnline
    ? Number(((snapshot.inProgress + backlog) / snapshot.staffOnline).toFixed(1))
    : snapshot.inProgress + backlog;

  return {
    backlog,
    completionRate,
    ratingStatus,
    capacityRatio,
  };
};

export const buildInsights = (snapshot, computedMetrics, isDataLoading) => {
  if (isDataLoading) {
    return [
      {
        label: "Sync in progress",
        value: "—",
        intent: "neutral",
        message: "Fetching the latest metrics from task and feedback services.",
      },
    ];
  }

  const items = [];
  const noTasksScheduled = snapshot.totalTasks === 0;

  items.push({
    label: "Completion rate",
    value: `${computedMetrics.completionRate}%`,
    intent: noTasksScheduled
      ? "neutral"
      : computedMetrics.completionRate >= 75
      ? "positive"
      : computedMetrics.completionRate >= 55
      ? "neutral"
      : "warning",
    message: noTasksScheduled
      ? "No tasks scheduled for the current window. Monitor upcoming check-ins."
      : computedMetrics.completionRate >= 75
      ? "Teams are closing tasks on schedule."
      : "Boost task closures to stay on target for the week.",
  });

  items.push({
    label: "Active backlog",
    value: computedMetrics.backlog,
    intent:
      computedMetrics.backlog <= 5
        ? "positive"
        : computedMetrics.backlog <= 12
        ? "neutral"
        : "warning",
    message:
      computedMetrics.backlog === 0
        ? "No pending work is waiting to be picked up."
        : `Assign or reprioritize ${computedMetrics.backlog} tasks to keep flow steady.`,
  });

  const hasRating = Number.isFinite(snapshot.avgRating) && snapshot.avgRating > 0;

  items.push({
    label: "Guest satisfaction",
    value: hasRating ? `${snapshot.avgRating.toFixed(1)}/5` : "No data",
    intent: !hasRating
      ? "neutral"
      : snapshot.avgRating >= 4.6
      ? "positive"
      : snapshot.avgRating >= 4
      ? "neutral"
      : "warning",
    message: !hasRating
      ? "No feedback captured yet — remind the front desk to share the quick survey link."
      : computedMetrics.ratingStatus === "Excellent"
      ? "Guests are consistently rating their experience highly."
      : "Review recent feedback to spot improvement opportunities.",
  });

  return items;
};

export const buildNextActions = (snapshot, computedMetrics, isDataLoading) => {
  const actions = [];

  if (isDataLoading) {
    actions.push({
      title: "Syncing metrics",
      description: "Hang tight while we load the most recent tasks and staffing data.",
      priority: "Low",
    });
    return actions;
  }

  if (snapshot.totalTasks === 0) {
    actions.push({
      title: "Awaiting task intake",
      description:
        "No work items logged yet today. Confirm pipeline sync with front desk and housekeeping leads.",
      priority: "Low",
    });
    return actions;
  }

  if (computedMetrics.backlog > 0) {
    actions.push({
      title: "Rebalance workload",
      description: `Distribute ${computedMetrics.backlog} backlog task${
        computedMetrics.backlog > 1 ? "s" : ""
      } across the afternoon shift.`,
      priority: computedMetrics.backlog >= 10 ? "High" : "Medium",
    });
  }

  if (computedMetrics.completionRate < 70) {
    actions.push({
      title: "Schedule stand-up",
      description: "Do a quick sync with supervisors to unblock delayed service tickets.",
      priority: "Medium",
    });
  }

  if (snapshot.avgRating && snapshot.avgRating < 4.2) {
    actions.push({
      title: "Audit guest feedback",
      description: "Scan the lowest-rated stays this week and log corrective follow-ups.",
      priority: "High",
    });
  }

  if (!actions.length) {
    actions.push({
      title: "Great job",
      description: "No pressing actions right now. Keep monitoring task inflow every 30 minutes.",
      priority: "Low",
    });
  }

  return actions;
};

export const buildWorkforceSnapshot = (snapshot, computedMetrics, isDataLoading) => {
  if (isDataLoading) {
    return {
      online: 0,
      workload: 0,
      coverage: 0,
      status: "Syncing the latest staffing snapshot...",
    };
  }

  const online = snapshot.staffOnline;
  const workload = snapshot.inProgress + computedMetrics.backlog;
  const coverage = online ? Math.round((snapshot.inProgress / online) * 10) / 10 : 0;

  return {
    online,
    workload,
    coverage,
    status: !online
      ? "No team members online"
      : workload === 0
      ? "Team is free — expect inflow from upcoming reservations."
      : coverage <= 1.5
      ? "Capacity is healthy"
      : coverage <= 2.5
      ? "Monitor for overload"
      : "High load — consider assigning backup",
  };
};
