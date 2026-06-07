<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CitizenNotification extends Model
{
    use HasUuids;

    protected $table = 'citizen_notifications';

    protected $fillable = [
        'id',
        'level',
        'title',
        'body',
        'water_level',
        'eta_hours',
        'location',
        'issued_at',
    ];

    protected $casts = [
        'issued_at'   => 'datetime',
        'water_level' => 'float',
        'eta_hours'   => 'float',
    ];
}
