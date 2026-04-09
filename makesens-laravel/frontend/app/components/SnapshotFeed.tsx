// frontend/app/components/SnapshotFeed.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface BoundingBox {
  label: string;
  confidence: number;
  x: number; // persen dari lebar (0-100)
  y: number; // persen dari tinggi (0-100)
  width: number;
  height: number;
  color: string;
}

interface SnapshotFeedProps {
  imageUrl: string;
  timestamp: string;
  boundingBoxes?: BoundingBox[];
  waterLevel?: number;
  cameraId?: string;
  location?: string;
  refreshKey?: number;
}

export function SnapshotFeed({
  imageUrl,
  timestamp,
  boundingBoxes = [],
  waterLevel,
  cameraId = "CAM-01",
  location = "River Monitoring",
  refreshKey,
}: SnapshotFeedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const finalUrl = (() => {
    try {
      const url = new URL(imageUrl);
      if (refreshKey) {
        url.searchParams.set("t", refreshKey.toString());
      }
      return url.toString();
    } catch {
      return refreshKey ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}t=${refreshKey}` : imageUrl;
    }
  })();

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const handleLoad = () => {
      setLoading(false);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size sesuai gambar
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Gambar image ke canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Gambar bounding boxes
      boundingBoxes.forEach((box) => {
        const x = (box.x / 100) * canvas.width;
        const y = (box.y / 100) * canvas.height;
        const w = (box.width / 100) * canvas.width;
        const h = (box.height / 100) * canvas.height;

        ctx.strokeStyle = box.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = box.color;
        const label = `${box.label} ${box.confidence}%`;
        const metrics = ctx.measureText(label);
        const labelWidth = metrics.width + 8;
        const labelHeight = 20;
        ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
        ctx.fillStyle = "white";
        ctx.font = "bold 12px monospace";
        ctx.fillText(label, x + 4, y - 6);
      });

      // Gambar garis water level
      if (waterLevel !== undefined) {
        const y = (waterLevel / 100) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = "rgba(0, 150, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(0, 150, 255, 0.8)";
        ctx.fillRect(10, y - 20, 70, 20);
        ctx.fillStyle = "white";
        ctx.font = "bold 10px monospace";
        ctx.fillText("Water Level", 12, y - 6);
      }
    };

    const handleError = () => {
      setError("Gambar gagal dimuat. Coba lagi nanti.");
      setLoading(false);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    // Reset state
    setLoading(true);
    setError(null);
    img.src = finalUrl;

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [finalUrl, boundingBoxes, waterLevel]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <img ref={imgRef} style={{ display: "none" }} alt="" />
      <canvas ref={canvasRef} className="w-full h-auto" />
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-white text-xs">
        {cameraId} • {location}
      </div>
      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-white text-xs">
        {timestamp}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}