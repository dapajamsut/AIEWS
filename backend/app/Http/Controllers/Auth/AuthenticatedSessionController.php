<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     * Returns a Sanctum personal access token (token-based, no cookies needed).
     */
    public function store(LoginRequest $request)
    {
        try {
            $request->authenticate();

            // Hapus token lama agar tidak menumpuk
            $request->user()->tokens()->delete();

            // Buat token baru
            $token = $request->user()->createToken('makesens-web')->plainTextToken;

            return response()->json([
                'user'  => $request->user(),
                'token' => $token,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Login gagal. Email atau password salah.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login gagal.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Destroy an authenticated session (revoke token).
     */
    public function destroy(Request $request)
    {
        try {
            // Revoke token yang dipakai sekarang
            $request->user('sanctum')?->currentAccessToken()?->delete();

            return response()->json(['message' => 'Logged out'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout gagal.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}