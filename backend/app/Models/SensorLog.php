<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SensorLog extends Model
{
    protected $table = 'sensor_logs';

    protected $fillable = [
        'sensor_code',
        'value',
        'status',
        'siaga_level',
        'weather_data',
        'region_name',
        'batch_id',
    ];

    protected $casts = [
        'weather_data' => 'array',
    ];

    // Enable timestamps
    public $timestamps = true;
}