"use client";

import { useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { MapPin } from "lucide-react";
import L from "leaflet"; 
import "leaflet/dist/leaflet.css";

interface SensorLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "alert" | "warning" | "normal";
}

interface MapWidgetProps {
  sensors: SensorLocation[];
}

export function MapWidget({ sensors }: MapWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix untuk container yang sudah terinisialisasi
    if (mapContainerRef.current) {
      const container = mapContainerRef.current;
      // @ts-ignore
      if (container._leaflet_id) {
        // @ts-ignore
        container._leaflet_id = null;
      }
    }

    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current).setView([-6.2088, 106.8456], 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (map) {
      // BENERIN MERAH DI eachLayer dengan ngasih tipe data 'any' atau 'L.Layer'
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      sensors.forEach((sensor) => {
        const color = 
          sensor.status === "alert" ? "#dc2626" : 
          sensor.status === "warning" ? "#ea580c" : 
          "#16a34a";

        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([sensor.lat, sensor.lng], { icon: customIcon })
          .bindPopup(`<b>${sensor.id}</b><br/>${sensor.name}`)
          .addTo(map);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [sensors]);

  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white uppercase tracking-tight text-sm">Sensor Location Map</h3>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-[400px] w-full z-0" />
    </Card>
  );
}