<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManPowerJumperTransaction extends Model
{
    use HasFactory;

    protected $table = 'man_power_jumper_transactions';

    protected $fillable = [
        'transaction_date',
        'man_power_jumper_id',
        'nik',
        'name',
        'origin_department',
        'origin_line',
        'loan_department',
        'loan_line',
        'loan_start_date',
        'in_time',
        'out_time',
        'status',
        'is_holiday',
        'remarks',
        'overtime_hours',
        'overtime_department',
        'overtime_line',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'loan_start_date' => 'date',
        'is_holiday' => 'boolean',
    ];

    public function jumper(): BelongsTo
    {
        return $this->belongsTo(ManPowerJumper::class, 'man_power_jumper_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
