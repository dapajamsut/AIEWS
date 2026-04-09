"use client";

import { useState, useEffect } from "react";
import { Activity, TrendingUp, Search, Wind, Droplets, Gauge, Thermometer } from "lucide-react";
import Layout from "@/app/components/layout/Layout";
import { SensorCard, SensorCardProps } from "@/app/components/SensorCard";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function SensorPage() {
  // 🔥 DESKRIPSI NAMA SENSOR (Sama dengan Dashboard)
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

  const getIcon = (type: string) => {
    switch (type) {
      case "wind":
        return <Wind className="size-4 text-blue-600 dark:text-blue-400" />;
      case "rain":
        return <Droplets className="size-4 text-cyan-600 dark:text-cyan-400" />;
      case "water":
        return <Activity className="size-4 text-purple-600 dark:text-purple-400" />;
      case "temp":
        return <Thermometer className="size-4 text-orange-600 dark:text-orange-400" />;
      case "humidity":
        return <Droplets className="size-4 text-blue-500 dark:text-blue-400" />;
      case "pressure":
        return <Gauge className="size-4 text-green-600 dark:text-green-400" />;
      default:
        return <Activity />;
    }
  };

  const [selectedSensor, setSelectedSensor] = useState("ANEMO-01");
  const [searchTerm, setSearchTerm] = useState("");

  const [sensors, setSensors] = useState<any[]>([]);

  const getTarget = (type: string) => {
    switch (type) {
      case "wind": return 20;
      case "rain": return 50;
      case "water": return 300;
      case "temp": return 35;
      case "humidity": return 90;
      case "pressure": return 1020;
      default: return 100;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/sensors/latest", {
          cache: "no-store",
          headers: {
            apikey: "pikel2"
          }
        });

        const data = await res.json();

        const mapped = data.map((s: any) => ({
          id: s.sensor_code,
          name: s.sensor_code, // 🔥 Tambahan biar atasnya tetap kode sensor
          location: getSensorName(s.type), // 🔥 PERBAIKAN: Teks bawah jadi deskripsi
          value: Number(s.value),
          unit: s.unit,
          status: s.status === "WARNING" ? "warning" : "normal",
          trend: "steady",
          target: getTarget(s.type),
          type: s.type
        }));

        // 🔥 SORT BIAR TIDAK LONCAT
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

        setSensors(mapped);

      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredSensors = sensors.filter(sensor =>
    sensor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sensor.location.toLowerCase().includes(searchTerm.toLowerCase()) // ✨ Pencarian sekarang juga bisa cari berdasarkan jenis sensornya
  );

  const totalSensors = filteredSensors.length;
  const alertCount = filteredSensors.filter((s) => s.status === "alert").length;
  const warningCount = filteredSensors.filter((s) => s.status === "warning").length;
  const normalCount = filteredSensors.filter((s) => s.status === "normal").length;

  const historicalData = [
    { time: "00:00", level: 280, rainfall: 12, temp: 26, humidity: 70, pressure: 1010 },
    { time: "02:00", level: 295, rainfall: 18, temp: 26.5, humidity: 72, pressure: 1011 },
    { time: "04:00", level: 315, rainfall: 25, temp: 27, humidity: 73, pressure: 1011 },
    { time: "06:00", level: 340, rainfall: 35, temp: 27.5, humidity: 74, pressure: 1012 },
    { time: "08:00", level: 380, rainfall: 42, temp: 28, humidity: 75, pressure: 1012 },
    { time: "10:00", level: 420, rainfall: 45, temp: 28.5, humidity: 75, pressure: 1012 },
    { time: "12:00", level: 450, rainfall: 38, temp: 29, humidity: 74, pressure: 1011 },
  ];

  const comparisonData = [
    { time: "00:00", "ANEMO-01": 10, "TIP-01": 15, "WATER-01": 280, "BME-TEMP": 26, "BME-HUM": 70, "BME-PRES": 1010 },
    { time: "02:00", "ANEMO-01": 11, "TIP-01": 20, "WATER-01": 295, "BME-TEMP": 26.5, "BME-HUM": 72, "BME-PRES": 1011 },
    { time: "04:00", "ANEMO-01": 12, "TIP-01": 25, "WATER-01": 315, "BME-TEMP": 27, "BME-HUM": 73, "BME-PRES": 1011 },
    { time: "06:00", "ANEMO-01": 12, "TIP-01": 30, "WATER-01": 340, "BME-TEMP": 27.5, "BME-HUM": 74, "BME-PRES": 1012 },
    { time: "08:00", "ANEMO-01": 12.5, "TIP-01": 35, "WATER-01": 380, "BME-TEMP": 28, "BME-HUM": 75, "BME-PRES": 1012 },
    { time: "10:00", "ANEMO-01": 12.5, "TIP-01": 38, "WATER-01": 420, "BME-TEMP": 28.5, "BME-HUM": 75, "BME-PRES": 1012 },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Sensor Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive sensor data: wind speed, rainfall, water level, temperature, humidity, pressure
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search sensors by ID or location..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* All Sensors Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Active Sensors
          </h2>
          {filteredSensors.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Tidak ada sensor yang cocok dengan pencarian "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSensors.map((sensor) => (
                <SensorCard
                key={sensor.id}
                {...sensor}
                icon={getIcon(sensor.type)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detailed Analytics */}
        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Activity className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              Sensor Analytics & Trends
            </h3>
          </div>

          <Tabs defaultValue="historical" className="space-y-4">
            <TabsList className="grid w-full max-md grid-cols-2">
              <TabsTrigger value="historical">Historical Data</TabsTrigger>
              <TabsTrigger value="comparison">Multi-Sensor Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="historical" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Water level and rainfall correlation (Last 12 hours)
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Selected:</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {selectedSensor}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" label={{ value: 'Water Level (cm)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" label={{ value: 'Rainfall (mm/h)', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(17 24 39)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="level"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorLevel)"
                    name="Water Level (cm)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="rainfall"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#colorRain)"
                    name="Rainfall (mm/h)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comparative data across selected sensors (Last 10 hours)
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" label={{ value: 'Values', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(17 24 39)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ANEMO-01" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Anemometer (m/s)" />
                  <Line type="monotone" dataKey="TIP-01" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} name="Rainfall (mm/h)" />
                  <Line type="monotone" dataKey="WATER-01" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 4 }} name="Water Level (cm)" />
                  <Line type="monotone" dataKey="BME-TEMP" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="BME-HUM" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Humidity (%)" />
                  <Line type="monotone" dataKey="BME-PRES" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Pressure (hPa)" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-10">
          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sensors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalSensors}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Activity className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alert Status</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{alertCount}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-950 rounded-lg">
                <TrendingUp className="size-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Warning Status</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{warningCount}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <TrendingUp className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Normal Status</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{normalCount}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                <Activity className="size-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}