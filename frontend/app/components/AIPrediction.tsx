import { Brain, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface AIPredictionProps {
  probability: number;
  timeframe: string;
  predictedAt: string;
  note: string;
  confidenceLevel: number;
}

export function AIPrediction({ probability, timeframe, predictedAt, note, confidenceLevel }: AIPredictionProps) {
  return (
    <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
            <Brain className="size-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Predictive Forecast</h3>
        </div>

        {/* Prediction */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative size-20">
              <svg className="size-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - probability / 100)}`}
                  className="text-red-600 dark:text-red-400"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{timeframe}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Probability of Overflow</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-600 dark:text-red-400">{probability}%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">at {predictedAt}</span>
              </div>
            </div>
          </div>

          {/* AI Note */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">AI Note:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{note}</p>
              </div>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Confidence Level</span>
              <span className="font-semibold text-gray-900 dark:text-white">{confidenceLevel}%</span>
            </div>
            <Progress value={confidenceLevel} className="h-2 [&>div]:bg-purple-600" />
          </div>
        </div>
      </div>
    </Card>
  );
}
