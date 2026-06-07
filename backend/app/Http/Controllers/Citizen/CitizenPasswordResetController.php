<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Notifications\CitizenOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CitizenPasswordResetController extends Controller
{
    private const OTP_TTL_MINUTES = 10;

    /**
     * Send a password reset OTP. Response is generic to prevent email enumeration:
     * the same 200 response is returned whether the email exists or not.
     */
    public function sendResetOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $citizen = Citizen::where('email', $data['email'])->first();

        if ($citizen) {
            $otp = $this->generateOtp();

            DB::table('citizen_password_reset_tokens')->updateOrInsert(
                ['email' => $citizen->email],
                [
                    'token' => Hash::make($otp),
                    'created_at' => Carbon::now(),
                ]
            );

            $citizen->notify(new CitizenOtpNotification($otp, 'reset'));
        }

        return response()->json([
            'message' => 'Jika email terdaftar, kode OTP telah dikirim.',
            'expires_in_minutes' => self::OTP_TTL_MINUTES,
        ]);
    }

    /**
     * Reset password using the OTP. Revokes all existing Sanctum tokens on success.
     */
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $row = DB::table('citizen_password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if (! $row) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP salah'],
            ]);
        }

        $createdAt = Carbon::parse($row->created_at);

        if ($createdAt->addMinutes(self::OTP_TTL_MINUTES)->isPast()) {
            DB::table('citizen_password_reset_tokens')
                ->where('email', $data['email'])
                ->delete();

            throw ValidationException::withMessages([
                'otp' => ['Kode OTP telah kedaluwarsa. Silakan minta kode baru.'],
            ]);
        }

        if (! Hash::check($data['otp'], $row->token)) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP salah'],
            ]);
        }

        $citizen = Citizen::where('email', $data['email'])->first();

        if (! $citizen) {
            // Should not happen — row exists for a non-existent citizen.
            throw ValidationException::withMessages([
                'email' => ['Akun tidak ditemukan.'],
            ]);
        }

        $citizen->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        // Invalidate all existing Sanctum tokens.
        $citizen->tokens()->delete();

        DB::table('citizen_password_reset_tokens')
            ->where('email', $data['email'])
            ->delete();

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan login kembali.',
        ]);
    }

    private function generateOtp(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
