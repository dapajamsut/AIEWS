<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('zone_id')->unique();   // identitas zona, mis. "zone_water_01"
            $table->string('name');                 // nama tampilan
            $table->string('sensor_code');          // referensi ke sensors.sensor_code
            $table->double('latitude');
            $table->double('longitude');
            $table->integer('radius_m')->default(1000); // jari-jari zona (meter)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
