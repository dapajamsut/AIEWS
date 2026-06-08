"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Wind, Droplets, Gauge, Thermometer, Activity, Clock, RefreshCw, Camera, ArrowRight, Database, Download, FileText, CheckCircle2, AlertTriangle, Droplet, Info } from "lucide-react";
import mqtt from "mqtt";
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
      <div className="h-[300px] md:h-[400px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-400 font-medium">Loading Interactive Map...</p>
      </div>
    ),
  }
);

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState("");
  // Interval CCTV refresh disinkron dengan Auto-Snapshot di /camera (input bebas + Terapkan).
  // Default 5 menit jika belum pernah di-set.
  const [refreshInterval, setRefreshInterval] = useState(300); // detik
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [countdown, setCountdown] = useState(300);

  const CCTV_IMAGE_URL = `http://cctv.makesens.my.id/snapshot?t=${refreshKey}`;

  // --- LOGIC TIMER (sinkron dengan Auto-Snapshot di camera page) ---
  // Camera page menyimpan ke localStorage:
  //   auto_snapshot_interval (menit, dari input bebas + Terapkan)
  //   auto_snapshot_enabled  ("true"/"false")
  // dan dispatch event "autoSnapshotIntervalUpdated".
  useEffect(() => {
    const readSettings = () => {
      const saved = parseInt(localStorage.getItem("auto_snapshot_interval") || "");
      if (saved && saved > 0) setRefreshInterval(saved * 60); // menit → detik
      const enabled = localStorage.getItem("auto_snapshot_enabled") === "true";
      setAutoEnabled(enabled);
    };
    readSettings();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auto_snapshot_interval" || e.key === "auto_snapshot_enabled") {
        readSettings();
      }
    };
    const onCustom = (e: any) => {
      const d = e?.detail;
      if (!d) return;
      if (typeof d.interval === "number" && d.interval > 0) setRefreshInterval(d.interval * 60);
      if (typeof d.enabled === "boolean") setAutoEnabled(d.enabled);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("autoSnapshotIntervalUpdated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("autoSnapshotIntervalUpdated", onCustom as EventListener);
    };
  }, []);

  // Setiap kali refreshInterval / autoEnabled berubah → reset countdown.
  // Auto-refresh frame hanya jalan saat autoEnabled = true.
  useEffect(() => {
    setCountdown(refreshInterval);

    if (!autoEnabled) {
      // Toggle off → tidak ada auto-refresh, countdown beku di interval penuh.
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshKey((k) => k + 1);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, autoEnabled]);

  // Klik tombol manual: hanya reload frame; tidak reset timer.
  const handleRefreshSnapshot = () => {
    setRefreshKey((prev) => prev + 1);
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

  // Physics params for local Siaga computation
  const [physicsParams, setPhysicsParams] = useState({
    w: 15, S: 0.001, n: 0.035, A_DAS: 10000000, C: 0.75, L_segment: 1000,
  });


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


  // 🔥 FETCH DATA AWAL DAN SET MQTT WEBSOCKET
  useEffect(() => {
    // 1. Initial Fetch dari DB Laravel (Supaya tidak blank di detik pertama)
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/sensors/latest`, {
          cache: "no-store",
          headers: {
            apikey: "pikel2"
          }
        });
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
        const data = await res.json();

        const mapped = data.map((s: any) => ({
          id: s.sensor_code,
          name: s.sensor_code,
          location: getSensorName(s.type),
          value: Number(s.value),
          unit: s.unit,
          status: s.status === "WARNING" ? "warning" : "normal",
          trend: "steady",
          type: s.type
        }));

        const order = ["ANEMO-01", "TIP-01", "WATER-01", "BME-TEMP", "BME-HUM", "BME-PRES"];
        mapped.sort((a: any, b: any) => order.indexOf(a.id) - order.indexOf(b.id));

        const filtered = mapped.filter((s: any) => s.id !== "SENSOR_001");
        setSensors(filtered);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();

    // 2. Hubungkan ke MQTT Broker via protokol WebSocket (ws:// atau wss://)
    const clientId = `makesens_web_${Math.random().toString(16).slice(3)}`;

    // URL broker websocket dibuat configurable lewat env.
    // - Production (https://makesens.my.id) HARUS pakai wss:// (mis. wss://makesens.my.id/mqtt)
    // - Dev lokal jatuh ke ws://localhost:9001
    const MQTT_WS_URL = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9001';
    const client = mqtt.connect(MQTT_WS_URL, {
      clientId: clientId,
      clean: true,
    });

    client.on('connect', () => {
      console.log('✅ [Dashboard] Terhubung ke MQTT Broker via WebSockets. Client ID:', clientId);
      client.subscribe('makesens/test/tmj', (err) => {
        if (!err) {
          console.log('📡 [Dashboard] Berhasil Subscribe ke: makesens/test/tmj');
        } else {
          console.error('❌ [Dashboard] Gagal Subscribe:', err);
        }
      });
      client.subscribe('makesens/test/tmj/siaga', (err) => {
        if (!err) console.log('📡 [Dashboard] Berhasil Subscribe ke: makesens/test/tmj/siaga');
      });
    });

    client.on('error', (err) => {
      console.error('❌ [Dashboard] MQTT Connection Error:', err);
    });

    client.on('message', (topic, message) => {
      if (topic === 'makesens/test/tmj') {
        try {
          console.log('📥 [Dashboard] MQTT Message Masuk:', message.toString());
          const payload = JSON.parse(message.toString());

          // Memperbarui state sensor di React (Real-Time)
          setSensors(prevSensors => {
            const newSensors = [...prevSensors];
            let changed = false;

            payload.forEach((incoming: any) => {
              if (incoming.sensor_code === "SENSOR_001") return;

              const idx = newSensors.findIndex(s => s.id === incoming.sensor_code);

              const prevValue = idx >= 0 ? newSensors[idx].value : null;
              let currentTrend = "steady";

              if (prevValue !== null) {
                if (Number(incoming.value) > prevValue) {
                  currentTrend = "rising";
                } else if (Number(incoming.value) < prevValue) {
                  currentTrend = "falling";
                }
              }

              // Simplifikasi status (Sesuai dengan logika original frontend atau backend default)
              // Menghapus penggunaan getTarget disini karena getTarget dihapus. Asumsi status diberikan oleh backend jika ada,
              // atau diset default jika tidak disediakan logika yang spesifik disini tanpa getTarget.
              // Jika Anda memerlukan kembali logika peringatan/status, Anda perlu menyediakannya dengan cara yang berbeda.
              // Untuk saat ini, kita bisa menggunakan status dari state lama atau default ke "normal".
              const status = "normal"; // Placeholder since target is removed

              const newData = {
                id: incoming.sensor_code,
                name: incoming.sensor_code,
                location: getSensorName(incoming.type),
                value: Number(incoming.value),
                unit: incoming.unit,
                status: status,
                trend: currentTrend,
                type: incoming.type
              };

              if (idx >= 0) {
                newSensors[idx] = newData;
              } else {
                newSensors.push(newData);
              }
              changed = true;
            });

            if (changed) {
              const order = ["ANEMO-01", "TIP-01", "WATER-01", "BME-TEMP", "BME-HUM", "BME-PRES"];
              newSensors.sort((a: any, b: any) => order.indexOf(a.id) - order.indexOf(b.id));
              console.log('🔄 [Dashboard] State Sensor Berhasil Diperbarui dari MQTT');
              return newSensors;
            }
            return prevSensors;
          });
        } catch (e) {
          console.error("❌ [Dashboard] MQTT Payload Error", e);
        }
      } else if (topic === 'makesens/test/tmj/siaga') {
        const level = Number(message.toString());
        if ([1, 2, 3].includes(level)) {
          setSiagaLevel(level as 1 | 2 | 3);
        }
      }
    });

    return () => {
      console.log('⚠️ [Dashboard] Memutus MQTT Connection');
      client.end(true); // force close di React unmout (strict mode)
    };
  }, []);

  // 🔥 FETCH THRESHOLD DARI SERVER
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds?type=siaga`, {
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

    // Fetch physics params
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds?type=physics`, { cache: "no-store", headers: { apikey: "pikel2" } })
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p) setPhysicsParams({
          w: Number(p.w ?? 15),
          S: Number(p.s ?? 0.001),
          n: Number(p.n ?? 0.035),
          A_DAS: Number(p.a_das ?? 10000000),
          C: Number(p.c ?? 0.75),
          L_segment: Number(p.l_segment ?? 1000),
        });
      })
      .catch(() => { });

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
    const loadRegion = () => {
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
    };

    loadRegion();

    // Re-sync ketika user ubah region di tab lain (storage event lintas tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'selectedRegionData') loadRegion();
    };
    // Re-sync ketika di tab yang sama (custom event yang kita pancarkan dari threshold page)
    const onCustom = () => loadRegion();
    // Re-sync ketika kembali ke tab Dashboard setelah ubah region di tab lain
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRegion();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('regionUpdated', onCustom);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('regionUpdated', onCustom);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // 🔥 FETCH WEATHER DATA FROM LARAVEL API
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const lat = activeRegionData.lat || -6.1744;
        const lon = activeRegionData.lon || 106.8229;
        const regionId = activeRegionData.id || selectedRegion;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/weather?region=${regionId}&lat=${lat}&lon=${lon}`, {
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/logs/settings`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/logs/settings`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/logs/save-now`, {
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
  // Ini memastikan data masuk ke riwayat log sesuai interval yang set,
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
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/weather-cache`, {
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


  // --- LOCAL PREDICTIVE SIAGA CALCULATION ---
  // This runs locally in the browser from real-time sensor data.
  // It is the primary source of truth, ensuring the UI always reacts
  // even if the backend mqtt:listen process is not running or was not restarted.
  useEffect(() => {
    const waterSensor = sensors.find((s: any) => s.type === 'water');
    const rainSensor = sensors.find((s: any) => s.type === 'rain');
    if (!waterSensor) return;

    const h_cm = Number(waterSensor.value || 0);
    const h = h_cm / 100;
    const I = Number(rainSensor?.value || 0);
    const siaga1_m = thresholds.siaga1.water / 100;
    const sisa_tinggi = siaga1_m - h;

    if (h_cm >= thresholds.siaga1.water) {
      setSiagaLevel(1);
      return;
    }

    const qHujan = physicsParams.C * (I / 3600000) * physicsParams.A_DAS;

    if (qHujan > 0) {
      const volume_sisa = sisa_tinggi * physicsParams.w * physicsParams.L_segment;
      const etaHours = volume_sisa / qHujan / 3600;
      const isExtreme = I >= 100 && etaHours < 3;

      if (etaHours <= 2 || isExtreme) {
        setSiagaLevel(1);
      } else if (etaHours <= 4) {
        setSiagaLevel(2);
      } else if (etaHours <= 8) {
        setSiagaLevel(3);
      } else {
        setSiagaLevel(3);
      }
    } else {
      // No rain: check raw water level as fallback
      if (h_cm >= thresholds.siaga2.water) {
        setSiagaLevel(2);
      } else {
        setSiagaLevel(3);
      }
    }
  }, [sensors, thresholds, physicsParams]);

  // Siaga now fully managed by local computation above
  useEffect(() => { }, [sensors, thresholds]);

  // Lokasi sensor pada peta — dibangun dari region yang dipilih di halaman Threshold.
  // Status tiap titik mengikuti siagaLevel global (1 → alert, 2 → warning, 3 → normal).
  const sensorLocations = useMemo(() => {
    const lat = Number(activeRegionData?.lat ?? activeRegionData?.latitude ?? -6.1744);
    const lng = Number(activeRegionData?.lon ?? activeRegionData?.longitude ?? 106.8229);
    const regionName: string =
      activeRegionData?.name ?? "Lokasi Sensor";

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const status: "alert" | "warning" | "normal" =
      siagaLevel === 1 ? "alert" : siagaLevel === 2 ? "warning" : "normal";

    // Cari nilai water + waktu update sebagai info pendamping di popup.
    const waterSensor = sensors.find((s) => s.type === "water");
    const lastUpdateLabel = waterSensor?.value !== undefined
      ? `${Number(waterSensor.value).toFixed(1)} ${waterSensor.unit ?? "cm"}`
      : undefined;

    return [
      {
        id: "WATER-01",
        name: "Sensor Tinggi Air",
        lat,
        lng,
        status,
        region: regionName,
        value: lastUpdateLabel,
        lastUpdate: "Real-time",
      },
    ];
  }, [activeRegionData, siagaLevel, sensors]);

  const MemoizedMap = useMemo(
    () => <MapWidget sensors={sensorLocations} />,
    [sensorLocations]
  );

  const notifications: any[] = [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 overflow-x-hidden">
       {/* Header Card - RESPONSIVE GRIDS FOR MOBILE COMPATIBILITY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Main Watershed Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring and AI-powered flood detection system
          </p>
        </div>
        <div className="flex flex-col gap-1 items-start sm:items-end w-full sm:max-w-sm text-left sm:text-right">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">Region terpilih:</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {regions.find((region) => region.id === selectedRegion)?.name || 'Jakarta Pusat'}
          </p>
        </div>
      </div>

      {/* Improved Threshold Summary - COLLAPSING GRID ON MOBILE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <AlertTriangle className="size-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ambang Batas SIAGA (Tinggi Air)</h3>
            <div className="group relative ml-auto">
              <Info className="size-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              <div className="absolute right-0 top-6 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                Level kewaspadaan berdasarkan tinggi air (cm)
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:grid-cols-1 lg:grid-cols-3">
            {/* SIAGA 1 - Critical / Red */}
            <div className={`relative group transition-all duration-300 ${siagaLevel === 1 ? 'scale-[1.02] z-10' : 'opacity-60 grayscale-[30%]'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-2xl ${siagaLevel === 1 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}></div>
              <div className={`relative bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-900 rounded-2xl border ${siagaLevel === 1 ? 'border-red-500 shadow-lg shadow-red-500/20 ring-2 ring-red-500/50 ring-offset-2 dark:ring-offset-gray-900' : 'border-red-200 dark:border-red-800/50 shadow-sm'} p-4 sm:p-5 transition-all duration-300 min-h-[140px] flex flex-col justify-between`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 text-center">
                    <p className={`text-base sm:text-xl font-extrabold ${siagaLevel === 1 ? 'text-red-600 dark:text-red-400' : 'text-red-500/70'} uppercase tracking-wider flex items-center justify-center gap-1.5`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full bg-red-500 ${siagaLevel === 1 ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}`}></span>
                      SIAGA 1 {siagaLevel === 1 && '(AKTIF)'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 ${siagaLevel === 1 ? 'bg-red-500 text-white shadow-md' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    <AlertTriangle className="size-5" />
                  </div>
                </div>
                <div className={`mt-4 pt-3 border-t w-full ${siagaLevel === 1 ? 'border-red-200 dark:border-red-800' : 'border-red-100 dark:border-red-900/30'}`}>
                  <p className={`text-xs font-medium flex items-center justify-center gap-1 ${siagaLevel === 1 ? 'text-red-700 dark:text-red-300' : 'text-red-600/70'}`}>
                    <AlertTriangle className="size-3" />
                    Banjir sudah meluap, evakuasi segera
                  </p>
                </div>
              </div>
            </div>

            {/* SIAGA 2 - Warning / Yellow/Orange */}
            <div className={`relative group transition-all duration-300 ${siagaLevel === 2 ? 'scale-[1.02] z-10' : 'opacity-60 grayscale-[30%]'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl ${siagaLevel === 2 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}></div>
              <div className={`relative bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900 rounded-2xl border ${siagaLevel === 2 ? 'border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/50 ring-offset-2 dark:ring-offset-gray-900' : 'border-amber-200 dark:border-amber-800/50 shadow-sm'} p-4 sm:p-5 transition-all duration-300 min-h-[140px] flex flex-col justify-between`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 text-center">
                    <p className={`text-base sm:text-xl font-extrabold ${siagaLevel === 2 ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500/70'} uppercase tracking-wider flex items-center justify-center gap-1.5`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ${siagaLevel === 2 ? 'animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''}`}></span>
                      SIAGA 2 {siagaLevel === 2 && '(AKTIF)'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 ${siagaLevel === 2 ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                    <AlertTriangle className="size-5" />
                  </div>
                </div>
                <div className={`mt-4 pt-3 border-t w-full ${siagaLevel === 2 ? 'border-amber-200 dark:border-amber-800' : 'border-amber-100 dark:border-amber-900/30'}`}>
                  <p className={`text-xs font-medium flex items-center justify-center gap-1 ${siagaLevel === 2 ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600/70'}`}>
                    <AlertTriangle className="size-3" />
                    Air naik cepat, siaga penuh
                  </p>
                </div>
              </div>
            </div>

            {/* SIAGA 3 - Normal / Green */}
            <div className={`relative group transition-all duration-300 ${siagaLevel === 3 ? 'scale-[1.02] z-10' : 'opacity-60 grayscale-[30%]'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl ${siagaLevel === 3 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}></div>
              <div className={`relative bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 rounded-2xl border ${siagaLevel === 3 ? 'border-green-500 shadow-lg shadow-green-500/20 ring-2 ring-green-500/50 ring-offset-2 dark:ring-offset-gray-900' : 'border-green-200 dark:border-green-800/50 shadow-sm'} p-4 sm:p-5 transition-all duration-300 min-h-[140px] flex flex-col justify-between`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 text-center">
                    <p className={`text-base sm:text-xl font-extrabold ${siagaLevel === 3 ? 'text-green-600 dark:text-green-400' : 'text-green-500/70'} uppercase tracking-wider flex items-center justify-center gap-1.5`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full bg-green-500 ${siagaLevel === 3 ? 'animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''}`}></span>
                      SIAGA 3 {siagaLevel === 3 && '(AKTIF)'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 ${siagaLevel === 3 ? 'bg-green-500 text-white shadow-md' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                    <Droplet className="size-5" />
                  </div>
                </div>
                <div className={`mt-4 pt-3 border-t w-full ${siagaLevel === 3 ? 'border-green-200 dark:border-green-800' : 'border-green-100 dark:border-green-900/30'}`}>
                  <p className={`text-xs font-medium flex items-center justify-center gap-1 ${siagaLevel === 3 ? 'text-green-700 dark:text-green-300' : 'text-green-600/70'}`}>
                    <CheckCircle2 className="size-3" />
                    Kondisi aman, pantau berkala
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Progress indicator - visual bar showing current water level relative to thresholds */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>Ketinggian Fisik Air Saat Ini <span className="text-[10px] text-gray-400 italic">(Bukan Status Prediksi AI)</span></span>
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
            <div className="flex flex-wrap justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500 gap-1">
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Real-time Sensor Data</h2>
          <Link
            href="/sensors"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors text-sm"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              {...sensor}
              icon={getIcon(sensor.type)}
            />
          ))}
        </div>
      </div>

      {/* Weather & Camera Row - RESPONSIVE STRETCHED HEIGHT CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {(() => {
          const apiTemp = currentWeather?.temp;
          const tempSensor = sensors.find((s) => s.type === "temp");
          const temperature = apiTemp !== undefined ? apiTemp : (tempSensor?.value || 25);

          return (
            <div className="min-h-[300px] sm:min-h-[340px] md:h-[340px] flex flex-col [&>div]:h-full [&>div]:flex-1">
              <WeatherWidget
                temperature={temperature}
                weatherCondition={weatherCondition}
                updateTime="real-time"
                weatherDescription={currentWeather?.weather_description}
                weatherMain={currentWeather?.weather_main}
                feelsLike={currentWeather?.feels_like}
                humidity={currentWeather?.humidity}
                windSpeed={currentWeather?.wind_speed}
                pressure={currentWeather?.pressure}
                visibility={currentWeather?.visibility}
                rain1h={currentWeather?.rain_1h}
                cityName={activeRegionData?.name || currentWeather?.city_name}
                tempMin={currentWeather?.temp_min}
                tempMax={currentWeather?.temp_max}
              />
            </div>
          );
        })()}
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-black group min-h-[300px] sm:min-h-[340px] md:h-[340px]">
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
          {/* Feed mengisi penuh container; konten di SnapshotFeed sudah punya
              centering vertikal sendiri (loading spinner / kamera tidak tersedia). */}
          <div className="absolute inset-0 [&>div]:h-full [&>div>div]:!aspect-auto [&>div>div]:!min-h-0 [&>div>div]:!h-full">
            <SnapshotFeed
              imageUrl={CCTV_IMAGE_URL}
              timestamp={snapshotTimestamp}
              boundingBoxes={[]}
              cameraId="" location="" refreshKey={refreshKey}
            />
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
        {MemoizedMap}
      </div>

      {/* Pencatatan Data Otomatis - COLLAPSES ON HP FOR PROPER FLEX */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        {/* Card Header */}
        <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                <Database className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">Pencatatan Data Otomatis</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Rekam data sensor &amp; cuaca secara berkala ke dalam log</p>
              </div>
            </div>
            {lastSavedAt && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full self-start sm:self-auto">
                <CheckCircle2 className="size-3.5 flex-shrink-0" />
                <span>Terakhir disimpan: {lastSavedAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* 🔥 FIXED LOGGING LAYOUT GRID SYSTEM FOR PROPER PROPORTIONS */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* ── KIRI: Toggle & Manual Save ── */}
          <div className="flex flex-col justify-between h-full space-y-4">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-950 p-4 flex-1 flex flex-col justify-center min-h-[148px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Auto Log</p>
                  <p className={`text-xs mt-0.5 font-medium ${loggingEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {loggingEnabled ? '🟢 Aktif — merekam otomatis' : '⚫ Nonaktif'}
                  </p>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1 self-start sm:self-auto">
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

            <div className="pt-2">
              <button
                onClick={() => handleSaveLogsNow()}
                disabled={savingLog}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-sm font-semibold py-2.5 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer h-10"
              >
                <Database className="size-4 flex-shrink-0" />
                {savingLog ? 'Menyimpan...' : 'Simpan Log Sekarang (Manual)'}
              </button>
            </div>
          </div>

          {/* ── KANAN: Interval ── */}
          <div className="flex flex-col justify-between h-full space-y-4">
            <div className={`rounded-2xl border p-4 transition-all flex-1 flex flex-col justify-between min-h-[148px] ${loggingEnabled ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20' : 'border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-950 opacity-50 pointer-events-none select-none'}`}>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Clock className="size-3.5 text-blue-500" />
                Interval Pencatatan
              </p>
              <div className="flex items-end gap-2 my-auto py-1 justify-center">
                <div className="w-20 text-center">
                  <input
                    type="number" min={0} max={23}
                    value={logHours}
                    onChange={(e) => setLogHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-bold text-2xl border border-gray-200 dark:border-gray-700 rounded-xl py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-[10px] font-bold text-gray-400 block mt-1">JAM</label>
                </div>
                <div className="text-gray-300 dark:text-gray-600 text-xl font-light pb-5">:</div>
                <div className="w-20 text-center">
                  <input
                    type="number" min={0} max={59}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-bold text-2xl border border-gray-200 dark:border-gray-700 rounded-xl py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-[10px] font-bold text-gray-400 block mt-1">MENIT</label>
                </div>
              </div>
              <p className="text-xs text-center text-blue-600 dark:text-blue-400">
                Rekam otomatis setiap <span className="font-bold">{formatIntervalLabel(logHours, logMinutes) || '—'}</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleIntervalApply}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold py-2 transition-all cursor-pointer h-10"
              >
                Terapkan Interval
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabel Riwayat Log Sensor */}
      <div className="w-full overflow-x-auto">
        <LogTable loggingInterval={loggingInterval} refreshTrigger={logRefreshTrigger} />
      </div>
    </div>
  );
}