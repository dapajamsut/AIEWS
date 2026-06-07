<?php

namespace App\Http\Controllers;

use App\Models\Sensor;
use App\Models\Threshold;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiPredictionController extends Controller
{
    /**
     * POST /api/ai-prediction
     *
     * Mengambil data sensor terbaru, menghitung status siaga,
     * lalu meneruskan ke FastAPI dan mengembalikan hasilnya ke frontend.
     */
    public function predict(Request $request)
    {
        // ── 1. Ambil sensor terbaru ──────────────────────────────────────
        $sensors = Sensor::latest()->get()->unique('sensor_code')->keyBy('type');

        $wind     = (float) ($sensors['wind']->value     ?? 0);
        $rain     = (float) ($sensors['rain']->value     ?? 0);
        $water    = (float) ($sensors['water']->value    ?? 0);
        $temp     = (float) ($sensors['temp']->value     ?? 0);
        $humidity = (float) ($sensors['humidity']->value ?? 0);
        $pressure = (float) ($sensors['pressure']->value ?? 0);

        // ── 2. Hitung Status_Siaga (1 = Siaga 1, 2 = Siaga 2, 3 = Normal) ─
        $threshold = Threshold::first();

        $siagaLevel = 3; // default: normal / aman

        if ($threshold) {
            $waterSiaga1 = $threshold->water_siaga1 ?? $threshold->siaga1 ?? 400;
            $rainSiaga1 = $threshold->rain_siaga1 ?? 100;
            $windSiaga1 = $threshold->wind_siaga1 ?? 20;
            $tempSiaga1 = $threshold->temp_siaga1 ?? 40;
            $humiditySiaga1 = $threshold->humidity_siaga1 ?? 95;
            $pressureSiaga1 = $threshold->pressure_siaga1 ?? 1030;

            $waterSiaga2 = $threshold->water_siaga2 ?? $threshold->siaga2 ?? 300;
            $rainSiaga2 = $threshold->rain_siaga2 ?? 70;
            $windSiaga2 = $threshold->wind_siaga2 ?? 15;
            $tempSiaga2 = $threshold->temp_siaga2 ?? 35;
            $humiditySiaga2 = $threshold->humidity_siaga2 ?? 85;
            $pressureSiaga2 = $threshold->pressure_siaga2 ?? 1010;

            if (
                $water    >= $waterSiaga1    ||
                $rain     >= $rainSiaga1     ||
                $wind     >= $windSiaga1     ||
                $temp     >= $tempSiaga1     ||
                $humidity >= $humiditySiaga1 ||
                $pressure >= $pressureSiaga1
            ) {
                $siagaLevel = 1;
            } elseif (
                $water    >= $waterSiaga2    ||
                $rain     >= $rainSiaga2     ||
                $wind     >= $windSiaga2     ||
                $temp     >= $tempSiaga2     ||
                $humidity >= $humiditySiaga2 ||
                $pressure >= $pressureSiaga2
            ) {
                $siagaLevel = 2;
            }
        }

        // ── 3. Hitung Selisih air vs 1 jam lalu & akumulasi hujan 2 jam ─
        // Ambil log sensor water & rain dari 2 jam terakhir untuk menghitung delta
        $oneHourAgo  = now()->subHour();
        $twoHoursAgo = now()->subHours(2);

        $waterLogHourAgo = \App\Models\SensorLog::where('sensor_code', 'WATER-01')
            ->where('created_at', '>=', $oneHourAgo)
            ->orderBy('created_at')
            ->first();

        $rainLogs2h = \App\Models\SensorLog::where('sensor_code', 'TIP-01')
            ->where('created_at', '>=', $twoHoursAgo)
            ->get();

        $selisihAir    = $waterLogHourAgo ? round($water - (float) $waterLogHourAgo->value, 2) : 0;
        $akumulasiHujan = $rainLogs2h->sum(fn ($l) => (float) $l->value);

        // ── 4. Susun body untuk FastAPI ──────────────────────────────────
        $body = [
            'Kecepatan_Angin_ms'    => $wind,
            'Curah_Hujan_mm_h'      => $rain,
            'Tinggi_Air_cm'         => $water,
            'Suhu_Celcius'          => $temp,
            'Kelembapan_Persen'     => $humidity,
            'Tekanan_Udara_hPa'     => $pressure,
            'Status_Siaga'          => $siagaLevel,
            'Selisih_Air_1_Jam_Lalu' => $selisihAir,
            'Akumulasi_Hujan_2_Jam' => $akumulasiHujan,
        ];

        // ── 5. Call FastAPI ──────────────────────────────────────────────
        try {
            $fastApiUrl = config('services.fastapi.url', 'http://192.168.0.100:8000');

            $response = Http::timeout(10)
                ->post("{$fastApiUrl}/predict", $body);

            if ($response->failed()) {
                Log::warning('FastAPI prediction request failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return response()->json([
                    'error'   => 'FastAPI returned an error.',
                    'details' => $response->body(),
                ], 502);
            }

            $result = $response->json();

            // Sertakan data sensor yang dikirim agar frontend bisa debug jika perlu
            return response()->json([
                'prediction' => $result,
                'input'      => $body,
                'siaga_level' => $siagaLevel,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('FastAPI connection error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Tidak dapat terhubung ke AI server. Pastikan FastAPI berjalan.',
            ], 503);
        }
    }
}
