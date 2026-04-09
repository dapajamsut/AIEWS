"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Wind, Droplets, Gauge, Thermometer, Activity, Clock, RefreshCw, Camera, ArrowRight } from "lucide-react";
import { SensorCard } from "../components/SensorCard";
import { WeatherWidget } from "../components/WeatherWidget";
import { SnapshotFeed } from "../components/SnapshotFeed";
import { AlertLogs } from "../components/AlertLogs";
import { AIPrediction } from "../components/AIPrediction";
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

  // ==============================
  // 🔥 LOGGING SETTINGS
  // ==============================
  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const [loggingInterval, setLoggingInterval] = useState(5);

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
        const res = await fetch("http://localhost:8000/api/sensors/latest", {
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

  // 🔥 FETCH LOGGING SETTINGS
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/logs/settings", {
          headers: {
            apikey: "pikel2"
          }
        });
        if (!res.ok) {
          console.error(`API Error: ${res.status} ${res.statusText}`);
          return;
        }
        const data = await res.json();
        setLoggingEnabled(data.enabled);
        setLoggingInterval(data.interval);
      } catch (err) {
        console.error("Fetch settings error:", err);
      }
    };

    fetchSettings();
  }, []);

  // --- DATA LOGS ---
  const logs = [
    { time: "10:45 AM", type: "critical" as const, title: "Critical Alert: Debris Detected", description: "Large object detected near Sluice Gate B-05. Risk of blockage high." },
    { time: "10:32 AM", type: "warning" as const, title: "Status Update: Siaga 2", description: "Water level rising rapidly (+15cm/15min). Flood protocol active." },
    { time: "10:15 AM", type: "info" as const, title: "Weather System Updated", description: "Radar confirms localized heavy rainfall in Northern Catchment Area." },
    { time: "09:58 AM", type: "info" as const, title: "Sensor Calibration Complete", description: "All sensors passed automated calibration check. System nominal." },
  ];

  const handleExportLogs = () => {
    const headers = ["Time", "Type", "Title", "Description"];
    const rows = logs.map(log => [log.time, log.type, `"${log.title}"`, `"${log.description}"`]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `System_Logs_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const updateLoggingSettings = async (enabled: boolean, interval: number) => {
    try {
      const res = await fetch("http://localhost:8000/api/logs/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "pikel2"
        },
        body: JSON.stringify({
          enabled,
          interval
        })
      });
      if (!res.ok) {
        console.error(`Error updating log settings: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      console.error("Update settings error:", err);
    }
  };

  const handleLoggingEnabledChange = async (enabled: boolean) => {
    setLoggingEnabled(enabled);
    await updateLoggingSettings(enabled, loggingInterval);
  };

  const handleLoggingIntervalChange = async (value: number) => {
    if (!loggingEnabled) return;
    setLoggingInterval(value);
    await updateLoggingSettings(true, value);
  };

  const handleSaveLogsNow = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/logs/save-now", {
        method: "POST",
        headers: {
          apikey: "pikel2"
        }
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
      } else {
        alert(`Error: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      console.error("Save logs error:", err);
      alert("Failed to save logs");
    }
  };

  // --- LOGIC SIAGA ---
  const getSiagaLevel = (): 1 | 2 | 3 => {
    const waterSensor = sensors.find((s) => s.id === "WATER-01");
    const waterLevel = waterSensor?.value || 0;

    let s1 = 400;
    let s2_low = 300;
    let s3 = 150;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waterLevelThresholds");
      if (saved) {
        try {
          const t = JSON.parse(saved);
          s1 = t.siaga1 ?? 400;
          s2_low = t.siaga2_low ?? 300;
          s3 = t.siaga3 ?? 150;
        } catch (e) {}
      }
    }

    if (waterLevel >= s1) return 1;
    if (waterLevel >= s2_low) return 2;
    return 3;
  };

  const [siagaLevel, setSiagaLevel] = useState<1 | 2 | 3>(getSiagaLevel());

  useEffect(() => {
    const update = () => setSiagaLevel(getSiagaLevel());
    window.addEventListener("storage", update);
    const intv = setInterval(update, 2000);
    return () => { window.removeEventListener("storage", update); clearInterval(intv); };
  }, [sensors]);

  const sensorLocations = [
    { id: "ANEMO-01", name: "Mast Station", lat: -6.1844, lng: 106.8229, status: "normal" as const },
    { id: "TIP-01", name: "Rain Gauge", lat: -6.2088, lng: 106.8456, status: "warning" as const },
    { id: "WATER-01", name: "River Level", lat: -6.1951, lng: 106.8203, status: "warning" as const },
  ];
  
  const MemoizedMap = useMemo(() => <MapWidget sensors={sensorLocations} />, []);

  const notifications = logs.map((log, index) => ({ id: index, title: log.title, message: log.description, time: log.time, type: log.type }));
  
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
        <div className="flex items-center gap-4">
          <StatusSiaga level={siagaLevel} size="sm" className="max-w-xs" />
          <NotificationBell notifications={notifications} />
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
        <WeatherWidget temperature={28} condition="Thunderstorm expected" humidity={88} rainfall={45} updateTime="10m ago" />
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

      {/* AI Prediction & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AIPrediction probability={82} timeframe="6h" predictedAt="16:45" note="Upstream discharge reach Station A-12 in approx. 4 hours." confidenceLevel={87} />
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">{MemoizedMap}</div>
      </div>

      {/* Logging Settings */}
      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Activity className="size-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Fitur Logs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Atur logging otomatis dan ekspor data log dengan mudah.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-950 p-5">
            <div className="flex items-center justify-between gap-4 rounded-full bg-white dark:bg-slate-900 p-2 shadow-sm border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">Auto Log</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{loggingEnabled ? 'ON' : 'OFF'}</div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-900 px-2 py-1">
                <button
                  type="button"
                  onClick={() => handleLoggingEnabledChange(true)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold transition ${loggingEnabled ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer' : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer'}`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => handleLoggingEnabledChange(false)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold transition ${!loggingEnabled ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer' : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer'}`}
                >
                  OFF
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Interval auto save</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pilih frekuensi pencatatan otomatis.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[2, 5, 10].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleLoggingIntervalChange(value)}
                      disabled={!loggingEnabled}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${loggingInterval === value ? 'border-blue-600 bg-blue-600 text-white shadow-sm cursor-pointer' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'} ${!loggingEnabled ? 'cursor-not-allowed opacity-50 dark:opacity-70' : 'cursor-pointer hover:shadow-sm'}`}
                    >
                      {value} Menit
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Keterangan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pilih interval dan sistem akan langsung menggunakan interval tersebut ketika Auto Log aktif.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={handleSaveLogsNow}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 cursor-pointer shadow-sm transition-colors"
            >
              Save Logs Now
            </Button>
            <Button
              onClick={handleExportLogs}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 cursor-pointer shadow-sm transition-colors"
            >
              Export to CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Alert Logs */}
      <AlertLogs logs={logs} onExport={handleExportLogs} />
    </div>
  );
}