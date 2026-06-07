<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CameraSnapshot extends Model
{
    protected $table = 'camera_snapshots';

    protected $fillable = [
        'camera_id',
        'location',
        'siaga_level',
        'water_level',
        'has_bounding_boxes',
        'total_objects',
        'image_width',
        'image_height',
        'original_size_kb',
        'compressed_size_kb',
        'compression_type',
        'capture_mode',
        'image_data',
    ];

    protected $casts = [
        'has_bounding_boxes'  => 'boolean',
        'water_level'         => 'float',
        'original_size_kb'    => 'float',
        'compressed_size_kb'  => 'float',
        'image_width'         => 'integer',
        'image_height'        => 'integer',
        'total_objects'       => 'integer',
    ];

    public $timestamps = true;
}
