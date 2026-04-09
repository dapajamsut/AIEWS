import { Bell, Clock } from "lucide-react";
import { SensorCard } from "../components/dashboard/SensorCard";
import { WeatherWidget } from "../components/dashboard/WeatherWidget";
import { AIForecast } from "../components/dashboard/AIForecast";
import { CameraFeed } from "../components/dashboard/CameraFeed";
import { MapView } from "../components/dashboard/MapView";
import { SystemLogs } from "../components/dashboard/SystemLogs";

export default function Dashboard() {
  const sensors = [
    {
      id: "A-12 BRIDGE NORTH",
      location: "Bridge North",
      value: 450,
      unit: "cm",
      status: "alert" as const,
      trend: "rising" as const,
      target: 300,
    },
    {
      id: "B-05 MAIN SLUICE",
      location: "Main Sluice",
      value: 320,
      unit: "cm",
      status: "warning" as const,
      trend: "rising" as const,
      target: 250,
    },
    {
      id: "C-08 EAST REACH",
      location: "East Reach",
      value: 150,
      unit: "cm",
      status: "normal" as const,
      trend: "falling" as const,
      target: 180,
    },
    {
      id: "D-01 SPILLWAY",
      location: "Spillway",
      value: 110,
      unit: "cm",
      status: "normal" as const,
      trend: "falling" as const,
      target: 200,
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Main Watershed Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-time monitoring and AI-powered flood prediction
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">10:48 AM</span>
            </div>
            <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-800 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                SIAGA 2
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 space-y-6">
        {/* Real-time Water Level Sensors */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Real-time Water Level Sensors
            </h2>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sensors.map((sensor, index) => (
              <SensorCard key={index} {...sensor} />
            ))}
          </div>
        </section>

        {/* Weather, AI Forecast, and Camera */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <WeatherWidget />
          </div>
          <div>
            <AIForecast />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Active Sensors</span>
                  <span className="font-semibold text-slate-900 dark:text-white">24/24</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Cameras Online</span>
                  <span className="font-semibold text-slate-900 dark:text-white">8/8</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <span className="text-sm text-red-700 dark:text-red-400">Active Alerts</span>
                  <span className="font-semibold text-red-700 dark:text-red-400">3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">System Uptime</span>
                  <span className="font-semibold text-slate-900 dark:text-white">99.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Feed and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CameraFeed />
          <MapView />
        </div>

        {/* System Logs */}
        <SystemLogs />
      </div>
    </div>
  );
}
