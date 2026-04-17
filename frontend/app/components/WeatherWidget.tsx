import { Cloud, CloudRain, CloudLightning, Sun, Wind, CloudDrizzle, CloudSnow } from "lucide-react";
import { Card } from "./ui/card";

interface WeatherWidgetProps {
  temperature: number;
  weatherCondition: 'kering' | 'normal' | 'berangin' | 'hujan' | 'hujan_deras';
  updateTime: string;
  weatherDescription?: string; // Real description from OpenWeatherMap e.g. "light rain"
  weatherMain?: string;        // Main category e.g. "Rain", "Clouds", "Clear", "Thunderstorm"
}

// -------------------------------------------------------
// Gradient mapping:
//   biru terang  → kering, normal, berangin
//   biru tua     → hujan, drizzle, rain
//   ungu         → hujan_deras, thunderstorm (ekstrim)
// -------------------------------------------------------
function getGradient(weatherMain?: string, condition?: string): string {
  const main = (weatherMain || '').toLowerCase();
  if (main === 'thunderstorm') return 'bg-gradient-to-br from-purple-700 to-violet-900';
  if (main === 'drizzle')      return 'bg-gradient-to-br from-blue-700 to-blue-900';
  if (main === 'rain')         return 'bg-gradient-to-br from-blue-700 to-blue-900';
  if (main === 'snow')         return 'bg-gradient-to-br from-blue-400 to-blue-600';
  if (main === 'clear')        return 'bg-gradient-to-br from-sky-500 to-blue-600';
  if (main === 'clouds')       return 'bg-gradient-to-br from-blue-500 to-cyan-600';
  // fallback per condition
  if (condition === 'hujan_deras') return 'bg-gradient-to-br from-purple-700 to-violet-900';
  if (condition === 'hujan')       return 'bg-gradient-to-br from-blue-700 to-blue-900';
  if (condition === 'berangin')    return 'bg-gradient-to-br from-sky-500 to-blue-600';
  if (condition === 'kering')      return 'bg-gradient-to-br from-sky-500 to-blue-600';
  return 'bg-gradient-to-br from-blue-500 to-cyan-600'; // normal
}

// Icon berdasarkan OWM weather_main
function getWeatherIcon(weatherMain?: string, condition?: string) {
  const main = (weatherMain || '').toLowerCase();
  if (main === 'thunderstorm') return <CloudLightning className="size-20 opacity-50" />;
  if (main === 'drizzle')      return <CloudDrizzle className="size-20 opacity-40" />;
  if (main === 'rain')         return <CloudRain className="size-20 opacity-40" />;
  if (main === 'snow')         return <CloudSnow className="size-20 opacity-40" />;
  if (main === 'clear')        return <Sun className="size-20 opacity-40" />;
  if (main === 'clouds')       return <Cloud className="size-20 opacity-30" />;
  if (condition === 'berangin')    return <Wind className="size-20 opacity-40" />;
  if (condition === 'kering')      return <Sun className="size-20 opacity-40" />;
  if (condition === 'hujan_deras') return <CloudLightning className="size-20 opacity-50" />;
  if (condition === 'hujan')       return <CloudRain className="size-20 opacity-40" />;
  return <Cloud className="size-20 opacity-30" />;
}

// Label siaga (selalu ditampilkan, tapi kecil di bawah description)
const conditionLabel: Record<string, string> = {
  kering:      '☀️ Kering',
  normal:      '🌤️ Normal',
  berangin:    '🌪️ Berangin',
  hujan:       '🌧️ Hujan',
  hujan_deras: '⛈️ Hujan Deras',
};

// Capitalize: "light rain" → "Light Rain"
function capitalize(str: string) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function WeatherWidget({ temperature, weatherCondition, updateTime, weatherDescription, weatherMain }: WeatherWidgetProps) {
  const gradient       = getGradient(weatherMain, weatherCondition);
  const icon           = getWeatherIcon(weatherMain, weatherCondition);
  const hasRealDesc    = !!weatherDescription;
  // If OWM gave us a description, show it. Otherwise show Indonesian fallback
  const displayDesc    = hasRealDesc
    ? capitalize(weatherDescription!)
    : conditionLabel[weatherCondition].replace(/^.{2}\s/, '');

  // Format temp: always show integer (no decimal)
  const displayTemp = Math.round(temperature);

  return (
    <Card className={`p-6 ${gradient} text-white border-0 shadow-xl`}>
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

        {/* Temperature + Description */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-bold tracking-tight">{displayTemp}</span>
              <span className="text-3xl">°C</span>
            </div>
            <div className="mt-3">
              {/* OWM description sebagai satu-satunya judul — "Light Rain", "Thunderstorm", dsb */}
              <p className="text-base font-bold opacity-100 tracking-wide">{displayDesc}</p>
              {/* Label siaga dihapus — tidak perlu double info */}
            </div>
          </div>
          {icon}
        </div>
      </div>
    </Card>
  );
}
