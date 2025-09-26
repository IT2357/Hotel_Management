import React from 'react';
import { 
  ManagerPageHeader, 
  ManagerPageLoader, 
  ManagerErrorState, 
  ManagerStatsCard 
} from '../../components/manager';

const ManagerDashboardTemplate = ({
  title,
  subtitle,
  icon,
  loading = false,
  error = null,
  onRefresh = null,
  stats = [],
  actions = [],
  children
}) => {
  if (loading) {
    return <ManagerPageLoader message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <ManagerErrorState
        title="Failed to Load Dashboard"
        message="We couldn't load the dashboard data. Please try again."
        error={error}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <ManagerPageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        loading={loading}
        onRefresh={onRefresh}
        actions={actions}
      />

      {/* Page Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <ManagerStatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                color={stat.color}
                onClick={stat.onClick}
              />
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardTemplate;