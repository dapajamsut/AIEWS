"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "critical" | "warning" | "info";
  read?: boolean;
}

export default function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifs, setLocalNotifs] = useState(notifications.map(n => ({ ...n, read: false })));

  const unreadCount = localNotifs.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical": return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      case "warning": return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
      default: return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="size-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-4 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {localNotifs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              localNotifs.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${!notif.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${!notif.read ? 'bg-blue-600' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(notif.type)}`}>
                          {notif.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{notif.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}