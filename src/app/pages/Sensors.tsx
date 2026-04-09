import { Activity, Droplet, Waves, TrendingUp, MapPin, Calendar } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const chartData = [
  { time: "00:00", level: 120, threshold: 200 },
  { time: "04:00", level: 135, threshold: 200 },
  { time: "08:00", level: 180, threshold: 200 },
  { time: "12:00", level: 280, threshold: 200 },
  { time: "16:00", level: 390, threshold: 200 },
  { time: "20:00", level: 450, threshold: 200 },
  { time: "24:00", level: 420, threshold: 200 },
];

const rainfallData = [
  { time: "00:00", rainfall: 5 },
  { time: "04:00", rainfall: 8 },
  { time: "08:00", rainfall: 12 },
  { time: "12:00", rainfall: 25 },
  { time: "16:00", rainfall: 45 },
  { time: "20:00", rainfall: 38 },
  { time: "24:00", rainfall: 32 },
];

export default function Sensors() {
  const sensorList = [
    {
      id: "A-12",
      name: "Bridge North Station",
      location: "North Watershed",
      level: 450,
      status: "alert",
      battery: 85,
      signal: 95,
    },
    {
      id: "B-05",
      name: "Main Sluice Station",
      location: "Central District",
      level: 320,
      status: "warning",
      battery: 92,
      signal: 88,
    },
    {
      id: "C-08",
      name: "East Reach Station",
      location: "East Watershed",
      level: 150,
      status: "normal",
      battery: 78,
      signal: 91,
    },
    {
      id: "D-01",
      name: "Spillway Station",
      location: "South District",
      level: 110,
      status: "normal",
      battery: 95,
      signal: 97,
    },
    {
      id: "E-15",
      name: "Reservoir Gate",
      location: "Upstream",
      level: 205,
      status: "normal",
      battery: 88,
      signal: 85,
    },
    {
      id: "F-09",
      name: "Drainage Canal",
      location: "West Sector",
      level: 180,
      status: "normal",
      battery: 90,
      signal: 93,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "alert":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case "warning":
        return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950";
      default:
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Sensor Network
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitor all water level and rainfall sensors across the watershed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  All Systems Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Sensors</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">24</p>
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">24 Active</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Critical Level</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">2</p>
              </div>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">Require attention</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Accuracy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">98.5%</p>
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">High precision</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Data Points</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">2.4M</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Last 30 days</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Water Level Trend (24h)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="time" className="text-xs" stroke="#94a3b8" />
                <YAxis className="text-xs" stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorLevel)"
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Rainfall Intensity (24h)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rainfallData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="time" className="text-xs" stroke="#94a3b8" />
                <YAxis className="text-xs" stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rainfall"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">All Sensors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sensor ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Water Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Battery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Signal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sensorList.map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {sensor.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{sensor.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{sensor.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {sensor.level} cm
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${sensor.battery > 80 ? "bg-green-500" : sensor.battery > 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${sensor.battery}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{sensor.battery}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${sensor.signal}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{sensor.signal}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
