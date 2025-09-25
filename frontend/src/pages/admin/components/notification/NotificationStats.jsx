import { useMemo } from "react";
import Card from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/Badge";

export default function NotificationStats({ stats }) {
  const statCards = useMemo(() => {
    if (!stats) return [];

    const totalByChannel = Object.values(stats.byChannel || {}).reduce((sum, count) => sum + count, 0);
    const totalByType = Object.values(stats.byType || {}).reduce((sum, count) => sum + count, 0);

    return [
      {
        title: "Total Notifications",
        value: stats.total ?? 0,
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
        gradient: "from-blue-50 to-blue-100",
        border: "border-blue-200",
        iconBg: "bg-blue-500",
        textColor: "text-blue-600",
        valueColor: "text-blue-900",
        description: "All notifications sent",
      },
      {
        title: "Unread",
        value: stats.unread ?? 0,
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        gradient: "from-yellow-50 to-yellow-100",
        border: "border-yellow-200",
        iconBg: "bg-yellow-500",
        textColor: "text-yellow-600",
        valueColor: "text-yellow-900",
        description: `${stats.readPercentage || 0}% read rate`,
      },
      {
        title: "Failed",
        value: stats.failed ?? 0,
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: "from-red-50 to-red-100",
        border: "border-red-200",
        iconBg: "bg-red-500",
        textColor: "text-red-600",
        valueColor: "text-red-900",
        description: "Delivery failures",
      },
      {
        title: "Read Rate",
        value: `${stats.readPercentage || 0}%`,
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: "from-green-50 to-green-100",
        border: "border-green-200",
        iconBg: "bg-green-500",
        textColor: "text-green-600",
        valueColor: "text-green-900",
        description: `${stats.read || 0} read notifications`,
      },
    ];
  }, [stats]);

  const channelStats = useMemo(() => {
    if (!stats?.byChannel) return [];

    return Object.entries(stats.byChannel).map(([channel, count]) => ({
      title: channel.charAt(0).toUpperCase() + channel.slice(1),
      value: count,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      gradient: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      iconBg: "bg-purple-500",
      textColor: "text-purple-600",
      valueColor: "text-purple-900",
    }));
  }, [stats]);

  const typeStats = useMemo(() => {
    if (!stats?.byType) return [];

    return Object.entries(stats.byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([type, count]) => ({
        title: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        gradient: "from-gray-50 to-gray-100",
        border: "border-gray-200",
        iconBg: "bg-gray-500",
        textColor: "text-gray-600",
        valueColor: "text-gray-900",
      }));
  }, [stats]);

  if (!stats) {
    return (
      <Card className="bg-white shadow-xl rounded-2xl border-0 text-center py-16">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-500 text-xl mb-2">No statistics available</p>
          <p className="text-gray-400">Try refreshing or checking your data source</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Notification Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-xl border ${stat.border} shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
                <div className={`p-3 ${stat.iconBg} rounded-full`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Channel Distribution */}
      {channelStats.length > 0 && (
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📡 By Channel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
            {channelStats.map((stat, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-xl border ${stat.border} shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.iconBg} rounded-full`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Notification Types */}
      {typeStats.length > 0 && (
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Top Notification Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {typeStats.map((stat, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-xl border ${stat.border} shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.iconBg} rounded-full`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity Summary */}
      {stats.recentNotifications && stats.recentNotifications.length > 0 && (
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🕒 Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentNotifications.slice(0, 5).map((notification, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                  <p className="text-xs text-gray-500">
                    {notification.userId?.email || "Unknown User"} •{" "}
                    {notification.type?.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={`${
                      notification.status === "sent"
                        ? "bg-green-50 text-green-800 border-green-200"
                        : notification.status === "failed"
                        ? "bg-red-50 text-red-800 border-red-200"
                        : notification.status === "pending"
                        ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                        : "bg-gray-50 text-gray-800 border-gray-200"
                    } px-2 py-1 text-xs font-medium rounded-full`}
                  >
                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                  </Badge>
                  <Badge
                    className={`${
                      notification.priority === "critical"
                        ? "bg-red-50 text-red-800 border-red-200"
                        : notification.priority === "high"
                        ? "bg-orange-50 text-orange-800 border-orange-200"
                        : notification.priority === "medium"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-gray-50 text-gray-800 border-gray-200"
                    } px-2 py-1 text-xs font-medium rounded-full`}
                  >
                    {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}