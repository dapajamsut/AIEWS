<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessRequest extends Model
{
    protected $table = 'access_requests';

    protected $fillable = [
        'name',
        'username',
        'instansi',
        'email',
        'nip',
        'phone',
        'letter_original_name',
        'letter_path',
        'letter_mime',
        'letter_size_bytes',
        'status',
        'note',
        'reviewed_at',
        'rejection_reason',
        'approved_email',
    ];

    protected $casts = [
        'letter_size_bytes' => 'integer',
        'reviewed_at'       => 'datetime',
    ];
}
