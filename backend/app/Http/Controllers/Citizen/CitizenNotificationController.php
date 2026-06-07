<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\CitizenNotification;
use App\Models\CitizenNotificationClear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CitizenNotificationController extends Controller
{
    /**
     * GET /api/citizen/notifications
     *
     * Return riwayat notifikasi peringatan banjir 30 hari terakhir,
     * urut dari yang paling baru. Filter visibility server-side pakai
     * notificationCutoff() — user baru tidak lihat notif lama.
     *
     * Query params (opsional):
     *   - limit : default 200, max 500
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Citizen) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk citizen.',
            ], 403);
        }

        $request->validate([
            'limit' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ]);

        $limit  = (int) $request->input('limit', 200);
        $cutoff = $user->notificationCutoff();

        $notifs = CitizenNotification::query()
            // Per-user visibility cutoff (created_at OR last_cleared_at).
            ->where('issued_at', '>', $cutoff)
            // Retention 30 hari.
            ->where('issued_at', '>=', now()->subDays(30))
            ->orderBy('issued_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'data'  => $notifs,
            'count' => $notifs->count(),
        ], 200);
    }

    /**
     * POST /api/citizen/notifications/clear
     *
     * Tandai timestamp "bersihkan semua" untuk user. Semua notifikasi yang
     * issued sebelum waktu ini akan ter-hidden dari endpoint index.
     *
     * Idempotent: panggil berkali-kali tetap aman, hanya last_cleared_at
     * yang ter-update jadi waktu sekarang.
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Citizen) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk citizen.',
            ], 403);
        }

        CitizenNotificationClear::updateOrCreate(
            ['citizen_id' => $user->id],
            ['last_cleared_at' => now()]
        );

        return response()->json([
            'message' => 'Notifikasi berhasil dibersihkan',
        ], 200);
    }
}
