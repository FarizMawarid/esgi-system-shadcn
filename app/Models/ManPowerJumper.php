<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManPowerJumper extends Model
{
    use HasFactory;

    protected $table = 'man_power_jumpers';

    protected $fillable = [
        'man_power_id',
        'nik',
        'name',
        'department',
        'line',
        'proses_sebelumnya',
        'skill',
        'status_mutasi',
        'mutasi_department',
        'mutasi_line',
        'tanggal_mutasi',
        'tanggal_keluar',
        'keterangan_mutasi',
        'uid',
    ];

    protected $casts = [
        'tanggal_mutasi' => 'date',
        'tanggal_keluar' => 'date',
    ];

    public function manPower(): BelongsTo
    {
        return $this->belongsTo(ManPower::class, 'man_power_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(ManPowerJumperTransaction::class, 'man_power_jumper_id');
    }

    /**
     * Scope query to only include jumpers that are active on a specific date.
     */
    public function scopeActiveOnDate($query, ?string $date = null)
    {
        $date = $date ?: now()->format('Y-m-d');

        return $query->where(function ($q) use ($date) {
            $q->where(function ($sub) {
                $sub->whereNull('status_mutasi')
                    ->orWhere('status_mutasi', 'Aktif')
                    ->orWhere('status_mutasi', 'Active');
            })->orWhere(function ($sub) use ($date) {
                $sub->where(function ($s) {
                    $s->where('status_mutasi', 'Mutasi')
                      ->orWhere('status_mutasi', 'like', 'Mutasi%')
                      ->orWhere('status_mutasi', 'like', 'Transfer%');
                })
                ->where(function ($d) use ($date) {
                    $d->where(function ($k) use ($date) {
                        $k->whereNotNull('tanggal_keluar')
                          ->whereDate('tanggal_keluar', '>', $date);
                    })->orWhere(function ($m) use ($date) {
                        $m->whereNull('tanggal_keluar')
                          ->whereNotNull('tanggal_mutasi')
                          ->whereDate('tanggal_mutasi', '>', $date);
                    });
                });
            })->orWhere(function ($sub) use ($date) {
                $sub->where(function ($s) {
                    $s->where('status_mutasi', 'Keluar')
                      ->orWhere('status_mutasi', 'like', 'Keluar%')
                      ->orWhere('status_mutasi', 'like', 'Out%');
                })
                ->whereNotNull('tanggal_keluar')
                ->whereDate('tanggal_keluar', '>', $date);
            });
        });
    }

    /**
     * Check if the jumper instance is active on a given date.
     */
    public function isActiveOnDate(?string $date = null): bool
    {
        $date = $date ?: now()->format('Y-m-d');

        if (!$this->status_mutasi || in_array($this->status_mutasi, ['Aktif', 'Active'])) {
            return true;
        }

        if ($this->status_mutasi === 'Mutasi' || str_starts_with($this->status_mutasi, 'Mutasi') || str_starts_with($this->status_mutasi, 'Transfer')) {
            $effectiveExitDate = $this->tanggal_keluar ?: $this->tanggal_mutasi;
            if (!$effectiveExitDate) {
                return false;
            }
            $mutasiDate = is_string($effectiveExitDate) ? $effectiveExitDate : $effectiveExitDate->format('Y-m-d');
            return $mutasiDate > $date;
        }

        if ($this->status_mutasi === 'Keluar' || str_starts_with($this->status_mutasi, 'Keluar') || str_starts_with($this->status_mutasi, 'Out')) {
            if (!$this->tanggal_keluar) {
                return false;
            }
            $keluarDate = is_string($this->tanggal_keluar) ? $this->tanggal_keluar : $this->tanggal_keluar->format('Y-m-d');
            return $keluarDate > $date;
        }

        return false;
    }
}
