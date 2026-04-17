<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('thresholds', function (Blueprint $table) {
            $table->integer('wind_siaga1')->default(20);
            $table->integer('wind_siaga2')->default(15);
            $table->integer('wind_siaga3')->default(10);

            $table->integer('rain_siaga1')->default(100);
            $table->integer('rain_siaga2')->default(70);
            $table->integer('rain_siaga3')->default(30);

            $table->integer('water_siaga1')->default(400);
            $table->integer('water_siaga2')->default(300);
            $table->integer('water_siaga3')->default(150);

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

        DB::table('thresholds')->get()->each(function ($row) {
            DB::table('thresholds')
                ->where('id', $row->id)
                ->update([
                    'water_siaga1' => $row->siaga1,
                    'water_siaga2' => $row->siaga2,
                    'water_siaga3' => $row->siaga3,
                ]);
        });

        Schema::table('thresholds', function (Blueprint $table) {
            if (Schema::hasColumn('thresholds', 'siaga1')) {
                $table->dropColumn(['siaga1', 'siaga2', 'siaga3']);
            }
        });
    }

    public function down()
    {
        Schema::table('thresholds', function (Blueprint $table) {
            $table->integer('siaga1')->default(400);
            $table->integer('siaga2')->default(300);
            $table->integer('siaga3')->default(150);
        });

        DB::table('thresholds')->get()->each(function ($row) {
            DB::table('thresholds')
                ->where('id', $row->id)
                ->update([
                    'siaga1' => $row->water_siaga1,
                    'siaga2' => $row->water_siaga2,
                    'siaga3' => $row->water_siaga3,
                ]);
        });

        Schema::table('thresholds', function (Blueprint $table) {
            $table->dropColumn([
                'wind_siaga1', 'wind_siaga2', 'wind_siaga3',
                'rain_siaga1', 'rain_siaga2', 'rain_siaga3',
                'water_siaga1', 'water_siaga2', 'water_siaga3',
                'temp_siaga1', 'temp_siaga2', 'temp_siaga3',
                'humidity_siaga1', 'humidity_siaga2', 'humidity_siaga3',
                'pressure_siaga1', 'pressure_siaga2', 'pressure_siaga3',
            ]);
        });
    }
};
