<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('man_power_jumpers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('man_power_id')->nullable()->constrained('man_powers')->nullOnDelete();
            $table->string('nik')->unique();
            $table->string('name');
            $table->string('department');
            $table->string('line');
            $table->string('proses_sebelumnya')->nullable();
            $table->text('skill')->nullable();
            $table->string('status_mutasi')->default('Aktif')->nullable();
            $table->string('mutasi_department')->nullable();
            $table->string('mutasi_line')->nullable();
            $table->date('tanggal_mutasi')->nullable();
            $table->date('tanggal_keluar')->nullable();
            $table->text('keterangan_mutasi')->nullable();
            $table->string('uid')->unique()->nullable();
            $table->timestamps();
        });

        Schema::create('man_power_jumper_transactions', function (Blueprint $table) {
            $table->id();
            $table->date('transaction_date');
            $table->foreignId('man_power_jumper_id')->constrained('man_power_jumpers')->cascadeOnDelete();
            $table->string('nik');
            $table->string('name');
            $table->string('origin_department');
            $table->string('origin_line');
            $table->string('loan_department')->nullable();
            $table->string('loan_line')->nullable();
            $table->date('loan_start_date')->nullable();
            $table->time('in_time')->default('07:30:00')->nullable();
            $table->time('out_time')->nullable();
            $table->string('status')->default('BORROWED');
            $table->boolean('is_holiday')->default(false);
            $table->text('remarks')->nullable();
            $table->decimal('overtime_hours', 4, 1)->nullable();
            $table->string('overtime_department')->nullable();
            $table->string('overtime_line')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['transaction_date', 'man_power_jumper_id'], 'jumper_tx_date_unique');
            $table->index('transaction_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('man_power_jumper_transactions');
        Schema::dropIfExists('man_power_jumpers');
    }
};
