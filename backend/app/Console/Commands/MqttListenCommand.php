<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sensor;
use App\Models\Threshold;
use App\Models\SensorLog;
use App\Models\CitizenNotification;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class MqttListenCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mqtt:listen';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Listen to MQTT topic for sensor data and publish siaga status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $server   = env('MQTT_HOST', 'broker.hivemq.com');
        $port     = env('MQTT_PORT', 1883);
        $clientId = env('MQTT_CLIENT_ID', 'makesens_laravel_client_' . uniqid());
        $username = env('MQTT_USERNAME');
        $password = env('MQTT_PASSWORD');
        $topicIn  = env('MQTT_TOPIC_SENSOR', 'makesens/test/tmj');
        $topicOut = env('MQTT_TOPIC_SIAGA', 'makesens/test/tmj/siaga');

        $this->info("Starting MQTT Listener against {$server}:{$port}...");
        $this->info("Subscribing to topic: {$topicIn}");

        try {
            $mqtt = new MqttClient($server, $port, $clientId);

            $connectionSettings = (new ConnectionSettings())
                ->setKeepAliveInterval(60);
                
            if ($username) {
                $connectionSettings->setUsername($username);
                if ($password) {
                    $connectionSettings->setPassword($password);
                }
            }

            $mqtt->connect($connectionSettings, true);
            $this->info("✅ Connected to MQTT Broker successfully!");

            $mqtt->subscribe($topicIn, function (string $topic, string $message) use ($mqtt, $topicOut) {
                $this->info(sprintf('Received message on topic [%s]: %s', $topic, $message));

                try {
                    $payload = json_decode($message, true);

                    if (!is_array($payload)) {
                        $this->error('Payload is not valid JSON array.');
                        return;
                    }

                    $siagaValue = 0;
                    $rainValue = 0;  // Langsung dari payload
                    $qHujan = 0;
                    $etaHours = null;
                    $updatedSensors = false;

                    foreach ($payload as $sensorData) {
                        if (isset($sensorData['sensor_code'], $sensorData['type'], $sensorData['value'], $sensorData['unit'])) {
                            
                            $status = $this->getStatus($sensorData['type'], $sensorData['value']);

                            Sensor::create([
                                'sensor_code' => $sensorData['sensor_code'],
                                'type'        => $sensorData['type'],
                                'value'       => $sensorData['value'],
                                'unit'        => $sensorData['unit'],
                                'status'      => $status,
                            ]);
                            
                            if ($sensorData['type'] === 'water') {
                                $siagaValue = (float) $sensorData['value'];
                            }

                            if ($sensorData['type'] === 'rain') {
                                $rainValue = (float) $sensorData['value'];
                            }
                            
                            $updatedSensors = true;
                        }
                    }

                    if ($updatedSensors) {
                        // Ambil Threshold untuk Batas Finis (Siaga 3 = threshold tertinggi = paling bahaya)
                        $thresholds = $this->getThresholds();
                        $siaga3_cm = $thresholds['siaga3']['water'] ?? 150; // threshold tertinggi
                        
                        // Default Siaga 3 (Normal in numerical terms for UI) 
                        // Wait, in Dashboard 3 is normal, 2 is warning, 1 is critical
                        $siagaStatus = '3'; // Normal

                        // Parameter Fisika Statis
                        $thresholdModel = Threshold::first();
                        $w = $thresholdModel->physics_w ?? 15;
                        $A_DAS = $thresholdModel->physics_a_das ?? 10000000;
                        $C = $thresholdModel->physics_c ?? 0.75;
                        $L_segment = $thresholdModel->physics_l_segment ?? 1000;

                        $h_m = $siagaValue / 100;
                        $h_siaga3_m = $siaga3_cm / 100;
                        
                        // Ambil intensitas hujan LANGSUNG dari payload (bukan dari DB)
                        $I = $rainValue;

                        if ($siagaValue >= $siaga3_cm) {
                            $siagaStatus = '1'; // Sudah meluap
                        } else {
                            $sisa_tinggi = $h_siaga3_m - $h_m;
                            $volume_sisa = ($sisa_tinggi * $w) * $L_segment;
                            
                            $qHujan = $C * ($I / 3600000) * $A_DAS;
                            
                            if ($qHujan > 0) {
                                $etaHours = $volume_sisa / $qHujan / 3600;
                                
                                // PROBABILITAS (Sederhana): Jika hujan sangat ekstrem dan sisa jarak pendek
                                $probability = ($I >= 100 && $etaHours < 3) ? 100 : 0;

                                if ($etaHours <= 2 || $probability >= 90) {
                                    $siagaStatus = '1'; // Siaga 1 = BAHAYA (MQTT '1')
                                } elseif ($etaHours <= 4) {
                                    $siagaStatus = '2'; // Siaga 2 = WASPADA (MQTT '2')
                                } elseif ($etaHours <= 8) {
                                    $siagaStatus = '3'; // Siaga 3 = NORMAL (MQTT '3')
                                }
                            } else {
                                // Fallback if no rain but water is dangerously high due to upstream
                                $siaga2_cm = $thresholds['siaga2']['water'] ?? 100;
                                if ($siagaValue >= $siaga2_cm) {
                                    $siagaStatus = '2';
                                }
                            }
                        }

                        // Jika ETA <= 4, timpa menjadi Siaga 2. Jika ETA <= 2, timpa menjadi Siaga 1.
                        if ($qHujan > 0 && isset($etaHours)) {
                            if ($etaHours <= 2 || ($I >= 100 && $etaHours < 3)) $siagaStatus = '1';
                            elseif ($etaHours <= 4 && $siagaStatus == '3') $siagaStatus = '2';
                        }

                        // Simpan status sebelumnya untuk mendeteksi PERUBAHAN status
                        $previousSiaga = Cache::get('last_siaga_status', '3');

                        // Publish status siaga ke MQTT (untuk web dashboard)
                        $this->info("Publishing siaga status: $siagaStatus to $topicOut (Retained)");
                        $mqtt->publish($topicOut, $siagaStatus, 0, true);

                        // ── Logika Pengiriman Notifikasi FCM ──
                        $statusChanged = $siagaStatus !== $previousSiaga;
                        $shouldNotify  = false;
                        $notifyReason  = '';

                        if ($statusChanged) {
                            // Selalu kirim notif saat ada perubahan status (naik maupun turun)
                            $shouldNotify = true;
                            $notifyReason = "perubahan status dari Siaga {$previousSiaga} ke Siaga {$siagaStatus}";
                            // Reset timer periodic saat status berubah
                            Cache::forget('last_fcm_sent_at');
                        } elseif ($siagaStatus === '1') {
                            // Siaga 1: kirim ulang setiap 30 detik selama masih Siaga 1
                            $lastSent = Cache::get('last_fcm_sent_at', 0);
                            if ((time() - $lastSent) >= 30) {
                                $shouldNotify = true;
                                $notifyReason = "pengingat berkala Siaga 1 (setiap 30 detik)";
                            }
                        } elseif ($siagaStatus === '2') {
                            // Siaga 2: kirim ulang setiap 60 detik selama masih Siaga 2
                            $lastSent = Cache::get('last_fcm_sent_at', 0);
                            if ((time() - $lastSent) >= 60) {
                                $shouldNotify = true;
                                $notifyReason = "pengingat berkala Siaga 2 (setiap 1 menit)";
                            }
                        }
                        // Siaga 3 (Normal): tidak ada pengiriman periodik, hanya saat perubahan status

                        if ($shouldNotify) {
                            $this->info("⚡ Mengirim notifikasi FCM — {$notifyReason}");
                            $this->sendFcmNotification($siagaStatus, $previousSiaga, $siagaValue, $etaHours ?? null);
                            Cache::put('last_fcm_sent_at', time(), now()->addHours(24));
                        }

                        // Simpan status siaga terakhir ke Cache selama 24 jam
                        Cache::put('last_siaga_status', $siagaStatus, now()->addHours(24));

                        // TODO: Event Broadcast untuk WebSocket di Frontend bisa dipanggil disini
                    }

                } catch (\Exception $e) {
                    $this->error('Error processing message: ' . $e->getMessage());
                    Log::error('MQTT Listen Error', ['exception' => $e]);
                }
            }, 0);

            $mqtt->loop(true);

        } catch (\Exception $e) {
            $this->error('Fatal Error: ' . $e->getMessage());
            Log::error('MQTT Fatal Error', ['exception' => $e]);
        }
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
                'wind' => $threshold->wind_siaga1 ?? 20,
                'rain' => $threshold->rain_siaga1 ?? 100,
                'water' => $threshold->water_siaga1 ?? $threshold->siaga1 ?? 400,
                'temp' => $threshold->temp_siaga1 ?? 40,
                'humidity' => $threshold->humidity_siaga1 ?? 95,
                'pressure' => $threshold->pressure_siaga1 ?? 1030,
            ],
            'siaga2' => [
                'wind' => $threshold->wind_siaga2 ?? 15,
                'rain' => $threshold->rain_siaga2 ?? 70,
                'water' => $threshold->water_siaga2 ?? $threshold->siaga2 ?? 300,
                'temp' => $threshold->temp_siaga2 ?? 35,
                'humidity' => $threshold->humidity_siaga2 ?? 85,
                'pressure' => $threshold->pressure_siaga2 ?? 1010,
            ],
            'siaga3' => [
                'wind' => $threshold->wind_siaga3 ?? 10,
                'rain' => $threshold->rain_siaga3 ?? 30,
                'water' => $threshold->water_siaga3 ?? $threshold->siaga3 ?? 150,
                'temp' => $threshold->temp_siaga3 ?? 30,
                'humidity' => $threshold->humidity_siaga3 ?? 70,
                'pressure' => $threshold->pressure_siaga3 ?? 1000,
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

    /**
     * Kirim Push Notification ke Flutter App via Firebase Cloud Messaging (FCM HTTP v1 API).
     * Menggunakan Service Account JSON untuk autentikasi OAuth2 (tanpa package tambahan).
     */
    private function sendFcmNotification(string $siagaLevel, string $previousSiaga, float $waterLevel, ?float $eta): void
    {
        $topic    = env('FCM_TOPIC', 'peringatan_banjir');
        $credPath = storage_path('app/firebase-service-account.json');

        if (!file_exists($credPath)) {
            $this->warn('firebase-service-account.json tidak ditemukan. Notifikasi dilewati.');
            return;
        }

        $statusChanged = $siagaLevel !== $previousSiaga;
        $isEscalating  = $siagaLevel < $previousSiaga; // '1' < '2' < '3' artinya makin parah
        $isImproving   = $siagaLevel > $previousSiaga; // naik angka = membaik

        if ($siagaLevel === '1') {
            if ($statusChanged && $isEscalating) {
                $title = '🚨 SIAGA 1 — Bahaya Banjir!';
                $body  = "Ketinggian air: {$waterLevel} cm. Status naik dari Siaga {$previousSiaga}. Segera lakukan evakuasi!";
            } else {
                $title = '🚨 SIAGA 1 — Bahaya Masih Berlanjut!';
                $body  = "Ketinggian air: {$waterLevel} cm. Kondisi masih berbahaya. Tetap waspada dan evakuasi!";
            }
        } elseif ($siagaLevel === '2') {
            if ($statusChanged && $isEscalating) {
                $title = '⚠️ SIAGA 2 — Waspada Banjir';
                $body  = "Ketinggian air: {$waterLevel} cm. Status naik dari Siaga {$previousSiaga}. Tetap waspada.";
            } elseif ($statusChanged && $isImproving) {
                $title = '⚠️ SIAGA 2 — Kondisi Sedikit Membaik';
                $body  = "Ketinggian air: {$waterLevel} cm. Status turun dari Siaga {$previousSiaga} ke Siaga 2. Tetap waspada.";
            } else {
                $title = '⚠️ SIAGA 2 — Waspada Masih Berlanjut';
                $body  = "Ketinggian air: {$waterLevel} cm. Kondisi masih perlu diwaspadai.";
            }
        } elseif ($siagaLevel === '3') {
            // Kondisi normal/membaik — hanya kirim saat ada perubahan dari siaga sebelumnya
            $title = '✅ Kondisi Kembali Normal';
            $body  = "Ketinggian air: {$waterLevel} cm. Status turun dari Siaga {$previousSiaga} ke Normal. Situasi terkendali.";
        } else {
            return; // Tidak dikenal
        }

        // ── BARU: simpan ke DB sebelum kirim FCM ────────────────────────────
        // Notif tetap tersimpan walau FCM gagal — mobile bisa fetch lewat endpoint /notifications
        $notif = CitizenNotification::create([
            'id'          => (string) Str::uuid(),
            'level'       => 'siaga' . $siagaLevel,
            'title'       => $title,
            'body'        => $body,
            'water_level' => $waterLevel,
            'eta_hours'   => $eta,
            'issued_at'   => now(),
        ]);

        try {
            // ── STEP 1: Ambil OAuth2 Access Token (di-cache 50 menit) ──
            $accessToken = Cache::remember('fcm_v1_access_token', now()->addMinutes(50), function () use ($credPath) {
                return $this->getGoogleAccessToken($credPath);
            });

            if (!$accessToken) {
                $this->error('❌ Gagal mendapatkan FCM access token.');
                return;
            }

            // ── STEP 2: Baca project_id dari service account JSON ──
            $cred      = json_decode(file_get_contents($credPath), true);
            $projectId = $cred['project_id'];

            // ── STEP 3: Kirim ke FCM HTTP v1 API ──
            $fcmUrl  = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
            $fcmBody = json_encode([
                'message' => [
                    'topic' => $topic,
                    'notification' => [
                        'title' => $title,
                        'body'  => $body,
                    ],
                    'data' => [
                        // BARU: ID notif dari DB, dipakai mobile untuk dedupe
                        'id'          => $notif->id,
                        'level'       => 'siaga' . $siagaLevel, // BARU (selaras kontrak)
                        'siaga'       => $siagaLevel,           // existing — biarkan untuk back-compat
                        'water_level' => (string) $waterLevel,
                        'eta_hours'   => $eta !== null ? (string) round($eta, 1) : 'N/A',
                    ],
                    'android' => [
                        'priority'     => 'high',
                        'notification' => ['sound' => 'default'],
                    ],
                    'apns' => [
                        'headers' => ['apns-priority' => '10'],
                        'payload' => ['aps' => ['sound' => 'default']],
                    ],
                ],
            ]);

            $ch = curl_init($fcmUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $fcmBody,
                CURLOPT_HTTPHEADER     => [
                    "Authorization: Bearer {$accessToken}",
                    'Content-Type: application/json',
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
            ]);

            $responseBody = curl_exec($ch);
            $curlError    = curl_error($ch);
            $httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($curlError) {
                $this->error("❌ cURL error saat kirim FCM: {$curlError}");
                Log::error('FCM cURL Error', ['error' => $curlError]);
                return;
            }

            if ($httpCode >= 200 && $httpCode < 300) {
                $this->info("✅ Notifikasi FCM v1 berhasil dikirim ke topic: {$topic}");
            } else {
                $this->error("❌ Gagal kirim FCM v1 (HTTP {$httpCode}): {$responseBody}");
                Log::error('FCM v1 Error', ['http_code' => $httpCode, 'response' => $responseBody]);
                // Hapus cache token jika gagal agar regenerate di percobaan berikutnya
                Cache::forget('fcm_v1_access_token');
            }
        } catch (\Exception $e) {
            $this->error('❌ Exception saat kirim FCM: ' . $e->getMessage());
            Log::error('FCM Exception', ['exception' => $e->getMessage()]);
        }
    }

    /**
     * Buat JWT dan tukar dengan OAuth2 Access Token dari Google.
     * Implementasi murni tanpa package tambahan, hanya menggunakan openssl bawaan PHP.
     */
    private function getGoogleAccessToken(string $credPath): ?string
    {
        $cred = json_decode(file_get_contents($credPath), true);

        $now     = time();
        $header  = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
        $payload = rtrim(strtr(base64_encode(json_encode([
            'iss'   => $cred['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600,
        ])), '+/', '-_'), '=');

        $signingInput = "{$header}.{$payload}";
        $privateKey   = openssl_pkey_get_private($cred['private_key']);

        if (!$privateKey) {
            Log::error('FCM OAuth2: Failed to load private key from service account.');
            $this->error('❌ Gagal memuat private key dari service account JSON.');
            return null;
        }

        $signed = openssl_sign($signingInput, $signature, $privateKey, 'SHA256');
        if (!$signed) {
            Log::error('FCM OAuth2: openssl_sign failed.');
            $this->error('❌ openssl_sign gagal.');
            return null;
        }

        $signature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
        $jwt = "{$signingInput}.{$signature}";

        // Tukar JWT dengan access token dari Google OAuth2
        // Gunakan raw cURL untuk menghindari HTTP/2 conflict dari Guzzle
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        ]);

        $responseBody = curl_exec($ch);
        $curlError    = curl_error($ch);
        $httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlError) {
            Log::error('FCM OAuth2 cURL Error', ['error' => $curlError]);
            $this->error("❌ cURL error saat ambil token: {$curlError}");
            return null;
        }

        $data = json_decode($responseBody, true);

        if ($httpCode === 200 && isset($data['access_token'])) {
            return $data['access_token'];
        }

        Log::error('FCM OAuth2 Error', ['http_code' => $httpCode, 'response' => $responseBody]);
        $this->error("❌ Gagal mendapatkan access token (HTTP {$httpCode}): {$responseBody}");
        return null;
    }
}
