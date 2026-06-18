<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Citizen\CitizenAuthController;
use App\Http\Controllers\Citizen\CitizenNotificationController;
use App\Http\Controllers\Citizen\CitizenPasswordResetController;
use App\Http\Controllers\Citizen\CitizenZoneController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\ThresholdController;
use App\Http\Controllers\CameraSnapshotController;
use App\Http\Controllers\AccessRequestController;
use App\Http\Controllers\AiPredictionController;

// =====================================================================
// PUBLIC ROUTES — Tidak memerlukan autentikasi
// =====================================================================

// Login
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Data sensor publik (untuk dashboard publik & widget)
Route::get('/sensors/latest', [SensorController::class, 'latest']);

// Data cuaca & wilayah (referensi publik)
Route::get('/weather', [ThresholdController::class, 'getWeatherData']);
Route::get('/regions', [ThresholdController::class, 'getRegions']);

// Cache cuaca — dipanggil dari dashboard publik (tanpa auth)
Route::post('/weather-cache', [SensorController::class, 'cacheWeatherData']);

// Thresholds — diperlukan dashboard publik untuk tampilkan siaga level
Route::get('/thresholds', [ThresholdController::class, 'index']);

// Form pendaftaran akses baru (di halaman login, sebelum punya akun)
Route::post('/access-requests', [AccessRequestController::class, 'store']);

// =====================================================================
// PROTECTED ROUTES — Wajib Bearer Token (auth:sanctum)
// =====================================================================

Route::middleware('auth:sanctum')->group(function () {

    // Logout
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User profile lengkap — gabungkan data users + access_requests (kalau user daftar via form)
    Route::get('/user/profile', function (Request $request) {
        $u = $request->user();
        $tz = 'Asia/Jakarta';

        // Cari permohonan asli yang dia daftar (match by email).
        // Kalau user dibuat manual via artisan create-user, access_request mungkin tidak ada.
        $req = \App\Models\AccessRequest::where('email', $u->email)
            ->orWhere('approved_email', $u->email)
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'id'              => $u->id,
            'name'            => $u->name,
            'email'           => $u->email,
            'created_at'      => $u->created_at,
            'created_at_wib'  => $u->created_at?->setTimezone($tz)->translatedFormat('j F Y, H:i'),
            // Data dari pendaftaran asli (kalau user daftar lewat form)
            'profile' => $req ? [
                'username'         => $req->username,
                'instansi'         => $req->instansi,
                'nip'              => $req->nip,
                'phone'            => $req->phone,
                'submitted_at_wib' => $req->created_at?->setTimezone($tz)->translatedFormat('j F Y, H:i'),
                'approved_at_wib'  => $req->reviewed_at?->setTimezone($tz)->translatedFormat('j F Y, H:i'),
                'status'           => $req->status,
            ] : null,
        ]);
    });

    // ─── Logging ───────────────────────────────────────────────────────
    Route::post('/logs/save-now',             [SensorController::class, 'saveLogsNow']);
    Route::get('/logs/settings',              [SensorController::class, 'getLoggingSettings']);
    Route::post('/logs/settings',             [SensorController::class, 'updateLoggingSettings']);
    Route::get('/logs',                       [SensorController::class, 'getLogs']);
    Route::get('/logs/exports',               [SensorController::class, 'getExports']);
    Route::get('/logs/exports/{filename}',    [SensorController::class, 'downloadExport']);

    // ─── Threshold settings (POST — hanya admin bisa ubah) ────────────
    Route::post('/thresholds', [ThresholdController::class, 'store']);

    // ─── Camera snapshots (gambar CCTV terkompresi) ────────────────────
    Route::get('/camera/snapshots/stats',   [CameraSnapshotController::class, 'stats']);
    Route::get('/camera/snapshots',         [CameraSnapshotController::class, 'index']);
    Route::post('/camera/snapshots',        [CameraSnapshotController::class, 'store']);
    Route::get('/camera/snapshots/{id}',    [CameraSnapshotController::class, 'show'])->whereNumber('id');
    Route::delete('/camera/snapshots/{id}', [CameraSnapshotController::class, 'destroy'])->whereNumber('id');

    // ─── AI Prediction — proxy ke FastAPI ─────────────────────────────
    Route::post('/ai-prediction', [AiPredictionController::class, 'predict']);

    // ─── Surat permohonan akses (hanya admin yang boleh unduh) ────────
    Route::get('/access-requests/{id}/letter', [AccessRequestController::class, 'letter'])->whereNumber('id');

});

// =====================================================================
// Citizen API (mobile app) — Sanctum Bearer token, parallel to admin.
// =====================================================================
Route::prefix('citizen')->group(function () {
    // Public — Register flow (OTP)
    Route::post('/register',                [CitizenAuthController::class, 'register']);
    Route::post('/verify-registration',     [CitizenAuthController::class, 'verifyRegistration']);
    Route::post('/resend-registration-otp', [CitizenAuthController::class, 'resendRegistrationOtp']);

    // Public — Login & password reset (OTP)
    Route::post('/login',           [CitizenAuthController::class, 'login']);
    Route::post('/forgot-password', [CitizenPasswordResetController::class, 'sendResetOtp']);
    Route::post('/reset-password',  [CitizenPasswordResetController::class, 'reset']);

    // Protected (Bearer Sanctum token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',                    [CitizenAuthController::class, 'me']);
        Route::patch('/profile',             [CitizenAuthController::class, 'updateProfile']);
        Route::post('/logout',               [CitizenAuthController::class, 'logout']);
        Route::get('/notifications',         [CitizenNotificationController::class, 'index']);
        Route::post('/notifications/clear',  [CitizenNotificationController::class, 'clear']);

        // Daftar zona rawan banjir untuk fitur geofence (koordinat + siaga terkini)
        Route::get('/zones',                 [CitizenZoneController::class, 'index']);
    });
});
