import React from 'react';
import { Link, useLocation } from 'react-router';
import { Droplets, LayoutDashboard, Video, FileText, Activity } from 'lucide-react';
import { cn } from '../ui/utils';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Live AI Vision',
    icon: Video,
    path: '/dashboard/ai-vision',
  },
  {
    label: 'Log Sensor',
    icon: FileText,
    path: '/dashboard/logs',
  },
  {
    label: 'Status Alat',
    icon: Activity,
    path: '/dashboard/status',
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Droplets className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">MakeSens</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AIEWS Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            Sistem Monitoring Air
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Version 1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
