import { Maximize2, AlertTriangle, Video } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface Detection {
  type: string;
  confidence: number;
}

interface CameraFeedProps {
  cameraId: string;
  location: string;
  status: "alert" | "normal";
  detections: Detection[];
  fps?: number;
  latency?: number;
  imageUrl?: string;
}

export function CameraFeed({ 
  cameraId, 
  location, 
  status, 
  detections,
  fps = 30,
  latency = 45,
  imageUrl
}: CameraFeedProps) {
  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      {/* Camera View */}
      <div className="relative aspect-video bg-gray-900">
        {imageUrl ? (
          <img src={imageUrl} alt={`Camera ${cameraId}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Video className="size-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera feed loading...</p>
            </div>
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="space-y-2">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-mono">
              {cameraId} - {location}
            </div>
            {status === "alert" && (
              <Badge className="bg-red-600 hover:bg-red-600 text-white border-0 gap-1.5">
                <AlertTriangle className="size-3" />
                CV Status: Alert - Debris Detected
              </Badge>
            )}
          </div>
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-black/60 backdrop-blur-sm hover:bg-black/80 border-0 text-white"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>

        {/* AI Detections Overlay */}
        {detections.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-2">
            {detections.map((detection, idx) => (
              <div 
                key={idx}
                className="bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
              >
                {detection.type.toUpperCase()} {detection.confidence}%
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-4 text-xs font-mono text-white">
            <span>FPS: {fps}</span>
            <span>|</span>
            <span>LATENCY: {latency}ms</span>
            <span>|</span>
            <span>SCALE: 1:1</span>
          </div>
        </div>
      </div>
    </Card>
  );
}