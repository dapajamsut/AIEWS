import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  status?: 'normal' | 'warning' | 'danger';
  trend?: string;
}

export function MetricCard({ title, value, unit, icon: Icon, status = 'normal', trend }: MetricCardProps) {
  const statusColors = {
    normal: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
            {unit && <span className="text-lg text-gray-500 dark:text-gray-400">{unit}</span>}
          </div>
          {trend && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${statusColors[status]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
