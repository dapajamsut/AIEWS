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
        'wind_siaga1', 'wind_siaga2', 'wind_siaga3',
        'rain_siaga1', 'rain_siaga2', 'rain_siaga3',
        'temp_siaga1', 'temp_siaga2', 'temp_siaga3',
        'humidity_siaga1', 'humidity_siaga2', 'humidity_siaga3',
        'pressure_siaga1', 'pressure_siaga2', 'pressure_siaga3',
        'wind_kering', 'rain_kering', 'temp_kering', 'humidity_kering', 'pressure_kering',
        'wind_normal', 'rain_normal', 'temp_normal', 'humidity_normal', 'pressure_normal',
        'wind_berangin', 'rain_berangin', 'temp_berangin', 'humidity_berangin', 'pressure_berangin',
        'wind_hujan', 'rain_hujan', 'temp_hujan', 'humidity_hujan', 'pressure_hujan',
        'wind_hujan_deras', 'rain_hujan_deras', 'temp_hujan_deras', 'humidity_hujan_deras', 'pressure_hujan_deras',
    ];
}
