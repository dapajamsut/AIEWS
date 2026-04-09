<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\SensorController;

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
Route::post('/logs/save-now', [SensorController::class, 'saveLogsNow']);
Route::get('/logs/settings', [SensorController::class, 'getLoggingSettings']);
Route::post('/logs/settings', [SensorController::class, 'updateLoggingSettings']);