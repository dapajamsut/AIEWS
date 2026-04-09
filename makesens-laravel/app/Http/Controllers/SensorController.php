<?php

namespace App\Http\Controllers;

use App\Models\Sensor;
use App\Models\SensorLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SensorController extends Controller
{
    public function store(Request $request)
{
    try {

        $results = [];

        foreach ($request->all() as $sensor) {

            // 🔒 VALIDASI BIAR GAK CRASH
            if (!isset($sensor['sensor_code'], $sensor['type'], $sensor['value'], $sensor['unit'])) {
                return response()->json([
                    'error' => 'Format data salah',
                    'data' => $sensor
                ], 400);
            }

            $status = $this->getStatus($sensor['type'], $sensor['value']);

            // ✅ SIMPAN KE sensors (data terbaru)
            $results[] = Sensor::create([
                'sensor_code' => $sensor['sensor_code'],
                'type' => $sensor['type'],
                'value' => $sensor['value'],
                'unit' => $sensor['unit'],
                'status' => $status
            ]);

            // 🔥 SIMPAN KE LOG (HISTORI)
            try {
                SensorLog::create([
                    'sensor_code' => $sensor['sensor_code'],
                    'value' => $sensor['value'],
                    'status' => $status
                ]);
            } catch (\Exception $e) {
                \Log::error('SensorLog gagal: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true
        ]);

    } catch (\Exception $e) {

        return response()->json([
            'error' => $e->getMessage()
        ], 500);
    }
}
    public function latest()
    {
        return Sensor::select('sensor_code', 'type', 'value', 'unit', 'status')
            ->latest()
            ->get()
            ->unique('sensor_code')
            ->values();
    }

    public function saveLogsNow()
    {
        $sensors = Sensor::all();

        foreach ($sensors as $sensor) {
            SensorLog::create([
                'sensor_code' => $sensor->sensor_code,
                'value' => $sensor->value,
                'status' => $sensor->status,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logs saved for ' . $sensors->count() . ' sensors.'
        ]);
    }

    public function getLoggingSettings()
    {
        return response()->json([
            'enabled' => Cache::get('logging_enabled', false),
            'interval' => Cache::get('logging_interval', 5), // default 5 minutes
        ]);
    }

    public function updateLoggingSettings(Request $request)
    {
        $request->validate([
            'enabled' => 'boolean',
            'interval' => 'integer|in:2,5,10',
        ]);

        Cache::put('logging_enabled', $request->enabled);
        Cache::put('logging_interval', $request->interval);

        return response()->json(['success' => true]);
    }

    private function getStatus($type, $value)
    {
        if ($type == 'water') {
            return $value > 300 ? 'WARNING' : 'NORMAL';
        }

        if ($type == 'rain') {
            return $value > 50 ? 'WARNING' : 'NORMAL';
        }

        return 'NORMAL';
    }
}