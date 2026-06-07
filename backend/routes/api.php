<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\ThresholdController;
use App\Http\Controllers\Citizen\CitizenAuthController;
use App\Http\Controllers\Citizen\CitizenNotificationController;
use App\Http\Controllers\Citizen\CitizenPasswordResetController;

// Login
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Logout
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

// User info (protected)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Sensor data    
Route::post('/sensors', [SensorController::class, 'store']);
Route::get('/sensors/latest', [SensorController::class, 'latest']);

// Logging
Route::post('/logs/save-now', [SensorController::class, 'saveLogsNow']);
Route::get('/logs/settings',  [SensorController::class, 'getLoggingSettings']);
Route::post('/logs/settings', [SensorController::class, 'updateLoggingSettings']);
Route::get('/logs',           [SensorController::class, 'getLogs']);
Route::post('/weather-cache', [SensorController::class, 'cacheWeatherData']);
Route::get('/logs/exports',   [SensorController::class, 'getExports']);
Route::get('/logs/exports/{filename}', [SensorController::class, 'downloadExport']);

// Threshold settings
Route::get('/thresholds', [ThresholdController::class, 'index']);
Route::post('/thresholds', [ThresholdController::class, 'store']);
Route::get('/weather', [ThresholdController::class, 'getWeatherData']);
Route::get('/regions', [ThresholdController::class, 'getRegions']);

// Khusus ESP32 / Hardware
Route::get('/siaga/status', [SensorController::class, 'getSiagaStatus']);

// Citizen Auth, Reset Password, and Notification Management
Route::prefix('citizen')->group(function () {
    Route::post('/register', [CitizenAuthController::class, 'register']);
    Route::post('/verify-register', [CitizenAuthController::class, 'verifyRegistration']);
    Route::post('/resend-register-otp', [CitizenAuthController::class, 'resendRegistrationOtp']);
    Route::post('/login', [CitizenAuthController::class, 'login']);

    Route::post('/forgot-password', [CitizenPasswordResetController::class, 'sendResetOtp']);
    Route::post('/reset-password', [CitizenPasswordResetController::class, 'reset']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [CitizenAuthController::class, 'me']);
        Route::put('/profile', [CitizenAuthController::class, 'updateProfile']);
        Route::post('/logout', [CitizenAuthController::class, 'logout']);

        Route::get('/notifications', [CitizenNotificationController::class, 'index']);
        Route::post('/notifications/clear', [CitizenNotificationController::class, 'clear']);
    });
});