<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('citizen_notifications', function (Blueprint $table) {
            // UUID supaya konsisten dengan FCM message ID dan tidak bisa ditebak
            $table->uuid('id')->primary();
            // Level: 'siaga1' | 'siaga2' | 'siaga3' (string supaya self-explanatory)
            $table->string('level', 16);
            $table->string('title');
            $table->text('body');
            // Optional metadata yang dipakai mobile untuk display tambahan
            $table->decimal('water_level', 8, 2)->nullable();
            $table->decimal('eta_hours', 6, 2)->nullable();
            $table->string('location')->nullable();
            // Waktu notifikasi diterbitkan (UTC). Mobile akan convert ke local TZ.
            $table->timestamp('issued_at');
            $table->timestamps();

            $table->index('issued_at');
            $table->index('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citizen_notifications');
    }
};
