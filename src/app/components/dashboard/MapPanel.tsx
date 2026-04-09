import React from 'react';
import { Card } from '../ui/card';
import { MapPin, Navigation } from 'lucide-react';

export function MapPanel() {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Lokasi Monitoring</h3>
          </div>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Lihat Peta Lengkap
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
        {/* Mock Map Display */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30">
          {/* Map Grid Pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(#9CA3AF 1px, transparent 1px), linear-gradient(90deg, #9CA3AF 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          {/* Location Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Pulsing Circle */}
              <div className="absolute -inset-4 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
              <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-50"></div>
              
              {/* Main Marker */}
              <div className="relative bg-blue-600 rounded-full p-3 shadow-lg">
                <Navigation className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Coordinates Display */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">Koordinat</div>
            <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
              -6.2088, 106.8456
            </div>
          </div>

          {/* Location Info */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">Lokasi</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Sungai Ciliwung, Jakarta
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Elevasi</div>
          <div className="font-semibold text-gray-900 dark:text-white">12 mdpl</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Jarak Pantau</div>
          <div className="font-semibold text-gray-900 dark:text-white">2.3 km</div>
        </div>
      </div>
    </Card>
  );
}
