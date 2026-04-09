<x-app-layout>
    <div class="max-w-[1600px] mx-auto space-y-6">
        <div class="flex justify-between items-end">
            <div>
                <h1 class="text-2xl font-black tracking-tight">Real-time Water Level Sensors</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm italic">Monitoring network: 4 Active Stations</p>
            </div>
            <div class="flex space-x-2">
                <span class="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full border border-green-500/20 uppercase tracking-widest">System Online</span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border-l-4 border-red-500 shadow-sm relative overflow-hidden">
                <div class="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                    <span>St. A-12 Bridge North</span>
                    <span class="text-red-500 animate-pulse">Alert</span>
                </div>
                <div class="mt-4 flex items-baseline space-x-1">
                    <span class="text-4xl font-black">145</span>
                    <span class="text-sm font-bold text-gray-400">cm</span>
                </div>
                <div class="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="bg-red-500 h-full" style="width: 85%"></div>
                </div>
                <p class="text-[10px] text-red-500 mt-3 font-bold italic">↑ Rising +8cm/hr</p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border-l-4 border-yellow-500 shadow-sm">
                <div class="flex justify-between text-[10px] font-black uppercase text-gray-400">
                    <span>St. B-05 Sluice Gate</span>
                    <span class="text-yellow-500">Warning</span>
                </div>
                <div class="mt-4 flex items-baseline space-x-1">
                    <span class="text-4xl font-black">92</span>
                    <span class="text-sm font-bold text-gray-400">cm</span>
                </div>
                <div class="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="bg-yellow-500 h-full" style="width: 60%"></div>
                </div>
                <p class="text-[10px] text-yellow-600 dark:text-yellow-500 mt-3 font-bold italic">→ Stable</p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border-l-4 border-blue-500 shadow-sm">
                <div class="flex justify-between text-[10px] font-black uppercase text-gray-400">
                    <span>St. C-09 River Bed</span>
                    <span class="text-blue-500">Normal</span>
                </div>
                <div class="mt-4 flex items-baseline space-x-1">
                    <span class="text-4xl font-black">45</span>
                    <span class="text-sm font-bold text-gray-400">cm</span>
                </div>
                <div class="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="bg-blue-500 h-full" style="width: 30%"></div>
                </div>
                <p class="text-[10px] text-blue-500 mt-3 font-bold italic">↓ Falling</p>
            </div>

            <div class="bg-red-600 p-5 rounded-3xl shadow-xl shadow-red-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div class="relative z-10 text-white">
                    <p class="text-[10px] font-black uppercase opacity-80 tracking-widest">Main Status</p>
                    <h3 class="text-4xl font-black mt-2">SIAGA 2</h3>
                    <div class="flex items-center mt-4 space-x-2">
                        <i data-lucide="alert-triangle" class="w-4 h-4 animate-bounce"></i>
                        <span class="text-[10px] font-bold uppercase tracking-tight italic">Action Protocol Active</span>
                    </div>
                </div>
                <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <i data-lucide="waves" class="w-24 h-24 text-white"></i>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div class="lg:col-span-3 space-y-6">
                <div class="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <div class="relative z-10">
                        <div class="flex justify-between items-start">
                            <span class="text-[10px] font-black uppercase tracking-widest opacity-70 italic underline">Weather Status</span>
                            <i data-lucide="cloud-lightning" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-5xl font-black mt-6 tracking-tighter">28°C</h3>
                        <p class="text-xs mt-2 font-bold opacity-90 uppercase">Thunderstorm expected</p>
                        
                        <div class="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/20">
                            <div>
                                <p class="text-[8px] opacity-60 uppercase font-black">Humidity</p>
                                <p class="text-sm font-bold">88%</p>
                            </div>
                            <div>
                                <p class="text-[8px] opacity-60 uppercase font-black">Rainfall</p>
                                <p class="text-sm font-bold">25mm/h</p>
                            </div>
                        </div>
                    </div>
                    <div class="absolute -right-10 top-0 opacity-10">
                        <i data-lucide="cloud-rain" class="w-40 h-40"></i>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border dark:border-gray-700 shadow-sm">
                    <h4 class="text-[10px] font-black uppercase text-gray-400 flex items-center tracking-widest">
                        <i data-lucide="brain" class="w-3 h-3 mr-2 text-blue-500"></i> AI Forecast
                    </h4>
                    <div class="mt-6 flex flex-col items-center">
                        <div class="relative w-28 h-28 flex items-center justify-center">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="8" fill="transparent" class="text-gray-100 dark:text-gray-700" />
                                <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="8" fill="transparent" stroke-dasharray="301.6" stroke-dashoffset="54.3" stroke-linecap="round" class="text-blue-500" />
                            </svg>
                            <span class="absolute text-2xl font-black text-blue-500">82%</span>
                        </div>
                        <div class="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <p class="text-[9px] font-bold text-blue-600 dark:text-blue-400 leading-tight italic">
                                "AI Analysis: Critical overflow risk at St. A-12 predicted within next 45 mins due to upstream volume."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-6 space-y-6">
                <div class="bg-black rounded-[2rem] overflow-hidden shadow-2xl relative group aspect-video">
                    <img src="https://images.unsplash.com/photo-1545239351-ef35f43d514b" class="w-full h-full object-cover opacity-60">
                    
                    <div class="absolute top-6 left-6 flex space-x-2">
                        <span class="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[9px] font-mono text-white uppercase tracking-widest">Cam_01 // South_River_Gate</span>
                        <span class="bg-red-600 px-3 py-1 rounded-full text-[9px] font-black text-white animate-pulse">REC LIVE</span>
                    </div>

                    <div class="absolute top-1/3 left-1/4 w-40 h-28 border-2 border-red-500 bg-red-500/10">
                        <span class="absolute -top-5 left-0 bg-red-500 text-white text-[8px] px-1 font-bold italic tracking-tighter uppercase">Object: Trash_Log (94.2%)</span>
                    </div>

                    <div class="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-[8px] font-mono text-gray-400 uppercase tracking-widest">
                        <span>FPS: 30.2</span>
                        <span>Latency: 18ms</span>
                        <span>Detector: YOLOv8_Nano_AIEWS</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border dark:border-gray-700 shadow-sm">
                    <div class="flex justify-between items-center mb-6">
                        <h4 class="text-xs font-black uppercase text-gray-500 tracking-widest">Trend Analysis (24h)</h4>
                        <span class="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold uppercase">+12cm vs yesterday</span>
                    </div>
                    <div class="h-32 w-full flex items-end space-x-1.5 px-2">
                        @foreach([120, 150, 140, 155, 125, 120, 145, 120, 140, 150, 155, 130, 160] as $h)
                        <div class="flex-1 bg-blue-500/20 dark:bg-blue-500/10 border-t-2 border-blue-500 transition-all hover:bg-blue-600 cursor-pointer" style="height: {{ $h/2 }}%"></div>
                        @endforeach
                    </div>
                </div>
            </div>

            <div class="lg:col-span-3 space-y-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border dark:border-gray-700 shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center">
                            <i data-lucide="bell" class="w-3 h-3 mr-2"></i> System Alerts
                        </h4>
                        <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    </div>
                    <div class="space-y-3">
                        <div class="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl">
                            <p class="text-[9px] font-black text-red-600 uppercase">Critical Blockage</p>
                            <p class="text-[9px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">AI detected large debris at St. B-05. Manual clearing required.</p>
                        </div>
                        <div class="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded-r-xl">
                            <p class="text-[9px] font-black text-yellow-600 uppercase">Status Up: Siaga 2</p>
                            <p class="text-[9px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">Flood protocol level 2 activated for Depok area.</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-4 rounded-[2rem] border dark:border-gray-700 shadow-sm overflow-hidden">
                    <div class="aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl relative overflow-hidden border dark:border-gray-700">
                        <img src="https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/106.8456,-6.2088,13/400x400?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2Z4eGZ4ZHgwMXZ3MnlvNXE4eXN4eXN4In0.example" class="w-full h-full object-cover">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-4 h-4 bg-blue-500 rounded-full animate-ping border-2 border-white"></div>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-between items-center px-2">
                        <span class="text-[8px] font-black uppercase text-gray-400 tracking-widest italic">Ciliwung River Basin</span>
                        <i data-lucide="map-pin" class="w-3 h-3 text-blue-500"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>