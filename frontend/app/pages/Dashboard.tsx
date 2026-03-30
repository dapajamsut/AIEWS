"use client";

import dynamic from "next/dynamic"; // 1. Import dynamic
import { Bell, AlertTriangle } from "lucide-react";
import { SensorCard } from "../components/SensorCard";
import { WeatherWidget } from "../components/WeatherWidget";
import { CameraFeed } from "../components/CameraFeed";
import { AlertLogs } from "../components/AlertLogs";
import { AIPrediction } from "../components/AIPrediction";
import { Badge } from "../components/ui/badge";

// 2. LOAD MAP SECARA DYNAMIC (Hanya di Client Side)
const MapWidget = dynamic(
  () => import("../components/MapWidget").then((mod) => mod.MapWidget),
  { 
    ssr: false, // Matikan render di server biar gak error "window is not defined"
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-400 font-medium">Loading Interactive Map...</p>
      </div>
    )
  }
);

export default function Dashboard() {
  const sensors = [
    { id: "A-12 BRIDGE NORTH", location: "North Gate Bridge", value: 450, unit: "cm", status: "alert" as const, trend: "rising" as const, target: 300 },
    { id: "B-05 MAIN SLUICE", location: "Main Sluice Gate", value: 320, unit: "cm", status: "warning" as const, trend: "steady" as const, target: 250 },
    { id: "C-09 EAST REACH", location: "East Reach Station", value: 150, unit: "cm", status: "normal" as const, trend: "falling" as const, target: 180 },
    { id: "D-01 SPILLWAY", location: "Spillway Control", value: 110, unit: "cm", status: "normal" as const, trend: "falling" as const, target: 200 },
  ];

  const sensorLocations = [
    { id: "A-12", name: "North Gate Bridge", lat: -6.1844, lng: 106.8229, status: "alert" as const },
    { id: "B-05", name: "Main Sluice Gate", lat: -6.2088, lng: 106.8456, status: "warning" as const },
    { id: "C-09", name: "East Reach Station", lat: -6.2297, lng: 106.8784, status: "normal" as const },
    { id: "D-01", name: "Spillway Control", lat: -6.1951, lng: 106.8203, status: "normal" as const },
  ];

  const logs = [
    { time: "10:45 AM", type: "critical" as const, title: "Critical Alert: Debris Detected", description: "Large object detected near Sluice Gate B-05. Risk of blockage high." },
    { time: "10:32 AM", type: "warning" as const, title: "Status Update: Siaga 2", description: "Water level at A-12 rising rapidly (+15cm/15min). Flood protocol active." },
    { time: "10:15 AM", type: "info" as const, title: "Weather System Updated", description: "Radar confirms localized heavy rainfall in Northern Catchment Area." },
    { time: "09:58 AM", type: "info" as const, title: "Sensor Calibration Complete", description: "All sensors passed automated calibration check. System nominal." },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Main Watershed Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring and AI-powered flood detection system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Time</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900 gap-2 px-4 py-2">
            <AlertTriangle className="size-4" />
            SIAGA 2
          </Badge>
          <div className="relative">
            <Bell className="size-6 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 size-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center">
              3
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Real-time Water Level Sensors
          </h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sensors.map((sensor) => (
            <SensorCard key={sensor.id} {...sensor} />
          ))}
        </div>
      </div>

      {/* Weather & Camera Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherWidget
          temperature={28}
          condition="Thunderstorm expected"
          humidity={88}
          rainfall={45}
          updateTime="10m ago"
        />

        <CameraFeed
          cameraId="CAM_04"
          location="MAIN RIVER DOCK"
          status="alert"
          detections={[
            { type: "debris", confidence: 98 },
            { type: "vegetation", confidence: 76 },
          ]}
          fps={30}
          latency={45}
          imageUrl="https://images.unsplash.com/photo-1772945858747-21726f64cd56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMHdhdGVyJTIwZmxvb2QlMjBtb25pdG9yaW5nfGVufDF8fHx8MTc3MzE1OTU2M3ww&ixlib=rb-4.1.0&q=80&w=1080"
        />
      </div>

      {/* AI Prediction & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AIPrediction
          probability={82}
          timeframe="6h"
          predictedAt="16:45"
          note="Forecast indicates upstream discharge will reach Station A-12 in approx. 4 hours."
          confidenceLevel={87}
        />
        <div className="lg:col-span-2">
          {/* 3. Panggil MapWidget yang sudah dinamis */}
          <MapWidget sensors={sensorLocations} />
        </div>
      </div>

      {/* Alert Logs */}
      <AlertLogs logs={logs} />
    </div>
  );
}