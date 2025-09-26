import React from 'react';
import { 
  ManagerPageHeader, 
  ManagerPageLoader, 
  ManagerErrorState, 
  ManagerEmptyState,
  ManagerTable,
  ManagerFilter
} from '../../components/manager';

const ManagerListTemplate = ({
  title,
  subtitle,
  icon,
  loading = false,
  error = null,
  onRefresh = null,
  actions = [],
  
  // Table props
  data = [],
  columns = [],
  emptyMessage = "No items found",
  emptyActionLabel = null,
  onEmptyAction = null,
  onRowClick = null,
  tableActions = [],
  
  // Filter props
  filters = [],
  activeFilters = {},
  onFilterChange = null,
  onClearFilters = null,
  
  // Search props
  searchable = true,
  searchPlaceholder = "Search...",
  
  // Pagination props
  pagination = null,
  
  children = null
}) => {
  if (loading) {
    return <ManagerPageLoader message="Loading data..." />;
  }

  if (error) {
    return (
      <ManagerErrorState
        title="Failed to Load Data"
        message="We couldn't load the data. Please try again."
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
        {/* Filters */}
        {filters.length > 0 && onFilterChange && (
          <div className="mb-6">
            <ManagerFilter
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={onFilterChange}
              onClearAll={onClearFilters}
            />
          </div>
        )}

        {/* Custom Content (above table) */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {/* Data Table or Empty State */}
        {data.length === 0 && !loading ? (
          <ManagerEmptyState
            title="No Data Found"
            message={emptyMessage}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        ) : (
          <ManagerTable
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage={emptyMessage}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            onRowClick={onRowClick}
            actions={tableActions}
            pagination={pagination}
          />
        )}
      </div>
    </div>
  );
};

export default ManagerListTemplate;