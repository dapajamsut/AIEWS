import React from 'react';
import { Card } from '../ui/card';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'danger',
    title: 'Status Siaga 2',
    message: 'TMA mencapai 145cm - batas siaga 2 terlampaui',
    time: '5 menit lalu',
  },
  {
    id: 2,
    type: 'warning',
    title: 'Sampah Terdeteksi',
    message: 'TDI mencapai 42% - pembersihan diperlukan',
    time: '15 menit lalu',
  },
  {
    id: 3,
    type: 'info',
    title: 'Curah Hujan Meningkat',
    message: 'Intensitas hujan 25mm/jam di area monitoring',
    time: '1 jam lalu',
  },
  {
    id: 4,
    type: 'success',
    title: 'Data Tersinkronisasi',
    message: 'Semua sensor beroperasi normal',
    time: '2 jam lalu',
  },
];

const iconMap = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const colorMap = {
  danger: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  info: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
};

export function NotificationPanel() {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifikasi & Peringatan</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Real-time</span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type as keyof typeof iconMap];
          const colorClass = colorMap[notification.type as keyof typeof colorMap];

          return (
            <div key={notification.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex space-x-3">
                <div className={`p-2 rounded-lg h-fit ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
