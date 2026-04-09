import { Brain, AlertTriangle } from "lucide-react";

export function AIForecast() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">AI Predictive Forecast</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Probability of Overflow</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-red-600 dark:text-red-500">82%</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">at 16:45</span>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 mb-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-300 mb-1">AI Note:</p>
            <p className="text-sm text-amber-800 dark:text-amber-400">
              Forecast indicates upstream discharge will reach Station A-12 in approx. 4 hours. 
              Prepare secondary retention basin.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">CONFIDENCE LEVEL</p>
        <div className="flex gap-1 mb-1">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < 10 ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-right text-slate-600 dark:text-slate-400">83% Confidence</p>
      </div>
    </div>
  );
}
