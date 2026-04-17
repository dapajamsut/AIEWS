<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Jalankan setiap menit; command itu sendiri yang memutuskan
        // apakah sudah waktunya berdasarkan logging_interval di cache.
        $schedule->command('log:save-sensors')->everyMinute();

        // Export harian + hapus log, tepat tengah malam (WIB)
        $schedule->command('log:daily-export')->dailyAt('00:00')->timezone('Asia/Jakarta');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}