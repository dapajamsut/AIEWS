<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel untuk mencatat permohonan akses dari halaman /login (Daftar Akses Baru).
     * Surat permohonan diunggah ke storage publik dan path-nya disimpan di sini,
     * sementara notifikasi ke admin dikirim via EmailJS dengan link download.
     */
    public function up(): void
    {
        Schema::create('access_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username');
            $table->string('instansi');
            $table->string('email');
            $table->string('nip');
            $table->string('phone');
            $table->string('letter_original_name')->nullable();
            $table->string('letter_path')->nullable();      // path relatif di disk 'public'
            $table->string('letter_mime')->nullable();
            $table->unsignedInteger('letter_size_bytes')->nullable();
            $table->string('status')->default('pending');   // pending | approved | rejected
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_requests');
    }
};
