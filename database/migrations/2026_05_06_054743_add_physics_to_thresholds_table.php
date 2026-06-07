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
        Schema::table('thresholds', function (Blueprint $table) {
            $table->float('physics_w')->nullable()->comment('Lebar sungai (m)');
            $table->float('physics_s', 10, 6)->nullable()->comment('Kemiringan');
            $table->float('physics_n', 10, 4)->nullable()->comment('Manning n');
            $table->float('physics_a_das')->nullable()->comment('Luas DAS (m2)');
            $table->float('physics_c')->nullable()->comment('Koefisien Limpasan');
            $table->float('physics_l_segment')->nullable()->comment('Panjang Segmen (m)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('thresholds', function (Blueprint $table) {
            $table->dropColumn([
                'physics_w',
                'physics_s',
                'physics_n',
                'physics_a_das',
                'physics_c',
                'physics_l_segment'
            ]);
        });
    }
};
