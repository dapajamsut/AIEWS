"use client";

import { useState } from "react";
import { Video, Grid, Maximize2, AlertTriangle, CheckCircle, Play, Pause } from "lucide-react";

// 1. PASTIKAN IMPORT LAYOUT BENER
import Layout from "@/app/components/layout/Layout"; 

// 2. COBA GANTI IMPORTNYA JADI PAKE @/app/components/...
import { CameraFeed } from "@/app/components/CameraFeed";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

// WAJIB PAKE 'export default' buat file di dalam folder app/camera/page.tsx
export default function CameraPage() {
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [isRecording, setIsRecording] = useState(true);

  const cameras = [
    {
      cameraId: "CAM_01",
      location: "NORTH GATE BRIDGE",
      status: "normal" as const,
      detections: [],
      fps: 30,
      latency: 42,
      imageUrl: "https://images.unsplash.com/photo-1560872236-1e6cb1c7c260?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMHN0cmVhbSUyMHdhdGVyJTIwZmxvd2luZ3xlbnwxfHx8fDE3NzMxNTk2OTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      cameraId: "CAM_02",
      location: "MAIN SLUICE GATE",
      status: "normal" as const,
      detections: [],
      fps: 30,
      latency: 38,
      imageUrl: "https://images.unsplash.com/photo-1762086897132-06c07fe78ae1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGdhdGUlMjBkYW0lMjBzdHJ1Y3R1cmV8ZW58MXx8fHwxNzczMTU5NjkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      cameraId: "CAM_03",
      location: "EAST REACH STATION",
      status: "normal" as const,
      detections: [],
      fps: 30,
      latency: 45,
      imageUrl: "https://images.unsplash.com/photo-1766470511185-2a7b9a1518bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jcmV0ZSUyMHdhdGVyJTIwY2hhbm5lbHxlbnwxfHx8fDE3NzMxNTk2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      cameraId: "CAM_04",
      location: "MAIN RIVER DOCK",
      status: "alert" as const,
      detections: [
        { type: "debris", confidence: 98 },
        { type: "vegetation", confidence: 76 },
      ],
      fps: 30,
      latency: 45,
      imageUrl: "https://images.unsplash.com/photo-1772945858747-21726f64cd56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMHdhdGVyJTIwZmxvb2QlMjBtb25pdG9yaW5nfGVufDF8fHx8MTc3MzE1OTU2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const detectionLogs = [
    {
      time: "10:45 AM",
      camera: "CAM_04",
      location: "Main River Dock",
      detection: "Debris",
      confidence: 98,
      status: "critical",
    },
    {
      time: "10:32 AM",
      camera: "CAM_04",
      location: "Main River Dock",
      detection: "Vegetation",
      confidence: 76,
      status: "warning",
    },
    {
      time: "09:15 AM",
      camera: "CAM_02",
      location: "Main Sluice Gate",
      detection: "Water Level High",
      confidence: 85,
      status: "info",
    },
    {
      time: "08:20 AM",
      camera: "CAM_01",
      location: "North Gate Bridge",
      detection: "Normal Flow",
      confidence: 95,
      status: "normal",
    },
  ];

  const activeAlerts = cameras.filter(cam => cam.status === "alert").length;
  const totalDetections = cameras.reduce((sum, cam) => sum + cam.detections.length, 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Camera Surveillance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered CCTV monitoring with real-time debris detection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid className="size-4" />
              Grid View
            </Button>
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsRecording(!isRecording)}
              className="gap-2"
            >
              {isRecording ? (
                <>
                  <Pause className="size-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Start Recording
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Video className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Cameras</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{cameras.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-950 rounded-lg">
                <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Online Cameras</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{cameras.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active Alerts</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{activeAlerts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <Maximize2 className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Detections</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalDetections}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cameras.map((camera) => (
            <CameraFeed key={camera.cameraId} {...camera} />
          ))}
        </div>

        {/* Detection Logs */}
        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Video className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              AI Detection Logs
            </h3>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Detections</TabsTrigger>
              <TabsTrigger value="alerts">Alerts Only</TabsTrigger>
              <TabsTrigger value="normal">Normal Status</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {detectionLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400 min-w-[80px]">
                      {log.time}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.camera}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.location}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detected: <span className="font-semibold">{log.detection}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {log.confidence}%
                      </p>
                    </div>
                    <Badge
                      className={
                        log.status === "critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900"
                          : log.status === "warning"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-900"
                          : log.status === "normal"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-900"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                      }
                    >
                      {log.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-2">
              {detectionLogs
                .filter((log) => log.status === "critical" || log.status === "warning")
                .map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400 min-w-[80px]">
                        {log.time}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.camera}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.location}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Detected: <span className="font-semibold">{log.detection}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {log.confidence}%
                        </p>
                      </div>
                      <Badge
                        className={
                          log.status === "critical"
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-900"
                        }
                      >
                        {log.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="normal" className="space-y-2">
              {detectionLogs
                .filter((log) => log.status === "normal")
                .map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400 min-w-[80px]">
                        {log.time}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.camera}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.location}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Detected: <span className="font-semibold">{log.detection}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {log.confidence}%
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-900">
                        {log.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}