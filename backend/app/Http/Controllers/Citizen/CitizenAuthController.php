<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\CitizenPendingRegistration;
use App\Notifications\CitizenOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CitizenAuthController extends Controller
{
    private const OTP_TTL_MINUTES = 10;
    private const OTP_MAX_ATTEMPTS = 5;

    /**
     * Step 1 of registration: validate input, store pending row, send OTP.
     * No citizen account is created yet.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['required', 'string', 'regex:/^[0-9]+$/', 'min:10', 'max:15'],
            'address' => ['required', 'string'],
        ]);

        if (Citizen::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => ['Email sudah terdaftar.'],
            ]);
        }

        $otp = $this->generateOtp();

        $pending = CitizenPendingRegistration::updateOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'],
                'address' => $data['address'],
                'otp_hash' => Hash::make($otp),
                'expires_at' => Carbon::now()->addMinutes(self::OTP_TTL_MINUTES),
                'attempts' => 0,
            ]
        );

        $pending->notify(new CitizenOtpNotification($otp, 'register'));

        return response()->json([
            'message' => 'Kode OTP telah dikirim ke email Anda',
            'email' => $pending->email,
            'expires_in_minutes' => self::OTP_TTL_MINUTES,
        ]);
    }

    /**
     * Step 2 of registration: verify OTP, move pending row to citizens table.
     */
    public function verifyRegistration(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $pending = CitizenPendingRegistration::where('email', $data['email'])->first();

        if (! $pending) {
            throw ValidationException::withMessages([
                'email' => ['Tidak ada permintaan pendaftaran untuk email ini.'],
            ]);
        }

        if ($pending->isExpired()) {
            $pending->delete();
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP telah kedaluwarsa. Silakan daftar ulang.'],
            ]);
        }

        if (! Hash::check($data['otp'], $pending->otp_hash)) {
            $pending->increment('attempts');

            if ($pending->attempts >= self::OTP_MAX_ATTEMPTS) {
                $pending->delete();
                throw ValidationException::withMessages([
                    'otp' => ['Terlalu banyak percobaan salah. Silakan daftar ulang.'],
                ]);
            }

            throw ValidationException::withMessages([
                'otp' => ['Kode OTP salah'],
            ]);
        }

        $citizen = DB::transaction(function () use ($pending) {
            // forceCreate bypasses $fillable guard so we can persist
            // email_verified_at without exposing it as mass-assignable.
            // The 'password' => 'hashed' cast on Citizen is idempotent
            // (Laravel uses Hash::isHashed under the hood), so passing
            // the already-bcrypted value from the pending row is safe.
            $citizen = Citizen::forceCreate([
                'name' => $pending->name,
                'email' => $pending->email,
                'password' => $pending->password,
                'phone' => $pending->phone,
                'address' => $pending->address,
                'email_verified_at' => Carbon::now(),
            ]);

            $pending->delete();

            return $citizen;
        });

        return response()->json([
            'message' => 'Pendaftaran berhasil. Silakan login.',
            'user' => $citizen,
        ], 201);
    }

    /**
     * Resend OTP for a pending registration. Refreshes expiry & resets attempts.
     */
    public function resendRegistrationOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $pending = CitizenPendingRegistration::where('email', $data['email'])->first();

        if (! $pending) {
            throw ValidationException::withMessages([
                'email' => ['Tidak ada permintaan pendaftaran untuk email ini.'],
            ]);
        }

        $otp = $this->generateOtp();

        $pending->update([
            'otp_hash' => Hash::make($otp),
            'expires_at' => Carbon::now()->addMinutes(self::OTP_TTL_MINUTES),
            'attempts' => 0,
        ]);

        $pending->notify(new CitizenOtpNotification($otp, 'register'));

        return response()->json([
            'message' => 'Kode OTP baru telah dikirim ke email Anda',
            'expires_in_minutes' => self::OTP_TTL_MINUTES,
        ]);
    }

    /**
     * Login: issue Sanctum personal access token.
     * Progressive lockout: setiap 3x salah → lockout bertambah (5, 15, 25, 35... menit).
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // 1. Ambil X-Device-ID dari header request (fallback ke IP jika kosong)
        $deviceId = $request->header('X-Device-ID');
        $throttleKey = 'citizen_login_device:' . ($deviceId ?: $request->ip());

        // 2. Cek apakah Device ID tersebut sedang dalam masa blokir (maksimal 3 kali percobaan)
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => 'Aktivitas mencurigakan terdeteksi. Perangkat Anda ditangguhkan dari login selama 5 menit.',
                'errors' => [
                    'email' => ["Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik."]
                ],
                'retry_after' => $seconds
            ], 429);
        }

        $citizen = Citizen::where('email', $request->email)->first();

        // 3. Coba autentikasi
        if (! $citizen || ! Hash::check($request->password, $citizen->password)) {
            // Catat hit kegagalan untuk Device ID ini (berlaku selama 5 menit / 300 detik)
            RateLimiter::hit($throttleKey, 300);

            // Hitung sisa percobaan untuk perangkat ini
            $attemptsLeft = RateLimiter::remaining($throttleKey, 3);

            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
                'errors' => [
                    'password' => ["Password salah. Sisa percobaan perangkat: {$attemptsLeft} kali."]
                ]
            ], 401);
        }

        // 4. Jika login sukses, bersihkan riwayat kesalahan Device ID tersebut
        RateLimiter::clear($throttleKey);

        $token = $citizen->createToken('citizen-mobile')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'user' => $citizen,
            'token' => $token
        ], 200);
    }

    /**
     * Authenticated profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof Citizen) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk citizen.',
            ], 403);
        }

        return response()->json($user);
    }

    /**
     * Update name / phone / address. Email & password are out of scope here.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof Citizen) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk citizen.',
            ], 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'regex:/^[0-9]+$/', 'min:10', 'max:15'],
            'address' => ['sometimes', 'required', 'string'],
        ]);

        $user->fill($data)->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user,
        ]);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof Citizen) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk citizen.',
            ], 403);
        }

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }

    private function generateOtp(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
