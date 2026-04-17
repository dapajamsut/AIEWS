<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('thresholds', function (Blueprint $table) {
            // Hanya simpan ketinggian air untuk SIAGA
            $table->integer('water_siaga1')->default(400)->change();
            $table->integer('water_siaga2')->default(300)->change();
            $table->integer('water_siaga3')->default(150)->change();

            // Drop kolom wind dan rain yang sebelumnya ada untuk SIAGA
            $table->dropColumn([
                'wind_siaga1', 'wind_siaga2', 'wind_siaga3',
                'rain_siaga1', 'rain_siaga2', 'rain_siaga3',
                'temp_siaga1', 'temp_siaga2', 'temp_siaga3',
                'humidity_siaga1', 'humidity_siaga2', 'humidity_siaga3',
                'pressure_siaga1', 'pressure_siaga2', 'pressure_siaga3',
            ]);

            // Kondisi Cuaca KERING
            $table->integer('wind_kering')->default(5);
            $table->integer('rain_kering')->default(0);
            $table->integer('temp_kering')->default(35);
            $table->integer('humidity_kering')->default(40);
            $table->integer('pressure_kering')->default(1025);

            // Kondisi Cuaca NORMAL
            $table->integer('wind_normal')->default(10);
            $table->integer('rain_normal')->default(5);
            $table->integer('temp_normal')->default(28);
            $table->integer('humidity_normal')->default(65);
            $table->integer('pressure_normal')->default(1015);

            // Kondisi Cuaca BERANGIN
            $table->integer('wind_berangin')->default(20);
            $table->integer('rain_berangin')->default(10);
            $table->integer('temp_berangin')->default(25);
            $table->integer('humidity_berangin')->default(75);
            $table->integer('pressure_berangin')->default(1005);

            // Kondisi Cuaca HUJAN
            $table->integer('wind_hujan')->default(30);
            $table->integer('rain_hujan')->default(50);
            $table->integer('temp_hujan')->default(20);
            $table->integer('humidity_hujan')->default(85);
            $table->integer('pressure_hujan')->default(995);

            // Kondisi Cuaca HUJAN DERAS
            $table->integer('wind_hujan_deras')->default(50);
            $table->integer('rain_hujan_deras')->default(100);
            $table->integer('temp_hujan_deras')->default(18);
            $table->integer('humidity_hujan_deras')->default(95);
            $table->integer('pressure_hujan_deras')->default(985);
        });
    }

    public function down()
    {
        Schema::table('thresholds', function (Blueprint $table) {
            $table->dropColumn([
                'wind_kering', 'rain_kering', 'temp_kering', 'humidity_kering', 'pressure_kering',
                'wind_normal', 'rain_normal', 'temp_normal', 'humidity_normal', 'pressure_normal',
                'wind_berangin', 'rain_berangin', 'temp_berangin', 'humidity_berangin', 'pressure_berangin',
                'wind_hujan', 'rain_hujan', 'temp_hujan', 'humidity_hujan', 'pressure_hujan',
                'wind_hujan_deras', 'rain_hujan_deras', 'temp_hujan_deras', 'humidity_hujan_deras', 'pressure_hujan_deras',
            ]);

            $table->integer('wind_siaga1')->default(20);
            $table->integer('wind_siaga2')->default(15);
            $table->integer('wind_siaga3')->default(10);
            $table->integer('rain_siaga1')->default(100);
            $table->integer('rain_siaga2')->default(70);
            $table->integer('rain_siaga3')->default(30);
            $table->integer('temp_siaga1')->default(40);
            $table->integer('temp_siaga2')->default(35);
            $table->integer('temp_siaga3')->default(30);
            $table->integer('humidity_siaga1')->default(95);
            $table->integer('humidity_siaga2')->default(85);
            $table->integer('humidity_siaga3')->default(70);
            $table->integer('pressure_siaga1')->default(1030);
            $table->integer('pressure_siaga2')->default(1010);
            $table->integer('pressure_siaga3')->default(1000);
        });
    }
};
