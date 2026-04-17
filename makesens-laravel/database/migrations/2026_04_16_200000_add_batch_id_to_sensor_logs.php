<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            // batch_id menyatukan semua sensor yang disimpan dalam 1 sesi
            $table->string('batch_id')->nullable()->index()->after('region_name');
        });
    }

    public function down(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->dropColumn('batch_id');
        });
    }
};
