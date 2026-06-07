<?php

namespace App\Models;

use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Citizen extends Authenticatable implements CanResetPassword
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'citizens';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the e-mail address where password reset links are sent.
     */
    public function getEmailForPasswordReset(): string
    {
        return $this->email;
    }

    public function notificationClear()
    {
        return $this->hasOne(CitizenNotificationClear::class, 'citizen_id');
    }

    /**
     * Cutoff timestamp untuk visibility notifikasi.
     * Notifikasi yang issued setelah waktu ini akan tampil.
     *
     * Logika:
     *   - Kalau user belum pernah "Bersihkan semua" → cutoff = created_at
     *   - Kalau sudah pernah → cutoff = MAX(created_at, last_cleared_at)
     */
    public function notificationCutoff(): \Carbon\Carbon
    {
        $clear = $this->notificationClear;
        if ($clear === null) return $this->created_at;
        return $clear->last_cleared_at->greaterThan($this->created_at)
            ? $clear->last_cleared_at
            : $this->created_at;
    }
}
