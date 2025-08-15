import { useState, useEffect, useMemo } from "react";
import notificationService from "../../../../services/notificationService";
import useDebounce from "../../../../hooks/useDebounce";

export default function NotificationFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange
}) {
  const [metadata, setMetadata] = useState({ types: [], channels: [] });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await notificationService.getNotificationMetadata();
        setMetadata(response.data || response);
      } catch (error) {
        console.error("Failed to fetch notification metadata:", error);
        // Fallback to hardcoded values
        setMetadata({
          types: ["admin_message", "system_alert", "emergency_alert", "manager_message", "test_notification"],
          channels: ["email", "inApp", "sms", "push"]
        });
      }
    };
    fetchMetadata();
  }, []);

  const priorityOptions = ["low", "medium", "high", "critical"];
  const statusOptions = ["pending", "sent", "delivered", "failed", "read"];
  const userTypeOptions = ["guest", "staff", "manager", "admin"];
  const readOptions = [
    { value: "", label: "All Notifications" },
    { value: "true", label: "Read Only" },
    { value: "false", label: "Unread Only" }
  ];

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== "").length +
           (debouncedSearchQuery.trim() ? 1 : 0);
  }, [filters, debouncedSearchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </span>
          )}
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* User Type Filter */}
        <select
          value={filters.userType}
          onChange={(e) => onFilterChange("userType", e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All User Types</option>
          {userTypeOptions.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* Channel Filter */}
        <select
          value={filters.channel}
          onChange={(e) => onFilterChange("channel", e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Channels</option>
          {metadata.channels.map(channel => (
            <option key={channel} value={channel}>
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => onFilterChange("type", e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Types</option>
          {metadata.types.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange("priority", e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Priorities</option>
          {priorityOptions.map(priority => (
            <option key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        {/* Read Status Filter */}
        <select
          value={filters.read}
          onChange={(e) => onFilterChange("read", e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        >
          {readOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
        <div className="flex flex-wrap gap-2">
          {[
            { field: "createdAt", label: "Date" },
            { field: "title", label: "Title" },
            { field: "priority", label: "Priority" },
            { field: "status", label: "Status" },
            { field: "userType", label: "User Type" }
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => onSortChange(field)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                sortField === field
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {label} {sortField === field && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}