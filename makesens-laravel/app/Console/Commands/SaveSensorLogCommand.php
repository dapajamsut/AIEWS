<?php

namespace App\Console\Commands;

use App\Models\Sensor;
use App\Models\SensorLog;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SaveSensorLogCommand extends Command
{
    protected $signature   = 'log:save-sensors';
    protected $description = 'Simpan snapshot sensor ke log (dipanggil scheduler setiap menit, memeriksa sendiri apakah waktunya)';

    public function handle(): void
    {
        $enabled  = Cache::get('logging_enabled', false);
        $interval = (int) Cache::get('logging_interval', 5); // menit

        if (!$enabled) {
            $this->info('Logging nonaktif, skip.');
            return;
        }

        // Periksa apakah sudah waktunya berdasarkan last_logged_at
        $lastLogged = Cache::get('last_logged_at');
        $now        = Carbon::now('Asia/Jakarta');

        if ($lastLogged) {
            $last         = Carbon::parse($lastLogged);
            $minutesPast  = $last->diffInMinutes($now, true);

            if ($minutesPast < $interval) {
                $this->info("Belum waktunya. Interval: {$interval} mnt, sudah: {$minutesPast} mnt.");
                return;
            }
        }

        $sensors = Sensor::latest()->get()->unique('sensor_code')->values();

        if ($sensors->isEmpty()) {
            $this->warn('Tidak ada data sensor yang tersedia.');
            return;
        }

        // Ambil data cuaca & siaga yang terakhir dikirim dari frontend
        $weatherData = Cache::get('last_weather_data');
        $siagaLevel  = Cache::get('last_siaga_level', 'SIAGA 3');
        $regionName  = Cache::get('last_region_name');

        // batch_id = timestamp sesi ini, dipakai untuk grouped query
        $batchId = $now->format('Y-m-d H:i:s');

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
        }

        // Simpan waktu log terakhir
        Cache::put('last_logged_at', $now->toISOString(), now()->addDay());

        $this->info("✅ Log tersimpan: {$sensors->count()} sensor | sesi: {$batchId}");
    }
}
