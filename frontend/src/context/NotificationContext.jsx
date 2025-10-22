// frontend/src/context/NotificationContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { toast } from 'react-toastify';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  preferences: null,
  loading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_PREFERENCES: 'SET_PREFERENCES',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload, error: null };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ActionTypes.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload, loading: false };

    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    case ActionTypes.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id ? action.payload : notification
        ),
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notification =>
          notification.id !== action.payload && notification._id !== action.payload
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case ActionTypes.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case ActionTypes.SET_PREFERENCES:
      return { ...state, preferences: action.payload };

    case ActionTypes.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          (notification.id === action.payload || notification._id === action.payload)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case ActionTypes.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      };

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}

// Context
const NotificationContext = createContext(undefined);

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Helper: check auth token
  const hasToken = () => {
    const token = localStorage.getItem('token');
    return token && token !== 'undefined' && token !== 'null';
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      if (!hasToken()) return;
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await notificationService.getMyNotifications(params);
      console.log('Fetched notifications response:', response); // Debug log
      
      // Handle different response structures
      let notifications = [];
      if (response.data && response.data.notifications) {
        notifications = response.data.notifications;
      } else if (response.notifications) {
        notifications = response.notifications;
      } else if (Array.isArray(response.data)) {
        notifications = response.data;
      } else if (Array.isArray(response)) {
        notifications = response;
      }
      
      dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications });
    } catch (error) {
      console.error('Fetch notifications error:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      toast.error(`Failed to fetch notifications: ${error.message}`);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!hasToken()) return;
      const response = await notificationService.getUnreadCount();
      console.log('Unread count response:', response); // Debug log
      
      // Handle different response structures
      let count = 0;
      if (response.data && typeof response.data.count === 'number') {
        count = response.data.count;
      } else if (typeof response.count === 'number') {
        count = response.count;
      }
      
      dispatch({ type: ActionTypes.SET_UNREAD_COUNT, payload: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    try {
      if (!hasToken()) return;
      const data = await notificationService.getMyPreferences();
      dispatch({ type: ActionTypes.SET_PREFERENCES, payload: data.preferences || {} });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      if (hasToken()) toast.error(`Failed to fetch preferences: ${error.message}`);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (!hasToken()) return;
      await notificationService.markAsRead(notificationId);
      dispatch({ type: ActionTypes.MARK_AS_READ, payload: notificationId });
    } catch (error) {
      toast.error(`Failed to mark as read: ${error.message}`);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!hasToken()) return;
      await notificationService.markAllAsRead();
      dispatch({ type: ActionTypes.MARK_ALL_AS_READ });
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(`Failed to mark all as read: ${error.message}`);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      if (!hasToken()) return;
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: notificationId });
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(`Failed to delete notification: ${error.message}`);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (preferences) => {
    try {
      if (!hasToken()) return;
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const data = await notificationService.updateMyPreferences(preferences);
      dispatch({ type: ActionTypes.SET_PREFERENCES, payload: data.preferences || {} });
      toast.success('Preferences updated successfully');
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      toast.error(`Failed to update preferences: ${error.message}`);
    }
  }, []);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification });
    toast.info(notification.title);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // Initialize data on mount and set up polling (only when authenticated)
  useEffect(() => {
    if (!hasToken()) return;
    fetchNotifications();
    fetchUnreadCount();
    fetchPreferences();

    // Set up real-time polling every 30 seconds for unread count
    const unreadCountInterval = setInterval(() => {
      if (hasToken()) fetchUnreadCount();
    }, 30000);

    // Set up polling every 60 seconds for new notifications
    const notificationsInterval = setInterval(() => {
      if (hasToken()) fetchNotifications({ limit: 20 }); // Get latest 20 notifications
    }, 60000);

    // Cleanup intervals on unmount
    return () => {
      clearInterval(unreadCountInterval);
      clearInterval(notificationsInterval);
    };
  }, [fetchNotifications, fetchUnreadCount, fetchPreferences]);

  const value = {
    // State
    ...state,
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    addNotification,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;