import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface SensorCardProps {
  id: string;
  location: string;
  value: number;
  unit: string;
  status: "alert" | "warning" | "normal";
  trend: "rising" | "falling" | "steady";
  target: number;
}

export function SensorCard({ id, location, value, unit, status, trend, target }: SensorCardProps) {
  const statusConfig = {
    alert: { label: "ALERT", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900" },
    warning: { label: "WARNING", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900" },
    normal: { label: "NORMAL", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900" },
  };

  const trendConfig = {
    rising: { icon: TrendingUp, label: "Rising Rapidly", color: "text-red-600 dark:text-red-400" },
    falling: { icon: TrendingDown, label: "Falling", color: "text-green-600 dark:text-green-400" },
    steady: { icon: Minus, label: "Steady", color: "text-orange-600 dark:text-orange-400" },
  };

  const TrendIcon = trendConfig[trend].icon;
  const percentage = (value / target) * 100;

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {id}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{location}</p>
          </div>
          <Badge className={`${statusConfig[status].color} border font-semibold text-xs px-2.5 py-0.5`}>
            {statusConfig[status].label}
          </Badge>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value}
          </span>
          <span className="text-lg text-gray-500 dark:text-gray-400">{unit}</span>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2">
          <TrendIcon className={`size-4 ${trendConfig[trend].color}`} />
          <span className={`text-sm font-medium ${trendConfig[trend].color}`}>
            {trendConfig[trend].label}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500 ml-auto">
            Target: {target}{unit}
          </span>
        </div>

        {/* Progress Bar */}
        <Progress 
          value={percentage} 
          className={`h-1.5 ${
            status === 'alert' ? '[&>div]:bg-red-600' : 
            status === 'warning' ? '[&>div]:bg-orange-600' : 
            '[&>div]:bg-green-600'
          }`}
        />
      </div>
    </Card>
  );
}
