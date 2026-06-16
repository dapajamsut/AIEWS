"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/app/components/layout/Layout";
import { SnapshotFeed, type SnapshotFeedHandle } from "@/app/components/SnapshotFeed";
import CameraSnapshotGallery from "@/app/components/CameraSnapshotGallery";
import { compressCanvas } from "@/app/lib/imageCompression";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";
import {
  RefreshCw,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  Download,
  CheckCircle2,
  LineChart as LineIcon,
  Calendar,
  SlidersHorizontal,
  AlertTriangle,
  Wrench,
  Droplet,
  Lightbulb,
  Save,
  Database,
  Timer,
  CircleStop
} from "lucide-react";

interface StatusConfig {
  text: string;
  glowClass: string;
  innerBg: string;
  iconBox: string;
  bottomText: string;
  bottomIcon: React.ReactNode;
  validationText: string;
  validationIcon: React.ReactNode;
  recommendation: string;
  statusBadge: string;
  statusBadgeColor: string;
  borderColor: string;
}

export default function CameraPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [thresholds, setThresholds] = useState({
    siaga1: { water: 400 },
    siaga2: { water: 300 },
    siaga3: { water: 150 },
  });
  const [waterSensorValue, setWaterSensorValue] = useState<number | null>(null);
  const [sensorLoading, setSensorLoading] = useState(false);
  const prevWaterValueRef = useRef<number | null>(null);
  const [isSensorValid, setIsSensorValid] = useState(true);
  const [hourlyChartData, setHourlyChartData] = useState<any[]>([]);

  // ==============================
  // 🔥 SNAPSHOT KE DATABASE (capture + kompresi)
  // ==============================
  const snapshotFeedRef = useRef<SnapshotFeedHandle>(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  // Otomatis snapshot ke DB setiap N menit (dapat dinyalakan/matikan & input bebas).
  // Nilai ini juga jadi sumber kebenaran untuk timer refresh CCTV di header.
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(false);
  const [autoSnapshotInterval, setAutoSnapshotInterval] = useState<number>(5); // menit
  const [autoSnapshotInputText, setAutoSnapshotInputText] = useState<string>("5");
  const [snapshotRefreshTick, setSnapshotRefreshTick] = useState(0); // memicu reload gallery

  // Statistik arsip snapshot (untuk card di sidebar kanan)
  const [snapshotStats, setSnapshotStats] = useState<{
    total_snapshots: number;
    total_original_kb: number;
    total_compressed_kb: number;
    saving_percent: number;
  } | null>(null);

  // Fetch statistik arsip snapshot
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/camera/snapshots/stats`, {
          cache: "no-store",
          headers: { apikey: "pikel2" },
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data) setSnapshotStats(json.data);
        }
      } catch { /* silent */ }
    };
    fetchStats();
    // refetch saat ada snapshot baru tersimpan
  }, [snapshotRefreshTick]);

  // Derived: interval refresh CCTV dalam detik (ikut Auto-Snapshot).
  const refreshInterval = Math.max(1, autoSnapshotInterval) * 60;

  // URL relative → diproksikan Next.js ke http://cctv.makesens.my.id/snapshot
  // Ini menghindari: (1) Mixed Content (HTTP dari halaman HTTPS), (2) CORS tainted-canvas.
  const CCTV_IMAGE_URL = `/cctv-snapshot`;

  const formatTimeWithoutSeconds = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr.replace(/[:.]\d{2}(?=\s|$)/, '');
  };

  useEffect(() => {
    const generateHourlyData = () => {
      const data = [];
      const currentHour = new Date().getHours();
      for (let i = 12; i >= 0; i--) {
        const targetHour = (currentHour - i + 24) % 24;
        const timeLabel = `${targetHour.toString().padStart(2, '0')}:00`;
        const dateMultiplier = parseInt(selectedDate.split('-')[2]) % 2 === 0 ? 1.2 : 0.85;
        const mockObjects = Math.floor((6 + Math.sin(i / 2) * 4 + Math.random() * 3) * dateMultiplier);
        const mockWater = Math.floor((110 + (mockObjects * 9) + Math.sin(i / 3) * 15 + Math.random() * 10) * dateMultiplier);
        data.push({ time: timeLabel, objects: mockObjects, water: mockWater });
      }
      setHourlyChartData(data);
    };
    generateHourlyData();
  }, [refreshKey, selectedDate]);

  const fetchThresholds = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds?type=siaga`, {
        cache: "no-store",
        headers: { apikey: "pikel2" },
      });
      if (res.ok) {
        const data = await res.json();
        setThresholds({
          siaga1: { water: Number(data.siaga1?.water ?? 400) },
          siaga2: { water: Number(data.siaga2?.water ?? 300) },
          siaga3: { water: Number(data.siaga3?.water ?? 150) },
        });
      }
    } catch (error) {
      console.error("Fetch thresholds error:", error);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
    const handleThresholdUpdate = () => fetchThresholds();
    window.addEventListener("thresholdsUpdated", handleThresholdUpdate);
    return () => window.removeEventListener("thresholdsUpdated", handleThresholdUpdate);
  }, [fetchThresholds]);

  const fetchWaterSensor = useCallback(async () => {
    try {
      setSensorLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/sensors/latest`, {
        cache: "no-store",
        headers: { apikey: "pikel2" },
      });
      if (res.ok) {
        const data = await res.json();
        const waterSensor = data.find((s: any) => s.type === "water");
        if (waterSensor) setWaterSensorValue(Number(waterSensor.value));
      }
    } catch (error) {
      console.error("Fetch water sensor error:", error);
    } finally {
      setSensorLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaterSensor();
    const interval = setInterval(fetchWaterSensor, 2000);
    return () => clearInterval(interval);
  }, [fetchWaterSensor]);

  // Validasi sensor (lonjakan)
  useEffect(() => {
    if (waterSensorValue === null) {
      setIsSensorValid(false);
      return;
    }
    const maxReasonable = thresholds.siaga1.water + 300;
    if (waterSensorValue > maxReasonable) {
      setIsSensorValid(false);
      return;
    }
    if (prevWaterValueRef.current !== null) {
      const change = Math.abs(waterSensorValue - prevWaterValueRef.current);
      if (change > 150 && waterSensorValue > thresholds.siaga1.water) {
        setIsSensorValid(false);
        return;
      }
    }
    setIsSensorValid(true);
    prevWaterValueRef.current = waterSensorValue;
  }, [waterSensorValue, thresholds.siaga1.water]);

  const getSiagaLevelFromThreshold = (waterLevel: number) => {
    if (waterLevel >= thresholds.siaga1.water) return { level: "SIAGA 1", status: "Bahaya" };
    if (waterLevel >= thresholds.siaga2.water) return { level: "SIAGA 2", status: "Waspada" };
    return { level: "SIAGA 3", status: "Normal" };
  };

  // Timer refresh CCTV — sumber kebenaran tunggal: setting Auto-Snapshot
  // di card "Capture Snapshot ke Database" (input bebas + tombol Terapkan).
  // Counter di header header & timer refresh frame mengikuti nilai itu.
  // - Klik "Request New Frame" tidak mereset countdown.
  // - Frame hanya auto-refresh saat Auto-Snapshot toggle ON.
  useEffect(() => {
    setCountdown(refreshInterval);

    if (!autoSnapshotEnabled) {
      // Toggle off → tidak ada auto-refresh, countdown beku di interval penuh.
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshKey((k) => k + 1);
          saveCurrentWaterLevelToHistory();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval, autoSnapshotEnabled]);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
  }, [refreshKey]);

  // Klik tombol "Request New Frame" — TIDAK mereset countdown.
  // Counter terus jalan seperti tidak ada apa-apa.
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    saveCurrentWaterLevelToHistory();
  };

  const saveCurrentWaterLevelToHistory = () => {
    const detectedWaterLevel = waterSensorValue !== null ? waterSensorValue : 0;
    const { level: siagaLevel, status: statusText } = getSiagaLevelFromThreshold(detectedWaterLevel);
    const newLog = {
      timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      water_level: detectedWaterLevel,
      siaga_level: siagaLevel,
      status: statusText,
    };
    const existing = localStorage.getItem("camera_water_history");
    let history = existing ? JSON.parse(existing) : [];
    history.unshift(newLog);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem("camera_water_history", JSON.stringify(history));
    if (waterLogs.length > 0) setWaterLogs(history);
  };

  const fetchWaterLogs = async () => {
    setLoadingLogs(true);
    try {
      const existing = localStorage.getItem("camera_water_history");
      if (existing) {
        setWaterLogs(JSON.parse(existing));
      } else {
        const dummyWaterLevel = waterSensorValue !== null ? waterSensorValue : 75;
        const { level: siagaLevel, status: statusText = "Normal" } = getSiagaLevelFromThreshold(dummyWaterLevel);
        const dummyHistory = [{ timestamp: new Date().toLocaleString(), water_level: dummyWaterLevel, siaga_level: siagaLevel, status: statusText }];
        setWaterLogs(dummyHistory);
        localStorage.setItem("camera_water_history", JSON.stringify(dummyHistory));
      }
    } catch (err) {
      console.error("Gagal membaca history kamera:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWaterLogs();
  }, []);

  const handleRefreshLogs = () => fetchWaterLogs();

  const exportToCSV = () => {
    if (waterLogs.length === 0) return;
    const headers = ["Waktu", "Tinggi Air (cm)", "Status SIAGA", "Keterangan"];
    const rows = waterLogs.map(log => [
      log.timestamp,
      log.water_level,
      log.siaga_level,
      log.status === "Bahaya" ? "Evakuasi segera" : log.status === "Waspada" ? "Siaga penuh" : "Normal & aman"
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `camera_water_history_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const boundingBoxes: any[] = [];

  // Data dummy untuk debris density (nanti bisa dari API)
  const debrisDensity = {
    densityPercentage: 62,
    densityLevel: "High" as const,
    lastAnalysis: formatTimeWithoutSeconds(lastUpdate),
    totalObjects: 18,
  };

  const currentWater = waterSensorValue ?? 0;

  // --- LOGIKA TABEL KEBENARAN (BACKEND) ---
  // Konversi persentase ke kategori Low/Medium/High
  const getDensityCategory = (percentage: number): "Low" | "Medium" | "High" => {
    if (percentage <= 33) return "Low";
    if (percentage <= 66) return "Medium";
    return "High";
  };

  // Kategori level air berdasarkan threshold SIAGA
  const getWaterCategory = (waterLevel: number): "Aman" | "Waspada" | "Bahaya" => {
    if (waterLevel >= thresholds.siaga1.water) return "Bahaya";
    if (waterLevel >= thresholds.siaga2.water) return "Waspada";
    return "Aman";
  };

  // Fungsi utama status sistem sesuai tabel kebenaran
  const getSystemStatus = (waterCategory: string, isJump: boolean, densityCategory: string) => {
    if (isJump) {
      // Lompat = 1 -> Sensor Terganggu
      let recommendation = "";
      if (densityCategory === "Low") recommendation = "Pembacaan sensor tidak valid. Periksa area sensor, kemungkinan ada benda menyangkut.";
      else if (densityCategory === "Medium") recommendation = "Pembacaan sensor tidak valid. Sampah terdeteksi, segera bersihkan area sensor.";
      else recommendation = "Pembacaan sensor tidak valid. Sampah padat menghalangi sensor, segera lakukan pembersihan.";
      return {
        status: "SENSOR TERGANGGU",
        recommendation,
        badgeText: "⚠️ Sensor Terganggu",
        badgeColor: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400"
      };
    } else {
      // Lompat = 0
      if (waterCategory === "Aman") {
        if (densityCategory === "Low") return {
          status: "AMAN",
          recommendation: "Kondisi normal. Tidak ada tindakan yang diperlukan.",
          badgeText: "SIAGA 3 • Normal",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
        };
        if (densityCategory === "Medium") return {
          status: "AMAN",
          recommendation: "Kondisi normal. Sampah terdeteksi hanyut, tidak mengganggu sensor.",
          badgeText: "SIAGA 3 • Normal",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
        };
        return {
          status: "AMAN",
          recommendation: "Kondisi normal. Sampah padat terdeteksi hanyut, pantau secara berkala.",
          badgeText: "SIAGA 3 • Normal",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
        };
      } else if (waterCategory === "Waspada") {
        if (densityCategory === "Low") return {
          status: "WASPADA",
          recommendation: "Air mulai naik. Aktifkan pemantauan intensif dan siapkan langkah mitigasi.",
          badgeText: "SIAGA 2 • Waspada",
          badgeColor: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400"
        };
        if (densityCategory === "Medium") return {
          status: "WASPADA",
          recommendation: "Air mulai naik disertai sampah hanyut. Pantau potensi penyumbatan di hilir.",
          badgeText: "SIAGA 2 • Waspada",
          badgeColor: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400"
        };
        return {
          status: "WASPADA",
          recommendation: "Air mulai naik dengan penumpukan sampah. Risiko sumbatan tinggi, segera koordinasi pembersihan.",
          badgeText: "SIAGA 2 • Waspada",
          badgeColor: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400"
        };
      } else { // Bahaya
        if (densityCategory === "Low") return {
          status: "BAHAYA BANJIR",
          recommendation: "ALERT! Air mencapai level kritis. Segera lakukan evakuasi dan hubungi pihak berwenang.",
          badgeText: "SIAGA 1 • Bahaya",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 animate-pulse"
        };
        if (densityCategory === "Medium") return {
          status: "BAHAYA BANJIR",
          recommendation: "ALERT! Banjir disertai material hanyut. Evakuasi segera, hindari area sungai.",
          badgeText: "SIAGA 1 • Bahaya",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 animate-pulse"
        };
        return {
          status: "BAHAYA BANJIR",
          recommendation: "ALERT! Banjir dengan penumpukan material padat. Risiko sumbatan kritis, evakuasi segera.",
          badgeText: "SIAGA 1 • Bahaya",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 animate-pulse"
        };
      }
    }
  };

  const densityCategory = getDensityCategory(debrisDensity.densityPercentage);
  const waterCategory = getWaterCategory(currentWater);
  const isJump = !isSensorValid || waterSensorValue === null;
  const system = getSystemStatus(waterCategory, isJump, densityCategory);

  let activeRecommendation = system.recommendation;

  // Bagian visual (glow, border, icon) tetap berdasarkan level air (untuk mempertahankan tampilan yang sudah ada)
  let baseConfig: any = {};
  if (!isSensorValid || waterSensorValue === null) {
    baseConfig = {
      text: "DATA TIDAK VALID",
      glowClass: "border-slate-400 dark:border-slate-600 shadow-[0_0_15px_rgba(148,163,184,0.15)] ring-2 ring-slate-400/30 dark:ring-slate-600/20",
      innerBg: "bg-slate-500/[0.03] dark:bg-slate-500/[0.02]",
      iconBox: "bg-slate-600 dark:bg-slate-700 text-white shadow-sm",
      bottomText: "Sensor Terganggu / Harap Periksa Alat",
      bottomIcon: <Wrench className="size-4 text-slate-500" />,
      borderColor: "border-l-[5px] border-l-amber-500"
    };
  } else {
    const { level } = getSiagaLevelFromThreshold(currentWater);
    if (level === "SIAGA 1") {
      baseConfig = {
        text: "SIAGA 1 (AKTIF)",
        glowClass: "border-red-500 dark:border-red-400/80 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-2 ring-red-500/30 dark:ring-red-400/20",
        innerBg: "bg-red-500/[0.03] dark:bg-red-500/[0.02]",
        iconBox: "bg-red-500 text-white shadow-sm shadow-red-500/20",
        bottomText: "Banjir Tak Terhindarkan / Sudah Meluap",
        bottomIcon: <AlertTriangle className="size-4 text-red-500" />,
        borderColor: "border-l-[5px] border-l-rose-500"
      };
    } else if (level === "SIAGA 2") {
      baseConfig = {
        text: "SIAGA 2 (AKTIF)",
        glowClass: "border-orange-500 dark:border-orange-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-2 ring-orange-500/30 dark:ring-orange-400/20",
        innerBg: "bg-orange-500/[0.03] dark:bg-orange-500/[0.02]",
        iconBox: "bg-orange-500 text-white shadow-sm shadow-orange-500/20",
        bottomText: "Kritis / Waspada Kenaikan Agresif",
        bottomIcon: <AlertTriangle className="size-4 text-orange-500" />,
        borderColor: "border-l-[5px] border-l-orange-500"
      };
    } else {
      baseConfig = {
        text: "SIAGA 3 (AKTIF)",
        glowClass: "border-amber-600 dark:border-amber-500 shadow-[0_0_15px_rgba(180,83,9,0.2)] ring-2 ring-amber-600/30 dark:ring-amber-500/20",
        innerBg: "bg-amber-600/[0.03] dark:bg-amber-500/[0.02]",
        iconBox: "bg-amber-600 text-white shadow-sm shadow-amber-600/20",
        bottomText: "Kondisi Normal / Waspada Ringan",
        bottomIcon: <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
        borderColor: "border-l-[5px] border-l-emerald-500"
      };
    }
  }

  const finalValidationText = (!isSensorValid || waterSensorValue === null) ? "Terganggu" : "Valid";
  const finalValidationIcon = (!isSensorValid || waterSensorValue === null) ? <Wrench className="size-3.5 text-orange-500" /> : <CheckCircle2 className="size-3.5 text-emerald-500" />;

  const statusConfig: StatusConfig = {
    ...baseConfig,
    validationText: finalValidationText,
    validationIcon: finalValidationIcon,
    recommendation: activeRecommendation,
    statusBadge: system.badgeText,
    statusBadgeColor: system.badgeColor,
  };

  // ==============================
  // 🔥 HANDLER: Simpan snapshot ke DB (manual / otomatis)
  // ==============================
  const handleSaveSnapshot = useCallback(async (mode: "manual" | "auto" = "manual") => {
    if (savingSnapshot) return;

    const handle = snapshotFeedRef.current;
    if (!handle || !handle.isReady()) {
      if (mode === "manual") alert("⚠️ Gambar CCTV belum siap. Coba lagi sebentar.");
      return;
    }
    const canvas = handle.getCanvas();
    if (!canvas) {
      if (mode === "manual") alert("⚠️ Canvas tidak tersedia.");
      return;
    }

    setSavingSnapshot(true);
    try {
      // Kompresi canvas → JPEG quality 0.6 → deflate → base64
      const result = await compressCanvas(canvas, 0.6);

      const { level: siagaLevel } = (waterSensorValue !== null && isSensorValid)
        ? getSiagaLevelFromThreshold(waterSensorValue)
        : { level: "SIAGA 3" };

      const payload = {
        image_data:         result.base64,
        camera_id:          "CCTV-1984-BANJIR",
        location:           "Sektor Sungai Utama",
        siaga_level:        siagaLevel,
        water_level:        waterSensorValue,
        has_bounding_boxes: boundingBoxes.length > 0,
        total_objects:      debrisDensity.totalObjects,
        image_width:        result.width,
        image_height:       result.height,
        original_size_kb:   result.originalSizeKb,
        compressed_size_kb: result.compressedSizeKb,
        compression_type:   "jpeg+deflate",
        capture_mode:       mode,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/camera/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: "pikel2" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const data = await res.json();
      setSnapshotRefreshTick((t) => t + 1);

      if (mode === "manual") {
        alert(
          `✅ Snapshot tersimpan (#${data.id}).\n` +
          `Asli: ${result.originalSizeKb.toFixed(1)} KB → ` +
          `Tersimpan: ${result.compressedSizeKb.toFixed(1)} KB ` +
          `(hemat ${(((result.originalSizeKb - result.compressedSizeKb) / result.originalSizeKb) * 100).toFixed(1)}%)`
        );
      }
    } catch (err: any) {
      console.error("Save snapshot error:", err);
      if (mode === "manual") {
        alert(
          "❌ Gagal menyimpan snapshot.\n" +
          "Catatan: server CCTV harus mengizinkan CORS, jika tidak canvas akan 'tainted' dan tidak bisa di-export.\n\n" +
          (err?.message || "")
        );
      }
    } finally {
      setSavingSnapshot(false);
    }
  }, [savingSnapshot, waterSensorValue, isSensorValid, boundingBoxes.length, debrisDensity.totalObjects, thresholds]);

  // ==============================
  // 🔥 EFFECT: Timer auto-snapshot
  // Setiap autoSnapshotInterval menit, otomatis simpan snapshot ke DB.
  // ==============================
  useEffect(() => {
    if (!autoSnapshotEnabled || autoSnapshotInterval <= 0) return;
    const ms = Math.max(1, autoSnapshotInterval) * 60 * 1000;
    console.log(`📸 Auto-snapshot aktif: setiap ${autoSnapshotInterval} menit`);
    const t = setInterval(() => {
      handleSaveSnapshot("auto");
    }, ms);
    return () => {
      clearInterval(t);
      console.log("📸 Auto-snapshot timer dibersihkan");
    };
  }, [autoSnapshotEnabled, autoSnapshotInterval, handleSaveSnapshot]);

  // Init dari localStorage saat mount
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("auto_snapshot_interval") || "");
    if (saved && saved > 0) {
      setAutoSnapshotInterval(saved);
      setAutoSnapshotInputText(String(saved));
    }
    const enabled = localStorage.getItem("auto_snapshot_enabled") === "true";
    if (enabled) setAutoSnapshotEnabled(true);
  }, []);

  // Persist toggle ke localStorage + broadcast ke Dashboard
  useEffect(() => {
    localStorage.setItem("auto_snapshot_enabled", String(autoSnapshotEnabled));
    window.dispatchEvent(
      new CustomEvent("autoSnapshotIntervalUpdated", {
        detail: { interval: autoSnapshotInterval, enabled: autoSnapshotEnabled },
      })
    );
  }, [autoSnapshotEnabled, autoSnapshotInterval]);

  const applyAutoSnapshotInterval = () => {
    const n = Number(autoSnapshotInputText);
    if (!Number.isFinite(n) || n < 1) {
      alert("⚠️ Masukkan angka menit minimal 1.");
      return;
    }
    const minutes = Math.floor(n);
    setAutoSnapshotInterval(minutes);
    // Simpan ke localStorage agar Dashboard bisa sinkron CCTV refresh frame.
    localStorage.setItem("auto_snapshot_interval", String(minutes));
    window.dispatchEvent(
      new CustomEvent("autoSnapshotIntervalUpdated", {
        detail: { interval: minutes, enabled: autoSnapshotEnabled },
      })
    );
    alert(`✅ Interval auto-snapshot diatur ke ${minutes} menit.`);
  };

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto space-y-6 p-3 sm:p-4 md:p-6 overflow-x-hidden font-sans tracking-tight">
        {/* Header - Minimalist Corporate */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm w-full">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`flex h-1.5 w-1.5 rounded-full ${!isSensorValid ? 'bg-orange-500' : 'bg-blue-600'}`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${!isSensorValid ? 'text-orange-500' : 'text-blue-600'}`}>
                {!isSensorValid ? 'System Diagnostics' : 'Telemetry Operational'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="text-gray-900 dark:text-white size-6 stroke-[2]" />
              Visual AI Monitoring
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[11px] text-gray-400 font-medium flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                <Clock className="size-3.5 text-gray-400" /> Refresh Counter: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
              <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-700"><MapPin className="size-3.5 text-gray-400" /> Banjir Cam • Sektor A</span>
            </div>
          </div>
          <Button onClick={handleRefresh} className="gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-5 sm:px-6 h-11 rounded-xl transition-all font-semibold cursor-pointer text-xs tracking-wide active:scale-95 shadow-sm">
            <RefreshCw className={`size-3.5 ${refreshKey > 0 ? 'animate-spin-slow' : ''}`} />
            <span>Request New Frame</span>
          </Button>
        </div>

        {/* Grid Stream Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
          <div className="lg:col-span-2 w-full">
            <SnapshotFeed
              ref={snapshotFeedRef}
              imageUrl={CCTV_IMAGE_URL}
              timestamp={formatTimeWithoutSeconds(lastUpdate)}
              boundingBoxes={boundingBoxes}
              cameraId=""
              location=""
              refreshKey={refreshKey}
            />

            {/* === SNAPSHOT KE DATABASE — di kolom kiri (mengisi ruang kosong) === */}
            <Card className="mt-6 p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-sm w-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm">
                  <Database className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight tracking-tight">
                    Capture Snapshot ke Database
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Simpan frame CCTV terkompresi (JPEG + Deflate) untuk arsip & riwayat investigasi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manual Capture */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                  <div className="mb-3">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1">Manual Capture</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Klik untuk simpan frame saat ini ke database secara langsung.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSaveSnapshot("manual")}
                    disabled={savingSnapshot}
                    className="w-full gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-5 h-11 rounded-xl transition-all font-semibold cursor-pointer text-xs tracking-wide active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    <Save className={`size-3.5 ${savingSnapshot ? 'animate-pulse' : ''}`} />
                    <span>{savingSnapshot ? "Menyimpan…" : "Simpan Snapshot Sekarang"}</span>
                  </Button>
                </div>

                {/* Auto Snapshot */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Timer className="size-3.5 text-gray-500" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Auto-Snapshot</span>
                    </div>
                    <button
                      onClick={() => setAutoSnapshotEnabled(v => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${autoSnapshotEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                      aria-label="Toggle auto snapshot"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${autoSnapshotEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={autoSnapshotInputText}
                      onChange={(e) => setAutoSnapshotInputText(e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-800 text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-white focus:outline-none focus:border-gray-900"
                      placeholder="Menit"
                    />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">menit</span>
                    <Button
                      onClick={applyAutoSnapshotInterval}
                      size="sm"
                      className="rounded-lg text-xs h-9 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 cursor-pointer"
                    >
                      Terapkan
                    </Button>
                  </div>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-auto">
                    {autoSnapshotEnabled
                      ? <>Aktif — simpan tiap <b className="text-emerald-600 dark:text-emerald-400">{autoSnapshotInterval} menit</b>.</>
                      : <>Nonaktif. Aktifkan toggle untuk simpan otomatis.</>}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sisi Kanan: Status Widget & Debris Density Card */}
          <div className="space-y-6 w-full">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm overflow-hidden w-full">
              <div className={`p-5 sm:p-6 space-y-4 ${statusConfig.borderColor}`}>
                <div className="flex justify-between items-center gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Pemantauan</p>
                    <span className={`inline-block px-3 py-1 rounded-md text-sm font-bold tracking-tight mt-1 ${statusConfig.statusBadgeColor}`}>
                      {statusConfig.statusBadge}
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded font-bold tracking-wide shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    Live Feed
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-400">Validasi Sensor</span>
                  <div className="flex items-center gap-1.5">
                    {statusConfig.validationIcon}
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{statusConfig.validationText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Debris Density Index Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm overflow-hidden w-full">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-900 dark:bg-white rounded-full"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Debris Density Index</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${debrisDensity.densityLevel === 'High' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:border-red-900/40' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                    {debrisDensity.densityLevel}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-gray-400">Kepadatan Objek</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{debrisDensity.densityPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gray-900 dark:bg-white h-1.5 rounded-full" style={{ width: `${debrisDensity.densityPercentage}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400">Total Sampah</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{debrisDensity.totalObjects} Pcs</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] font-medium text-gray-400">Analisis Terakhir</span>
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{debrisDensity.lastAnalysis}</span>
                  </div>

                  <div className="mt-4 p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 border-amber-500/20 bg-amber-500/[0.04]">
                    <div className="flex items-center gap-2 border-b border-gray-200/20 pb-1.5 w-full">
                      <Lightbulb className="size-4 text-amber-500 fill-amber-500/20 shrink-0" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Recommendation</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold leading-relaxed">
                      {activeRecommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* === STATISTIK ARSIP SNAPSHOT — mengisi ruang kosong sidebar === */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                  <div className="w-1 h-4 bg-gray-900 dark:bg-white rounded-full"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Statistik Arsip Snapshot</span>
                </div>

                {snapshotStats ? (
                  <div className="space-y-4">
                    {/* Total snapshots — angka besar */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                        Total Snapshot Tersimpan
                      </p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {snapshotStats.total_snapshots.toLocaleString("id-ID")}
                        <span className="text-sm font-bold text-gray-400 ml-1.5">arsip</span>
                      </p>
                    </div>

                    {/* Penghematan kompresi */}
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">
                          Penghematan Kompresi
                        </span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                          {snapshotStats.saving_percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${Math.min(100, snapshotStats.saving_percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Detail ukuran */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                          Ukuran Asli
                        </p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {(snapshotStats.total_original_kb / 1024).toFixed(2)} <span className="text-[10px] text-gray-400">MB</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                          Tersimpan
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {(snapshotStats.total_compressed_kb / 1024).toFixed(2)} <span className="text-[10px] text-gray-400">MB</span>
                        </p>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed pt-2 border-t border-gray-100 dark:border-gray-800">
                      Snapshot dikompresi dengan format <strong>JPEG + Deflate</strong> sebelum disimpan ke basis data, mengoptimalkan kapasitas penyimpanan tanpa mengurangi keterbacaan visual.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Database className="size-8 mb-2 opacity-30" />
                    <p className="text-xs font-medium">Belum ada arsip snapshot</p>
                    <p className="text-[10px] mt-0.5">Klik "Simpan Snapshot Sekarang" untuk mulai mengarsipkan.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Kontrol Interval Recording dihapus —
                Counter di header sekarang ikut Auto-Snapshot di card di bawah feed CCTV. */}
          </div>
        </div>

        {/* Grafik Tren Akumulasi Kamera & Sensor */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800/60 shadow-sm bg-white dark:bg-gray-900 rounded-2xl w-full">
          <div className="px-4 py-4 sm:px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm">
                  <LineIcon className="size-4 sm:size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight tracking-tight">Analisis Tren Akumulasi Kamera & Sensor</h3>
                  <p className="text-xs text-gray-400 font-medium">Korelasi volume objek sampah (YOLO) dengan tinggi air sensor (12 Jam Berkala)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Calendar className="size-3.5 text-gray-400" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                  />
                </div>
                
                <Button onClick={handleRefreshLogs} variant="outline" size="sm" className="gap-1.5 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold cursor-pointer h-8 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-800 dark:text-gray-200" disabled={loadingLogs}>
                  <RefreshCw className={`size-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-1.5 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold cursor-pointer h-8 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-800 dark:text-gray-200" disabled={waterLogs.length === 0}>
                  <Download className="size-3" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 w-full">
            <div className="mb-3 flex justify-between items-center text-[11px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 px-1">
              <span>Histori Jam-demi-Jam Tanggal: <b>{new Date(selectedDate).toLocaleDateString("id-ID", { dateStyle: "long" })}</b></span>
              <span className="text-gray-900 dark:text-white font-extrabold tracking-wide text-[10px] uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Dual-Axis Chart</span>
            </div>
            
            <div className="w-full h-[280px] sm:h-[360px] chart-container overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" className="recharts-responsive-container">
                <AreaChart data={hourlyChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWaterCam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDebrisCam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" fontSize={10} tickLine={false} label={{ value: 'Tinggi Air (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={10} tickLine={false} label={{ value: 'Sampah (Pcs)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' } }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0' }} itemStyle={{ fontSize: '11px' }} labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="water" name="Tinggi Air (cm)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWaterCam)" />
                  <Area yAxisId="right" type="monotone" dataKey="objects" name="Sampah Terdeteksi (Pcs)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDebrisCam)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl flex items-start gap-2">
              <span className="text-gray-900 dark:text-white text-[10px] font-bold bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded mt-0.5 shrink-0">Info Dashboard</span>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium">
                Modul ini dikonfigurasi menggunakan Dual Line Area Chart. Perubahan opsi tanggal pada bilah filter akan memuat ulang data histori pencatatan lingkungan secara otomatis tanpa menginterupsi jalannya framework deteksi YOLO di latar belakang.
              </p>
            </div>
          </div>
        </Card>

        {/* === GALERI SNAPSHOT YANG TERSIMPAN DI DATABASE === */}
        <CameraSnapshotGallery key={snapshotRefreshTick} />
      </div>
    </Layout>
  );
}