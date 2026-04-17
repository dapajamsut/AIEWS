<?php

namespace App\Http\Controllers;

use App\Models\Sensor;
use App\Models\SensorLog;
use App\Models\Threshold;
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

            // ✅ Data log hanya disimpan oleh scheduler (SaveSensorLogCommand)
            //    atau tombol "Simpan Sekarang" (saveLogsNow), BUKAN di sini.
            //    Ini mencegah log penuh dengan data per-detik/milidetik dari hardware.
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
        return Sensor::select('sensor_code', 'type', 'value', 'unit', 'status', 'created_at')
            ->latest()
            ->get()
            ->unique('sensor_code')
            ->values();
    }

    public function saveLogsNow(Request $request)
    {
        $sensors = Sensor::latest()->get()->unique('sensor_code')->values();

        $weatherData  = $request->input('weather_data');
        $siagaLevel   = $request->input('siaga_level');
        $regionName   = $request->input('region_name');

        // batch_id dipakai untuk grouping (1 sesi = semua sensor dengan batch_id yang sama)
        $batchId = now()->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s');
        $count = 0;

        foreach ($sensors as $sensor) {
            SensorLog::create([
                'sensor_code'  => $sensor->sensor_code,
                'value'        => $sensor->value,
                'status'       => $sensor->status,
                'siaga_level'  => $siagaLevel,
                'weather_data' => $weatherData ? json_encode($weatherData) : null,
                'region_name'  => $regionName,
                'batch_id'     => $batchId,
            ]);
            $count++;
        }

        // Update last_logged_at cache juga
        Cache::put('last_logged_at', now()->toISOString(), now()->addDay());

        return response()->json([
            'success'  => true,
            'message'  => "Log berhasil disimpan untuk {$count} sensor.",
            'saved_at' => now()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
            'batch_id' => $batchId,
        ]);
    }

    public function getLoggingSettings()
    {
        return response()->json([
            'enabled'  => Cache::get('logging_enabled', false),
            'interval' => Cache::get('logging_interval', 5), // dalam menit
        ]);
    }

    public function updateLoggingSettings(Request $request)
    {
        $request->validate([
            'enabled'  => 'boolean',
            'interval' => 'integer|min:1|max:1440', // 1 menit – 24 jam
        ]);

        Cache::put('logging_enabled', $request->enabled);
        Cache::put('logging_interval', $request->interval);

        return response()->json(['success' => true]);
    }

    /**
     * GET /api/logs
     * Params: date (Y-m-d, default hari ini), from (H:i), to (H:i)
     * Mengembalikan sesi log dalam format pivot (1 sesi = 1 objek).
     */
    public function getLogs(Request $request)
    {
        $tz   = 'Asia/Jakarta';
        $date = $request->input('date', now()->setTimezone($tz)->format('Y-m-d'));
        $from = $request->input('from', '00:00');
        $to   = $request->input('to',   '23:59');

        // 🔥 Parse dalam timezone WIB lalu konversi ke UTC untuk query database
        $fromDt = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "{$date} {$from}:00", $tz)->utc();
        $toDt   = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "{$date} {$to}:59", $tz)->utc();

        $logs = SensorLog::whereBetween('created_at', [$fromDt, $toDt])
            ->orderByDesc('created_at')
            ->get();

        // Kelompokkan per sesi (batch_id, atau per detik dalam WIB jika batch_id kosong)
        $groups = $logs->groupBy(fn ($l) =>
            $l->batch_id ?? \Carbon\Carbon::parse($l->created_at)->setTimezone($tz)->format('Y-m-d H:i:s')
        );

        $sensorOrder = ['ANEMO-01', 'TIP-01', 'WATER-01', 'BME-TEMP', 'BME-HUM', 'BME-PRES'];

        $sessions = $groups->map(function ($entries) use ($sensorOrder, $tz) {
            $first   = $entries->first();
            $weather = is_array($first->weather_data)
                ? $first->weather_data
                : json_decode($first->weather_data ?? '{}', true);

            $sensorMap = $entries->pluck('value', 'sensor_code');

            // Tentukan status sesi: WARNING jika salah satu sensor WARNING
            $anyWarning = $entries->contains(fn ($e) => $e->status === 'WARNING');

            return [
                'batch_id'    => $first->batch_id,
                'time'        => \Carbon\Carbon::parse($first->created_at)
                                    ->setTimezone($tz)->format('H:i:s'),
                'created_at'  => $first->created_at,
                'siaga_level' => $first->siaga_level,
                'region_name' => $first->region_name,
                'status'      => $anyWarning ? 'WARNING' : 'NORMAL',
                'weather'     => $weather,
                'sensors'     => collect($sensorOrder)->mapWithKeys(fn ($c) => [
                    $c => $sensorMap->get($c) !== null ? (float) $sensorMap->get($c) : null,
                ]),
            ];
        })->values();

        return response()->json([
            'date'     => $date,
            'from'     => $from,
            'to'       => $to,
            'total'    => $sessions->count(),
            'sessions' => $sessions,
        ]);
    }

    /**
     * POST /api/weather-cache
     * Frontend mengirim data cuaca, siaga, dan region agar scheduler bisa memakainya.
     */
    public function cacheWeatherData(Request $request)
    {
        Cache::put('last_weather_data', $request->input('weather_data'),  now()->addHours(2));
        Cache::put('last_siaga_level',  $request->input('siaga_level', 'SIAGA 3'), now()->addHours(2));
        Cache::put('last_region_name',  $request->input('region_name'),  now()->addHours(2));

        return response()->json(['success' => true]);
    }

    /**
     * GET /api/logs/exports
     * Mengembalikan daftar file CSV ekspor harian yang tersedia.
     */
    public function getExports()
    {
        $files = \Storage::disk('local')->files('exports');
        $list  = collect($files)
            ->filter(fn ($f) => str_ends_with($f, '.csv'))
            ->map(fn ($f) => [
                'filename' => basename($f),
                'date'     => str_replace(['log_', '.csv'], '', basename($f)),
                'size_kb'  => round(\Storage::disk('local')->size($f) / 1024, 1),
                'url'      => url('api/logs/exports/' . basename($f)),
            ])
            ->sortByDesc('date')
            ->values();

        return response()->json($list);
    }

    /**
     * GET /api/logs/exports/{filename}
     * Download file CSV ekspor harian.
     */
    public function downloadExport(string $filename)
    {
        // Sanitasi nama file
        $filename = basename($filename);
        $path     = "exports/{$filename}";

        if (!\Storage::disk('local')->exists($path)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return \Storage::disk('local')->download($path);
    }

    private function getThresholds(): array
    {
        $threshold = Threshold::first();

        if (!$threshold) {
            return [
                'siaga1' => ['wind' => 20, 'rain' => 100, 'water' => 400, 'temp' => 40, 'humidity' => 95, 'pressure' => 1030],
                'siaga2' => ['wind' => 15, 'rain' => 70, 'water' => 300, 'temp' => 35, 'humidity' => 85, 'pressure' => 1010],
                'siaga3' => ['wind' => 10, 'rain' => 30, 'water' => 150, 'temp' => 30, 'humidity' => 70, 'pressure' => 1000],
            ];
        }

        return [
            'siaga1' => [
                'wind' => $threshold->wind_siaga1,
                'rain' => $threshold->rain_siaga1,
                'water' => $threshold->water_siaga1,
                'temp' => $threshold->temp_siaga1,
                'humidity' => $threshold->humidity_siaga1,
                'pressure' => $threshold->pressure_siaga1,
            ],
            'siaga2' => [
                'wind' => $threshold->wind_siaga2,
                'rain' => $threshold->rain_siaga2,
                'water' => $threshold->water_siaga2,
                'temp' => $threshold->temp_siaga2,
                'humidity' => $threshold->humidity_siaga2,
                'pressure' => $threshold->pressure_siaga2,
            ],
            'siaga3' => [
                'wind' => $threshold->wind_siaga3,
                'rain' => $threshold->rain_siaga3,
                'water' => $threshold->water_siaga3,
                'temp' => $threshold->temp_siaga3,
                'humidity' => $threshold->humidity_siaga3,
                'pressure' => $threshold->pressure_siaga3,
            ],
        ];
    }

    private function getStatus($type, $value)
    {
        $thresholds = $this->getThresholds();
        $siaga1 = $thresholds['siaga1'][$type] ?? null;
        $siaga2 = $thresholds['siaga2'][$type] ?? null;

        if ($siaga1 !== null && $value >= $siaga1) {
            return 'WARNING';
        }

        if ($siaga2 !== null && $value >= $siaga2) {
            return 'WARNING';
        }

        return 'NORMAL';
    }

    public function getSiagaStatus()
    {
        // Ambil data terbaru tinggi air dari sensor WATER-01
        $waterSensor = Sensor::where('sensor_code', 'WATER-01')->latest()->first();
        $value = $waterSensor ? (float) $waterSensor->value : 0;

        $thresholds = $this->getThresholds();

        // Siaga 1 = Paling Bahaya
        if ($value >= ($thresholds['siaga1']['water'] ?? 400)) {
            return response('1', 200)->header('Content-Type', 'text/plain');
        }

        // Siaga 2 = Waspada Tinggi
        if ($value >= ($thresholds['siaga2']['water'] ?? 300)) {
            return response('2', 200)->header('Content-Type', 'text/plain');
        }

        // Siaga 3 = Normal / Aman
        return response('3', 200)->header('Content-Type', 'text/plain');
    }
}