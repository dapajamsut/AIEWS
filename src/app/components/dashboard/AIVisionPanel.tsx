import React from 'react';
import { Card } from '../ui/card';
import { Video, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function AIVisionPanel() {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Vision Monitor</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">LIVE</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-gray-900">
        {/* CCTV Feed Background */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1600069620961-8bee77c2e28a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDQ1RWJTIwY2FtZXJhJTIwc3VydmVpbGxhbmNlJTIwd2F0ZXJ8ZW58MXx8fHwxNzczMDkzMTMwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="CCTV Feed"
          className="w-full h-full object-cover opacity-80"
        />

        {/* AI Detection Overlays */}
        <div className="absolute inset-0">
          {/* Bounding Box for Debris Detection */}
          <div className="absolute top-1/4 left-1/4 w-32 h-24 border-2 border-red-500 rounded">
            <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Sampah: 87%
            </div>
          </div>

          {/* Bounding Box for Water Level */}
          <div className="absolute top-1/2 right-1/4 w-40 h-32 border-2 border-yellow-500 rounded">
            <div className="absolute -top-6 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
              TMA: 145cm
            </div>
          </div>

          {/* TDI Indicator */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
            <div className="text-xs mb-1">Trash Detection Index</div>
            <div className="text-2xl font-bold text-red-400">42%</div>
          </div>

          {/* Timestamp */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-xs">
            {new Date().toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>

      {/* Detection Stats */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Objek Terdeteksi</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">23</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sampah</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">8</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Akurasi AI</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">94%</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
