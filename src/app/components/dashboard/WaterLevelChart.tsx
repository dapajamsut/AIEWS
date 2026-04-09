import React from 'react';
import { Card } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Generate mock data for 24 hours
const generateData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      tma: Math.floor(120 + Math.random() * 40),
      rainfall: Math.floor(Math.random() * 30),
    });
  }
  
  return data;
};

const data = generateData();

export function WaterLevelChart() {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tren Tinggi Muka Air (24 Jam)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Data real-time dari sensor IoT</p>
        </div>
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-medium">+12cm dari kemarin</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTma" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'TMA (cm)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Area 
            type="monotone" 
            dataKey="tma" 
            stroke="#3B82F6" 
            strokeWidth={2}
            fill="url(#colorTma)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
