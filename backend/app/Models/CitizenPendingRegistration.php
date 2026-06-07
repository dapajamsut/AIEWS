<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class CitizenPendingRegistration extends Model
{
    use Notifiable;

    protected $table = 'citizen_pending_registrations';

    protected $fillable = [
        'email',
        'name',
        'password',
        'phone',
        'address',
        'otp_hash',
        'expires_at',
        'attempts',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Required by Notifiable trait so $pending->notify(...) can route
     * the OTP email to the pending registration's email address.
     */
    public function routeNotificationForMail(): string
    {
        return $this->email;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
