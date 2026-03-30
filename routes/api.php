<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

// Rute buat ambil data user (Bawaan)
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// RUTE SAKTI LOGIN (Tambahin ini)
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::attempt($credentials)) {
        $request->session()->regenerate();
        return response()->json(['message' => 'Login Berhasil Bos!'], 200);
    }

    return response()->json([
        'message' => 'Email atau password salah di PostgreSQL.',
    ], 401);
});

// RUTE LOGOUT (Biar nanti bisa keluar)
Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return response()->noContent();
});