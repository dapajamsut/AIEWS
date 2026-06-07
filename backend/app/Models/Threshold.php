<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Threshold extends Model
{
    protected $fillable = [
        // Legacy SIAGA water columns
        'siaga1', 'siaga2', 'siaga3',

        // Current SIAGA water columns
        'water_siaga1', 'water_siaga2', 'water_siaga3',

        // Weather Conditions
        'wind_kering', 'rain_kering', 'temp_kering', 'humidity_kering', 'pressure_kering',
        'wind_normal', 'rain_normal', 'temp_normal', 'humidity_normal', 'pressure_normal',
        'wind_berangin', 'rain_berangin', 'temp_berangin', 'humidity_berangin', 'pressure_berangin',
        'wind_hujan', 'rain_hujan', 'temp_hujan', 'humidity_hujan', 'pressure_hujan',
        'wind_hujan_deras', 'rain_hujan_deras', 'temp_hujan_deras', 'humidity_hujan_deras', 'pressure_hujan_deras',
    ];
}
