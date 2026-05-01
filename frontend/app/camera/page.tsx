"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/app/components/layout/Layout";
import { SnapshotFeed } from "@/app/components/SnapshotFeed";
import { DebrisDensitySidebar } from "@/app/components/DebrisDensitySidebar";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  RefreshCw, 
  Camera, 
  MapPin, 
  Clock, 
  ShieldCheck,
  Database,
  Download,
  CheckCircle2
} from "lucide-react";

export default function CameraPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [countdown, setCountdown] = useState(300);

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

  const CCTV_IMAGE_URL = `http://108.136.240.250:1984/api/frame.jpeg?src=banjir_cam&t=${refreshKey}`;

  // 🔥 Ambil threshold dari API (sama dengan dashboard)
  const fetchThresholds = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"}/api/thresholds?type=siaga`, {
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

  // 🔥 Ambil nilai sensor WATER-01 realtime (sama seperti dashboard)
  const fetchWaterSensor = useCallback(async () => {
    try {
      setSensorLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"}/api/sensors/latest`, {
        cache: "no-store",
        headers: { apikey: "pikel2" },
      });
      if (res.ok) {
        const data = await res.json();
        const waterSensor = data.find((s: any) => s.type === "water");
        if (waterSensor) {
          setWaterSensorValue(Number(waterSensor.value));
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

  // Fungsi untuk menentukan SIAGA level berdasarkan water level (pakai threshold terbaru)
  const getSiagaLevelFromThreshold = (waterLevel: number) => {
    if (waterLevel >= thresholds.siaga1.water) return { level: "SIAGA 1", status: "Bahaya" };
    if (waterLevel >= thresholds.siaga2.water) return { level: "SIAGA 2", status: "Waspada" };
    return { level: "SIAGA 3", status: "Normal" };
  };

  // --- Timer refresh CCTV (5 menit) ---
  useEffect(() => {
    const lastRefresh = localStorage.getItem("last_cctv_refresh_camera");
    const now = Date.now();

    if (lastRefresh) {
      const diffInSeconds = Math.floor((now - parseInt(lastRefresh)) / 1000);
      if (diffInSeconds >= 300) {
        handleRefresh();
      } else {
        setCountdown(300 - diffInSeconds);
      }
    } else {
      localStorage.setItem("last_cctv_refresh_camera", now.toString());
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }));
  }, [refreshKey]);

  // Fungsi refresh kamera (manual & auto)
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    localStorage.setItem("last_cctv_refresh_camera", Date.now().toString());
    setCountdown(300);
    // Simpan water level dari sensor ke history
    saveCurrentWaterLevelToHistory();
  };

  // Simpan water level dari sensor WATER-01 ke localStorage (history kamera)
  const saveCurrentWaterLevelToHistory = () => {
    // Gunakan nilai sensor WATER-01 yang terbaru
    const detectedWaterLevel = waterSensorValue !== null ? waterSensorValue : 0;
    
    // Tentukan SIAGA level berdasarkan threshold yang sudah di-fetch
    const { level: siagaLevel, status: statusText } = getSiagaLevelFromThreshold(detectedWaterLevel);

    const newLog = {
      timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      water_level: detectedWaterLevel,
      siaga_level: siagaLevel,
      status: statusText,
    };

    // Ambil history lama dari localStorage
    const existing = localStorage.getItem("camera_water_history");
    let history = existing ? JSON.parse(existing) : [];
    // Tambahkan di awal (terbaru di atas)
    history.unshift(newLog);
    // Batasi maksimal 50 data
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem("camera_water_history", JSON.stringify(history));
    
    // Update state tabel
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
        // Data dummy awal jika belum ada history
        const dummyWaterLevel = waterSensorValue !== null ? waterSensorValue : 75;
        const { level: siagaLevel, status: statusText } = getSiagaLevelFromThreshold(dummyWaterLevel);
        const dummyHistory = [
          { timestamp: new Date().toLocaleString(), water_level: dummyWaterLevel, siaga_level: siagaLevel, status: statusText },
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

  // Auto refresh history setiap 5 menit (sama dengan refresh kamera)
  useEffect(() => {
    fetchWaterLogs();
    const interval = setInterval(fetchWaterLogs, 300000);
    return () => clearInterval(interval);
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

  // Data bounding box (tetap)
  const boundingBoxes = [
    { label: "Plastic Waste", confidence: 96, x: 25, y: 50, width: 10, height: 15, color: "#ef4444" },
    { label: "Wood/Debris", confidence: 84, x: 60, y: 70, width: 20, height: 12, color: "#f97316" },
    { label: "Styrofoam", confidence: 91, x: 10, y: 30, width: 15, height: 10, color: "#ef4444" },
  ];

  const debrisDensity = {
    densityPercentage: 62,
    densityLevel: "High" as const,
    recommendation: "ALERTA! Terjadi penumpukan material di hilir. Segera lakukan pembersihan manual.",
    lastAnalysis: lastUpdate,
    totalObjects: 18,
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header Section - unchanged */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">AI Active Monitoring</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Camera className="text-blue-600 size-8" />
              Visual AI Monitoring
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                <Clock className="size-4" /> Next Refresh: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
              <span className="flex items-center gap-1"><MapPin className="size-4" /> Banjir Cam - Sektor A</span>
              <span className="flex items-center gap-1"><ShieldCheck className="size-4 text-blue-500" /> YOLO26 Verified</span>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <RefreshCw className={`size-5 ${refreshKey > 0 ? 'animate-spin-slow' : ''}`} />
            <span className="font-bold text-base">Request New Frame</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SnapshotFeed
              imageUrl={CCTV_IMAGE_URL}
              timestamp={lastUpdate}
              boundingBoxes={boundingBoxes}
              waterLevel={75}
              cameraId="CCTV-1984-BANJIR"
              location="Sektor Sungai Utama"
              refreshKey={refreshKey}
            />
          </div>
          <div className="space-y-6">
            <DebrisDensitySidebar {...debrisDensity} />
            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">AI Processing Info</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Auto-Refresh Interval</p>
                  <p className="text-sm font-semibold">Every 5 Minutes (300s)</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Data Consistency</p>
                  <p className="text-sm font-semibold">Synced with Dashboard</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabel Riwayat Air dari Kamera (threshold sinkron dengan dashboard, data dari sensor WATER-01) */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                  <Database className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Riwayat Tinggi Air (Deteksi Kamera)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Data history dari sensor WATER-01 – threshold sinkron dengan dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lastLogRefresh && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="size-3.5 flex-shrink-0" />
                    <span>Terakhir: {lastLogRefresh}</span>
                  </div>
                )}
                <Button
                  onClick={handleRefreshLogs}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-gray-300 dark:border-gray-700"
                  disabled={loadingLogs}
                >
                  <RefreshCw className={`size-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-gray-300 dark:border-gray-700"
                  disabled={waterLogs.length === 0}
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Waktu</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Tinggi Air (cm)</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Status SIAGA</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs && waterLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        Memuat data history kamera...
                      </div>
                    </td>
                  </tr>
                ) : waterLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      Belum ada data history dari kamera. Refresh kamera untuk menyimpan data pertama.
                    </td>
                  </tr>
                ) : (
                  waterLogs.map((log, idx) => {
                    let badgeClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                    let siagaText = log.siaga_level || "SIAGA 3";
                    if (siagaText.includes("1")) badgeClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                    else if (siagaText.includes("2")) badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                    
                    let statusText = "✅ Normal & aman";
                    if (log.status === "Bahaya") statusText = "⚠️ Evakuasi segera";
                    else if (log.status === "Waspada") statusText = "⚡ Siaga penuh";
                    
                    return (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs">{log.timestamp}</td>
                        <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">
                          {log.water_level} cm
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                            {siagaText}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{statusText}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loadingLogs && waterLogs.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 text-right">
              Menampilkan {waterLogs.length} riwayat dari kamera
            </div>
          )}
        </Card>

        <footer className="text-center py-4 text-xs text-gray-400 font-medium">
          Makesens Flood Monitoring System • Semester 6 PBL • Nabiel Ischak
        </footer>
      </div>
    </Layout>
  );
}