<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SensorLog extends Model
{
    protected $table = 'sensor_logs';

    protected $fillable = [
        'sensor_code',
        'value',
        'status'
    ];

    // Enable timestamps
    public $timestamps = true;
}