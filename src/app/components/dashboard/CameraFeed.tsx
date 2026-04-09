import { Maximize2, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function CameraFeed() {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg relative group">
      <div className="aspect-video relative">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=450&fit=crop"
          alt="River monitoring camera"
          className="w-full h-full object-cover"
        />
        
        {/* Camera Info Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">CAM-04 - MAIN RIVER DOCK</p>
            <p className="text-slate-300 text-xs">FPS: 30 | LATENCY: 45ms | SCALE: 1:5</p>
          </div>
          <button className="bg-black/70 backdrop-blur-sm p-2 rounded-lg hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100">
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* AI Detection Overlays */}
        <div className="absolute top-1/3 left-1/4 w-48 h-32">
          <div className="border-2 border-red-500 rounded-lg relative">
            <div className="absolute -top-6 left-0 bg-red-500 px-2 py-1 rounded text-xs text-white font-semibold">
              DEBRIS 94%
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 right-1/4 w-56 h-40">
          <div className="border-2 border-orange-500 rounded-lg relative">
            <div className="absolute -top-6 left-0 bg-orange-500 px-2 py-1 rounded text-xs text-white font-semibold">
              VEGETATION 78%
            </div>
          </div>
        </div>

        {/* Alert Badge */}
        <div className="absolute bottom-4 left-4 bg-red-600 px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Debris Detected</span>
        </div>

        {/* Live Indicator */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
      </div>
    </div>
  );
}
