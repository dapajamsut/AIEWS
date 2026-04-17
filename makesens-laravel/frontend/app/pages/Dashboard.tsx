"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Wind, Droplets, Gauge, Thermometer, Activity, Clock, RefreshCw, Camera, ArrowRight, Database, Download, FileText, CheckCircle2, AlertTriangle, Droplet, Info } from "lucide-react";
import { SensorCard } from "../components/SensorCard";
import { WeatherWidget } from "../components/WeatherWidget";
import { SnapshotFeed } from "../components/SnapshotFeed";
import { LogTable } from "../components/LogTable";
// AIPrediction import removed as requested
import StatusSiaga from "../components/StatusSiaga";
import NotificationBell from "../components/NotificationBell";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

const MapWidget = dynamic(
  () => import("../components/MapWidget").then((mod) => mod.MapWidget),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-400 font-medium">Loading Interactive Map...</p>
      </div>
    ),
  }
);

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState("");
  const [countdown, setCountdown] = useState(300);

  const CCTV_IMAGE_URL = `http://108.136.240.250:1984/api/frame.jpeg?src=banjir_cam&t=${refreshKey}`;

  // --- LOGIC TIMER ANTI-RESET ---
  useEffect(() => {
    const lastRefreshTime = localStorage.getItem("last_cctv_refresh");
    const now = Date.now();
    if (lastRefreshTime) {
      const diffInSeconds = Math.floor((now - parseInt(lastRefreshTime)) / 1000);
      if (diffInSeconds >= 300) {
        handleRefreshSnapshot();
      } else {
        setCountdown(300 - diffInSeconds);
      }
    } else {
      localStorage.setItem("last_cctv_refresh", now.toString());
    }
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { handleRefreshSnapshot(); return 300; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, []);

  const handleRefreshSnapshot = () => {
    setRefreshKey((prev) => prev + 1);
    localStorage.setItem("last_cctv_refresh", Date.now().toString());
  };

  useEffect(() => {
    setSnapshotTimestamp(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
  }, [refreshKey]);

  // ==============================
  // 🔥 SENSOR STATE (REALTIME)
  // ==============================
  const [sensors, setSensors] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState({
    siaga1: { wind: 20, rain: 100, water: 400, temp: 40, humidity: 95, pressure: 1030 },
    siaga2: { wind: 15, rain: 70, water: 300, temp: 35, humidity: 85, pressure: 1010 },
    siaga3: { wind: 10, rain: 30, water: 150, temp: 30, humidity: 70, pressure: 1000 },
  });
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [currentWeatherThresholds, setCurrentWeatherThresholds] = useState<any>({
    wind: 10, rain: 5, temp: 28, humidity: 65, pressure: 1015 // Default: normal condition
  });
  const [selectedRegion, setSelectedRegion] = useState<string>('jakarta_pusat');
  const [regions, setRegions] = useState<any[]>([]);
  const [activeRegionData, setActiveRegionData] = useState<any>({ name: 'Jakarta Pusat', lat: -6.1744, lon: 106.8229 });
  const [siagaLevel, setSiagaLevel] = useState<1 | 2 | 3>(3);
  const [weatherCondition, setWeatherCondition] = useState<'kering' | 'normal' | 'berangin' | 'hujan' | 'hujan_deras'>('normal');


  // ==============================
  // 🔥 LOGGING SETTINGS
  // ==============================
  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const [loggingInterval, setLoggingInterval] = useState(5);
  const [logHours, setLogHours] = useState(0);
  const [logMinutes, setLogMinutes] = useState(5);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  /** Dinaikkan setiap kali save manual berhasil → memicu LogTable refresh segera */
  const [logRefreshTrigger, setLogRefreshTrigger] = useState(0);
  // Ref keeps latest state for auto-log timer (avoids stale closures)
  const logDataRef = useRef({ currentWeather: null as any, siagaLevel: 3 as 1 | 2 | 3, weatherCondition: 'normal' as string });

  // 🔥 DESKRIPSI NAMA SENSOR (TAMBAHAN BARU)
  const getSensorName = (type: string) => {
    switch (type) {
      case "wind":
        return "Sensor Kecepatan Angin";
      case "rain":
        return "Sensor Curah Hujan";
      case "water":
        return "Sensor Tinggi Air";
      case "temp":
        return "Sensor Suhu Udara";
      case "humidity":
        return "Sensor Kelembapan Udara";
      case "pressure":
        return "Sensor Tekanan Udara";
      default:
        return "Sensor Deteksi";
    }
  };

  // 🔥 ICON MAPPING
  const getIcon = (type: string) => {
    switch (type) {
      case "wind":
        return <Wind className="size-4 text-blue-600" />;
      case "rain":
        return <Droplets className="size-4 text-cyan-600" />;
      case "water":
        return <Activity className="size-4 text-purple-600" />;
      case "temp":
        return <Thermometer className="size-4 text-orange-600" />;
      case "humidity":
        return <Droplets className="size-4 text-blue-500" />;
      case "pressure":
        return <Gauge className="size-4 text-green-600" />;
      default:
        return <Activity />;
    }
  };

  const getTarget = (type: string) => {
    switch (type) {
      case "water": return 300;
      case "rain": return 50;
      case "wind": return 20;
      case "temp": return 35;
      case "humidity": return 90;
      case "pressure": return 1020;
      default: return 100;
    }
  };

  // 🔥 FETCH DATA DARI LARAVEL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8002/api/sensors/latest", {
          cache: "no-store",
          headers: {
            apikey: "pikel2"
          }
        });
        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        console.log("🔥 DATA API:", data);

        const mapped = data.map((s: any) => ({
          id: s.sensor_code,
          name: s.sensor_code, // 🔥 Tambahan biar atasnya tetap kode sensor
          location: getSensorName(s.type), // 🔥 PERBAIKAN: Subtitle diubah jadi deskripsi sensor
          value: Number(s.value),
          unit: s.unit,
          status: s.status === "WARNING" ? "warning" : "normal",
          trend: "steady",
          target: getTarget(s.type),
          type: s.type
        }));

        // DATA WEB URUTAN SESUAI SENSOR_CODE
        const order = [
          "ANEMO-01",
          "TIP-01",
          "WATER-01",
          "BME-TEMP",
          "BME-HUM",
          "BME-PRES"
        ];

        mapped.sort((a: any, b: any) => {
          return order.indexOf(a.id) - order.indexOf(b.id);
        });

        const filtered = mapped.filter((s: any) => s.id !== "SENSOR_001");
        setSensors(filtered);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2000); // 🔥 realtime 2 detik

    return () => clearInterval(interval);
  }, []);

  // 🔥 FETCH THRESHOLD DARI SERVER
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await fetch("http://localhost:8002/api/thresholds?type=siaga", {
          cache: "no-store",
          headers: { apikey: "pikel2" }
        });
        if (!res.ok) {
          throw new Error("Tidak dapat memuat threshold");
        }

        const data = await res.json();
        setThresholds({
          siaga1: {
            wind: 0, // Not used for SIAGA anymore
            rain: 0, // Not used for SIAGA anymore
            water: Number(data.siaga1?.water ?? 400),
            temp: 0, // Not used
            humidity: 0, // Not used
            pressure: 0, // Not used
          },
          siaga2: {
            wind: 0,
            rain: 0,
            water: Number(data.siaga2?.water ?? 300),
            temp: 0,
            humidity: 0,
            pressure: 0,
          },
          siaga3: {
            wind: 0,
            rain: 0,
            water: Number(data.siaga3?.water ?? 150),
            temp: 0,
            humidity: 0,
            pressure: 0,
          },
        });
      } catch (err) {
        console.error("Fetch thresholds error:", err);
      }
    };

    fetchThresholds();

    // 🔥 Re-fetch when user navigates back to this tab/page (e.g. from threshold page)
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchThresholds();
    };

    const listener = () => fetchThresholds();
    window.addEventListener("thresholdsUpdated", listener);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("thresholdsUpdated", listener);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // 🔥 LOAD REGION FROM STORAGE
  useEffect(() => {
    const savedRegionData = localStorage.getItem('selectedRegionData');
    if (savedRegionData) {
      try {
        const parsedData = JSON.parse(savedRegionData);
        if (parsedData.lat && parsedData.lon) {
          setRegions([parsedData]);
          setSelectedRegion(parsedData.id);
          setActiveRegionData(parsedData);
        }
      } catch (e) {
        console.error("Failed parsing selectedRegionData from storage:", e);
      }
    } else {
      // Fallback dummy region so it doesn't break
      const fallback = { id: "jakarta_pusat", name: "Jakarta Pusat", lat: "-6.1744", lon: "106.8229", latitude: "-6.1744", longitude: "106.8229" };
      setRegions([fallback]);
      setActiveRegionData(fallback);
    }
  }, []);

  // 🔥 FETCH WEATHER DATA FROM LARAVEL API
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const lat = activeRegionData.lat || -6.1744;
        const lon = activeRegionData.lon || 106.8229;
        const regionId = activeRegionData.id || selectedRegion;

        const res = await fetch(`http://localhost:8002/api/weather?region=${regionId}&lat=${lat}&lon=${lon}`, {
          cache: "no-store",
          headers: { apikey: "pikel2" }
        });

        const data = await res.json();

        if (res.ok && data?.current_weather) {
          setWeatherCondition(data.condition);
          setCurrentWeather(data.current_weather);
          setCurrentWeatherThresholds(data.thresholds);
        } else {
          throw new Error("Invalid backend weather response");
        }

      } catch (err) {
        console.error("Fetch weather data error:", err);
        // Fallback to default values if API fails
        setWeatherCondition('normal');
        setCurrentWeather({ temp: 28 }); // Fallback
        setCurrentWeatherThresholds({ wind: 10, rain: 5, temp: 28, humidity: 65, pressure: 1015 });
      }
    };

    fetchWeatherData();

    // Update weather data every 30 seconds (30000 ms) as requested
    const interval = setInterval(fetchWeatherData, 30000);

    return () => clearInterval(interval);
  }, [activeRegionData]);

  // 🔥 FETCH LOGGING SETTINGS
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:8002/api/logs/settings", {
          headers: { apikey: "pikel2" }
        });
        if (!res.ok) { console.error(`API Error: ${res.status} ${res.statusText}`); return; }
        const data = await res.json();
        setLoggingEnabled(data.enabled);
        setLoggingInterval(data.interval);
        setLogHours(Math.floor(data.interval / 60));
        setLogMinutes(data.interval % 60);
      } catch (err) {
        console.error("Fetch settings error:", err);
      }
    };
    fetchSettings();
  }, []);

  // --- SENSOR HELPERS ---
  const getSensorUnit = (code: string) => {
    const m: Record<string, string> = { 'ANEMO-01': 'm/s', 'TIP-01': 'mm', 'WATER-01': 'cm', 'BME-TEMP': '°C', 'BME-HUM': '%', 'BME-PRES': 'hPa' };
    return m[code] ?? '';
  };
  const getSensorLabel = (code: string) => {
    const m: Record<string, string> = { 'ANEMO-01': 'Angin', 'TIP-01': 'Curah Hujan', 'WATER-01': 'Tinggi Air', 'BME-TEMP': 'Suhu', 'BME-HUM': 'Kelembapan', 'BME-PRES': 'Tekanan' };
    return m[code] ?? code;
  };
  const formatIntervalLabel = (h: number, m: number) => {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    return parts.length > 0 ? parts.join(' ') : '—';
  };


  const updateLoggingSettings = async (enabled: boolean, interval: number) => {
    try {
      const res = await fetch("http://localhost:8002/api/logs/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: "pikel2" },
        body: JSON.stringify({ enabled, interval })
      });
      if (!res.ok) console.error(`Error updating log settings: ${res.status} ${res.statusText}`);
    } catch (err: any) {
      console.error("Update settings error:", err);
    }
  };

  const handleLoggingEnabledChange = async (enabled: boolean) => {
    setLoggingEnabled(enabled);
    await updateLoggingSettings(enabled, loggingInterval);
  };

  const handleIntervalApply = async () => {
    const total = Math.max(1, logHours * 60 + logMinutes);
    setLoggingInterval(total);
    await updateLoggingSettings(loggingEnabled, total);
    alert(`✅ Interval berhasil diterapkan: rekam otomatis setiap ${total} menit`);
  };

  const handleSaveLogsNow = async (silent = false) => {
    if (savingLog) return;
    setSavingLog(true);
    try {
      const regionName = (() => { try { return JSON.parse(localStorage.getItem('selectedRegionData') || '{}')?.name || null; } catch { return null; } })();
      const { currentWeather: cw, siagaLevel: sl, weatherCondition: wc } = logDataRef.current;
      const res = await fetch("http://localhost:8002/api/logs/save-now", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: "pikel2" },
        body: JSON.stringify({
          siaga_level: `SIAGA ${sl}`,
          weather_data: cw ? { temp: Math.round(cw.temp ?? 0), description: cw.weather_description ?? null, main: cw.weather_main ?? null, condition: wc } : null,
          region_name: regionName,
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLastSavedAt(data.saved_at || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
        // 🔥 Trigger refresh segera pada LogTable
        setLogRefreshTrigger(prev => prev + 1);
        if (!silent) alert(`✅ ${data.message}`);
      } else {
        if (!silent) alert(`Gagal menyimpan log: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      console.error("Save logs error:", err);
      if (!silent) alert("Gagal menyimpan log. Periksa koneksi ke server.");
    } finally {
      setSavingLog(false);
    }
  };

  // 🔥 SYNC REF dengan state terbaru (tetap dipakai handleSaveLogsNow manual & auto-save timer)
  useEffect(() => {
    logDataRef.current = { currentWeather, siagaLevel, weatherCondition };
  });

  // ==============================
  // 🔥 AUTO-SAVE TIMER (browser-side)
  // Setiap loggingInterval menit, simpan snapshot sensor ke DB secara otomatis.
  // Ini memastikan data masuk ke riwayat log sesuai interval yang diset,
  // tanpa bergantung sepenuhnya pada scheduler Laravel di server.
  // ==============================
  useEffect(() => {
    if (!loggingEnabled || loggingInterval <= 0) return;

    const intervalMs = loggingInterval * 60 * 1000; // menit → ms
    console.log(`⏰ Auto-save timer aktif: setiap ${loggingInterval} menit`);

    const timer = setInterval(() => {
      console.log(`⏰ Auto-save dijalankan (interval ${loggingInterval} menit)`);
      handleSaveLogsNow(true); // silent → tidak muncul alert, tetap trigger refreshTrigger
    }, intervalMs);

    return () => {
      clearInterval(timer);
      console.log('⏰ Auto-save timer dibersihkan');
    };
  }, [loggingEnabled, loggingInterval]); // re-setup tiap kali interval atau status enabled berubah

  // 🔥 PUSH DATA CUACA KE CACHE SERVER (agar scheduler bisa pakai saat browser tutup)
  useEffect(() => {
    const push = async () => {
      if (!currentWeather) return;
      try {
        const regionName = (() => { try { return JSON.parse(localStorage.getItem('selectedRegionData') || '{}')?.name || null; } catch { return null; } })();
        await fetch("http://localhost:8002/api/weather-cache", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: "pikel2" },
          body: JSON.stringify({
            weather_data: {
              temp: Math.round(currentWeather.temp ?? 0),
              description: currentWeather.weather_description ?? null,
              main: currentWeather.weather_main ?? null,
              condition: weatherCondition,
            },
            siaga_level: `SIAGA ${siagaLevel}`,
            region_name: (() => { try { return JSON.parse(localStorage.getItem('selectedRegionData') || '{}')?.name || null; } catch { return null; } })(),
          })
        });
      } catch { /* silent */ }
    };
    push();
    const t = setInterval(push, 30_000); // perbarui setiap 30 detik
    return () => clearInterval(t);
  }, [currentWeather, siagaLevel, weatherCondition]);


  // --- LOGIC SIAGA ---
  const getSiagaLevel = (): 1 | 2 | 3 => {
    const waterSensor = sensors.find((s) => s.type === "water");
    const waterValue = waterSensor?.value || 0;

    // SIAGA hanya berdasarkan water level
    if (waterValue >= thresholds.siaga1.water) {
      return 1;
    }

    if (waterValue >= thresholds.siaga2.water) {
      return 2;
    }

    return 3;
  };

  // --- LOGIC WEATHER CONDITION ---
  useEffect(() => {
    setSiagaLevel(getSiagaLevel());
    // ✨ Weather condition now comes from API, not calculated from sensors
  }, [sensors, thresholds]);

  const sensorLocations = [
    { id: "ANEMO-01", name: "Mast Station", lat: -6.1844, lng: 106.8229, status: "normal" as const },
    { id: "TIP-01", name: "Rain Gauge", lat: -6.2088, lng: 106.8456, status: "warning" as const },
    { id: "WATER-01", name: "River Level", lat: -6.1951, lng: 106.8203, status: "warning" as const },
  ];

  const MemoizedMap = useMemo(() => <MapWidget sensors={sensorLocations} />, []);

  const notifications: any[] = [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Main Watershed Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring and AI-powered flood detection system
          </p>
        </div>
        <div className="flex flex-col gap-3 items-end w-full max-w-sm text-right">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Region terpilih:</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {regions.find((region) => region.id === selectedRegion)?.name || 'Jakarta Pusat'}
          </p>
          <div className="flex items-center gap-4">
            <StatusSiaga level={siagaLevel} size="sm" className="max-w-xs" />
            <NotificationBell notifications={notifications} />
          </div>
        </div>
      </div>

      {/* ✅ Improved Threshold Summary - Modern & Cohesive Design */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <AlertTriangle className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ambang Batas SIAGA (Tinggi Air)</h3>
            <div className="group relative ml-auto">
              <Info className="size-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              <div className="absolute right-0 top-6 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                Level kewaspadaan berdasarkan tinggi air (cm)
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* SIAGA 1 - Critical / Red */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-900 rounded-2xl border border-red-200 dark:border-red-800/50 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      SIAGA 1
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3 tracking-tight">
                      {thresholds.siaga1.water}
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400 ml-1">cm</span>
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-red-100 dark:border-red-900/30">
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-1">
                    <Droplet className="size-3" />
                    Bahaya banjir besar
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Evakuasi segera</p>
                </div>
              </div>
            </div>

            {/* SIAGA 2 - Warning / Yellow/Orange */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                      SIAGA 2
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3 tracking-tight">
                      {thresholds.siaga2.water}
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400 ml-1">cm</span>
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                    <Droplet className="size-3" />
                    Waspada banjir
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Siaga penuh</p>
                </div>
              </div>
            </div>

            {/* SIAGA 3 - Normal / Green */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 rounded-2xl border border-green-200 dark:border-green-800/50 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      SIAGA 3
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3 tracking-tight">
                      {thresholds.siaga3.water}
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400 ml-1">cm</span>
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                    <Droplet className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-green-100 dark:border-green-900/30">
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium flex items-center gap-1">
                    <Droplet className="size-3" />
                    Normal & aman
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Pantau rutin</p>
                </div>
              </div>
            </div>
          </div>
          {/* Progress indicator - visual bar showing current water level relative to thresholds */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>Tinggi air saat ini</span>
              <span className="font-mono">{sensors.find(s => s.type === "water")?.value || 0} cm</span>
            </div>
            <div className="relative h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((sensors.find(s => s.type === "water")?.value || 0) / thresholds.siaga1.water) * 100)}%` }}
              />
              {/* Threshold markers */}
              <div className="absolute top-0 h-full w-px bg-white dark:bg-gray-900 z-10" style={{ left: `${(thresholds.siaga3.water / thresholds.siaga1.water) * 100}%` }}></div>
              <div className="absolute top-0 h-full w-px bg-white dark:bg-gray-900 z-10" style={{ left: `${(thresholds.siaga2.water / thresholds.siaga1.water) * 100}%` }}></div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500">
              <span>0 cm</span>
              <span>SIAGA 3 ({thresholds.siaga3.water}cm)</span>
              <span>SIAGA 2 ({thresholds.siaga2.water}cm)</span>
              <span>SIAGA 1 ({thresholds.siaga1.water}cm)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Real-time Sensor Data</h2>
          <Link
            href="/sensors"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              {...sensor}
              icon={getIcon(sensor.type)}
            />
          ))}
        </div>
      </div>

      {/* Weather & Camera Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(() => {
          // Priority 1: OpenWeatherMap API temperature (real location temp)
          // Priority 2: Local hardware sensor
          const apiTemp = currentWeather?.temp;
          const tempSensor = sensors.find((s) => s.type === "temp");
          const temperature = apiTemp !== undefined ? apiTemp : (tempSensor?.value || 25);

          return (
            <WeatherWidget
              temperature={temperature}
              weatherCondition={weatherCondition}
              updateTime="real-time"
              weatherDescription={currentWeather?.weather_description}
              weatherMain={currentWeather?.weather_main}
            />
          );
        })()}
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-black group">
          <div className="absolute top-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Camera className="size-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest">AI Snapshot Analysis</h3>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                <Clock className="size-3.5 text-blue-300" />
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
              <button onClick={handleRefreshSnapshot} className="bg-blue-600 hover:bg-blue-500 p-1.5 rounded-lg text-white shadow-lg transition-all active:scale-90">
                <RefreshCw className={`size-4 ${refreshKey > 0 ? 'animate-spin-slow' : ''}`} />
              </button>
            </div>
          </div>
          <div className="pt-14">
            <SnapshotFeed
              imageUrl={CCTV_IMAGE_URL}
              timestamp={snapshotTimestamp}
              boundingBoxes={[{ label: "Plastic", confidence: 98, x: 15, y: 40, width: 12, height: 10, color: "#ef4444" }, { label: "Wood", confidence: 76, x: 55, y: 60, width: 18, height: 14, color: "#f97316" }]}
              waterLevel={68} cameraId="CAM-04" location="MAIN RIVER DOCK" refreshKey={refreshKey}
            />
          </div>
        </div>
      </div>

      {/* Map only - AI Prediction removed */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
        {MemoizedMap}
      </div>

      {/* Pencatatan Data Otomatis */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        {/* Card Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                <Database className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Pencatatan Data Otomatis</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rekam data sensor &amp; cuaca secara berkala ke dalam log</p>
              </div>
            </div>
            {lastSavedAt && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="size-3.5 flex-shrink-0" />
                <span>Terakhir disimpan: {lastSavedAt}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-8 items-start">
          {/* ── KIRI: Toggle & Manual Save ── */}
          <div className="space-y-4">

            {/* Toggle Auto Log */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Auto Log</p>
                  <p className={`text-xs mt-0.5 font-medium ${loggingEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {loggingEnabled ? '🟢 Aktif — merekam otomatis' : '⚫ Nonaktif'}
                  </p>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => handleLoggingEnabledChange(true)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${loggingEnabled ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                  >AKTIF</button>
                  <button
                    type="button"
                    onClick={() => handleLoggingEnabledChange(false)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${!loggingEnabled ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                  >NONAKTIF</button>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => handleSaveLogsNow()}
                disabled={savingLog}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-sm font-semibold py-2.5 transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <Database className="size-4 flex-shrink-0" />
                {savingLog ? 'Menyimpan...' : 'Simpan Log Sekarang (Manual)'}
              </button>
            </div>
          </div>

          {/* ── KANAN: Interval ── */}
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 transition-all ${loggingEnabled ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20' : 'border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-950 opacity-50 pointer-events-none select-none'}`}>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                <Clock className="size-3.5 text-blue-500" />
                Interval Pencatatan
              </p>
              <div className="flex items-end gap-2">
                <div className="flex-1 text-center">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Jam</label>
                  <input
                    type="number" min={0} max={23}
                    value={logHours}
                    onChange={(e) => setLogHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-bold text-2xl border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div className="text-gray-300 dark:text-gray-600 text-2xl font-light pb-2.5 px-1">:</div>
                <div className="flex-1 text-center">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Menit</label>
                  <input
                    type="number" min={0} max={59}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-bold text-2xl border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <p className="text-xs text-center mt-2.5 text-blue-600 dark:text-blue-400">
                Rekam otomatis setiap{" "}
                <span className="font-bold">{formatIntervalLabel(logHours, logMinutes) || '—'}</span>
              </p>
              <button
                onClick={handleIntervalApply}
                className="mt-3 w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold py-2 transition-all cursor-pointer"
              >
                Terapkan Interval
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabel Riwayat Log Sensor */}
      {/* loggingInterval → auto-refresh sesuai interval; refreshTrigger → refresh segera setelah save manual */}
      <LogTable loggingInterval={loggingInterval} refreshTrigger={logRefreshTrigger} />
    </div>
  );
}