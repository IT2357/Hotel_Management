import { useState, useRef, useEffect, useMemo } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import useAuth from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  // Debug logging
  console.log('NotificationDropdown state:', {
    notifications,
    unreadCount,
    loading,
    notificationsLength: notifications?.length,
    hasUnread: unreadCount > 0,
    shouldShowButton: unreadCount > 0
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedNotification(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id || notification.id);
    }
    setSelectedNotification(notification);
  };

  // Handle action button click
  const handleActionClick = (notification) => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    setSelectedNotification(null);
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get notification type icon
  const getTypeIcon = (type) => {
    const iconMap = {
      // Admin notifications
      admin_message: '📢',
      system_alert: '⚠️',
      emergency_alert: '🚨',
      financial_alert: '💰',
      security_alert: '🔒',
      
      // Staff notifications
      task_assigned: '📋',
      shift_scheduled: '📅',
      manager_message: '💬',
      
      // Guest notifications
      booking_confirmation: '✅',
      payment_receipt: '💳',
      checkin_reminder: '🏨',
      
      // Default
      default: '🔔'
    };
    return iconMap[type] || iconMap.default;
  };

  // Derived: unique types/channels for filter dropdowns
  const typeOptions = useMemo(() => {
    const set = new Set();
    notifications.forEach(n => n.type && set.add(n.type));
    return ['all', ...Array.from(set)];
  }, [notifications]);

  const channelOptions = useMemo(() => {
    const set = new Set();
    notifications.forEach(n => n.channel && set.add(n.channel));
    return ['all', ...Array.from(set)];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Defensive: ensure only current user's notifications if userId present
      if (n.userId && user?._id && String(n.userId) !== String(user._id)) return false;
      if (showUnreadOnly && n.isRead) return false;
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (filterChannel !== 'all' && n.channel !== filterChannel) return false;
      // Role-aware client check (defensive): if notification has userType, ensure it matches current role
      if (n.userType && user?.role && n.userType !== user.role) return false;
      return true;
    });
  }, [notifications, showUnreadOnly, filterType, filterChannel, user]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405C18.525 14.632 18 13.38 18 12V8a6 6 0 00-5-5.917V2a1 1 0 10-2 0v.083A6 6 0 006 8v4c0 1.38-.525 2.632-1.595 3.595L3 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications ({unreadCount} unread)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotifications()}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={loading}
              >
                {loading ? '⟳' : '↻'}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={showUnreadOnly} onChange={(e) => setShowUnreadOnly(e.target.checked)} />
              Unread
            </label>
            <select
              className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {typeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              {channelOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications to display
              </div>
            ) : (
              filteredNotifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id || notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon & Priority */}
                    <div className="flex-shrink-0 relative">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <span className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.isRead 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {notification.channel !== 'inApp' && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                            {notification.channel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && user?.role === 'admin' && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/admin/notifications';
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}

          {/* Footer - REMOVED: Dashboard now provides full notification functionality */}
          {/* {filteredNotifications.length > 0 && user?.role === 'staff' && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/staff/notifications';
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )} */}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(selectedNotification.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedNotification.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(selectedNotification.priority)}`}>
                      {selectedNotification.priority}
                    </span>
                    <span>{selectedNotification.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {selectedNotification.message}
              </p>

              {/* Metadata */}
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                <div>
                  <strong>Received:</strong> {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                </div>
                <div>
                  <strong>Channel:</strong> {selectedNotification.channel}
                </div>
                {selectedNotification.isRead && selectedNotification.readAt && (
                  <div>
                    <strong>Read:</strong> {formatDistanceToNow(new Date(selectedNotification.readAt), { addSuffix: true })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedNotification.actionUrl && (
                  <button
                    onClick={() => handleActionClick(selectedNotification)}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Take Action
                  </button>
                )}
                <button
                  onClick={async () => {
                    await deleteNotification(selectedNotification._id || selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;