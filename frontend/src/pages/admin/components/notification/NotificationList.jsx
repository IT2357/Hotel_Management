// src/pages/admin/components/notification/NotificationList.jsx
import React, { useState } from "react";
import { format } from "date-fns";
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Pagination from "../../../../components/ui/Pagination";

export default function NotificationListWrapper({
  notifications = [], // Accept notifications as prop
  totalPages = 1, // Accept totalPages as prop
  onDelete,
  onMarkAllRead,
  onPageChange, // Accept page change handler
  currentPage = 1, // Accept currentPage
}) {
  if (!Array.isArray(notifications)) {
    console.error("Expected notifications to be an array but got:", notifications);
    return (
      <div className="px-6 py-4 text-center text-red-500 dark:text-red-400">
        Invalid notification data.
      </div>
    );
  }

  return (
    <NotificationList
      notifications={notifications}
      onDelete={onDelete}
      onMarkAllRead={onMarkAllRead}
      totalPages={totalPages}
      currentPage={currentPage}
      onPageChange={onPageChange}
    />
  );
}

function NotificationList({
  notifications,
  onDelete,
  onMarkAllRead,
  totalPages,
  currentPage,
  onPageChange,
}) {
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [internalPage, setInternalPage] = useState(1);
  const itemsPerPage = 10;

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNotifications(notifications.map((n) => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (
      window.confirm("Are you sure you want to delete the selected notifications?")
    ) {
      selectedNotifications.forEach((id) => onDelete(id));
      setSelectedNotifications([]);
    }
  };

  // Use internal pagination if no external pagination is provided
  const effectivePage = onPageChange ? currentPage : internalPage;
  const setEffectivePage = onPageChange ? onPageChange : setInternalPage;

  const indexOfLastItem = effectivePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = notifications.slice(indexOfFirstItem, indexOfLastItem);
  const effectiveTotalPages = totalPages || Math.ceil(notifications.length / itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={
              selectedNotifications.length > 0 &&
              selectedNotifications.length === notifications.length
            }
            onChange={toggleSelectAll}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedNotifications.length} selected
          </span>
        </div>
        <div className="flex space-x-2">
          {onMarkAllRead && (
            <Button size="sm" onClick={onMarkAllRead}>
              Mark All as Read
            </Button>
          )}
          {selectedNotifications.length > 0 && (
            <Button size="sm" variant="danger" onClick={handleDeleteSelected}>
              Delete Selected
            </Button>
          )}
        </div>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md dark:bg-gray-800">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {currentItems.length > 0 ? (
            currentItems.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.includes(notification.id)}
                onToggleSelect={toggleSelectNotification}
                onDelete={onDelete}
              />
            ))
          ) : (
            <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No notifications found
            </li>
          )}
        </ul>
      </div>
      {notifications.length > itemsPerPage && (
        <Pagination
          currentPage={effectivePage}
          totalPages={effectiveTotalPages}
          onPageChange={(page) => setEffectivePage(page)}
          className="mt-4"
        />
      )}
    </div>
  );
}

function NotificationItem({ notification, isSelected, onToggleSelect, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <li className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
      <div className="px-6 py-4 flex items-center space-x-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(notification.id)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
        />
        <div
          className={`flex-1 min-w-0 cursor-pointer ${
            notification.read ? "opacity-75" : ""
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-center">
            <p
              className={`text-sm font-medium truncate ${
                notification.read
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {notification.title}
            </p>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  notification.type === "booking_confirmation" ? "primary" : "success"
                }
              >
                {notification.type}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(notification.createdAt), "MMM d, yyyy - h:mm a")}
              </span>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <p>{notification.message}</p>
              <div className="mt-3 flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Recipient: {notification.userEmail || "Unknown"}
                </p>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}