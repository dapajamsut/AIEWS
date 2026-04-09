"use client";

import { useState, useEffect } from "react";
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
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CameraPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [countdown, setCountdown] = useState(300);

  const CCTV_IMAGE_URL = `http://108.136.240.250:1984/api/frame.jpeg?src=banjir_cam&t=${refreshKey}`;

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

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    localStorage.setItem("last_cctv_refresh_camera", Date.now().toString());
    setCountdown(300);
  };

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

  // 🔥 DATA MOCK UNTUK HISTORY 24 JAM
  const waterHistoryData = [
    { time: "16:00 (-24h)", level: 60, status: "Stabil" },
    { time: "20:00", level: 62, status: "Stabil" },
    { time: "00:00", level: 68, status: "Naik" },
    { time: "04:00", level: 85, status: "Naik Tajam" },
    { time: "08:00", level: 80, status: "Turun" },
    { time: "12:00", level: 75, status: "Turun" },
    { time: "16:00 (Now)", level: 75, status: "Stabil" },
  ];

  // Custom Tooltip untuk Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-white">
          <p className="text-sm font-semibold mb-1 text-blue-400">{label}</p>
          <p className="text-sm">Tinggi Air: <span className="font-bold">{data.level} cm</span></p>
          <div className="flex items-center gap-1 mt-1 text-xs">
            Status: 
            <span className={`font-bold flex items-center gap-1 ${
              data.status.includes("Naik") ? "text-red-400" : 
              data.status.includes("Turun") ? "text-green-400" : "text-yellow-400"
            }`}>
              {data.status.includes("Naik") && <TrendingUp className="size-3" />}
              {data.status.includes("Turun") && <TrendingDown className="size-3" />}
              {data.status.includes("Stabil") && <Minus className="size-3" />}
              {data.status}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header Section */}
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

        {/* 🔥 NEW: 24-HOUR HISTORY TREND SECTION */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <TrendingUp className="text-blue-600 size-5" />
                24-Hour Water Level Trend
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Visualisasi fluktuasi tinggi air berdasarkan pantauan kamera dalam 24 jam terakhir.
              </p>
            </div>
            {/* Status Indicator Current */}
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-right">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status Saat Ini</p>
              <div className="flex items-center justify-end gap-2 text-blue-600 dark:text-blue-400 font-bold">
                <Minus className="size-4" /> Stabil (75cm)
              </div>
            </div>
          </div>
          
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waterHistoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  className="text-xs font-medium text-gray-500" 
                  tick={{ fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  className="text-xs font-medium text-gray-500" 
                  tick={{ fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false}
                  dx={-10}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <footer className="text-center py-4 text-xs text-gray-400 font-medium">
          Makesens Flood Monitoring System • Semester 6 PBL • Nabiel Ischak
        </footer>
      </div>
    </Layout>
  );
}