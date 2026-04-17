<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\ThresholdController;

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