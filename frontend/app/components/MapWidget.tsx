"use client";

import { useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { MapPin, Activity, Wifi } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface SensorLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "alert" | "warning" | "normal";
  /** label tambahan, mis. nama region */
  region?: string;
  /** waktu update terakhir (string siap tampil), mis. "1 mnt lalu" */
  lastUpdate?: string;
  /** value sensor saat ini (opsional), mis. "20.5 cm" */
  value?: string;
}

interface MapWidgetProps {
  sensors: SensorLocation[];
}

const STATUS_META = {
  alert:   { color: "#dc2626", label: "SIAGA 1", glow: "rgba(220,38,38,0.55)" },
  warning: { color: "#f59e0b", label: "SIAGA 2", glow: "rgba(245,158,11,0.55)" },
  normal:  { color: "#10b981", label: "SIAGA 3", glow: "rgba(16,185,129,0.45)" },
} as const;

function buildMarkerHtml(status: SensorLocation["status"]): string {
  const m = STATUS_META[status];
  // Marker premium: dot solid + ring pulse + drop shadow halus.
  return `
    <div class="msx-marker" style="--c:${m.color};--g:${m.glow};">
      <span class="msx-marker__pulse"></span>
      <span class="msx-marker__core"></span>
    </div>
  `;
}

function dedupeRegion(name?: string | null): string {
  if (!name) return "";
  // Pisah by koma → trim → hilangkan duplikat (case-insensitive) → join lagi.
  const parts = String(name)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }
  return unique.join(", ");
}

function formatCoordinate(lat?: number, lng?: number): string {
  if (lat === undefined || lng === undefined) return "";
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

function buildPopupHtml(sensor: SensorLocation): string {
  const m = STATUS_META[sensor.status];
  const cleanRegion = dedupeRegion(sensor.region);
  const coords = formatCoordinate(sensor.lat, sensor.lng);
  return `
    <div style="
      font-family:-apple-system,'Segoe UI',Roboto,sans-serif;
      min-width:220px;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:12px;
      padding:14px 16px;
      box-shadow:0 12px 28px rgba(15,23,42,0.18);
    ">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${m.color};box-shadow:0 0 0 3px ${m.glow};"></span>
        <span style="font-size:10px;font-weight:800;letter-spacing:1.2px;color:${m.color};text-transform:uppercase;">${m.label}</span>
      </div>
      <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">${sensor.id}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#64748b;">${sensor.name}</p>
      ${cleanRegion ? `<p style="margin:6px 0 0;font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;">📍 <span>${cleanRegion}</span></p>` : ""}
      ${coords ? `<p style="margin:3px 0 0;font-size:10px;color:#94a3b8;font-family:Menlo,Consolas,monospace;padding-left:18px;">${coords}</p>` : ""}
      ${sensor.value ? `<p style="margin:8px 0 0;font-size:13px;font-weight:700;color:#0f172a;font-family:Menlo,Consolas,monospace;">${sensor.value}</p>` : ""}
      ${sensor.lastUpdate ? `<p style="margin:4px 0 0;font-size:10px;color:#94a3b8;">⏱ ${sensor.lastUpdate}</p>` : ""}
    </div>
  `;
}

export function MapWidget({ sensors }: MapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Init map sekali
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Reset id internal Leaflet jika container pernah diinit
    // @ts-ignore
    if (containerRef.current._leaflet_id) {
      // @ts-ignore
      containerRef.current._leaflet_id = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
      worldCopyJump: true,
    }).setView([-6.2088, 106.8456], 12);

    // Tile yang lebih clean & modern (CartoDB Voyager).
    // Kalau Voyager kena CORS, library akan otomatis fallback ke Positron via ke-2 URL.
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // Update markers ketika sensors berubah
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Bersihkan marker lama
    markersRef.current.forEach((mk) => map.removeLayer(mk));
    markersRef.current = [];

    if (sensors.length === 0) return;

    sensors.forEach((sensor) => {
      const icon = L.divIcon({
        className: "msx-marker-wrap",
        html: buildMarkerHtml(sensor.status),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([sensor.lat, sensor.lng], { icon })
        .bindPopup(buildPopupHtml(sensor), {
          offset: [0, -8],
          maxWidth: 260,
          className: "msx-popup",
        })
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Auto-fit ke semua marker (smooth)
    if (sensors.length === 1) {
      map.flyTo([sensors[0].lat, sensors[0].lng], 14, { duration: 0.7 });
    } else {
      const bounds = L.latLngBounds(sensors.map((s) => [s.lat, s.lng]));
      map.flyToBounds(bounds, { padding: [40, 40], duration: 0.7, maxZoom: 14 });
    }
  }, [sensors]);

  // Status counts untuk legend
  const counts = sensors.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<SensorLocation["status"], number>
  );

  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200 dark:shadow-indigo-900/30">
            <MapPin className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight tracking-tight">
              Peta Lokasi Sensor
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              Sebaran perangkat aktif berdasarkan region terpilih
            </p>
          </div>
        </div>

        {/* Legend / status pills */}
        {sensors.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["alert", "warning", "normal"] as const).map((st) => {
              const m = STATUS_META[st];
              const n = counts[st] ?? 0;
              if (n === 0) return null;
              return (
                <span
                  key={st}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                  style={{
                    color: m.color,
                    background: `${m.color}10`,
                    borderColor: `${m.color}40`,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: m.color }}
                  />
                  {m.label} · {n}
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Wifi className="size-3" />
              Live
            </span>
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[420px] w-full z-0"
          style={{ background: "#eef2f6" }}
        />

        {/* Empty state overlay */}
        {sensors.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm pointer-events-none">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <Activity className="size-5 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">Belum ada lokasi sensor</p>
            <p className="text-xs text-gray-500 mt-1">
              Pilih region di halaman Threshold untuk menampilkan titik di sini.
            </p>
          </div>
        )}
      </div>

      {/* Custom marker styles */}
      <style jsx global>{`
        .msx-marker-wrap { background: transparent !important; border: 0 !important; }
        .msx-marker {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .msx-marker__core {
          position: relative;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: var(--c);
          box-shadow:
            0 0 0 3px #fff,
            0 4px 10px rgba(15, 23, 42, 0.25);
          z-index: 2;
        }
        .msx-marker__pulse {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: var(--c);
          opacity: 0.45;
          animation: msx-pulse 2.2s ease-out infinite;
          z-index: 1;
        }
        @keyframes msx-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(2.4); opacity: 0;    }
          100% { transform: scale(2.4); opacity: 0;    }
        }

        /* Popup styling — wrapper transparan, content sendiri yang jadi card */
        .msx-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          border: 0 !important;
        }
        .msx-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
          line-height: 1.5;
        }
        /* Tip dibikin senada warna content */
        .msx-popup .leaflet-popup-tip {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08) !important;
        }
        .msx-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        .msx-popup .leaflet-popup-close-button {
          color: #64748b !important;
          font-size: 18px !important;
          padding: 8px 10px 0 0 !important;
          font-weight: 400 !important;
          z-index: 10;
        }
        .msx-popup .leaflet-popup-close-button:hover {
          color: #0f172a !important;
        }

        /* Zoom control polish */
        .leaflet-control-zoom a {
          border-radius: 10px !important;
          color: #334155 !important;
          font-weight: 600;
        }
      `}</style>
    </Card>
  );
}
