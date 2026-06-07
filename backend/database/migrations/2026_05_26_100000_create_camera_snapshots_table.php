<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tabel untuk menyimpan snapshot CCTV terkompresi.
     * Alur penyimpanan:
     *   Canvas (gambar + bounding box) → encode JPEG (quality 0.6)
     *   → deflate (pako) → base64 string → disimpan di kolom image_data.
     *
     * Saat ditampilkan kembali di web, frontend akan:
     *   base64 → inflate → JPEG bytes → Blob URL → ditampilkan di <img>.
     */
    public function up(): void
    {
        Schema::create('camera_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('camera_id')->default('CCTV-1984-BANJIR');
            $table->string('location')->nullable();
            $table->string('siaga_level')->nullable();          // SIAGA 1/2/3
            $table->double('water_level')->nullable();          // cm, snapshot saat capture
            $table->boolean('has_bounding_boxes')->default(false);
            $table->unsignedInteger('total_objects')->default(0);
            $table->unsignedInteger('image_width')->nullable();
            $table->unsignedInteger('image_height')->nullable();
            $table->float('original_size_kb')->nullable();      // perkiraan ukuran sebelum kompresi
            $table->float('compressed_size_kb')->nullable();    // ukuran setelah JPEG+deflate (base64)
            $table->string('compression_type')->default('jpeg+deflate');
            $table->string('capture_mode')->default('manual');  // manual | auto
            $table->mediumText('image_data');                   // base64 dari hasil deflate (max ~16MB)
            $table->timestamps();

            $table->index('siaga_level');
            $table->index('capture_mode');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('camera_snapshots');
    }
};
