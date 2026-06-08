<?php

namespace App\Http\Controllers;

use App\Mail\AccessRequestApproved;
use App\Mail\AccessRequestRejected;
use App\Models\AccessRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class AccessReviewController extends Controller
{
    /** GET /admin/access-requests/{id} — halaman web review */
    public function show(int $id)
    {
        $req = AccessRequest::findOrFail($id);
        return view('admin.access-review', ['req' => $req]);
    }

    /** GET /admin/access-requests/{id}/letter — inline view surat */
    public function letter(int $id)
    {
        $req = AccessRequest::findOrFail($id);
        if (!$req->letter_path) abort(404);
        $disk = Storage::disk('public');
        if (!$disk->exists($req->letter_path)) abort(404, 'File tidak ditemukan');
        return response()->file(
            $disk->path($req->letter_path),
            [
                'Content-Type'        => $req->letter_mime ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="' . ($req->letter_original_name ?: 'surat') . '"',
            ]
        );
    }

    /** POST /admin/access-requests/{id}/approve */
    public function approve(Request $request, int $id)
    {
        $data = $request->validate([
            'login_email'    => 'required|email|max:150',
            'login_password' => 'required|string|min:6|max:200',
        ]);

        $req = AccessRequest::findOrFail($id);
        if ($req->status !== 'pending') {
            return back()->withErrors(['status' => 'Permohonan ini sudah pernah direview.'])->withInput();
        }

        // Buat akun login secara otomatis dari email + password yang diisi admin.
        // Jika email sudah terdaftar, password-nya diperbarui agar kredensial yang
        // dikirim ke pemohon dijamin valid. Tidak perlu lagi `php artisan app:create-user`.
        $user = User::updateOrCreate(
            ['email' => $data['login_email']],
            [
                'name'     => $req->name ?: $data['login_email'],
                'password' => $data['login_password'], // auto-hashed via cast 'hashed'
            ]
        );

        $req->update([
            'status'         => 'approved',
            'reviewed_at'    => now(),
            'approved_email' => $data['login_email'],
        ]);

        try {
            Mail::to($req->email)->send(
                new AccessRequestApproved($req, $data['login_email'], $data['login_password'])
            );
        } catch (\Throwable $e) {
            return back()->withErrors([
                'mail' => 'Status sudah disetujui di DB, tapi email kredensial gagal terkirim: ' . $e->getMessage(),
            ]);
        }

        // Generate signed URL baru ke halaman show — biar admin bisa lihat
        // konfirmasi sukses tanpa kena 403 invalid signature.
        $redirectUrl = URL::temporarySignedRoute(
            'admin.access.show',
            now()->addDays(14),
            ['id' => $req->id]
        );
        return redirect($redirectUrl)->with('approved', true);
    }

    /** POST /admin/access-requests/{id}/reject */
    public function reject(Request $request, int $id)
    {
        $data = $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500',
        ]);

        $req = AccessRequest::findOrFail($id);
        if ($req->status !== 'pending') {
            return back()->withErrors(['status' => 'Permohonan ini sudah pernah direview.'])->withInput();
        }

        $req->update([
            'status'           => 'rejected',
            'reviewed_at'      => now(),
            'rejection_reason' => $data['rejection_reason'],
        ]);

        try {
            Mail::to($req->email)->send(new AccessRequestRejected($req, $data['rejection_reason']));
        } catch (\Throwable $e) {
            return back()->withErrors([
                'mail' => 'Status sudah ditolak di DB, tapi email pemberitahuan gagal terkirim: ' . $e->getMessage(),
            ]);
        }

        $redirectUrl = URL::temporarySignedRoute(
            'admin.access.show',
            now()->addDays(14),
            ['id' => $req->id]
        );
        return redirect($redirectUrl)->with('rejected', true);
    }
}
