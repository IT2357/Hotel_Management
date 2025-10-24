/**
 * Staff Analytics Utility Functions
 * Data transformation and mapping utilities
 */

/**
 * Map API response to analytics format
 * Transforms backend data structure to match frontend expectations
 */
export const mapApiToAnalytics = (payload) => {
  if (!payload?.staff) {
    return null;
  }

  const summary = payload.staff.summary || {};
  const departmentPerformance = payload.staff.departmentPerformance || [];
  const topPerformers = payload.staff.topPerformers || [];
  const riskAlerts = payload.staff.riskAlerts || [];

  return {
    summary: {
      totalStaff: summary.totalStaff ?? 0,
      activeStaff: summary.activeStaff ?? summary.currentlyWorking ?? 0,
      onDuty: summary.onDuty ?? summary.currentlyOnDuty ?? 0,
      completionRate: Math.round(summary.completionRate ?? 0),
      avgResponseTime: Math.round(summary.avgResponseTime ?? summary.averageResponseTime ?? 0),
      guestSatisfaction: (() => {
        const raw = summary.guestSatisfaction ?? summary.averageSatisfaction ?? 0;
        const numeric = Number.parseFloat(raw);
        return Number.isFinite(numeric) ? Number(numeric.toFixed(1)) : 0;
      })(),
    },
    departmentBreakdown: (departmentPerformance || [])
      .map((dept) => {
        const departmentName = dept.department || dept.name;
        if (!departmentName) {
          return null;
        }

        const totalTasks = Number.isFinite(dept.totalTasks) ? dept.totalTasks : Number.isFinite(dept.tasks) ? dept.tasks : 0;
        const completedTasks = Number.isFinite(dept.completedTasks) ? dept.completedTasks : Number.isFinite(dept.completed) ? dept.completed : 0;
        const completionRate = Number.isFinite(dept.completionRate)
          ? Math.round(dept.completionRate)
          : Math.round((completedTasks / Math.max(totalTasks, 1)) * 100);

        const satisfactionRaw = dept.guestSatisfaction ?? dept.satisfaction ?? dept.qualityScore;
        const satisfactionValue = Number.parseFloat(satisfactionRaw);

        return {
          department: departmentName,
          totalTasks,
          completed: completedTasks,
          completionRate,
          satisfaction: Number.isFinite(satisfactionValue) ? Number(satisfactionValue.toFixed(1)) : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5),
    topPerformers: topPerformers.map((person) => ({
      id: person.staffId || person.id,
      name: person.name || "Unknown Staff",
      role: person.role || person.position || "Staff Member",
      completionRate: Math.round(person.completionRate ?? 0),
      tasksCompleted: person.completedTasks ?? person.totalCompleted ?? 0,
      avgQualityScore: Number(person.avgQualityScore ?? person.qualityScore ?? 0),
    })),
    riskAlerts: riskAlerts.map((alert, index) => ({
      id: alert.id || `alert-${index}`,
      title: alert.title || alert.heading || "Alert",
      detail: alert.detail || alert.description || "No details available",
      severity: alert.severity || "medium",
    })),
  };
};
