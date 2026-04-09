import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const sensors = [
  { id: "A-12", position: [-6.2088, 106.8456] as [number, number], status: "alert", value: 450 },
  { id: "B-05", position: [-6.2108, 106.8476] as [number, number], status: "warning", value: 320 },
  { id: "C-08", position: [-6.2068, 106.8436] as [number, number], status: "normal", value: 150 },
  { id: "D-01", position: [-6.2048, 106.8496] as [number, number], status: "normal", value: 110 },
];

function getCircleColor(status: string) {
  switch (status) {
    case "alert":
      return "#ef4444";
    case "warning":
      return "#f97316";
    default:
      return "#22c55e";
  }
}

function MapMarkers() {
  return (
    <>
      {sensors.map((sensor) => (
        <Marker key={`marker-${sensor.id}`} position={sensor.position} icon={icon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">{sensor.id}</p>
              <p className="text-sm">Water Level: {sensor.value}cm</p>
              <p className="text-xs text-slate-500 capitalize">Status: {sensor.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      {sensors.map((sensor) => (
        <Circle
          key={`circle-${sensor.id}`}
          center={sensor.position}
          radius={200}
          pathOptions={{
            color: getCircleColor(sensor.status),
            fillColor: getCircleColor(sensor.status),
            fillOpacity: 0.2,
          }}
        />
      ))}
    </>
  );
}

export function MapView() {
  useEffect(() => {
    // Ensure Leaflet images are loaded
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">Watershed Map</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Real-time sensor locations</p>
      </div>
      <div className="h-96 relative">
        <MapContainer
          center={[-6.2088, 106.8456]}
          zoom={14}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapMarkers />
        </MapContainer>
      </div>
    </div>
  );
}
