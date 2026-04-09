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
        // Schedule the save sensor logs command based on settings
        if (\Cache::get('logging_enabled', false)) {
            $interval = \Cache::get('logging_interval', 5);
            switch ($interval) {
                case 2:
                    $schedule->command('sensors:save-logs')->everyTwoMinutes();
                    break;
                case 5:
                    $schedule->command('sensors:save-logs')->everyFiveMinutes();
                    break;
                case 10:
                    $schedule->command('sensors:save-logs')->everyTenMinutes();
                    break;
            }
        }
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