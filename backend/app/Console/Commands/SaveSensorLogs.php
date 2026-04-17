<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sensor;
use App\Models\SensorLog;

class SaveSensorLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sensors:save-logs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Save current sensor data to logs every 5 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Fetch all sensors
        $sensors = Sensor::all();

        foreach ($sensors as $sensor) {
            // Create log entry
            SensorLog::create([
                'sensor_code' => $sensor->sensor_code,
                'value' => $sensor->value,
                'status' => $sensor->status,
            ]);
        }

        $this->info('Sensor logs saved successfully for ' . $sensors->count() . ' sensors.');
    }
}