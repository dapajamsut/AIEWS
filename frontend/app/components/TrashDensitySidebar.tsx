// frontend/app/components/TrashDensitySidebar.tsx
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, Droplets, Trash2, AlertCircle } from "lucide-react";

interface TrashDensitySidebarProps {
  totalObjects: number;
  densityLevel: "Low" | "Medium" | "High";
  recommendation: string;
  lastAnalysis: string;
}

export function TrashDensitySidebar({
  totalObjects,
  densityLevel,
  recommendation,
  lastAnalysis,
}: TrashDensitySidebarProps) {
  const densityColor = {
    Low: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    High: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };

  return (
    <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <Trash2 className="size-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trash Density Index (TDI)</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Objects</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{totalObjects}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Density Level</span>
            <Badge className={densityColor[densityLevel]}>{densityLevel}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Last Analysis</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{lastAnalysis}</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mt-2">
          <div className="flex gap-2">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Recommendation</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}