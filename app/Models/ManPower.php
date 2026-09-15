<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManPower extends Model
{
    use HasFactory;

    protected $table = 'man_powers';

    protected $fillable = [
        'nik',
        'name',
        'department',
        'line',
        'uid',
    ];
}
