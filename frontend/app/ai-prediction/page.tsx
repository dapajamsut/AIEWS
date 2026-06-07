"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Droplets,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Wifi,
  WifiOff,
  Info,
  TrendingUp,
  Clock,
  Gauge,
} from "lucide-react";

import mqtt from "mqtt";

import Layout from "@/app/components/layout/Layout";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

// =====================================================================
// AI PREDICTION RESULT TYPE
// =====================================================================
interface AiPredictionResult {
  status_siaga: string;
  current_water_level: string;
  predicted_water_level_3_hours: string;
  predicted_water_rise: string;
  estimated_arrival: string;
}

// =====================================================================
// CONFIDENCE INDICATOR
// ---------------------------------------------------------------------
// Skor confidence menentukan seberapa percaya prediksi AI saat ini.
// Komponen:
//   - Data freshness  (40%) — seberapa baru data sensor terakhir
//   - Sensor coverage (40%) — semua sensor kunci tersedia atau tidak
//   - Data validity   (20%) — apakah nilai sensor masih dalam range wajar
// Skor < 60 → prediksi disembunyikan (ditampilkan "Insufficient Data")
//   karena AI tidak punya data cukup untuk diandalkan.
// =====================================================================

interface ConfidenceResult {
  score: number;          // 0-100
  level: "high" | "medium" | "low";
  freshness: number;      // 0-100
  coverage: number;       // 0-100
  validity: number;       // 0-100
  notes: string[];        // catatan diagnostik
  reliable: boolean;      // apakah prediksi cukup reliable untuk ditampilkan
}

function calcFreshnessScore(secondsAgo: number): number {
  if (secondsAgo < 60)   return 100;  // < 1 menit
  if (secondsAgo < 180)  return 90;   // < 3 menit
  if (secondsAgo < 300)  return 75;   // < 5 menit
  if (secondsAgo < 600)  return 50;   // < 10 menit
  if (secondsAgo < 1800) return 25;   // < 30 menit
  return 0;                            // basi
}

function calcConfidence(sensors: any[]): ConfidenceResult {
  const notes: string[] = [];

  // Sensor kunci yang dibutuhkan untuk model hidrologi
  const REQUIRED = ["water", "rain"] as const;
  const RECOMMENDED = ["wind", "temp", "humidity", "pressure"] as const;

  // 1) FRESHNESS — pakai sensor paling lama updatenya sebagai indikator
  let oldestAgeSec = Infinity;
  let freshSensorCount = 0;
  sensors.forEach((s) => {
    const t = s?.created_at ? new Date(s.created_at).getTime() : 0;
    if (!t) return;
    const ageSec = Math.max(0, (Date.now() - t) / 1000);
    if (ageSec < oldestAgeSec) oldestAgeSec = ageSec;
    if (ageSec < 60) freshSensorCount++;
  });

  const freshness = sensors.length === 0
    ? 0
    : Number.isFinite(oldestAgeSec)
      ? calcFreshnessScore(oldestAgeSec)
      : 0;

  if (freshness < 60) {
    notes.push(
      sensors.length === 0
        ? "Tidak ada data sensor yang masuk."
        : `Data sensor terakhir berumur ${Math.round(oldestAgeSec / 60)} menit.`
    );
  }

  // 2) COVERAGE — sensor kunci tersedia atau tidak
  const present = new Set<string>(sensors.map((s) => s?.type).filter(Boolean));
  const missingRequired = REQUIRED.filter((t) => !present.has(t));
  const missingRecommended = RECOMMENDED.filter((t) => !present.has(t));

  let coverage = 100;
  if (missingRequired.length > 0) {
    coverage -= missingRequired.length * 50; // sensor wajib hilang → drop besar
  }
  coverage -= missingRecommended.length * 5;
  coverage = Math.max(0, coverage);

  if (missingRequired.length > 0) {
    notes.push(`Sensor kunci tidak terdeteksi: ${missingRequired.join(", ")}.`);
  }

  // 3) VALIDITY — apakah nilai sensor wajar (tidak negatif, tidak ekstrim)
  let validityIssues = 0;
  sensors.forEach((s) => {
    const v = Number(s?.value);
    if (!Number.isFinite(v)) {
      validityIssues++;
      return;
    }
    if (s.type === "water" && (v < 0 || v > 1000)) validityIssues++;
    if (s.type === "rain"  && (v < 0 || v > 500))  validityIssues++;
    if (s.type === "temp"  && (v < -10 || v > 60)) validityIssues++;
  });
  const validity = sensors.length === 0
    ? 0
    : Math.max(0, 100 - validityIssues * 25);

  if (validityIssues > 0) {
    notes.push(`${validityIssues} pembacaan sensor di luar batas wajar.`);
  }

  // Final score: weighted average
  const score = Math.round(
    freshness * 0.40 +
    coverage  * 0.40 +
    validity  * 0.20
  );

  let level: ConfidenceResult["level"] = "low";
  if (score >= 80) level = "high";
  else if (score >= 60) level = "medium";

  return {
    score,
    level,
    freshness: Math.round(freshness),
    coverage: Math.round(coverage),
    validity: Math.round(validity),
    notes,
    reliable: score >= 60,
  };
}

// =====================================================================
// HELPER — format durasi: < 60 menit tampil "X Menit", >= 60 tampil "X Jam"
// =====================================================================
function formatArrival(raw: string): string {
  if (!raw || raw === "No Threat") return raw;
  const match = raw.match(/(\d+)/);
  if (!match) return raw;
  const minutes = parseInt(match[1]);
  if (minutes < 60) return `${minutes} Menit`;
  return `${Math.round(minutes / 60)} Jam`;
}

export default function WeatherAIPage() {
  const [activeRegion, setActiveRegion] = useState("Jakarta Pusat");
  const [lastUpdated, setLastUpdated] = useState("--:--");
  const [sensors, setSensors] = useState<any[]>([]);

  const [thresholds, setThresholds] = useState({
    siaga1: { water: 400 },
    siaga2: { water: 300 },
    siaga3: { water: 150 },
  });

  const [params, setParams] = useState({
    w: 15,
    S: 0.001,
    n: 0.035,
    A_DAS: 10000000,
    C: 0.75,
    L_segment: 1000,
  });

  const [hydrology, setHydrology] = useState({
    h: 0,
    V: 0,
    qSungai: 0,
    qHujan: 0,
    etaHours: 0,
    probability: 0,
    insight: "Mengumpulkan data sensor...",
  });

  // Confidence state
  const [confidence, setConfidence] = useState<ConfidenceResult>({
    score: 0,
    level: "low",
    freshness: 0,
    coverage: 0,
    validity: 0,
    notes: [],
    reliable: false,
  });

  // AI Prediction state
  const [aiResult, setAiResult] = useState<AiPredictionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ─────────────────────────────
  // LOAD REGION
  // ─────────────────────────────
  useEffect(() => {
    const loadRegion = () => {
      try {
        const saved = localStorage.getItem("selectedRegionData");
        if (saved) {
          const parsed = JSON.parse(saved);
          setActiveRegion(parsed.name || "Jakarta Pusat");
        }
      } catch {}
    };
    loadRegion();
    window.addEventListener("regionUpdated", loadRegion);
    window.addEventListener("thresholdsUpdated", loadRegion);
    return () => {
      window.removeEventListener("regionUpdated", loadRegion);
      window.removeEventListener("thresholdsUpdated", loadRegion);
    };
  }, []);

  // ─────────────────────────────
  // AI PREDICTION FETCH
  // ─────────────────────────────
  const fetchAiPrediction = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("http://localhost:8000/api/ai-prediction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "pikel2",
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      setAiResult(data.prediction ?? null);
    } catch (err: any) {
      setAiError(err?.message ?? "Gagal menghubungi AI server.");
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAiPrediction();
    const t = setInterval(fetchAiPrediction, 30_000); // refresh tiap 30 detik
    return () => clearInterval(t);
  }, [fetchAiPrediction]);

  // ─────────────────────────────
  // LAST UPDATED CLOCK
  // ─────────────────────────────
  useEffect(() => {
    const update = () => {
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);

  // ─────────────────────────────
  // FETCH DATA
  // ─────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resSensor = await fetch(
          "http://localhost:8000/api/sensors/latest",
          { headers: { apikey: "pikel2" }, cache: "no-store" }
        );
        if (resSensor.ok) {
          const sensorData = await resSensor.json();
          setSensors(sensorData);
        }

        const resThresh = await fetch(
          "http://localhost:8000/api/thresholds?type=siaga",
          { headers: { apikey: "pikel2" } }
        );
        if (resThresh.ok) {
          const tData = await resThresh.json();
          setThresholds({
            siaga1: { water: Number(tData.siaga1?.water ?? 400) },
            siaga2: { water: Number(tData.siaga2?.water ?? 300) },
            siaga3: { water: Number(tData.siaga3?.water ?? 150) },
          });
        }

        const resPhysics = await fetch(
          "http://localhost:8000/api/thresholds?type=physics",
          { headers: { apikey: "pikel2" } }
        );
        if (resPhysics.ok) {
          const pData = await resPhysics.json();
          setParams({
            w: Number(pData.w ?? 15),
            S: Number(pData.s ?? 0.001),
            n: Number(pData.n ?? 0.035),
            A_DAS: Number(pData.a_das ?? 10000000),
            C: Number(pData.c ?? 0.75),
            L_segment: Number(pData.l_segment ?? 1000),
          });
        }
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };

    fetchAll();
    const refetch = setInterval(fetchAll, 5000); // re-fetch tiap 5s untuk perbarui created_at

    // MQTT realtime
    let client: any = null;
    try {
      client = mqtt.connect("ws://localhost:9001");
      client.on("connect", () => client.subscribe("makesens/test/tmj"));
      client.on("message", (topic: string, message: any) => {
        if (topic === "makesens/test/tmj") {
          try {
            const payload = JSON.parse(message.toString());
            setSensors(payload);
          } catch {}
        }
      });
    } catch {}

    return () => {
      clearInterval(refetch);
      if (client) client.end(true);
    };
  }, []);

  // ─────────────────────────────
  // CALC: Confidence — recompute setiap detik agar freshness selalu update
  // ─────────────────────────────
  useEffect(() => {
    const compute = () => setConfidence(calcConfidence(sensors));
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [sensors]);

  // ─────────────────────────────
  // CALC: Hydrology
  // ─────────────────────────────
  useEffect(() => {
    if (!sensors.length) return;

    const waterSensor = sensors.find((s) => s.type === "water");
    const rainSensor = sensors.find((s) => s.type === "rain");

    const h = Number(waterSensor?.value || 0) / 100;
    const I = Number(rainSensor?.value || 0);

    const A = params.w * h;
    const P = params.w + 2 * h;
    const R = P > 0 ? A / P : 0;
    const V = (1 / params.n) * Math.pow(R, 2 / 3) * Math.pow(params.S, 1 / 2);
    const qSungai = A * V;
    const qHujan = params.C * (I / 3600000) * params.A_DAS;

    let probability = 0;
    let etaHours = 999;
    let insight = "Kondisi air stabil.";

    if (qHujan > 0) {
      etaHours = Math.max(1, 12 - qHujan);
      probability = Math.min(99, Math.round(100 - etaHours * 8));
      if (probability >= 80)       insight = "🚨 Potensi banjir tinggi terdeteksi.";
      else if (probability >= 50)  insight = "⚠️ Debit sungai mulai meningkat.";
    }

    setHydrology({ h, V, qSungai, qHujan, etaHours, probability, insight });
  }, [sensors, params]);

  // ─────────────────────────────
  // CALC: Probability dari AI result (atau fallback Manning)
  // ─────────────────────────────
  // Kalau AI result tersedia, derive probability dari estimated_arrival
  // dan predicted_water_rise. Kalau tidak, pakai kalkulasi Manning.
  const aiProbability: number | null = (() => {
    if (!aiResult) return null;

    // Parse estimated_arrival — "144 Menit", "No Threat", "175 Menit", dsb
    const arrivalRaw = aiResult.estimated_arrival ?? "";
    if (arrivalRaw === "No Threat") return 5; // hampir 0

    const minuteMatch = arrivalRaw.match(/(\d+)/);
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : null;

    // Parse predicted_water_rise — "+92 cm", "-7 cm", "0 cm"
    const riseRaw = aiResult.predicted_water_rise ?? "";
    const riseMatch = riseRaw.match(/([+-]?\d+)/);
    const riseCm = riseMatch ? parseInt(riseMatch[1]) : 0;

    if (minutes === null) return null;

    // Semakin sedikit menit → probability tinggi
    // Semakin besar kenaikan → probability tinggi
    // Formula: base dari waktu (inversi) + bobot dari kenaikan
    const timeScore  = Math.max(0, Math.min(100, Math.round(100 - (minutes / 300) * 100)));
    const riseScore  = Math.max(0, Math.min(100, Math.round((riseCm / 200) * 100)));
    const combined   = Math.round(timeScore * 0.65 + riseScore * 0.35);

    return Math.max(1, Math.min(99, combined));
  })();

  // Final probability yang ditampilkan
  const displayProbability = aiProbability !== null ? aiProbability : hydrology.probability;

  // ─────────────────────────────
  // SIAGA LEVEL dari AI (1 = darurat, 2 = waspada, 3 = aman)
  // Dipakai untuk warna dan label — konsisten dengan sistem siaga backend
  // ─────────────────────────────
  const aiSiagaLevel: 1 | 2 | 3 | null = (() => {
    if (!aiResult?.status_siaga) return null;
    const s = aiResult.status_siaga;
    if (s.includes("1")) return 1;
    if (s.includes("2")) return 2;
    return 3;
  })();

  // Warna: kalau AI ada → ikut siaga level, kalau tidak → ikut probability Manning
  const probColor =
    aiSiagaLevel === 1 ? "#ef4444" :
    aiSiagaLevel === 2 ? "#f59e0b" :
    aiSiagaLevel === 3 ? "#22c55e" :
    displayProbability >= 80 ? "#ef4444" :
    displayProbability >= 50 ? "#f59e0b" :
                               "#22c55e";

  // Label status pill
  const statusLabel = !confidence.reliable
    ? "Insufficient Data"
    : aiSiagaLevel === 1 ? "Siaga 1 — Darurat"
    : aiSiagaLevel === 2 ? "Siaga 2 — Waspada"
    : aiSiagaLevel === 3 ? "Siaga 3 — Aman"
    : displayProbability >= 80 ? "High Risk"
    : displayProbability >= 50 ? "Warning"
    : "Stable";

  // Kelas warna pill
  const statusPillClass = !confidence.reliable
    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    : aiSiagaLevel === 1 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
    : aiSiagaLevel === 2 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
    : aiSiagaLevel === 3 ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
    : displayProbability >= 80 ? "bg-red-100 text-red-700"
    : displayProbability >= 50 ? "bg-yellow-100 text-yellow-700"
    : "bg-green-100 text-green-700";

  // AI Note insight
  const aiInsight = !confidence.reliable
    ? "Sistem belum dapat menampilkan prediksi karena kualitas data sensor terlalu rendah. Pastikan semua sensor aktif dan terhubung."
    : aiSiagaLevel === 1
    ? "🚨 Status Siaga 1 — Bahaya. Lakukan evakuasi dan persiapan tanggap darurat segera."
    : aiSiagaLevel === 2
    ? "⚠️ Status Siaga 2 — Waspada. Pantau kondisi air secara intensif dan siapkan langkah mitigasi."
    : aiSiagaLevel === 3
    ? "✅ Status Siaga 3 — Kondisi aman. Tetap pantau sensor secara berkala."
    : hydrology.insight;

  const confColor =
    confidence.level === "high"   ? "#10b981" :
    confidence.level === "medium" ? "#f59e0b" :
                                    "#ef4444";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* HEADER */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Brain className="text-purple-600" />
              Hydrological AI Prediction
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Model Prediksi Fisika & AI
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live data badge */}
            {confidence.freshness >= 60 ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                <Wifi className="size-3" /> Live Data
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 gap-1">
                <WifiOff className="size-3" /> Stale Data
              </Badge>
            )}
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              Live Calculation
            </Badge>
          </div>
        </div>

        {/* MAIN CARD */}
        <Card className="overflow-hidden border-0 rounded-3xl shadow-2xl bg-white dark:bg-gray-900">

          {/* TOP: Region + Risk Status */}
          <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">
                  AI FLOOD FORECAST
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                  {activeRegion}
                </h2>
              </div>

              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${statusPillClass}`}
              >
                {statusLabel}
              </div>
            </div>

            {/* MAIN VISUAL: 2 columns — Probability circle + Confidence breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

              {/* LEFT — Probability Circle (kalau reliable, kalau tidak: insufficient data) */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-gray-800/50">
                {confidence.reliable ? (
                  <>
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
                        <circle
                          cx="128" cy="128" r="100"
                          strokeWidth="18" fill="none"
                          className="stroke-gray-200 dark:stroke-gray-700"
                        />
                        <circle
                          cx="128" cy="128" r="100"
                          strokeWidth="18" fill="none"
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                          style={{
                            stroke: probColor,
                            strokeDasharray: 628,
                            strokeDashoffset:
                              628 - (Math.min(displayProbability, 100) / 100) * 628,
                          }}
                        />
                      </svg>
                      <div className="text-center z-10">
                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                          {displayProbability}%
                        </h1>
                        <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mt-2">
                          Flood Risk
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 font-medium">
                      Last updated · {lastUpdated} WIB
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 max-w-xs text-center leading-relaxed italic">
                      {aiProbability !== null
                        ? "Dihitung dari prediksi AI: estimasi waktu kedatangan & kenaikan air."
                        : "Prediksi berbasis Manning's equation dengan parameter standar. Akurasi aktual bergantung pada kalibrasi lapangan dan kondisi mikro lokasi."}
                    </p>
                  </>
                ) : (
                  // INSUFFICIENT DATA STATE — sensor mati / data basi
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-sm">
                    <div className="size-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-4">
                      <ShieldAlert className="size-10 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                      Prediksi Tidak Tersedia
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Confidence terlalu rendah untuk menghasilkan prediksi yang dapat diandalkan.
                      Periksa koneksi sensor.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT — Confidence Breakdown */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800/70 dark:to-gray-900/70 border border-slate-200 dark:border-slate-700">

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">
                      Data Quality Score
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      Kualitas Data Sensor
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {confidence.level === "high"
                      ? <ShieldCheck className="size-5" style={{ color: confColor }} />
                      : <ShieldAlert className="size-5" style={{ color: confColor }} />}
                    <span
                      className="text-3xl font-black"
                      style={{ color: confColor }}
                    >
                      {confidence.score}%
                    </span>
                  </div>
                </div>

                {/* Status pill */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5"
                  style={{
                    background: `${confColor}1a`,
                    color: confColor,
                    border: `1px solid ${confColor}33`,
                  }}
                >
                  <span className="size-1.5 rounded-full" style={{ background: confColor }} />
                  {confidence.level === "high"   && "Baik — Data Layak untuk Prediksi"}
                  {confidence.level === "medium" && "Sedang — Pantau Kualitas Sensor"}
                  {confidence.level === "low"    && "Rendah — Data Tidak Memadai"}
                </div>

                {/* Breakdown bars */}
                <div className="space-y-3">
                  {[
                    { label: "Kesegaran Data", value: confidence.freshness, weight: "40%" },
                    { label: "Cakupan Sensor", value: confidence.coverage,  weight: "40%" },
                    { label: "Validitas Nilai", value: confidence.validity, weight: "20%" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {item.label}
                          <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
                            ({item.weight})
                          </span>
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${item.value}%`,
                            background:
                              item.value >= 80 ? "#10b981" :
                              item.value >= 60 ? "#f59e0b" :
                                                 "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Diagnostic notes */}
                {confidence.notes.length > 0 && (
                  <div className="mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <div className="flex gap-2">
                      <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <p className="font-bold mb-1">Catatan Diagnostik</p>
                        <ul className="space-y-0.5">
                          {confidence.notes.map((n, i) => (
                            <li key={i}>• {n}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* INFO BOXES — AI Prediction Results */}
            {confidence.reliable && (
              <div className="mt-8 space-y-3">

                {/* AI Loading / Error banner */}
                {aiLoading && !aiResult && (
                  <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 flex items-center gap-3">
                    <div className="size-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-purple-700 dark:text-purple-300">Memuat prediksi dari AI server...</p>
                  </div>
                )}

                {aiError && (
                  <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
                    <AlertCircle className="size-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">AI server tidak tersedia</p>
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{aiError}</p>
                    </div>
                    <button
                      onClick={fetchAiPrediction}
                      className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                    >
                      Coba lagi
                    </button>
                  </div>
                )}

                {/* Hasil prediksi AI */}
                {aiResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Predicted Water Level 3 Hours */}
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="size-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                          <Gauge className="size-4 text-blue-600" />
                        </div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                          Prediksi Tinggi Air
                        </p>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {aiResult.predicted_water_level_3_hours}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3 jam ke depan</p>
                    </div>

                    {/* Predicted Water Rise */}
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="size-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                          <TrendingUp className="size-4 text-amber-600" />
                        </div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                          Kenaikan / Penurunan
                        </p>
                      </div>
                      <h3
                        className={`text-3xl font-bold ${
                          aiResult.predicted_water_rise.startsWith("-")
                            ? "text-emerald-600 dark:text-emerald-400"
                            : aiResult.predicted_water_rise === "0 cm"
                            ? "text-gray-900 dark:text-white"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {aiResult.predicted_water_rise}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">dibanding kondisi saat ini</p>
                    </div>

                    {/* Estimated Arrival */}
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="size-8 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                          <Clock className="size-4 text-red-600" />
                        </div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                          Estimasi Kedatangan
                        </p>
                      </div>
                      <h3 className={`text-3xl font-bold ${
                        aiResult.estimated_arrival === "No Threat"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {formatArrival(aiResult.estimated_arrival)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">potensi banjir</p>
                    </div>
                  </div>
                )}

                {/* Badge sumber: AI */}
                {aiResult && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 text-right">
                    Sumber: AI Model · {aiLoading ? "memperbarui..." : `diperbarui ${lastUpdated} WIB`}
                  </p>
                )}
              </div>
            )}

            {/* AI NOTE */}
            <div className="mt-8 rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-5">
              <div className="flex gap-4">
                <div className="size-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <Brain className="size-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    AI Note
                    {aiResult?.status_siaga && (
                      <span className="ml-2 text-xs font-normal bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {aiResult.status_siaga}
                      </span>
                    )}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {aiInsight}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL INSIGHTS */}
          <div className="p-6 sm:p-8 bg-gray-50/70 dark:bg-gray-950/40">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Critical Insights
            </h3>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                    <AlertCircle className="size-6 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      River Water Rising
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      Water level currently reaches{" "}
                      {(hydrology.h * 100).toFixed(0)} cm with river flow velocity{" "}
                      {hydrology.V.toFixed(2)} m/s.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Droplets className="size-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      System Recommendation
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      {!confidence.reliable
                        ? "Tingkatkan kualitas data sensor terlebih dahulu sebelum mengambil keputusan operasional."
                        : aiResult
                        ? `AI memprediksi tinggi air akan mencapai ${aiResult.predicted_water_level_3_hours} dalam 3 jam ke depan (${aiResult.predicted_water_rise}). Estimasi kedatangan potensi banjir: ${formatArrival(aiResult.estimated_arrival)}.`
                        : hydrology.probability >= 80
                        ? "Immediate evacuation preparation and flood barrier deployment are recommended."
                        : hydrology.probability >= 50
                        ? "Monitor river conditions continuously and prepare drainage mitigation."
                        : "Current hydrological conditions remain stable and under control."}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: Data Quality Status */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="flex gap-4">
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${confColor}1a` }}
                  >
                    <Activity className="size-6" style={{ color: confColor }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Data Quality
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      Skor kualitas data {confidence.score}% — kombinasi dari kesegaran
                      data sensor, kelengkapan cakupan, dan validitas pembacaan.
                      {confidence.score < 60 && " Periksa konektivitas sensor agar prediksi dapat ditampilkan."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
