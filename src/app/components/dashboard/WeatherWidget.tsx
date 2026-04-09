import { Cloud, Droplets, Wind } from "lucide-react";

export function WeatherWidget() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-950 p-6 rounded-xl text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Weather Status</h3>
          <p className="text-xs opacity-75">Updated 10m ago</p>
        </div>
        <Cloud className="w-12 h-12 opacity-80" />
      </div>

      <div className="mb-6">
        <div className="text-5xl font-bold mb-2">28°C</div>
        <p className="text-sm opacity-90">Thunderstorm expected</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4" />
            <span className="text-xs opacity-75">Humidity</span>
          </div>
          <p className="text-xl font-semibold">88%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4" />
            <span className="text-xs opacity-75">Rainfall</span>
          </div>
          <p className="text-xl font-semibold">45mm/h</p>
        </div>
      </div>
    </div>
  );
}
