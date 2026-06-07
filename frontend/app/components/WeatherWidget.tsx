import {
  Cloud, CloudRain, CloudLightning, Sun, Wind, CloudDrizzle, CloudSnow,
  MapPin, ThermometerSun, CloudFog,
} from "lucide-react";
import { Card } from "./ui/card";

interface WeatherWidgetProps {
  temperature: number;
  weatherCondition: 'kering' | 'normal' | 'berangin' | 'hujan' | 'hujan_deras';
  updateTime: string;
  weatherDescription?: string;
  weatherMain?: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  visibility?: number;
  rain1h?: number;
  cityName?: string;
  tempMin?: number;
  tempMax?: number;
}

// 3-stop gradient agar terasa premium
function getGradient(weatherMain?: string, condition?: string): string {
  const main = (weatherMain || '').toLowerCase();
  if (main === 'thunderstorm') return 'from-indigo-900 via-purple-800 to-violet-950';
  if (main === 'drizzle')      return 'from-slate-700 via-blue-800 to-slate-900';
  if (main === 'rain')         return 'from-blue-700 via-indigo-800 to-slate-950';
  if (main === 'snow')         return 'from-cyan-300 via-sky-500 to-blue-700';
  if (main === 'clear')        return 'from-amber-300 via-orange-500 to-rose-600';
  if (main === 'clouds')       return 'from-sky-500 via-blue-600 to-indigo-800';
  if (['mist', 'fog', 'haze', 'smoke'].includes(main)) return 'from-slate-400 via-slate-600 to-slate-800';
  if (condition === 'hujan_deras') return 'from-indigo-900 via-purple-800 to-violet-950';
  if (condition === 'hujan')       return 'from-blue-700 via-indigo-800 to-slate-950';
  if (condition === 'berangin')    return 'from-sky-500 via-cyan-600 to-blue-800';
  if (condition === 'kering')      return 'from-amber-300 via-orange-500 to-rose-600';
  return 'from-sky-500 via-blue-600 to-indigo-800';
}

function getWeatherIcon(weatherMain?: string, condition?: string) {
  const main = (weatherMain || '').toLowerCase();
  const cls = "size-full text-white drop-shadow-[0_8px_30px_rgba(255,255,255,0.4)]";
  if (main === 'thunderstorm') return <CloudLightning className={cls} strokeWidth={1.2} />;
  if (main === 'drizzle')      return <CloudDrizzle className={cls} strokeWidth={1.2} />;
  if (main === 'rain')         return <CloudRain className={cls} strokeWidth={1.2} />;
  if (main === 'snow')         return <CloudSnow className={cls} strokeWidth={1.2} />;
  if (main === 'clear')        return <Sun className={cls} strokeWidth={1.2} />;
  if (main === 'clouds')       return <Cloud className={cls} strokeWidth={1.2} />;
  if (['mist', 'fog', 'haze', 'smoke'].includes(main)) return <CloudFog className={cls} strokeWidth={1.2} />;
  if (condition === 'berangin')    return <Wind className={cls} strokeWidth={1.2} />;
  if (condition === 'kering')      return <Sun className={cls} strokeWidth={1.2} />;
  if (condition === 'hujan_deras') return <CloudLightning className={cls} strokeWidth={1.2} />;
  if (condition === 'hujan')       return <CloudRain className={cls} strokeWidth={1.2} />;
  return <Cloud className={cls} strokeWidth={1.2} />;
}

const conditionBadge: Record<string, { emoji: string; label: string }> = {
  kering:      { emoji: '☀️', label: 'Kering' },
  normal:      { emoji: '🌤️', label: 'Normal' },
  berangin:    { emoji: '🌪️', label: 'Berangin' },
  hujan:       { emoji: '🌧️', label: 'Hujan' },
  hujan_deras: { emoji: '⛈️', label: 'Hujan Deras' },
};

function capitalize(str: string) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function WeatherWidget({
  temperature, weatherCondition, updateTime,
  weatherDescription, weatherMain,
  feelsLike, cityName, tempMin, tempMax,
}: WeatherWidgetProps) {
  const gradient    = getGradient(weatherMain, weatherCondition);
  const icon        = getWeatherIcon(weatherMain, weatherCondition);
  const displayDesc = weatherDescription
    ? capitalize(weatherDescription)
    : conditionBadge[weatherCondition]?.label ?? 'Normal';
  const displayTemp = Math.round(temperature);
  const badge = conditionBadge[weatherCondition];

  return (
    <Card
      className={`
        relative overflow-hidden rounded-2xl border-0 shadow-2xl text-white
        bg-gradient-to-br ${gradient}
        h-full p-6 sm:p-7
        flex flex-col
      `}
    >
      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-white/5 blur-3xl" />

      {/* Subtle grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' /%3E%3C/svg%3E\")",
        }}
      />

      {/* === HEADER === */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
            <Cloud className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide leading-none">Weather Status</h3>
            <p className="text-[10px] text-white/70 mt-1 leading-none">Live data from satellite</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/25 uppercase tracking-wider shadow whitespace-nowrap">
              {badge.emoji} {badge.label}
            </span>
          )}
        </div>
      </div>

      {/* === HERO: 2 columns (text kiri, ikon kanan) === */}
      <div className="relative z-10 grid grid-cols-[1fr_auto] items-center gap-4 my-auto py-4">
        {/* LEFT: temperature + description + meta */}
        <div className="min-w-0">
          <div className="flex items-start gap-1">
            <span
              className="text-[5.5rem] sm:text-[6.5rem] font-extralight tracking-tighter leading-[0.85] drop-shadow-2xl"
              style={{ fontVariantNumeric: 'tabular-nums', textShadow: '0 4px 30px rgba(255,255,255,0.25)' }}
            >
              {displayTemp}
            </span>
            <span className="text-2xl font-light text-white/80 mt-3">°C</span>
          </div>

          <p className="text-xl sm:text-2xl font-semibold mt-1 tracking-tight drop-shadow truncate">
            {displayDesc}
          </p>

          <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-xs text-white/85 flex-wrap">
            {cityName && (
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="size-3.5" />
                {cityName}
              </span>
            )}
            {(tempMin !== undefined && tempMax !== undefined) && (
              <span className="flex items-center gap-1 font-medium">
                <span className="opacity-60">H</span>
                {Math.round(tempMax)}°
                <span className="opacity-60 ml-1">L</span>
                {Math.round(tempMin)}°
              </span>
            )}
            {feelsLike !== undefined && (
              <span className="flex items-center gap-1 font-medium">
                <ThermometerSun className="size-3.5" />
                Terasa {Math.round(feelsLike)}°
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: animated weather icon */}
        <div className="size-28 sm:size-36 relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
          <div className="relative size-full animate-[float_6s_ease-in-out_infinite]">
            {icon}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </Card>
  );
}
