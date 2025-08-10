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
      try {
        const res = await adminService.getNotificationStats();
        setStats(res.data); // ✅ Make sure you're accessing res.data
      } catch (error) {
        toast.error(error.message);
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
        value={stats.totalNotifications ?? 0}
        trend={stats.notificationsTrend ?? null}
      />
      <StatsCard
        title="Unread Notifications"
        value={stats.unreadNotifications ?? 0}
        trend={stats.unreadTrend ?? null}
        variant="warning"
      />
      <StatsCard
        title="Email Notifications"
        value={stats.channels?.email ?? 0}
        trend={stats.channelTrends?.email ?? null}
        variant="info"
      />
      <StatsCard
        title="System Notifications"
        value={stats.types?.system ?? 0}
        trend={stats.typeTrends?.system ?? null}
        variant="success"
      />
    </div>
  );
}
