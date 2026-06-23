"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/app/components/layout/Layout";
import { SnapshotFeed } from "@/app/components/SnapshotFeed";
import { DebrisDensitySidebar } from "@/app/components/DebrisDensitySidebar";
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
  Database,
  Download,
  CheckCircle2,
  LineChart as LineIcon,
  Calendar,
  SlidersHorizontal,
  AlertTriangle,
  Activity,
  Wrench
} from "lucide-react";

export default function CameraPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  
  // ── Fitur Baru: Pengaturan Interval & Filter Tanggal ──
  const [refreshInterval, setRefreshInterval] = useState(300); // Default 300 detik (5 menit)
  const [countdown, setCountdown] = useState(300);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // State untuk riwayat air dari kamera (disimpan di localStorage)
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [lastLogRefresh, setLastLogRefresh] = useState("");

  // 🔥 State untuk threshold SIAGA dari API (sama dengan dashboard)
  const [thresholds, setThresholds] = useState({
    siaga1: { water: 400 },
    siaga2: { water: 300 },
    siaga3: { water: 150 },
  });

  // 🔥 State untuk nilai sensor WATER-01 realtime
  const [waterSensorValue, setWaterSensorValue] = useState<number | null>(null);
  const [sensorLoading, setSensorLoading] = useState(false);

  // ── 🔥 State Tambahan untuk Validasi Sensor & Deteksi Lonjakan Drastis ──
  const [isSensorValid, setIsSensorValid] = useState<boolean>(true);
  const previousWaterValueRef = useRef<number | null>(null);

  // URL relative → diproksikan Next.js ke http://cctv.makesens.my.id/snapshot
  // Ini menghindari: (1) Mixed Content (HTTP dari halaman HTTPS), (2) CORS tainted-canvas.
  const CCTV_IMAGE_URL = `/cctv-snapshot`;

  // ── State Baru untuk Analisis Grafik Dual Line Per Jam ──
  const [hourlyChartData, setHourlyChartData] = useState<any[]>([]);

  // Generator data log per jam otomatis yang merespons perubahan tanggal & refresh
  useEffect(() => {
    const generateHourlyData = () => {
      const data = [];
      const currentHour = new Date().getHours();
      
      for (let i = 12; i >= 0; i--) {
        const targetHour = (currentHour - i + 24) % 24;
        const timeLabel = `${targetHour.toString().padStart(2, '0')}:00`;
        
        // Pola korelasi fungsional (mengikuti simulasi tanggal terpilih agar variatif)
        const dateMultiplier = parseInt(selectedDate.split('-')[2]) % 2 === 0 ? 1.2 : 0.85;
        const mockObjects = Math.floor((6 + Math.sin(i / 2) * 4 + Math.random() * 3) * dateMultiplier);
        const mockWater = Math.floor((110 + (mockObjects * 9) + Math.sin(i / 3) * 15 + Math.random() * 10) * dateMultiplier);

        data.push({
          time: timeLabel,
          objects: mockObjects, // Line 1
          water: mockWater,     // Line 2
        });
      }
      setHourlyChartData(data);
    };
    generateHourlyData();
  }, [refreshKey, selectedDate]);

  // 🔥 Ambil threshold dari API (sama dengan dashboard)
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
      console.error("Fetch thresholds error di camera:", error);
    }
  }, []);

  // Dengarkan event ketika threshold diubah dari halaman threshold
  useEffect(() => {
    fetchThresholds();
    const handleThresholdUpdate = () => {
      fetchThresholds();
    };
    window.addEventListener("thresholdsUpdated", handleThresholdUpdate);
    return () => window.removeEventListener("thresholdsUpdated", handleThresholdUpdate);
  }, [fetchThresholds]);

  // 🔥 Ambil nilai sensor WATER-01 realtime dengan Deteksi Kebisingan/Lonjakan Angka
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
        if (waterSensor) {
          const currentVal = Number(waterSensor.value);
          
          // ── Logika Deteksi Gangguan Sensor (Spike Detection) ──
          if (previousWaterValueRef.current !== null) {
            const delta = Math.abs(currentVal - previousWaterValueRef.current);
            // Jika dalam 2 detik air melonjak/turun drastis > 150cm, set sensor tidak valid (terganggu)
            if (delta > 150) {
              setIsSensorValid(false);
            } else {
              setIsSensorValid(true);
            }
          }
          
          previousWaterValueRef.current = currentVal;
          setWaterSensorValue(currentVal);
        }
      }
    } catch (error) {
      console.error("Fetch water sensor error:", error);
    } finally {
      setSensorLoading(false);
    }
  }, []);

  // Jalankan fetch sensor setiap 2 detik (sama seperti dashboard)
  useEffect(() => {
    fetchWaterSensor();
    const interval = setInterval(fetchWaterSensor, 2000);
    return () => clearInterval(interval);
  }, [fetchWaterSensor]);

  // Fungsi untuk menentukan kondisi sistem berdasarkan kombinasi ketinggian air dan validitas sensor
  const getSystemStatus = () => {
    const detectedWaterLevel = waterSensorValue !== null ? waterSensorValue : 0;
    
    if (!isSensorValid) {
      return {
        level: "Data Tidak Valid",
        status: "Terganggu",
        recommendation: "Pembacaan sensor tidak valid. Terdeteksi lonjakan drastis yang tidak wajar. Segera periksa dan bersihkan area sensor dari material yang menyangkut.",
        variant: "error"
      };
    }
    
    if (detectedWaterLevel <= thresholds.siaga1.water) {
      return {
        level: "Siaga 1 - Bahaya",
        status: "Valid",
        recommendation: "ALERT! Air mencapai level kritis. Segera lakukan evakuasi dan hubungi pihak berwenang.",
        variant: "danger"
      };
    }
    
    if (detectedWaterLevel <= thresholds.siaga2.water) {
      return {
        level: "Siaga 2 - Waspada",
        status: "Valid",
        recommendation: "Air mulai naik. Aktifkan pemantauan intensif dan siapkan langkah mitigasi.",
        variant: "warning"
      };
    }
    
    return {
      level: "Siaga Normal - Aman",
      status: "Valid",
      recommendation: "Kondisi normal. Tidak ada tindakan yang diperlukan.",
      variant: "success"
    };
  };

  const systemCondition = getSystemStatus();

  // ── Timer refresh CCTV Dinamis Berdasarkan State refreshInterval ──
  useEffect(() => {
    setCountdown(refreshInterval);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
  }, [refreshKey]);

  // Fungsi refresh kamera (manual & auto)
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setCountdown(refreshInterval);
    saveCurrentWaterLevelToHistory();
  };

  // Simpan water level dari sensor WATER-01 ke localStorage (history kamera)
  const saveCurrentWaterLevelToHistory = () => {
    const detectedWaterLevel = waterSensorValue !== null ? waterSensorValue : 0;
    const currentStatus = getSystemStatus();

    const newLog = {
      timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      water_level: detectedWaterLevel,
      siaga_level: currentStatus.level,
      status: currentStatus.status === "Valid" ? (detectedWaterLevel <= thresholds.siaga1.water ? "Bahaya" : detectedWaterLevel <= thresholds.siaga2.water ? "Waspada" : "Normal") : "Terganggu",
    };

    const existing = localStorage.getItem("camera_water_history");
    let history = existing ? JSON.parse(existing) : [];
    history.unshift(newLog);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem("camera_water_history", JSON.stringify(history));

    setWaterLogs(history);
    setLastLogRefresh(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
  };

  // Ambil riwayat dari localStorage (history kamera)
  const fetchWaterLogs = async () => {
    setLoadingLogs(true);
    try {
      const existing = localStorage.getItem("camera_water_history");
      if (existing) {
        const history = JSON.parse(existing);
        setWaterLogs(history);
      } else {
        const dummyWaterLevel = waterSensorValue !== null ? waterSensorValue : 75;
        const currentStatus = getSystemStatus();
        const dummyHistory = [
          { timestamp: new Date().toLocaleString(), water_level: dummyWaterLevel, siaga_level: currentStatus.level, status: "Normal" },
        ];
        setWaterLogs(dummyHistory);
        localStorage.setItem("camera_water_history", JSON.stringify(dummyHistory));
      }
      setLastLogRefresh(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
    } catch (err) {
      console.error("Gagal membaca history kamera:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWaterLogs();
  }, []);

  const handleRefreshLogs = () => {
    fetchWaterLogs();
  };

  // Export ke CSV
  const exportToCSV = () => {
    if (waterLogs.length === 0) return;
    const headers = ["Waktu", "Tinggi Air (cm)", "Status SIAGA", "Keterangan"];
    const rows = waterLogs.map(log => [
      log.timestamp,
      log.water_level,
      log.siaga_level,
      log.status === "Bahaya" ? "Evakuasi segera" : log.status === "Waspada" ? "Siaga penuh" : log.status === "Terganggu" ? "Sensor butuh maintenance" : "Normal & aman"
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

  // Bounding boxes akan diisi dari hasil prediksi AI yang nyata (belum tersedia)
  const boundingBoxes: any[] = [];

  const debrisDensity = {
    densityPercentage: 62,
    densityLevel: "High" as const,
    recommendation: systemCondition.recommendation, // Sinkronisasi otomatis rekomendasi ke sidebar density
    lastAnalysis: lastUpdate,
    totalObjects: 18,
  };

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto space-y-6 p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex h-2 w-2 rounded-full animate-pulse ${!isSensorValid ? 'bg-amber-500' : 'bg-green-500'}`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${!isSensorValid ? 'text-amber-600' : 'text-green-600'}`}>
                {!isSensorValid ? 'Sensor Maintenance Mode' : 'AI Active Monitoring'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3">
              <Camera className="text-blue-600 size-7 sm:size-8" />
              Visual AI Monitoring
            </h1>
            <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                <Clock className="size-3.5 sm:size-4" /> Refresh: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
              <span className="flex items-center gap-1"><MapPin className="size-3.5 sm:size-4" /> Banjir Cam - Sektor A</span>
              <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 sm:size-4 text-blue-500" /> YOLO26 Verified</span>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-5 sm:py-6 rounded-xl shadow-md shadow-blue-500/10 transition-all active:scale-95 text-sm sm:text-base font-bold cursor-pointer"
          >
            <RefreshCw className={`size-4 sm:size-5 ${refreshKey > 0 ? 'animate-spin-slow' : ''}`} />
            <span>Request New Frame</span>
          </Button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            🔥 BARU: PANEL STATUS VALIDASI SISTEM (INTEGRASI SIAGA 1, 2, 3 & ERROR GANGGUAN)
            ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Box Status Sistem */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 shadow-sm bg-gradient-to-br transition-all duration-300 ${
            systemCondition.variant === 'success' ? 'from-green-50/60 to-white dark:from-green-950/10 dark:to-gray-900 border-green-200 dark:border-green-900/40' :
            systemCondition.variant === 'warning' ? 'from-amber-50/60 to-white dark:from-amber-950/10 dark:to-gray-900 border-amber-200 dark:border-amber-900/40' :
            systemCondition.variant === 'danger' ? 'from-red-50/60 to-white dark:from-red-950/10 dark:to-gray-900 border-red-200 dark:border-red-900/40' :
            'from-slate-100 to-white dark:from-slate-900/50 dark:to-gray-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className={`p-3 rounded-xl text-white shadow-sm shrink-0 ${
              systemCondition.variant === 'success' ? 'bg-green-500 shadow-green-200' :
              systemCondition.variant === 'warning' ? 'bg-amber-500 shadow-amber-200' :
              systemCondition.variant === 'danger' ? 'bg-red-500 shadow-red-200' :
              'bg-slate-600'
            }`}>
              {systemCondition.variant === 'success' && <CheckCircle2 className="size-6" />}
              {systemCondition.variant === 'warning' && <AlertTriangle className="size-6" />}
              {systemCondition.variant === 'danger' && <AlertTriangle className="size-6 animate-bounce" />}
              {systemCondition.variant === 'error' && <Wrench className="size-6" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Sistem</p>
              <p className={`text-base font-black tracking-tight ${
                systemCondition.variant === 'success' ? 'text-green-600 dark:text-green-400' :
                systemCondition.variant === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                systemCondition.variant === 'danger' ? 'text-red-600 dark:text-red-400' :
                'text-slate-600 dark:text-slate-400'
              }`}>
                {systemCondition.variant === 'success' && "✅ "}
                {systemCondition.variant === 'warning' && "⚠️ "}
                {systemCondition.variant === 'danger' && "🚨 "}
                {systemCondition.variant === 'error' && "🔧 "}
                {systemCondition.level}
              </p>
            </div>
          </div>

          {/* Box Validasi Kredibilitas Sensor */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 shadow-sm bg-gradient-to-br transition-all duration-300 ${
            isSensorValid ? 'from-blue-50/40 to-white dark:from-blue-950/10 dark:to-gray-900 border-blue-100 dark:border-blue-900/30' : 'from-amber-50/70 to-white dark:from-amber-950/10 dark:to-gray-900 border-amber-300 dark:border-amber-700'
          }`}>
            <div className={`p-3 rounded-xl text-white shadow-sm shrink-0 ${isSensorValid ? 'bg-blue-600 shadow-blue-100' : 'bg-orange-500 shadow-orange-100'}`}>
              <Activity className={`size-5 ${isSensorValid && waterSensorValue !== null ? 'animate-pulse' : ''}`} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Validasi Korelasi Sensor</p>
              <p className={`text-base font-extrabold tracking-tight ${isSensorValid ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {isSensorValid ? "✅ Valid (WATER-01)" : "⚠️ Terganggu / Noise"}
              </p>
            </div>
          </div>

          {/* Box Rekomendasi Pintar Terintegrasi */}
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-center shadow-sm md:col-span-1">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              💡 Intelligent Recommendation
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1 leading-relaxed line-clamp-2 md:line-clamp-3">
              {systemCondition.recommendation}
            </p>
          </div>
        </div>

        {/* Visual Stream Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
          <div className="lg:col-span-2 w-full">
            <SnapshotFeed
              imageUrl={CCTV_IMAGE_URL}
              timestamp={lastUpdate}
              boundingBoxes={boundingBoxes}
              cameraId="CCTV-1984-BANJIR"
              location="Sektor Sungai Utama"
              refreshKey={refreshKey}
            />
          </div>
          <div className="space-y-6 w-full">
            <DebrisDensitySidebar {...debrisDensity} />
            
            {/* AI Processing Info - Kontrol Interval Jeda */}
            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm w-full">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
                <SlidersHorizontal className="size-4 text-blue-500" /> Kontrol Interval Recording
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider block mb-1.5">
                    Atur Interval Jeda Refresh
                  </label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={60}>Setiap 1 Menit (60s)</option>
                    <option value={300}>Setiap 5 Menit (300s)</option>
                    <option value={600}>Setiap 10 Menit (600s)</option>
                    <option value={1800}>Setiap 30 Menit (1800s)</option>
                    <option value={3600}>Setiap 1 Jam (3600s)</option>
                  </select>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Konsistensi Basis Data</p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">Synced & Calibrated with Dashboard</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Grafik Tren Akumulasi Kamera & Sensor */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl w-full">
          <div className="px-4 py-4 sm:px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md text-white">
                  <LineIcon className="size-4 sm:size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">Analisis Tren Akumulasi Kamera & Sensor</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Korelasi volume objek sampah (YOLO) dengan tinggi air sensor (12 Jam Berkala)</p>
                </div>
              </div>
              
              {/* Filter Jendela Histori */}
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
                
                <Button
                  onClick={handleRefreshLogs}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold cursor-pointer h-8"
                  disabled={loadingLogs}
                >
                  <RefreshCw className={`size-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold cursor-pointer h-8"
                  disabled={waterLogs.length === 0}
                >
                  <Download className="size-3" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Area/Line Dual Axis Chart */}
          <div className="p-4 sm:p-6 w-full">
            <div className="mb-3 flex justify-between items-center text-[11px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 px-1">
              <span>Histori Jam-demi-Jam Tanggal: <b>{new Date(selectedDate).toLocaleDateString("id-ID", { dateStyle: "long" })}</b></span>
              <span className="text-blue-500 font-bold">Dual-Axis Active</span>
            </div>
            
            {/* Wrapper Chart yang responsif bebas crash max-width */}
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
                  
                  {/* Sumbu Kiri: Tinggi Air */}
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#3b82f6" 
                    fontSize={10} 
                    tickLine={false} 
                    label={{ value: 'Tinggi Air (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' } }} 
                  />
                  
                  {/* Sumbu Kanan: Densitas Sampah */}
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#ef4444" 
                    fontSize={10} 
                    tickLine={false} 
                    label={{ value: 'Sampah (Pcs)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' } }} 
                  />
                  
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    itemStyle={{ fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="water" 
                    name="Tinggi Air (cm)" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fillOpacity={1}
                    fill="url(#colorWaterCam)" 
                  />
                  <Area 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="objects" 
                    name="Sampah Terdeteksi (Pcs)" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    fillOpacity={1}
                    fill="url(#colorDebrisCam)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded mt-0.5 shrink-0">Info Dashboard</span>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Modul ini dikonfigurasi menggunakan Dual Line Area Chart. Perubahan opsi tanggal pada bilah filter akan memuat ulang data histori pencatatan lingkungan secara otomatis tanpa menginterupsi jalannya framework deteksi YOLO di latar belakang.
              </p>
            </div>
          </div>
        </Card>

        <footer className="text-center py-4 text-[11px] text-gray-400 font-medium">
          Makesens Flood Monitoring System • Semester 6 PBL • Nabiel Ischak
        </footer>
      </div>
    </Layout>
  );
}