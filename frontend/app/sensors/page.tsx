"use client";

import { useState, useEffect, useRef } from "react";
import {
  Activity, Wind, Droplets, Gauge, Thermometer, RefreshCw,
  CheckCircle2, AlertTriangle, WifiOff, Heart, Wifi,
  ShieldCheck, ShieldAlert, Clock,
} from "lucide-react";
import Layout from "@/app/components/layout/Layout";
import { SensorCard } from "@/app/components/SensorCard";
import StatusSiaga from "@/app/components/StatusSiaga";
import { Card } from "@/app/components/ui/card";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SENSOR_NAMES: Record<string, string> = {
  wind:     "Kecepatan Angin",
  rain:     "Curah Hujan",
  water:    "Tinggi Air",
  temp:     "Suhu Udara",
  humidity: "Kelembapan",
  pressure: "Tekanan Udara",
};

const SENSOR_UNITS: Record<string, string> = {
  wind: "m/s", rain: "mm", water: "cm", temp: "°C", humidity: "%", pressure: "hPa",
};

/**
 * Rentang operasional NORMAL setiap jenis sensor.
 * Nilai di luar rentang ini menurunkan skor Range.
 */
const NORMAL_RANGE: Record<string, { min: number; max: number }> = {
  wind:     { min: 0,   max: 15   },
  rain:     { min: 0,   max: 30   },
  water:    { min: 0,   max: 250  },
  temp:     { min: 18,  max: 35   },
  humidity: { min: 40,  max: 90   },
  pressure: { min: 990, max: 1030 },
};

const SENSOR_ORDER = ["ANEMO-01", "TIP-01", "WATER-01", "BME-TEMP", "BME-HUM", "BME-PRES"];

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH SCORE FORMULA (Kombinasi 3 Faktor)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bobot tiap faktor (total = 100 %):
 *   - Range     30 % → seberapa masuk akal nilai sensor (deteksi hardware/kalibrasi)
 *   - Freshness 70 % → seberapa segar data / uptime koneksi (deteksi sensor mati/macet)
 */
const WEIGHT = { range: 0.30, freshness: 0.70 } as const;

/** Komponen 1 – Range Score (0–100) */
function calcRangeScore(type: string, value: number): number {
  const range = NORMAL_RANGE[type];
  if (!range) return 80; // tidak diketahui → netral

  if (value >= range.min && value <= range.max) return 100; // dalam rentang normal

  // Semakin jauh dari titik tengah, makin rendah skornya
  const mid  = (range.min + range.max) / 2;
  const half = (range.max - range.min) / 2;
  const dist = Math.abs(value - mid);
  return Math.max(0, Math.round(100 - (dist / half) * 100));
}

/** Komponen 2 – Freshness Score (0–100) berdasarkan detik sejak data terakhir */
function calcFreshnessScore(secondsAgo: number): number {
  if (secondsAgo < 5)   return 100;  // sangat segar (live)
  if (secondsAgo < 10)  return  95;  // segar
  if (secondsAgo < 30)  return  85;  // masih ok
  if (secondsAgo < 60)  return  60;  // mulai lambat (delay)
  if (secondsAgo < 120) return  30;  // terlambat (warning)
  return 0;                          // kemungkinan mati/offline
}

/** Skor gabungan 0–100 dibulatkan ke bilangan bulat */
function calcHealthScore(
  type: string,
  value: number,
  secondsAgo: number
): { total: number; range: number; freshness: number } {
  const r = calcRangeScore(type, value);
  const f = calcFreshnessScore(secondsAgo);
  const total = Math.round(r * WEIGHT.range + f * WEIGHT.freshness);
  return { total, range: r, freshness: f };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

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

/** Format detik menjadi "X det", "X mnt Y det", dsb */
function formatAge(sec: number): string {
  if (sec < 5)   return "baru saja";
  if (sec < 60)  return `${Math.round(sec)} dtk lalu`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m} mnt ${s} dtk lalu` : `${m} mnt lalu`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENSOR HEALTH CARD
// ═══════════════════════════════════════════════════════════════════════════════

const SensorHealthCard = ({
  sensors, loading, fetchError, lastUpdated,
}: {
  sensors: any[];
  loading: boolean;
  fetchError: boolean;
  lastUpdated: string;
}) => {
  // Hitung skor tiap sensor setiap detik (freshness berubah seiring waktu)
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

  // Skor keseluruhan = rata-rata skor total semua sensor
  const overallScore = totalCount > 0
    ? Math.round(scored.reduce((acc, s) => acc + s.scores.total, 0) / totalCount)
    : 0;

  const scoreColor =
    overallScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
    overallScore >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                         "text-red-600 dark:text-red-400";

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Kesehatan Perangkat Sensor</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Kesehatan murni hardware berdasarkan Uptime (70%) & Kewajaran Data (30%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {fetchError ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                <WifiOff className="size-3" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                <Wifi className="size-3" /> Live
              </span>
            )}
            {lastUpdated && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Clock className="size-3" /> {lastUpdated}
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

            {/* ── Panel Kiri: Skor Keseluruhan ── */}
            <div className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
              {/* Gauge melingkar */}
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
                  <span className={`text-4xl font-black ${scoreColor}`}>{overallScore}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ 100</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {overallScore >= 80 ? "🟢 Sangat Sehat" : overallScore >= 60 ? "🟡 Perlu Cek Kabel" : "🔴 Masalah Hardware"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Rata-rata <b>uptime & akurasi</b> {totalCount} sensor
                </p>
              </div>

              {/* Legend bobot */}
              <div className="w-full space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-2">
                  Basis Perhitungan
                </p>
                {[
                  { label: "Kesegaran (Uptime)", pct: "70%", color: "bg-teal-500"   },
                  { label: "Logika (Akurasi)",   pct: "30%", color: "bg-violet-500" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-2 text-[11px]">
                    <div className={`size-2 rounded-full flex-shrink-0 ${color}`} />
                    <span className="text-gray-600 dark:text-gray-400 flex-1">{label}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{pct}</span>
                  </div>
                ))}
              </div>

              {/* Mini stat pills */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="size-2.5" /> {healthyCount} Bagus
                </span>
                {sickCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                    <ShieldAlert className="size-2.5" /> {sickCount} Bermasalah
                  </span>
                )}
                {staleCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Clock className="size-2.5" /> {staleCount} Macet
                  </span>
                )}
              </div>
            </div>

            {/* ── Panel Kanan: Per Sensor ── */}
            <div className="lg:col-span-2 space-y-2">
              {scored.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <WifiOff className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tidak ada data sensor</p>
                </div>
              ) : (
                scored.map(sensor => {
                  const { total, status: sScore, range: rScore, freshness: fScore } = sensor.scores;
                  const isWarning = sensor.status === "warning";
                  const isStale   = sensor.secondsAgo >= 30;
                  const range     = NORMAL_RANGE[sensor.type];
                  const barPct    = range
                    ? Math.min(100, Math.max(0, ((sensor.value - range.min) / (range.max - range.min)) * 100))
                    : 50;

                  return (
                    <div
                      key={sensor.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        isWarning
                          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10"
                          : isStale
                            ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60"
                            : "border-gray-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      {/* Baris atas: icon + nama + nilai + skor */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          isWarning ? "bg-amber-100 dark:bg-amber-950/60"
                                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                        }`}>
                          {getIcon(sensor.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{sensor.id}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
                              {SENSOR_NAMES[sensor.type]}
                            </span>
                          </div>
                          {/* Freshness */}
                          <span className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${
                            sensor.secondsAgo < 10
                              ? "text-emerald-500 dark:text-emerald-400"
                              : sensor.secondsAgo < 30
                                ? "text-blue-400 dark:text-blue-300"
                                : sensor.secondsAgo < 60
                                  ? "text-amber-500 dark:text-amber-400"
                                  : "text-red-400 dark:text-red-500"
                          }`}>
                            <Clock className="size-2.5" />
                            {formatAge(sensor.secondsAgo)}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className={`text-sm font-bold ${
                            isWarning ? "text-amber-600 dark:text-amber-400" : "text-gray-800 dark:text-gray-200"
                          }`}>
                            {Number(sensor.value).toFixed(1)} {sensor.unit ?? SENSOR_UNITS[sensor.type] ?? ""}
                          </span>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {total >= 80
                              ? <ShieldCheck  className="size-3 text-emerald-500" />
                              : <ShieldAlert  className="size-3 text-red-500" />}
                            <span className={`text-xs font-black ${
                              total >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : total >= 60
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                            }`}>{total}%</span>
                          </div>
                        </div>
                      </div>

                      {/* 2 sub-bar untuk 2 komponen kesehatan hardware */}
                      <div className="space-y-1.5">
                        {/* Freshness bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] w-16 text-gray-400 dark:text-gray-500 flex-shrink-0">Koneksi</span>
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                fScore >= 90 ? "bg-teal-500" :
                                fScore >= 70 ? "bg-blue-400" :
                                fScore >= 50 ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${fScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] w-7 text-right text-gray-400 dark:text-gray-500">{fScore}%</span>
                        </div>
                        {/* Range bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] w-16 text-gray-400 dark:text-gray-500 flex-shrink-0">Akurasi</span>
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all duration-500"
                              style={{ width: `${rScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] w-7 text-right text-gray-400 dark:text-gray-500">{rScore}%</span>
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
// PAGE
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

  const getSiagaLevel = (list: any[]): 1 | 2 | 3 => {
    const water = list.find(s => s.type === "water")?.value ?? 0;
    if (water >= thresholds.siaga1.water) return 1;
    if (water >= thresholds.siaga2.water) return 2;
    return 3;
  };

  // Sensors fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8002/api/sensors/latest", {
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
          created_at: s.created_at, // ← dari backend untuk freshness
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
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const t = setInterval(fetchData, 2000);
    return () => clearInterval(t);
  }, [thresholds]);

  // Thresholds fetch
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await fetch("http://localhost:8002/api/thresholds?type=siaga", {
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

  const totalSensors = sensors.length;
  const warningCount = sensors.filter(s => s.status === "warning").length;
  const normalCount  = sensors.filter(s => s.status === "normal").length;

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

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sensor",    value: loading ? "—" : String(totalSensors), icon: <Activity    className="size-5 text-blue-600 dark:text-blue-400"   />, bg: "bg-blue-50 dark:bg-blue-950",     text: "text-blue-700 dark:text-blue-300"   },
            { label: "Sensor Normal",   value: loading ? "—" : String(normalCount),  icon: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />, bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300" },
            { label: "Perlu Perhatian", value: loading ? "—" : String(warningCount), icon: <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />, bg: "bg-amber-50 dark:bg-amber-950",     text: "text-amber-700 dark:text-amber-300" },
            { label: "Update Terakhir", value: lastUpdated || "—",                   icon: <RefreshCw   className="size-5 text-violet-600 dark:text-violet-400" />, bg: "bg-violet-50 dark:bg-violet-950",   text: "text-violet-700 dark:text-violet-300", small: true },
          ].map(({ label, value, icon, bg, text, small }: any) => (
            <Card key={label} className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${bg} flex-shrink-0`}>{icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`font-bold mt-0.5 truncate ${small ? "text-sm" : "text-2xl"} ${text}`}>{value}</p>
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

        {/* Sensor Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Data Sensor Realtime
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : sensors.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <WifiOff className="size-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {fetchError ? "Tidak dapat terhubung ke server sensor" : "Tidak ada data sensor"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
              {sensors.map(sensor => (
                <SensorCard
                  key={sensor.id}
                  {...sensor}
                  icon={getIcon(sensor.type)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}