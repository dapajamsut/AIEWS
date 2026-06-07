<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Jumlah percobaan salah sebelum kena lockout.
     */
    private const ATTEMPTS_PER_BLOCK = 3;

    /**
     * Durasi lockout pertama (menit). Setiap blok berikutnya +10 menit.
     * Blok 1 → 5 menit, Blok 2 → 15 menit, Blok 3 → 25 menit, dst.
     */
    private const BASE_LOCKOUT_MINUTES = 5;
    private const LOCKOUT_INCREMENT_MINUTES = 10;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            $this->recordFailedAttempt();

            // Cek apakah langsung diblokir (terkunci) setelah penambahan attempt gagal
            if (RateLimiter::tooManyAttempts($this->throttleKey(), self::ATTEMPTS_PER_BLOCK)) {
                $seconds = RateLimiter::availableIn($this->throttleKey());
                $minutes = ceil($seconds / 60);
                throw ValidationException::withMessages([
                    'email' => "Terlalu banyak percobaan login. Akun dikunci selama {$minutes} menit.",
                ]);
            }

            $attemptsNow = RateLimiter::attempts($this->throttleKey());
            $remaining = self::ATTEMPTS_PER_BLOCK - $attemptsNow;

            throw ValidationException::withMessages([
                'email' => "Email atau password salah. Sisa percobaan: {$remaining}x.",
            ]);
        }

        // Login berhasil — bersihkan semua counter
        RateLimiter::clear($this->throttleKey());
        Cache::forget($this->blockCountKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::ATTEMPTS_PER_BLOCK)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());
        $minutes = ceil($seconds / 60);

        throw ValidationException::withMessages([
            'email' => "Terlalu banyak percobaan login. Coba lagi dalam {$minutes} menit.",
        ]);
    }

    /**
     * Catat percobaan gagal dan terapkan progressive lockout.
     * Tiap 3x salah → lockout: Blok 1=5 mnt, Blok 2=10 mnt, Blok 3=20 mnt, dst.
     */
    private function recordFailedAttempt(): void
    {
        RateLimiter::hit($this->throttleKey(), 60); // decay sementara, akan di-override

        $attemptsNow = RateLimiter::attempts($this->throttleKey());

        if ($attemptsNow >= self::ATTEMPTS_PER_BLOCK) {
            // Hitung sudah berapa blok yang terjadi (berapa kali sudah kena lockout sebelumnya)
            $blockCount  = Cache::get($this->blockCountKey(), 0) + 1;
            Cache::put($this->blockCountKey(), $blockCount, now()->addHours(24));

            // Blok 1 = 5 menit, Blok 2 = 10 menit, Blok 3 = 20 menit, Blok 4 = 30 menit, dst.
            $lockoutMinutes = ($blockCount === 1) ? 5 : 10 * ($blockCount - 1);

            // Set RateLimiter dengan durasi lockout yang baru
            RateLimiter::clear($this->throttleKey());
            for ($i = 0; $i < self::ATTEMPTS_PER_BLOCK; $i++) {
                RateLimiter::hit($this->throttleKey(), $lockoutMinutes * 60);
            }
        }
    }

    /**
     * Key untuk menyimpan jumlah blok lockout yang sudah terjadi.
     */
    private function blockCountKey(): string
    {
        return 'login_block_count:' . $this->throttleKey();
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')).'|'.$this->ip());
    }
}
