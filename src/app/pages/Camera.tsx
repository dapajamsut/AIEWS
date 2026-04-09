import { Camera as CameraIcon, Maximize2, Download, AlertCircle, Eye, Package } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";

interface CameraData {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  fps: number;
  latency: number;
  detections: Array<{
    type: string;
    confidence: number;
    position: { x: number; y: number; width: number; height: number };
  }>;
  image: string;
}

export default function Camera() {
  const [selectedCamera, setSelectedCamera] = useState<string>("CAM-04");

  const cameras: CameraData[] = [
    {
      id: "CAM-04",
      name: "Main River Dock",
      location: "Central Watershed",
      status: "online",
      fps: 30,
      latency: 45,
      detections: [
        { type: "debris", confidence: 94, position: { x: 25, y: 33, width: 30, height: 25 } },
        { type: "vegetation", confidence: 78, position: { x: 60, y: 50, width: 35, height: 32 } },
      ],
      image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=450&fit=crop",
    },
    {
      id: "CAM-01",
      name: "Bridge North",
      location: "Station A-12",
      status: "online",
      fps: 30,
      latency: 52,
      detections: [],
      image: "https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&h=450&fit=crop",
    },
    {
      id: "CAM-05",
      name: "East Spillway",
      location: "Station C-08",
      status: "online",
      fps: 30,
      latency: 38,
      detections: [
        { type: "debris", confidence: 88, position: { x: 40, y: 40, width: 25, height: 20 } },
      ],
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=450&fit=crop",
    },
    {
      id: "CAM-08",
      name: "Downstream Gate",
      location: "Station D-01",
      status: "online",
      fps: 30,
      latency: 61,
      detections: [],
      image: "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800&h=450&fit=crop",
    },
    {
      id: "CAM-03",
      name: "Reservoir Inlet",
      location: "Upstream",
      status: "online",
      fps: 30,
      latency: 48,
      detections: [
        { type: "vegetation", confidence: 82, position: { x: 30, y: 45, width: 28, height: 30 } },
      ],
      image: "https://images.unsplash.com/photo-1464039397811-476f652a343b?w=800&h=450&fit=crop",
    },
    {
      id: "CAM-06",
      name: "Canal Junction",
      location: "West Sector",
      status: "online",
      fps: 30,
      latency: 55,
      detections: [],
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&h=450&fit=crop",
    },
  ];

  const selectedCameraData = cameras.find((cam) => cam.id === selectedCamera);

  const getDetectionColor = (type: string) => {
    switch (type) {
      case "debris":
        return "border-red-500 bg-red-500";
      case "vegetation":
        return "border-orange-500 bg-orange-500";
      default:
        return "border-yellow-500 bg-yellow-500";
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Live Camera Monitoring
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered object detection for debris and obstruction monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {cameras.filter((c) => c.status === "online").length}/{cameras.length} Cameras Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Camera Feeds</h3>
              </div>
              <div className="p-4 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => setSelectedCamera(camera.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedCamera === camera.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CameraIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {camera.id}
                        </span>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          camera.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                      {camera.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {camera.location}
                    </p>
                    {camera.detections.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-red-100 dark:bg-red-950 rounded">
                        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                          {camera.detections.length} Detection{camera.detections.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Detection Stats */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Detection Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Debris Detected</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {cameras.reduce((acc, cam) => acc + cam.detections.filter((d) => d.type === "debris").length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Vegetation</span>
                  </div>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {cameras.reduce((acc, cam) => acc + cam.detections.filter((d) => d.type === "vegetation").length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CameraIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Clear Channels</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {cameras.filter((cam) => cam.detections.length === 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Camera View */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCameraData && (
              <>
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {selectedCameraData.id} - {selectedCameraData.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        FPS: {selectedCameraData.fps} | Latency: {selectedCameraData.latency}ms | Scale: 1:5
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <Download className="w-5 h-5 text-white" />
                      </button>
                      <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="aspect-video relative group">
                    <ImageWithFallback
                      src={selectedCameraData.image}
                      alt={selectedCameraData.name}
                      className="w-full h-full object-cover"
                    />

                    {/* AI Detection Overlays */}
                    {selectedCameraData.detections.map((detection, index) => {
                      const colors = getDetectionColor(detection.type);
                      return (
                        <div
                          key={index}
                          className="absolute"
                          style={{
                            left: `${detection.position.x}%`,
                            top: `${detection.position.y}%`,
                            width: `${detection.position.width}%`,
                            height: `${detection.position.height}%`,
                          }}
                        >
                          <div className={`w-full h-full border-2 ${colors.split(" ")[0]} rounded-lg`}>
                            <div className={`absolute -top-7 left-0 ${colors.split(" ")[1]} px-2 py-1 rounded text-xs text-white font-semibold uppercase`}>
                              {detection.type} {detection.confidence}%
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Status Overlays */}
                    {selectedCameraData.detections.length > 0 && (
                      <div className="absolute bottom-4 left-4 bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-white" />
                        <span className="text-white font-semibold">
                          {selectedCameraData.detections.length} Object{selectedCameraData.detections.length > 1 ? "s" : ""} Detected
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white font-medium">LIVE</span>
                    </div>
                  </div>
                </div>

                {/* Detection Details */}
                {selectedCameraData.detections.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Detected Objects
                    </h3>
                    <div className="space-y-3">
                      {selectedCameraData.detections.map((detection, index) => {
                        const isDebris = detection.type === "debris";
                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-l-4 ${
                              isDebris
                                ? "border-red-500 bg-red-50 dark:bg-red-950"
                                : "border-orange-500 bg-orange-50 dark:bg-orange-950"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Package className={`w-5 h-5 ${isDebris ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`} />
                                <span className="font-semibold capitalize text-slate-900 dark:text-white">
                                  {detection.type}
                                </span>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDebris ? "bg-red-500" : "bg-orange-500"} text-white`}>
                                {detection.confidence}% Confidence
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {isDebris
                                ? "Large object detected obstructing water flow. Immediate removal recommended to prevent blockage."
                                : "Vegetation growth detected. Monitor for potential obstruction if growth continues."}
                            </p>
                            <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                              <span>Position: X:{detection.position.x}% Y:{detection.position.y}%</span>
                              <span>Size: {detection.position.width}×{detection.position.height}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedCameraData.detections.length === 0 && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      Channel Clear
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      No obstructions or debris detected in this camera feed
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
