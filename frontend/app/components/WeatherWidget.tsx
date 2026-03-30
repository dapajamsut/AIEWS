import { Cloud, Droplets, Wind } from "lucide-react";
import { Card } from "./ui/card";

interface WeatherWidgetProps {
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: number;
  updateTime: string;
}

export function WeatherWidget({ temperature, condition, humidity, rainfall, updateTime }: WeatherWidgetProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-0 shadow-xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="size-6" />
            <h3 className="text-lg font-semibold">Weather Status</h3>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
            Update: {updateTime}
          </span>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-bold tracking-tight">{temperature}</span>
              <span className="text-3xl">°C</span>
            </div>
            <p className="text-lg mt-2 opacity-90">{condition}</p>
          </div>
          <Cloud className="size-20 opacity-30" />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Droplets className="size-5" />
            </div>
            <div>
              <p className="text-xs opacity-75">Humidity</p>
              <p className="text-xl font-semibold">{humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wind className="size-5" />
            </div>
            <div>
              <p className="text-xs opacity-75">Rainfall</p>
              <p className="text-xl font-semibold">{rainfall}mm/h</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
