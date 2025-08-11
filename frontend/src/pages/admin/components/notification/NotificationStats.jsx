import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import adminService from "../../../../services/adminService";
import Spinner from "../../../../components/ui/Spinner";
import StatsCard from "../../../../components/ui/StatsCard";

export default function NotificationStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await adminService.getNotificationStats();
        setStats(res.data.data);
      } catch (error) {
        toast.error(error?.message || "Failed to fetch notification stats.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <Spinner size="lg" />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Notifications"
        value={stats.total ?? 0}
        trend={null}
      />
      <StatsCard
        title="Unread Notifications"
        value={stats.unread ?? 0}
        trend={null}
        variant="warning"
      />
      <StatsCard
        title="Email Notifications"
        value={stats.byChannel?.email ?? 0}
        trend={null}
        variant="info"
      />
      <StatsCard
        title="Task Assigned"
        value={stats.byType?.task_assigned ?? 0}
        trend={null}
        variant="success"
      />
    </div>
  );
}
