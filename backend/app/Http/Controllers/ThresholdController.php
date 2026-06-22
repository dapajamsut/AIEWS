<?php

namespace App\Http\Controllers;

use App\Models\Threshold;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

class ThresholdController extends Controller
{
    public function index()
    {
        $type = request()->query('type', 'siaga'); // 'siaga' or 'weather'
        $threshold = Threshold::first();

        if (!$threshold) {
            $threshold = Threshold::create($this->defaultThresholdRow());
        }

        return response()->json($this->formatThresholdResponse($threshold, $type));
    }

    public function store(Request $request)
    {
        $type = $request->input('type', 'siaga');

        if ($type === 'siaga') {
            $request->validate([
                'type' => 'required|string|in:siaga,weather',
                'level' => 'required|integer|in:1,2,3',
                'water' => 'required|integer|min:0',
            ]);

            $threshold = Threshold::first();
            if (!$threshold) {
                $threshold = Threshold::create($this->defaultThresholdRow());
            }

            $level = $request->input('level');
            $column = $this->getSiagaColumn($threshold, $level);
            $waterValue = $request->input('water');

            // Log the update for debugging
            \Log::info("Updating threshold column: {$column} with value: {$waterValue} for level: {$level}");

            $threshold->update([
                $column => $waterValue,
            ]);

            // Reload fresh data from database to ensure consistency
            $threshold = Threshold::find($threshold->id);

            // ✅ PUBLISH STATUS BARU VIA MQTT (LANGSUNG KE ESP32)
            try {
                // Ambil nilai sensor air paling terakhir
                $waterSensor = \App\Models\Sensor::where('sensor_code', 'WATER-01')->latest()->first();
                $actualWater = $waterSensor ? (float) $waterSensor->value : 0;
                
                $siagaStatus = '3'; // Default Normal
                // Sensor ultrasonik: jarak KECIL = air TINGGI = BAHAYA → pakai <=
                $batasSiaga1 = $threshold->getAttribute('water_siaga1') ?? $threshold->getAttribute('siaga1') ?? 50;
                $batasSiaga2 = $threshold->getAttribute('water_siaga2') ?? $threshold->getAttribute('siaga2') ?? 100;

                if ($actualWater <= $batasSiaga1) {
                    $siagaStatus = '1'; // jarak <= siaga1 = air sangat tinggi = BAHAYA
                } elseif ($actualWater <= $batasSiaga2) {
                    $siagaStatus = '2'; // jarak <= siaga2 = air sedang tinggi = WASPADA
                }

                $server   = env('MQTT_HOST', 'broker.hivemq.com');
                $port     = env('MQTT_PORT', 1883);
                $clientId = 'makesens_api_' . uniqid();
                $topicOut = env('MQTT_TOPIC_SIAGA', 'makesens/test/tmj/siaga');
                $username = env('MQTT_USERNAME');
                $password = env('MQTT_PASSWORD');

                $mqtt = new \PhpMqtt\Client\MqttClient($server, $port, $clientId);

                $connectionSettings = (new \PhpMqtt\Client\ConnectionSettings())
                    ->setKeepAliveInterval(60);

                if ($username) {
                    $connectionSettings->setUsername($username);
                    if ($password) {
                        $connectionSettings->setPassword($password);
                    }
                }

                $mqtt->connect($connectionSettings, true);
                $mqtt->publish($topicOut, $siagaStatus, 0, true);
                $mqtt->disconnect();
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('MQTT Threshold Publish Error: ' . $e->getMessage());
            }

        } elseif ($type === 'weather') {
            $request->validate([
                'type' => 'required|string|in:siaga,weather',
                'condition' => 'required|string|in:kering,normal,berangin,hujan,hujan_deras',
                'wind' => 'required|integer|min:0',
                'rain' => 'required|integer|min:0',
                'temp' => 'required|integer',
                'humidity' => 'required|integer|min:0|max:100',
                'pressure' => 'required|integer|min:0',
            ]);

            $threshold = Threshold::first();
            if (!$threshold) {
                $threshold = Threshold::create($this->defaultThresholdRow());
            }

            $condition = $request->input('condition');
            $updateData = [
                "wind_{$condition}" => $request->input('wind'),
                "rain_{$condition}" => $request->input('rain'),
                "temp_{$condition}" => $request->input('temp'),
                "humidity_{$condition}" => $request->input('humidity'),
                "pressure_{$condition}" => $request->input('pressure'),
            ];

            $threshold->update($updateData);
        } elseif ($type === 'physics') {
            $request->validate([
                'w' => 'required|numeric',
                's' => 'required|numeric',
                'n' => 'required|numeric',
                'a_das' => 'required|numeric',
                'c' => 'required|numeric',
                'l_segment' => 'required|numeric',
            ]);

            $threshold = Threshold::first();
            if (!$threshold) {
                $threshold = Threshold::create($this->defaultThresholdRow());
            }

            $threshold->update([
                'physics_w' => $request->input('w'),
                'physics_s' => $request->input('s'),
                'physics_n' => $request->input('n'),
                'physics_a_das' => $request->input('a_das'),
                'physics_c' => $request->input('c'),
                'physics_l_segment' => $request->input('l_segment'),
            ]);
        }

        return response()->json(['success' => true, 'data' => $this->formatThresholdResponse(Threshold::first(), $type)]);
    }

    private function getSiagaColumn(Threshold $threshold, int $level): string
    {
        $waterColumn = "water_siaga{$level}";
        return Schema::hasColumn('thresholds', $waterColumn) ? $waterColumn : "siaga{$level}";
    }

    private function defaultThresholdRow(): array
    {
        $columns = Schema::getColumnListing('thresholds');
        $defaults = [
            'water_siaga1' => 400,
            'water_siaga2' => 300,
            'water_siaga3' => 150,
            'siaga1' => 400,
            'siaga2' => 300,
            'siaga3' => 150,

            'wind_siaga1' => 20,
            'wind_siaga2' => 15,
            'wind_siaga3' => 10,
            'rain_siaga1' => 100,
            'rain_siaga2' => 70,
            'rain_siaga3' => 30,
            'temp_siaga1' => 40,
            'temp_siaga2' => 35,
            'temp_siaga3' => 30,
            'humidity_siaga1' => 95,
            'humidity_siaga2' => 85,
            'humidity_siaga3' => 70,
            'pressure_siaga1' => 1030,
            'pressure_siaga2' => 1010,
            'pressure_siaga3' => 1000,

            'wind_kering' => 5,
            'rain_kering' => 0,
            'temp_kering' => 35,
            'humidity_kering' => 40,
            'pressure_kering' => 1025,

            'wind_normal' => 10,
            'rain_normal' => 5,
            'temp_normal' => 28,
            'humidity_normal' => 65,
            'pressure_normal' => 1015,

            'wind_berangin' => 20,
            'rain_berangin' => 10,
            'temp_berangin' => 25,
            'humidity_berangin' => 75,
            'pressure_berangin' => 1005,

            'wind_hujan' => 30,
            'rain_hujan' => 50,
            'temp_hujan' => 20,
            'humidity_hujan' => 85,
            'pressure_hujan' => 995,

            'wind_hujan_deras' => 50,
            'rain_hujan_deras' => 100,
            'temp_hujan_deras' => 18,
            'humidity_hujan_deras' => 95,
            'pressure_hujan_deras' => 985,

            'physics_w' => 15.0,
            'physics_s' => 0.001,
            'physics_n' => 0.035,
            'physics_a_das' => 10000000.0,
            'physics_c' => 0.75,
            'physics_l_segment' => 1000.0,
        ];

        $row = [];
        foreach ($columns as $column) {
            if (array_key_exists($column, $defaults)) {
                $row[$column] = $defaults[$column];
            }
        }
        return $row;
    }

    private function formatThresholdResponse(Threshold $threshold, string $type = 'siaga'): array
    {
        if ($type === 'weather') {
            return [
                'kering' => [
                    'wind' => $threshold->wind_kering,
                    'rain' => $threshold->rain_kering,
                    'temp' => $threshold->temp_kering,
                    'humidity' => $threshold->humidity_kering,
                    'pressure' => $threshold->pressure_kering,
                ],
                'normal' => [
                    'wind' => $threshold->wind_normal,
                    'rain' => $threshold->rain_normal,
                    'temp' => $threshold->temp_normal,
                    'humidity' => $threshold->humidity_normal,
                    'pressure' => $threshold->pressure_normal,
                ],
                'berangin' => [
                    'wind' => $threshold->wind_berangin,
                    'rain' => $threshold->rain_berangin,
                    'temp' => $threshold->temp_berangin,
                    'humidity' => $threshold->humidity_berangin,
                    'pressure' => $threshold->pressure_berangin,
                ],
                'hujan' => [
                    'wind' => $threshold->wind_hujan,
                    'rain' => $threshold->rain_hujan,
                    'temp' => $threshold->temp_hujan,
                    'humidity' => $threshold->humidity_hujan,
                    'pressure' => $threshold->pressure_hujan,
                ],
                'hujan_deras' => [
                    'wind' => $threshold->wind_hujan_deras,
                    'rain' => $threshold->rain_hujan_deras,
                    'temp' => $threshold->temp_hujan_deras,
                    'humidity' => $threshold->humidity_hujan_deras,
                    'pressure' => $threshold->pressure_hujan_deras,
                ],
            ];
        }

        if ($type === 'physics') {
            return [
                'w' => $threshold->physics_w ?? 15,
                's' => $threshold->physics_s ?? 0.001,
                'n' => $threshold->physics_n ?? 0.035,
                'a_das' => $threshold->physics_a_das ?? 10000000,
                'c' => $threshold->physics_c ?? 0.75,
                'l_segment' => $threshold->physics_l_segment ?? 1000,
            ];
        }

        return [
            'siaga1' => [
                'water' => $threshold->getAttribute('water_siaga1') ?? $threshold->getAttribute('siaga1') ?? 400,
            ],
            'siaga2' => [
                'water' => $threshold->getAttribute('water_siaga2') ?? $threshold->getAttribute('siaga2') ?? 300,
            ],
            'siaga3' => [
                'water' => $threshold->getAttribute('water_siaga3') ?? $threshold->getAttribute('siaga3') ?? 150,
            ],
        ];
    }

    public function getWeatherData()
    {
        try {
            $region = request()->query('region', 'jakarta');
            $latitude = (float) request()->query('lat', -6.2088);
            $longitude = (float) request()->query('lon', 106.8456);

            $apiKey = config('services.openweather.api_key', env('OPENWEATHER_API_KEY'));

            if (!$apiKey) {
                return response()->json([
                    'error' => 'OpenWeatherMap API key not configured',
                    'current_weather' => [
                        'temp' => 28,
                        'humidity' => 65,
                        'pressure' => 1015,
                        'wind_speed' => 10,
                        'weather_main' => 'Clear',
                        'weather_description' => 'Default weather',
                        'rain_1h' => 0,
                    ],
                    'condition' => 'normal',
                    'thresholds' => ['wind' => 10, 'rain' => 5, 'temp' => 28, 'humidity' => 65, 'pressure' => 1015],
                    'region' => $region
                ], 200);
            }

            $response = Http::get('https://api.openweathermap.org/data/2.5/weather', [
                'lat' => $latitude,
                'lon' => $longitude,
                'appid' => $apiKey,
                'units' => 'metric',
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Failed to fetch weather data from OpenWeatherMap (' . $response->status() . ')',
                    'current_weather' => [
                        'temp' => 28,
                        'humidity' => 65,
                        'pressure' => 1015,
                        'wind_speed' => 10,
                        'weather_main' => 'Clear',
                        'weather_description' => 'Default weather',
                        'rain_1h' => 0,
                    ],
                    'condition' => 'normal',
                    'thresholds' => ['wind' => 10, 'rain' => 5, 'temp' => 28, 'humidity' => 65, 'pressure' => 1015],
                    'region' => $region
                ], 200);
            }

            $weatherData = $response->json();

            $currentWeather = [
                'temp' => round($weatherData['main']['temp'], 1),
                'feels_like' => round($weatherData['main']['feels_like'], 1),
                'temp_min' => round($weatherData['main']['temp_min'], 1),
                'temp_max' => round($weatherData['main']['temp_max'], 1),
                'humidity' => $weatherData['main']['humidity'],
                'pressure' => $weatherData['main']['pressure'],
                'wind_speed' => round($weatherData['wind']['speed'] * 3.6, 1),
                'weather_main' => $weatherData['weather'][0]['main'],
                'weather_description' => $weatherData['weather'][0]['description'],
                'weather_icon' => $weatherData['weather'][0]['icon'],
                'rain_1h' => $weatherData['rain']['1h'] ?? 0,
                'visibility' => $weatherData['visibility'] ?? null,
                'city_name' => $weatherData['name'] ?? null,
            ];

            $condition = $this->determineWeatherCondition($currentWeather);

            $threshold = Threshold::first();
            if (!$threshold) {
                $threshold = Threshold::create($this->defaultThresholdRow());
            }

            $weatherThresholds = $this->formatThresholdResponse($threshold, 'weather');

            return response()->json([
                'current_weather' => $currentWeather,
                'condition' => $condition,
                'thresholds' => $weatherThresholds[$condition] ?? $weatherThresholds['normal'],
                'region' => $region,
                'location' => [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Weather service unavailable: ' . $e->getMessage(),
                'current_weather' => [
                    'temp' => 28,
                    'humidity' => 65,
                    'pressure' => 1015,
                    'wind_speed' => 10,
                    'weather_main' => 'Clear',
                    'weather_description' => 'Default weather',
                    'rain_1h' => 0,
                ],
                'condition' => 'normal',
                'thresholds' => ['wind' => 10, 'rain' => 5, 'temp' => 28, 'humidity' => 65, 'pressure' => 1015],
                'region' => request()->query('region', 'jakarta'),
            ], 200);
        }
    }

    public function getRegions()
    {
        $regions = [
            ['id' => 'jakarta_pusat', 'name' => 'Jakarta Pusat', 'description' => 'DKI Jakarta', 'latitude' => -6.1744, 'longitude' => 106.8229],
            ['id' => 'jakarta_utara', 'name' => 'Jakarta Utara', 'description' => 'DKI Jakarta', 'latitude' => -6.1200, 'longitude' => 106.8300],
            ['id' => 'jakarta_barat', 'name' => 'Jakarta Barat', 'description' => 'DKI Jakarta', 'latitude' => -6.1370, 'longitude' => 106.7450],
            ['id' => 'jakarta_selatan', 'name' => 'Jakarta Selatan', 'description' => 'DKI Jakarta', 'latitude' => -6.2700, 'longitude' => 106.8000],
            ['id' => 'jakarta_timur', 'name' => 'Jakarta Timur', 'description' => 'DKI Jakarta', 'latitude' => -6.2100, 'longitude' => 107.0100],
            ['id' => 'depok_beji', 'name' => 'Depok - Kecamatan Beji', 'description' => 'Kota Depok', 'latitude' => -6.3625, 'longitude' => 106.8253],
            ['id' => 'depok_cimanggis', 'name' => 'Depok - Kecamatan Cimanggis', 'description' => 'Kota Depok', 'latitude' => -6.3714, 'longitude' => 106.9234],
            ['id' => 'depok_limo', 'name' => 'Depok - Kecamatan Limo', 'description' => 'Kota Depok', 'latitude' => -6.3571, 'longitude' => 106.8042],
            ['id' => 'bogor_pusat', 'name' => 'Bogor Pusat', 'description' => 'Kota Bogor', 'latitude' => -6.5971, 'longitude' => 106.7883],
            ['id' => 'tangerang_pusat', 'name' => 'Tangerang Pusat', 'description' => 'Kota Tangerang', 'latitude' => -6.1784, 'longitude' => 106.6327],
            ['id' => 'bekasi_pusat', 'name' => 'Bekasi Pusat', 'description' => 'Kota Bekasi', 'latitude' => -6.2349, 'longitude' => 107.0057],
        ];

        return response()->json($regions);
    }

    private function determineWeatherCondition(array $weather): string
    {
        $temp = $weather['temp'];
        $humidity = $weather['humidity'];
        $pressure = $weather['pressure'];
        $wind = $weather['wind_speed'];
        $rain = $weather['rain_1h'];

        if ($rain >= 100 || $wind >= 50 || $humidity >= 95 || $temp <= 18 || $pressure <= 985) {
            return 'hujan_deras';
        }

        if ($rain >= 50 || $humidity >= 85 || $temp <= 20 || $pressure <= 995) {
            return 'hujan';
        }

        if ($wind >= 20 && $rain < 50) {
            return 'berangin';
        }

        if ($wind <= 5 && $rain <= 0 && $temp >= 35 && $humidity <= 40 && $pressure >= 1025) {
            return 'kering';
        }

        return 'normal';
    }
}
