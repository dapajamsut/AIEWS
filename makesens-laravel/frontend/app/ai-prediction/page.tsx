"use client";

import { useState } from "react";
import { 
  Brain, 
  Sparkles,
  Cloud
} from "lucide-react";
import Layout from "@/app/components/layout/Layout";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { AIPrediction } from "@/app/components/AIPrediction";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function WeatherAIPage() {
  const [aiNotes] = useState([
    {
      id: 1,
      timestamp: "10:30 AM - Mar 10, 2026",
      note: "Based on current weather patterns, rainfall intensity expected to increase by 20% in next 2 hours. Recommend activating secondary pumps.",
      type: "prediction",
    },
    {
      id: 2,
      timestamp: "09:15 AM - Mar 10, 2026",
      note: "Correlation analysis shows strong relationship between upstream rainfall and Station A-12 water levels with 3.5-hour lag time.",
      type: "analysis",
    },
    {
      id: 3,
      timestamp: "08:45 AM - Mar 10, 2026",
      note: "Weather satellite imagery indicates storm system moving southeast. Estimated arrival: 11:00 AM. Prepare for heavy rainfall event.",
      type: "alert",
    },
  ]);

  const forecastData = [
    { time: "Now", temp: 28, rainfall: 45, humidity: 88 },
    { time: "+1h", temp: 27, rainfall: 52, humidity: 90 },
    { time: "+2h", temp: 26, rainfall: 58, humidity: 92 },
    { time: "+3h", temp: 26, rainfall: 48, humidity: 91 },
    { time: "+4h", temp: 27, rainfall: 35, humidity: 87 },
    { time: "+5h", temp: 28, rainfall: 22, humidity: 82 },
    { time: "+6h", temp: 29, rainfall: 15, humidity: 78 },
  ];

  const rainfallData = [
    { hour: "06:00", actual: 25, predicted: 22 },
    { hour: "07:00", actual: 32, predicted: 30 },
    { hour: "08:00", actual: 38, predicted: 35 },
    { hour: "09:00", actual: 42, predicted: 40 },
    { hour: "10:00", actual: 45, predicted: 45 },
    { hour: "11:00", actual: null, predicted: 52 },
    { hour: "12:00", actual: null, predicted: 58 },
    { hour: "13:00", actual: null, predicted: 48 },
  ];

  const getNoteIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />;
      case "analysis":
        return <Brain className="size-4 text-blue-600 dark:text-blue-400" />;
      case "alert":
        return <Cloud className="size-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Brain className="size-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNoteColor = (type: string) => {
    switch (type) {
      case "prediction":
        return "border-l-purple-600 dark:border-l-purple-400 bg-purple-50 dark:bg-purple-950/20";
      case "analysis":
        return "border-l-blue-600 dark:border-l-blue-400 bg-blue-50 dark:bg-blue-950/20";
      case "alert":
        return "border-l-orange-600 dark:border-l-orange-400 bg-orange-50 dark:bg-orange-950/20";
      default:
        return "border-l-gray-600 dark:border-l-gray-400 bg-gray-50 dark:bg-gray-800/50";
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            AI Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered weather forecasting and intelligent notes system
          </p>
        </div>

        {/* AI Prediction Row */}
        <div className="grid grid-cols-1 gap-6">
          <AIPrediction
            probability={82}
            timeframe="6h"
            predictedAt="16:45"
            note="Forecast indicates upstream discharge will reach Station A-12 in approx. 4 hours. Prepare secondary retention basin."
            confidenceLevel={87}
          />
        </div>

        {/* Interactive Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 uppercase text-sm">
              6-Hour Weather Forecast
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(17 24 39)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rainfall"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Rainfall (mm/h)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temp"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Temperature (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-sm">
                AI Prediction vs Actual
              </h3>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200 dark:border-purple-900">
                <Brain className="size-3 mr-1" />
                AI Model V.1
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rainfallData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(17 24 39)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
                <Legend />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                <Bar dataKey="predicted" fill="#8b5cf6" name="AI Predicted" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* AI Intelligence Observation Notes */}
        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 pb-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-md">
              <Brain className="size-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              AI Intelligence Observation Notes
            </h3>
          </div>

          <div className="space-y-4">
            {aiNotes.map((note) => (
              <div
                key={note.id}
                className={`border-l-4 ${getNoteColor(note.type)} p-5 rounded-r-xl shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {getNoteIcon(note.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {note.timestamp}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                        {note.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {note.note}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}