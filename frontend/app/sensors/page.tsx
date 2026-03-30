"use client";

import { useState } from "react";
import { Activity, TrendingUp, Search, Filter } from "lucide-react";
// 1. INI YANG GUE BENERIN: Import langsung ke komponen Sidebar, bukan ke file metadata
import Layout from "@/app/components/layout/Layout"; 
import { SensorCard } from "@/app/components/SensorCard";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// WAJIB PAKE 'export default' buat file di dalam folder app
export default function SensorPage() {
  const [selectedSensor, setSelectedSensor] = useState("A-12");

  const sensors = [
    { id: "A-12 BRIDGE NORTH", location: "North Gate Bridge", value: 450, unit: "cm", status: "alert" as const, trend: "rising" as const, target: 300 },
    { id: "B-05 MAIN SLUICE", location: "Main Sluice Gate", value: 320, unit: "cm", status: "warning" as const, trend: "steady" as const, target: 250 },
    { id: "C-09 EAST REACH", location: "East Reach Station", value: 150, unit: "cm", status: "normal" as const, trend: "falling" as const, target: 180 },
    { id: "D-01 SPILLWAY", location: "Spillway Control", value: 110, unit: "cm", status: "normal" as const, trend: "falling" as const, target: 200 },
    { id: "E-03 UPSTREAM", location: "Upstream Monitor", value: 275, unit: "cm", status: "warning" as const, trend: "rising" as const, target: 220 },
    { id: "F-07 DOWNSTREAM", location: "Downstream Station", value: 95, unit: "cm", status: "normal" as const, trend: "steady" as const, target: 150 },
  ];

  const historicalData = [
    { time: "00:00", level: 280, rainfall: 12 },
    { time: "02:00", level: 295, rainfall: 18 },
    { time: "04:00", level: 315, rainfall: 25 },
    { time: "06:00", level: 340, rainfall: 35 },
    { time: "08:00", level: 380, rainfall: 42 },
    { time: "10:00", level: 420, rainfall: 45 },
    { time: "12:00", level: 450, rainfall: 38 },
  ];

  const comparisonData = [
    { time: "00:00", "A-12": 280, "B-05": 245, "C-09": 165 },
    { time: "02:00", "A-12": 295, "B-05": 260, "C-09": 162 },
    { time: "04:00", "A-12": 315, "B-05": 278, "C-09": 158 },
    { time: "06:00", "A-12": 340, "B-05": 295, "C-09": 155 },
    { time: "08:00", "A-12": 380, "B-05": 310, "C-09": 152 },
    { time: "10:00", "A-12": 420, "B-05": 320, "C-09": 150 },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Sensor Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive water level and rainfall sensor data
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search sensors by ID or location..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="size-4" />
            Filter
          </Button>
        </div>

        {/* All Sensors Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Active Sensors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map((sensor) => (
              <SensorCard key={sensor.id} {...sensor} />
            ))}
          </div>
        </div>

        {/* Detailed Analytics */}
        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Activity className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              Sensor Analytics & Trends
            </h3>
          </div>

          <Tabs defaultValue="historical" className="space-y-4">
            <TabsList className="grid w-full max-md grid-cols-2">
              <TabsTrigger value="historical">Historical Data</TabsTrigger>
              <TabsTrigger value="comparison">Multi-Sensor Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="historical" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Water level and rainfall correlation (Last 12 hours)
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Selected:</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {selectedSensor}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" label={{ value: 'Water Level (cm)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" label={{ value: 'Rainfall (mm/h)', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(17 24 39)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="level"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorLevel)"
                    name="Water Level (cm)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="rainfall"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#colorRain)"
                    name="Rainfall (mm/h)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comparative water levels across multiple sensors (Last 10 hours)
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" label={{ value: 'Water Level (cm)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(17 24 39)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="A-12" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 4 }} name="A-12 Bridge North" />
                  <Line type="monotone" dataKey="B-05" stroke="#ea580c" strokeWidth={2} dot={{ fill: '#ea580c', r: 4 }} name="B-05 Main Sluice" />
                  <Line type="monotone" dataKey="C-09" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 4 }} name="C-09 East Reach" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-10">
          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sensors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">6</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Activity className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alert Status</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">1</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-950 rounded-lg">
                <TrendingUp className="size-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Warning Status</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">2</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <TrendingUp className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Normal Status</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">3</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                <Activity className="size-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}