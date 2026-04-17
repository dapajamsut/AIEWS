<!DOCTYPE html>
<html lang="en" x-data="{ 
    darkMode: localStorage.getItem('theme') === 'dark',
    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    }
}" :class="{ 'dark': darkMode }">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MakeSens AIEWS</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="antialiased font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
    <div class="flex h-screen overflow-hidden">
        
        <aside class="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300">
            <div class="p-8 flex items-center space-x-3">
                <div class="text-blue-500"><i data-lucide="droplets" class="w-8 h-8"></i></div>
                <div>
                    <h1 class="font-bold text-xl leading-none">MakeSens</h1>
                    <p class="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">AIEWS Platform</p>
                </div>
            </div>

            <nav class="flex-1 px-4 space-y-2 mt-4">
                <a href="{{ route('dashboard') }}" class="flex items-center p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
                    <i data-lucide="layout-grid" class="mr-3 w-5 h-5"></i> Dashboard
                </a>
                <a href="#" class="flex items-center p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    <i data-lucide="video" class="mr-3 w-5 h-5"></i> Live AI Vision
                </a>
                <a href="#" class="flex items-center p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    <i data-lucide="file-text" class="mr-3 w-5 h-5"></i> Log Sensor
                </a>
            </nav>

            <div class="p-4 mx-4 mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center">
                <p class="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Version 1.0.0</p>
            </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="h-20 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-between px-10 transition-colors duration-300">
                
                <div class="flex flex-col" x-data="{ 
                    time: '', 
                    date: '',
                    updateTime() {
                        const now = new Date();
                        this.time = now.toLocaleTimeString('id-ID', { hour12: false });
                        this.date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    },
                    init() { this.updateTime(); setInterval(() => this.updateTime(), 1000); } 
                }">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="clock" class="w-4 h-4 text-gray-400"></i>
                        <span class="font-bold text-lg tracking-wider" x-text="time"></span>
                    </div>
                    <span class="text-[10px] text-gray-400 font-medium uppercase" x-text="date"></span>
                </div>

                <div class="flex items-center space-x-6">
                    <button @click="toggleTheme()" class="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:ring-2 ring-blue-500/20 transition-all duration-300 shadow-sm">
                        <div x-show="!darkMode" class="flex items-center text-gray-600">
                            <i data-lucide="moon" class="w-4 h-4 mr-2"></i>
                            <span class="text-[10px] font-bold uppercase">Dark Mode</span>
                        </div>
                        <div x-show="darkMode" class="flex items-center text-yellow-400">
                            <i data-lucide="sun" class="w-4 h-4 mr-2"></i>
                            <span class="text-[10px] font-bold uppercase text-white">Light Mode</span>
                        </div>
                    </button>

                    <div class="flex items-center space-x-3 pl-6 border-l dark:border-gray-700">
                        <div class="text-right">
                            <p class="text-sm font-bold leading-none">{{ Auth::user()->name }}</p>
                            <p class="text-[10px] text-gray-400 mt-1 uppercase font-medium">Admin</p>
                        </div>
                        <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white dark:border-gray-800 shadow-lg">
                            {{ substr(Auth::user()->name, 0, 1) }}
                        </div>
                    </div>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-10 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                {{ $slot }}
            </main>
        </div>
    </div>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>lucide.createIcons();</script>
</body>
</html>