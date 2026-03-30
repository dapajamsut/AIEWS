import { AlertTriangle, Info, TrendingUp, Download } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface LogEntry {
  time: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
}

interface AlertLogsProps {
  logs: LogEntry[];
}

export function AlertLogs({ logs }: AlertLogsProps) {
  const getLogIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />;
      case "warning":
        return <TrendingUp className="size-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="size-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-l-red-600 dark:border-l-red-400";
      case "warning":
        return "border-l-orange-600 dark:border-l-orange-400";
      default:
        return "border-l-blue-600 dark:border-l-blue-400";
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">System Logs & Alerts</h3>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-3">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`border-l-4 ${getLogColor(log.type)} bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg space-y-1`}
            >
              <div className="flex items-start gap-3">
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {log.time}
                    </span>
                    <span className={`font-semibold text-sm ${
                      log.type === "critical" ? "text-red-700 dark:text-red-400" :
                      log.type === "warning" ? "text-orange-700 dark:text-orange-400" :
                      "text-blue-700 dark:text-blue-400"
                    }`}>
                      {log.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {log.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
