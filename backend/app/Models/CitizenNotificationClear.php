<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CitizenNotificationClear extends Model
{
    protected $table = 'citizen_notification_clears';
    protected $primaryKey = 'citizen_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'citizen_id',
        'last_cleared_at',
    ];

    protected $casts = [
        'last_cleared_at' => 'datetime',
    ];

    public function citizen()
    {
        return $this->belongsTo(Citizen::class);
    }
}
