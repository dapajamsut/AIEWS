"use client";

import { useState, useEffect, useRef } from "react";
import {
  Activity, Wind, Droplets, Gauge, Thermometer, RefreshCw,
  CheckCircle2, AlertTriangle, WifiOff, Heart, Wifi,
  ShieldCheck, ShieldAlert, Clock, BarChart3, LineChart
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Line
} from "recharts";
import Layout from "@/app/components/layout/Layout";
import StatusSiaga from "@/app/components/StatusSiaga";
import { Card } from "@/app/components/ui/card";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SENSOR_NAMES: Record<string, string> = {
  wind:      "Kecepatan Angin",
  rain:      "Curah Hujan",
  water:     "Tinggi Air",
  temp:      "Suhu Udara",
  humidity:  "Kelembapan",
  pressure:  "Tekanan Udara",
};

const SENSOR_UNITS: Record<string, string> = {
  wind: "m/s", rain: "mm", water: "cm", temp: "°C", humidity: "%", pressure: "hPa",
};

const NORMAL_RANGE: Record<string, { min: number; max: number }> = {
  wind:     { min: 0,   max: 15   },
  rain:     { min: 0,   max: 30   },
  water:    { min: 0,   max: 250  },
  temp:     { min: 18,  max: 35   },
  humidity: { min: 40,  max: 90   },
  pressure: { min: 990, max: 1030 },
};

const SENSOR_ORDER = ["ANEMO-01", "TIP-01", "WATER-01", "BME-TEMP", "BME-HUM", "BME-PRES"];

const WEIGHT = { range: 0.30, freshness: 0.70 } as const;

function calcRangeScore(type: string, value: number): number {
  const range = NORMAL_RANGE[type];
  if (!range) return 80;
  if (value >= range.min && value <= range.max) return 100;
  const mid  = (range.min + range.max) / 2;
  const half = (range.max - range.min) / 2;
  const dist = Math.abs(value - mid);
  return Math.max(0, Math.round(100 - (dist / half) * 100));
}

function calcFreshnessScore(secondsAgo: number): number {
  if (secondsAgo < 5)   return 100;
  if (secondsAgo < 10)  return  95;
  if (secondsAgo < 30)  return  85;
  if (secondsAgo < 60)  return  60;
  if (secondsAgo < 120) return  30;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENSOR HEALTH CARD
// ═══════════════════════════════════════════════════════════════════════════════

function calcHealthScore(type: string, value: number, secondsAgo: number) {
  const r = calcRangeScore(type, value);
  const f = calcFreshnessScore(secondsAgo);
  const total = Math.round(r * WEIGHT.range + f * WEIGHT.freshness);
  return { total, range: r, freshness: f };
}

const getIcon = (type: string, cls = "size-4") => {
  switch (type) {
    case "wind":     return <Wind        className={`${cls} text-blue-500`} />;
    case "rain":     return <Droplets    className={`${cls} text-cyan-500`} />;
    case "water":    return <Activity    className={`${cls} text-purple-500`} />;
    case "temp":     return <Thermometer className={`${cls} text-orange-500`} />;
    case "humidity": return <Droplets    className={`${cls} text-blue-400`} />;
    case "pressure": return <Gauge       className={`${cls} text-green-500`} />;
    default:         return <Activity    className={`${cls}`} />;
  }
};

const getTarget = (type: string) => {
  const m: Record<string, number> = { wind: 20, rain: 50, water: 300, temp: 35, humidity: 90, pressure: 1020 };
  return m[type] ?? 100;
};

function formatAge(sec: number): string {
  if (sec < 5)   return "baru saja";
  if (sec < 60)  return `${Math.round(sec)} dtk lalu`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m} mnt ${s} dtk lalu` : `${m} mnt lalu`;
}

const SensorHealthCard = ({
  sensors, loading, fetchError, lastUpdated,
}: {
  sensors: any[];
  loading: boolean;
  fetchError: boolean;
  lastUpdated: string;
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const scored = sensors.map(s => {
    const createdAt   = s.created_at ? new Date(s.created_at).getTime() : Date.now();
    const secondsAgo  = Math.max(0, (Date.now() - createdAt) / 1000);
    const scores      = calcHealthScore(s.type, s.value, secondsAgo);
    return { ...s, secondsAgo, scores };
  });

  const totalCount   = scored.length;
  const healthyCount = scored.filter(s => s.scores.total >= 80).length;
  const sickCount    = scored.filter(s => s.scores.total < 60).length;
  const staleCount   = scored.filter(s => s.secondsAgo >= 60).length;

  const overallScore = totalCount > 0
    ? Math.round(scored.reduce((acc, s) => acc + s.scores.total, 0) / totalCount)
    : 0;

  const scoreColor =
    overallScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
    overallScore >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                         "text-red-600 dark:text-red-400";

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Kesehatan Perangkat Sensor</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Kesehatan murni hardware berdasarkan Uptime (70%) & Kewajaran Data (30%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {fetchError ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full">
                <WifiOff className="size-3.5" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
                <Wifi className="size-3.5" /> Live
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                <Clock className="size-3.5" /> {lastUpdated}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="relative size-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                    className="stroke-gray-200 dark:stroke-gray-700" />
                  <circle
                    cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                    strokeLinecap="round"
                    stroke={overallScore >= 80 ? "#10b981" : overallScore >= 60 ? "#f59e0b" : "#ef4444"}
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallScore / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${scoreColor}`}>{overallScore}</span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">/ 100</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                  {overallScore >= 80 ? "🟢 Sangat Sehat" : overallScore >= 60 ? "🟡 Perlu Cek Kabel" : "🔴 Masalah Hardware"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Rata-rata <b>uptime & akurasi</b> {totalCount} sensor
                </p>
              </div>

              <div className="w-full space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-2">
                  Basis Perhitungan
                </p>
                {[
                  { label: "Kesegaran (Uptime)", pct: "70%", color: "bg-teal-500"   },
                  { label: "Logika (Akurasi)",   pct: "30%", color: "bg-violet-500" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <div className={`size-2 rounded-full flex-shrink-0 ${color}`} />
                    <span className="text-gray-600 dark:text-gray-400 flex-1">{label}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{pct}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" /> {healthyCount} Bagus
                </span>
                {sickCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                    <ShieldAlert className="size-3" /> {sickCount} Bermasalah
                  </span>
                )}
                {staleCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Clock className="size-3" /> {staleCount} Macet
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              {scored.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <WifiOff className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tidak ada data sensor</p>
                </div>
              ) : (
                scored.map(sensor => {
                  const { total, range: rScore, freshness: fScore } = sensor.scores;
                  const isWarning = sensor.status === "warning";
                  const isStale   = sensor.secondsAgo >= 30;

                  return (
                    <div
                      key={sensor.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        isWarning
                          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10"
                          : isStale
                            ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60"
                            : "border-gray-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isWarning ? "bg-amber-100 dark:bg-amber-950/60"
                                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                        }`}>
                          {getIcon(sensor.type, "size-5")}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{sensor.id}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                              {SENSOR_NAMES[sensor.type]}
                            </span>
                          </div>
                          <span className={`text-xs flex items-center gap-1 mt-1 ${
                            sensor.secondsAgo < 10
                              ? "text-emerald-500 dark:text-emerald-400"
                              : sensor.secondsAgo < 30
                                ? "text-blue-400 dark:text-blue-300"
                                : sensor.secondsAgo < 60
                                  ? "text-amber-500 dark:text-amber-400"
                                  : "text-red-400 dark:text-red-500"
                          }`}>
                            <Clock className="size-3" />
                            {formatAge(sensor.secondsAgo)}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className={`text-base font-bold ${
                            isWarning ? "text-amber-600 dark:text-amber-400" : "text-gray-800 dark:text-gray-200"
                          }`}>
                            {Number(sensor.value).toFixed(1)} {sensor.unit ?? SENSOR_UNITS[sensor.type] ?? ""}
                          </span>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {total >= 80
                              ? <ShieldCheck  className="size-3.5 text-emerald-500" />
                              : <ShieldAlert  className="size-3.5 text-red-500" />}
                            <span className={`text-sm font-black ${
                              total >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : total >= 60
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                            }`}>{total}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20 text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">Koneksi</span>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                fScore >= 90 ? "bg-teal-500" :
                                fScore >= 70 ? "bg-blue-400" :
                                fScore >= 50 ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${fScore}%` }}
                            />
                          </div>
                          <span className="text-xs w-10 text-right text-gray-500 dark:text-gray-400 font-semibold">{fScore}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20 text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">Akurasi</span>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all duration-500"
                              style={{ width: `${rScore}%` }}
                            />
                          </div>
                          <span className="text-xs w-10 text-right text-gray-500 dark:text-gray-400 font-semibold">{rScore}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SensorPage() {
  const [sensors,    setSensors]    = useState<any[]>([]);
  const [siagaLevel, setSiagaLevel] = useState<1 | 2 | 3>(3);
  const [thresholds, setThresholds] = useState({
    siaga1: { water: 400 }, siaga2: { water: 300 }, siaga3: { water: 150 },
  });
  const [fetchError,  setFetchError]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const [activeTab, setActiveTab] = useState<"historical" | "comparison">("historical");
  const [mockChartData, setMockChartData] = useState<any[]>([]);

  // ANTI STALE CLOSURE
  const thresholdsRef = useRef(thresholds);
  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  useEffect(() => {
    const generateInitialData = () => {
      const data = [];
      const now = new Date();
      for (let i = 12; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        
        const baseRain = 15 + Math.sin(i / 2) * 10 + Math.random() * 5;
        const baseWater = 120 + (12 - i) * 12 + Math.sin(i / 3) * 20 + Math.random() * 10;

        data.push({
          time: timeStr,
          rain: parseFloat(baseRain.toFixed(1)),
          water: parseFloat(baseWater.toFixed(1)),
          wind: parseFloat((3 + Math.random() * 4).toFixed(1)),
          temp: parseFloat((26 + Math.random() * 3).toFixed(1)),
          humidity: parseFloat((75 + Math.random() * 10).toFixed(0)),
          pressure: parseFloat((1008 + Math.random() * 4).toFixed(0)),
        });
      }
      setMockChartData(data);
    };
    generateInitialData();
  }, []);

  const getSiagaLevel = (list: any[]): 1 | 2 | 3 => {
    const water = list.find(s => s.type === "water")?.value ?? 0;
    if (water >= thresholdsRef.current.siaga1.water) return 1;
    if (water >= thresholdsRef.current.siaga2.water) return 2;
    return 3;
  };

  // Sensors fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/sensors/latest", {
          cache: "no-store",
          headers: { apikey: "pikel2" },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const mapped = data.map((s: any) => ({
          id:         s.sensor_code,
          name:       s.sensor_code,
          location:   SENSOR_NAMES[s.type] ?? "Sensor Deteksi",
          value:      Number(s.value),
          unit:       s.unit,
          status:     s.status === "WARNING" ? "warning" : "normal",
          trend:      "steady",
          target:     getTarget(s.type),
          type:       s.type,
          created_at: s.created_at,
        }));
        mapped.sort((a: any, b: any) => SENSOR_ORDER.indexOf(a.id) - SENSOR_ORDER.indexOf(b.id));
        setSensors(mapped);
        setSiagaLevel(getSiagaLevel(mapped));
        setFetchError(false);
        setLastUpdated(
          new Date().toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          })
        );

        if (mapped.length > 0) {
          setMockChartData(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            
            const rainVal = mapped.find((s: any) => s.type === "rain")?.value ?? updated[lastIndex].rain;
            const waterVal = mapped.find((s: any) => s.type === "water")?.value ?? updated[lastIndex].water;
            const windVal = mapped.find((s: any) => s.type === "wind")?.value ?? updated[lastIndex].wind;
            const tempVal = mapped.find((s: any) => s.type === "temp")?.value ?? updated[lastIndex].temp;
            const humVal = mapped.find((s: any) => s.type === "humidity")?.value ?? updated[lastIndex].humidity;
            const presVal = mapped.find((s: any) => s.type === "pressure")?.value ?? updated[lastIndex].pressure;

            updated[lastIndex] = {
              ...updated[lastIndex],
              rain: rainVal,
              water: waterVal,
              wind: windVal,
              temp: tempVal,
              humidity: humVal,
              pressure: presVal,
            };
            return updated;
          });
        }

      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const t = setInterval(fetchData, 2000);
    return () => clearInterval(t);
  }, []);

  // Thresholds fetch
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/thresholds?type=siaga", {
          cache: "no-store", headers: { apikey: "pikel2" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setThresholds({
          siaga1: { water: Number(data.siaga1?.water ?? 400) },
          siaga2: { water: Number(data.siaga2?.water ?? 300) },
          siaga3: { water: Number(data.siaga3?.water ?? 150) },
        });
      } catch { /* silent */ }
    };
    fetchThresholds();
    const listener = () => fetchThresholds();
    window.addEventListener("thresholdsUpdated", listener);
    return () => window.removeEventListener("thresholdsUpdated", listener);
  }, []);

  // Hitung kesehatan setiap sensor pakai metrik yang sama dengan card
  // "Kesehatan Perangkat Sensor" — supaya 4 kartu atas SINKRON dengan
  // diagnostik di bawahnya. Skor: uptime 70% + akurasi 30%.
  //   ≥ 80 → normal
  //   60–79 → perlu perhatian
  //   < 60 → bermasalah
  const sensorHealthScores = sensors.map((s) => {
    const createdAt  = s.created_at ? new Date(s.created_at).getTime() : Date.now();
    const secondsAgo = Math.max(0, (Date.now() - createdAt) / 1000);
    const r = calcRangeScore(s.type, s.value);
    const f = calcFreshnessScore(secondsAgo);
    return Math.round(r * WEIGHT.range + f * WEIGHT.freshness);
  });

  const totalSensors = sensors.length;
  const normalCount  = sensorHealthScores.filter((sc) => sc >= 80).length;
  const warningCount = sensorHealthScores.filter((sc) => sc < 80).length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Sensor Monitoring
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Pantau data realtime: angin, curah hujan, tinggi air, suhu, kelembapan, tekanan
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                fetchError
                  ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                  : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              }`}>
                <span className={`size-1.5 rounded-full ${fetchError ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                {fetchError ? "Server Offline" : "Live · 2s"}
              </div>
              <StatusSiaga level={siagaLevel} size="sm" className="max-w-[200px]" />
            </div>
          </div>
        </div>

        {/* Stats Row - 🔥 LAYOUT UPDATED TO PERFECTLY ALIGN CENTERIC TEXT & CONTENT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sensor",    value: loading ? "—" : String(totalSensors), icon: <Activity    className="size-5 text-blue-600 dark:text-blue-400"   />, bg: "bg-blue-50 dark:bg-blue-950",       text: "text-blue-700 dark:text-blue-300"   },
            { label: "Sensor Normal",   value: loading ? "—" : String(normalCount),  icon: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />, bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300" },
            { label: "Perlu Perhatian", value: loading ? "—" : String(warningCount), icon: <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />, bg: "bg-amber-50 dark:bg-amber-950",      text: "text-amber-700 dark:text-amber-300" },
            { label: "Update Terakhir", value: lastUpdated || "—",                   icon: <RefreshCw   className="size-5 text-violet-600 dark:text-violet-400" />, bg: "bg-violet-50 dark:bg-violet-950",   text: "text-violet-700 dark:text-violet-300", small: true },
          ].map(({ label, value, icon, bg, text, small }: any) => (
            <Card key={label} className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center gap-3">
              <div className={`p-3 rounded-xl ${bg} flex-shrink-0`}>{icon}</div>
              <div className="w-full">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                <p className={`font-bold mt-1.5 ${small ? "text-base" : "text-3xl"} ${text}`}>{value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Health Card */}
        <SensorHealthCard
          sensors={sensors}
          loading={loading}
          fetchError={fetchError}
          lastUpdated={lastUpdated}
        />

        {/* Analytics & Trends Module */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200 dark:shadow-indigo-900/30">
                <BarChart3 className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Sensor Analytics & Trends</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Visualisasi korelasi parameter lingkungan dan hidrologi secara berkala
                </p>
              </div>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("historical")}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "historical"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <LineChart className="size-3.5" /> Historical Data
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "comparison"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Activity className="size-3.5" /> Multi-Sensor Comparison
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="w-full h-[350px] bg-gray-50 dark:bg-gray-950/40 rounded-xl flex items-center justify-center animate-pulse border border-gray-100 dark:border-gray-800">
                <RefreshCw className="size-8 text-gray-300 dark:text-gray-700 animate-spin" />
              </div>
            ) : (
              <div className="w-full h-[380px]">
                {activeTab === "historical" ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Water level and rainfall correlation (Last 12 hours)
                      </span>
                      <span className="text-sm font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900">
                        Selected: WATER-01 & TIP-01
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="90%">
                      <AreaChart data={mockChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={13} fontWeight="bold" tickLine={false} />
                        <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" fontSize={13} fontWeight="bold" tickLine={false} label={{ value: 'Water Level (cm)', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#8b5cf6', fontSize: 13, fontWeight: 'bold'} }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={13} fontWeight="bold" tickLine={false} label={{ value: 'Rainfall (mm/h)', angle: 90, position: 'insideRight', style: {textAnchor: 'middle', fill: '#06b6d4', fontSize: 13, fontWeight: 'bold'} }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                          itemStyle={{ fontSize: '13px', fontWeight: 'medium' }}
                          labelStyle={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="water" name="Water Level (cm)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWater)" />
                        <Area yAxisId="right" type="monotone" dataKey="rain" name="Rainfall (mm/h)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRain)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Comparative data across selected sensors (Last 12 hours)
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="90%">
                      <AreaChart data={mockChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={13} fontWeight="bold" tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={13} fontWeight="bold" tickLine={false} label={{ value: 'Values', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#64748b', fontSize: 13, fontWeight: 'bold'} }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                          itemStyle={{ fontSize: '13px', fontWeight: 'medium' }}
                          labelStyle={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="wind" name="Anemometer (m/s)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="pressure" name="Pressure (hPa)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="water" name="Water Level (cm)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

      </div>
    </Layout>
  );
}