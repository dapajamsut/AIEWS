import { AlertCircle, AlertTriangle, Info, Download } from "lucide-react";

interface LogEntry {
  id: string;
  time: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
}

const logs: LogEntry[] = [
  {
    id: "1",
    time: "10:45 AM",
    type: "critical",
    title: "Critical Alert: Debris Detected",
    description: "Large object obstructing main sluice Gate D-05. Risk of blockage high.",
  },
  {
    id: "2",
    time: "10:32 AM",
    type: "warning",
    title: "Status Update: Siaga 2",
    description: "Water level at A-12 rising rapidly (15cm/15min). Flood protocol active.",
  },
  {
    id: "3",
    time: "10:15 AM",
    type: "info",
    title: "Weather System Updated",
    description: "Radar confirms localized heavy rainfall in Northern Catchment Area.",
  },
  {
    id: "4",
    time: "09:58 AM",
    type: "info",
    title: "Sensor Calibration Complete",
    description: "All sensors at stations A-12, B-05, C-08 recalibrated successfully.",
  },
];

export function SystemLogs() {
  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400";
      case "warning":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400";
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">System Logs & Alerts</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-4 rounded-lg border-l-4 ${getColors(log.type)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(log.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm">{log.title}</p>
                  <span className="text-xs whitespace-nowrap">{log.time}</span>
                </div>
                <p className="text-sm opacity-90">{log.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
