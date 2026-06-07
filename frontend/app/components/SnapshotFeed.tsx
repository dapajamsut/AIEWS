// frontend/app/components/SnapshotFeed.tsx
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

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

/**
 * Handle yang di-expose ke parent via ref.
 *
 * `getCanvas()` mengembalikan canvas (lengkap dengan bounding box & overlay) saat ini.
 * `isReady()` mengembalikan true kalau gambar sudah selesai dimuat & digambar ke canvas.
 */
export interface SnapshotFeedHandle {
  getCanvas: () => HTMLCanvasElement | null;
  isReady: () => boolean;
}

export const SnapshotFeed = forwardRef<SnapshotFeedHandle, SnapshotFeedProps>(
  function SnapshotFeed(
    {
      imageUrl,
      timestamp,
      boundingBoxes = [],
      waterLevel,
      cameraId = "CAM-01",
      location = "River Monitoring",
      refreshKey,
    },
    ref
  ) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose canvas & status ready ke parent component.
    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        isReady: () => ready,
      }),
      [ready]
    );

    const finalUrl = (() => {
      try {
        const url = new URL(imageUrl);
        if (refreshKey) {
          url.searchParams.set("t", refreshKey.toString());
        }
        return url.toString();
      } catch {
        return refreshKey
          ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}t=${refreshKey}`
          : imageUrl;
      }
    })();

    useEffect(() => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const handleLoad = () => {
        if (timeoutId) clearTimeout(timeoutId);
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

        setReady(true);
      };

      const handleError = () => {
        if (timeoutId) clearTimeout(timeoutId);
        setError("Gambar gagal dimuat. Coba lagi nanti.");
        setLoading(false);
        setReady(false);
      };

      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);

      // Reset state
      setLoading(true);
      setError(null);
      setReady(false);
      // Penting: izinkan canvas exporting (toBlob) tanpa dimark "tainted".
      // Server CCTV harus mengirim CORS header (Access-Control-Allow-Origin).
      img.crossOrigin = "anonymous";
      img.src = finalUrl;

      // Timeout: kalau 8 detik tidak ke-load (server CCTV down / lambat),
      // langsung anggap offline supaya UI tidak stuck di loading.
      timeoutId = setTimeout(() => {
        if (!img.complete || !img.naturalWidth) {
          handleError();
        }
      }, 8000);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        img.removeEventListener("load", handleLoad);
        img.removeEventListener("error", handleError);
      };
    }, [finalUrl, boundingBoxes, waterLevel]);

    if (error) {
      return (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-lg overflow-hidden">
          {/* Aspect-ratio guard: same proportion as live feed */}
          <div className="relative" style={{ aspectRatio: "16 / 9", minHeight: 240 }}>
            {/* Subtle scanline grain pattern (signal lost vibe) */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.6) 2px, rgba(255,255,255,0.6) 3px)",
              }}
            />
            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
              }}
            />

            {/* Center content — minimal, fokus pada satu pesan */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              {/* Camera icon with red diagonal slash */}
              <div className="relative mb-5">
                <div className="size-20 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-sm flex items-center justify-center">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
                {/* Diagonal slash line indicating disconnected */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: "rotate(-45deg)" }}
                >
                  <span className="block w-[110%] h-[2px] bg-red-500/80 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                </div>
              </div>

              {/* Single clear heading */}
              <h3 className="text-white text-lg sm:text-xl font-bold tracking-tight">
                Kamera Tidak Tersedia
              </h3>
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 inset-x-0 px-4 py-2 flex items-center justify-between text-[10px] text-white/50 bg-gradient-to-t from-black/60 to-transparent">
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-red-500" />
                NO SIGNAL
              </span>
              <span>{timestamp || "—"}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Aspect ratio guard — supaya tinggi container konsisten saat loading/error/normal */}
        <div className="relative w-full" style={{ aspectRatio: "16 / 9", minHeight: 240 }}>
          <img ref={imgRef} style={{ display: "none" }} alt="" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

          {(cameraId || location) && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-white text-xs z-10">
              {[cameraId, location].filter(Boolean).join(" • ")}
            </div>
          )}
          {!loading && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-white text-xs z-10">
              {timestamp}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
              {/* Subtle grain pattern */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.6) 2px, rgba(255,255,255,0.6) 3px)",
                }}
              />
              <div className="relative">
                <div className="size-12 rounded-full border-[3px] border-white/15 border-t-white animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm font-semibold">Memuat citra CCTV…</p>
                <p className="text-white/40 text-[11px] mt-1">Menghubungkan ke perangkat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
