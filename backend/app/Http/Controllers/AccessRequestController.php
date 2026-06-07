<?php

namespace App\Http\Controllers;

use App\Mail\AccessRequestNotification;
use App\Models\AccessRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AccessRequestController extends Controller
{
    /**
     * POST /api/access-requests
     *
     * Multipart form-data:
     *   name, username, instansi, email, nip, phone (text)
     *   letter (file, max 5 MB)
     *
     * Alur:
     *   1. Validasi & simpan file ke disk 'public'
     *   2. Insert record ke DB
     *   3. Kirim email ke ADMIN dengan file sebagai ATTACHMENT
     *      (pakai SMTP Gmail yang sudah dikonfigurasi di .env)
     *
     * Tujuan ke admin diambil dari config app.access_admin_email,
     * fallback ke env ACCESS_ADMIN_EMAIL atau MAIL_FROM_ADDRESS.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'username' => 'required|string|max:50',
            'instansi' => 'required|string|max:200',
            'email'    => 'required|email|max:150',
            'nip'      => 'required|string|max:50',
            'phone'    => 'required|string|max:30',
            'letter'   => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $file = $request->file('letter');
        $originalName = $file->getClientOriginalName();
        $mime = $file->getMimeType();
        $size = $file->getSize();

        $path = $file->store('access-letters', 'public');

        $record = AccessRequest::create([
            'name'                 => $data['name'],
            'username'             => $data['username'],
            'instansi'             => $data['instansi'],
            'email'                => $data['email'],
            'nip'                  => $data['nip'],
            'phone'                => $data['phone'],
            'letter_original_name' => $originalName,
            'letter_path'          => $path,
            'letter_mime'          => $mime,
            'letter_size_bytes'    => $size,
            'status'               => 'pending',
        ]);

        // Kirim email notifikasi + lampiran surat ke admin
        $adminEmail = env('ACCESS_ADMIN_EMAIL', 'nabielischak7@gmail.com');
        $absolutePath = Storage::disk('public')->path($path);

        $emailSent = false;
        $emailError = null;
        try {
            Mail::to($adminEmail)->send(
                new AccessRequestNotification($record, $absolutePath)
            );
            $emailSent = true;
        } catch (\Throwable $e) {
            // Tetap return success untuk record DB; admin bisa cek manual nanti.
            $emailError = $e->getMessage();
            Log::warning('Gagal kirim email permohonan akses', [
                'id'    => $record->id,
                'error' => $emailError,
            ]);
        }

        return response()->json([
            'success'              => true,
            'message'              => $emailSent
                ? 'Permohonan terkirim dan notifikasi email sudah dikirim ke admin.'
                : 'Permohonan tersimpan, namun pengiriman email ke admin gagal. Admin akan diberitahu manual.',
            'id'                   => $record->id,
            'email_sent'           => $emailSent,
            'email_error'          => $emailError,
            'letter_original_name' => $originalName,
            'letter_size_kb'       => round($size / 1024, 1),
        ]);
    }

    /**
     * GET /api/access-requests/{id}/letter
     *
     * Endpoint download surat permohonan (untuk fallback view dari admin
     * yang berada di mesin yang sama). Tidak dipakai untuk email lagi.
     */
    public function letter(int $id)
    {
        $record = AccessRequest::find($id);
        if (!$record || !$record->letter_path) {
            abort(404, 'Surat tidak ditemukan.');
        }

        $disk = Storage::disk('public');
        if (!$disk->exists($record->letter_path)) {
            abort(404, 'File fisik tidak ditemukan di storage.');
        }

        return response()->file(
            $disk->path($record->letter_path),
            [
                'Content-Type' => $record->letter_mime ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="' . ($record->letter_original_name ?: 'surat.pdf') . '"',
            ]
        );
    }
}
