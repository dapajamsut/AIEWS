<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->string('siaga_level')->nullable()->after('status');       // 'SIAGA 1' / 'SIAGA 2' / 'SIAGA 3'
            $table->json('weather_data')->nullable()->after('siaga_level');  // snapshot cuaca saat log
            $table->string('region_name')->nullable()->after('weather_data'); // nama region aktif
        });
    }

    public function down(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->dropColumn(['siaga_level', 'weather_data', 'region_name']);
        });
    }
};
