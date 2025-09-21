import { useMemo } from "react";
import StatsCard from "../../../../components/ui/statscard";

export default function NotificationStats({ stats }) {
  const statCards = useMemo(() => {
    if (!stats) return [];
    
    const totalByChannel = Object.values(stats.byChannel || {}).reduce((sum, count) => sum + count, 0);
    const totalByType = Object.values(stats.byType || {}).reduce((sum, count) => sum + count, 0);
    
    return [
      {
        title: "Total Notifications",
        value: stats.total ?? 0,
        variant: "primary",
        description: "All notifications sent"
      },
      {
        title: "Unread",
        value: stats.unread ?? 0,
        variant: "warning",
        description: `${stats.readPercentage || 0}% read rate`
      },
      {
        title: "Failed",
        value: stats.failed ?? 0,
        variant: "danger",
        description: "Delivery failures"
      },
      {
        title: "Read Rate",
        value: `${stats.readPercentage || 0}%`,
        variant: "success",
        description: `${stats.read || 0} read notifications`
      }
    ];
  }, [stats]);

  const channelStats = useMemo(() => {
    if (!stats?.byChannel) return [];
    
    return Object.entries(stats.byChannel).map(([channel, count]) => ({
      title: channel.charAt(0).toUpperCase() + channel.slice(1),
      value: count,
      variant: "info"
    }));
  }, [stats]);

  const typeStats = useMemo(() => {
    if (!stats?.byType) return [];
    
    return Object.entries(stats.byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([type, count]) => ({
        title: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        variant: "secondary"
      }));
  }, [stats]);

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              variant={stat.variant}
              trend={null}
            />
          ))}
        </div>
      </div>

      {/* Channel Distribution */}
      {channelStats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">By Channel</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {channelStats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                variant={stat.variant}
                trend={null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Notification Types */}
      {typeStats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Top Notification Types</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeStats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                variant={stat.variant}
                trend={null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      {stats.recentNotifications && stats.recentNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Recent Activity</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="space-y-3">
              {stats.recentNotifications.slice(0, 5).map((notification, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.userId?.email || 'Unknown User'} • {notification.type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      notification.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      notification.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {notification.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      notification.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      notification.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      notification.priority === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
