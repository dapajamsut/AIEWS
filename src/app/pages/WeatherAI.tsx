import { Cloud, CloudRain, Wind, Droplets, Brain, Sparkles, TrendingUp, AlertTriangle, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";

const forecastData = [
  { hour: "Now", temp: 28, rain: 45, prediction: 82 },
  { hour: "2h", temp: 27, rain: 52, prediction: 85 },
  { hour: "4h", temp: 26, rain: 58, prediction: 89 },
  { hour: "6h", temp: 25, rain: 42, prediction: 78 },
  { hour: "8h", temp: 26, rain: 35, prediction: 65 },
  { hour: "10h", temp: 27, rain: 28, prediction: 52 },
  { hour: "12h", temp: 28, rain: 20, prediction: 38 },
];

export default function WeatherAI() {
  const [selectedNote, setSelectedNote] = useState<number | null>(null);

  const aiNotes = [
    {
      id: 1,
      time: "10:45 AM",
      priority: "high",
      title: "Critical Overflow Prediction",
      content: "AI model predicts 82% probability of overflow at Station A-12 by 16:45. Upstream discharge patterns indicate rapid accumulation. Recommend activating secondary retention basin and preparing evacuation protocols for low-lying areas.",
      confidence: 89,
      tags: ["overflow", "station-a12", "urgent"],
    },
    {
      id: 2,
      time: "10:30 AM",
      priority: "medium",
      title: "Weather Pattern Analysis",
      content: "Radar analysis shows thunderstorm cell moving northeast at 15 km/h. Expected to reach Northern Catchment Area in 2-3 hours. Intensity may increase rainfall by 30-40% in affected zones. Monitor Stations B-05 and C-08 closely.",
      confidence: 85,
      tags: ["weather", "thunderstorm", "radar"],
    },
    {
      id: 3,
      time: "10:15 AM",
      priority: "low",
      title: "Seasonal Trend Observation",
      content: "Historical data comparison: Current water levels 15% higher than seasonal average for March. This correlates with above-average rainfall in February. Long-term forecast suggests continued elevated levels through mid-April.",
      confidence: 92,
      tags: ["seasonal", "trend", "analysis"],
    },
    {
      id: 4,
      time: "09:50 AM",
      priority: "medium",
      title: "Debris Detection Correlation",
      content: "Camera AI detected 3 debris accumulations upstream. Cross-referencing with flow rate data suggests potential 20% reduction in channel capacity at chokepoints. Recommend debris removal within 6 hours to maintain optimal flow.",
      confidence: 87,
      tags: ["debris", "camera-ai", "maintenance"],
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-950";
      case "medium":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950";
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-orange-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Weather AI & Predictions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered weather analysis and flood forecasting
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
              AI Models Active
            </span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Current Weather */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-950 p-8 rounded-xl text-white shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Current Weather</h2>
                <p className="text-sm opacity-90">Jakarta Watershed Region</p>
              </div>
              <CloudRain className="w-16 h-16 opacity-80" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-6xl font-bold mb-2">28°C</p>
                <p className="text-lg opacity-90">Thunderstorm expected</p>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-5 h-5" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <p className="text-2xl font-semibold">88%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-5 h-5" />
                    <span className="text-sm">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-semibold">12 km/h</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="w-5 h-5" />
                <span className="font-medium">Rainfall Intensity</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">45 mm/h</span>
                <span className="text-sm opacity-75">Heavy rain</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">AI Prediction</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Next 6 hours</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-500">82%</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Overflow Risk</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: "82%" }} />
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    High Alert
                  </p>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Prepare for potential flooding at Station A-12 by 16:45
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Model Confidence</span>
                  <span className="font-semibold text-slate-900 dark:text-white">89%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Data Sources</span>
                  <span className="font-semibold text-slate-900 dark:text-white">24 Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                  <span className="font-semibold text-slate-900 dark:text-white">2 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Temperature & Rainfall Forecast
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorTemp)"
                  name="Temperature (°C)"
                />
                <Area
                  type="monotone"
                  dataKey="rain"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRain)"
                  name="Rainfall (mm/h)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              AI Overflow Probability
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="prediction" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Overflow Risk (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Notes Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">AI Analysis Notes</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Automated insights and recommendations
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
                {aiNotes.length} Notes
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {aiNotes.map((note) => (
              <div
                key={note.id}
                className={`border-l-4 rounded-lg p-5 cursor-pointer transition-all hover:shadow-md ${getPriorityColor(note.priority)} ${
                  selectedNote === note.id ? "ring-2 ring-offset-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedNote(selectedNote === note.id ? null : note.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${getPriorityBadge(note.priority)}`}>
                      {note.priority}
                    </span>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{note.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                    {note.time}
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                  {note.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {note.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
