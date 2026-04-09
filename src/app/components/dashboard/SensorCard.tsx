import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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
  const statusColors = {
    alert: "bg-red-500",
    warning: "bg-orange-500",
    normal: "bg-green-500",
  };

  const statusBgColors = {
    alert: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900",
    warning: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900",
    normal: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900",
  };

  const statusTextColors = {
    alert: "text-red-700 dark:text-red-400",
    warning: "text-orange-700 dark:text-orange-400",
    normal: "text-green-700 dark:text-green-400",
  };

  const trendIcons = {
    rising: TrendingUp,
    falling: TrendingDown,
    steady: Minus,
  };

  const TrendIcon = trendIcons[trend];

  return (
    <div className={`p-5 rounded-xl border ${statusBgColors[status]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{id}</p>
          <h3 className="font-semibold text-slate-900 dark:text-white mt-0.5">{location}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[status]} text-white uppercase`}>
          {status}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
        <span className="text-lg text-slate-600 dark:text-slate-400">{unit}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 ${statusTextColors[status]}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">{trend}</span>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Target: {target}{unit}
        </span>
      </div>

      <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColors[status]} transition-all`}
          style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
