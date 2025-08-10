// src/components/admin/components/notification/NotificationItem.jsx
import { useState } from "react";
import { format } from "date-fns";

export default function NotificationItem({ 
  notification, 
  isSelected, 
  onToggleSelect 
}) {
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
          className={`flex-1 min-w-0 cursor-pointer ${notification.read ? "opacity-75" : ""}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-center">
            <p className={`text-sm font-medium truncate ${notification.read ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
              {notification.title}
            </p>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {notification.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(notification.createdAt), 'MMM d, yyyy - h:mm a')}
              </span>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <p>{notification.message}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recipient: {notification.recipient}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}