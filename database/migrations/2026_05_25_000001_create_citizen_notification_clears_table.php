<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('citizen_notification_clears', function (Blueprint $table) {
            // 1 row per citizen — citizen_id sebagai PK + FK.
            // Saat user tap "Bersihkan semua" di mobile, last_cleared_at
            // di-update; endpoint GET filter notif yang issued sebelum ini.
            $table->unsignedBigInteger('citizen_id')->primary();
            $table->timestamp('last_cleared_at');
            $table->timestamps();

            $table->foreign('citizen_id')
                ->references('id')
                ->on('citizens')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citizen_notification_clears');
    }
};
