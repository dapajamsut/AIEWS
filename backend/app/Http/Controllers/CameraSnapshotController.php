<?php

namespace App\Http\Controllers;

use App\Models\CameraSnapshot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CameraSnapshotController extends Controller
{
    /**
     * POST /api/camera/snapshots
     *
     * Body (JSON):
     *  - image_data        (string, required) → base64 dari JPEG hasil deflate (pako).
     *  - camera_id         (string, optional)
     *  - location          (string, optional)
     *  - siaga_level       (string, optional) - misal "SIAGA 1"
     *  - water_level       (number, optional) - cm
     *  - has_bounding_boxes (bool, optional)
     *  - total_objects     (int, optional)
     *  - image_width       (int, optional)
     *  - image_height      (int, optional)
     *  - original_size_kb  (number, optional) - ukuran sebelum kompresi
     *  - compressed_size_kb(number, optional) - ukuran final (base64) yang dikirim
     *  - compression_type  (string, optional) default "jpeg+deflate"
     *  - capture_mode      (string, optional) "manual" | "auto"
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'image_data'         => 'required|string',
            'camera_id'          => 'nullable|string|max:100',
            'location'           => 'nullable|string|max:255',
            'siaga_level'        => 'nullable|string|max:50',
            'water_level'        => 'nullable|numeric',
            'has_bounding_boxes' => 'nullable|boolean',
            'total_objects'      => 'nullable|integer|min:0',
            'image_width'        => 'nullable|integer|min:0',
            'image_height'       => 'nullable|integer|min:0',
            'original_size_kb'   => 'nullable|numeric|min:0',
            'compressed_size_kb' => 'nullable|numeric|min:0',
            'compression_type'   => 'nullable|string|max:50',
            'capture_mode'       => 'nullable|string|in:manual,auto',
        ]);

        // Pengaman: cek payload tidak terlalu besar (default kolom MEDIUMTEXT ~16MB).
        // 12MB string base64 = ~9MB binary, masih aman.
        $approxBytes = strlen($data['image_data']);
        if ($approxBytes > 12 * 1024 * 1024) {
            return response()->json([
                'success' => false,
                'message' => 'Data gambar terlalu besar. Tingkatkan kompresi di sisi frontend.',
            ], 413);
        }

        $snapshot = CameraSnapshot::create($data);

        return response()->json([
            'success'  => true,
            'message'  => 'Snapshot berhasil disimpan.',
            'id'       => $snapshot->id,
            'saved_at' => $snapshot->created_at->setTimezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
        ]);
    }

    /**
     * GET /api/camera/snapshots
     *
     * Mengembalikan list snapshot TANPA image_data (ringan, untuk gallery).
     * Query params:
     *  - date       (Y-m-d) optional
     *  - siaga      ("SIAGA 1"/2/3) optional
     *  - capture_mode (manual/auto) optional
     *  - per_page   (int, default 20)
     */
    public function index(Request $request)
    {
        $tz = 'Asia/Jakarta';
        $query = CameraSnapshot::query()->select([
            'id', 'camera_id', 'location', 'siaga_level', 'water_level',
            'has_bounding_boxes', 'total_objects', 'image_width', 'image_height',
            'original_size_kb', 'compressed_size_kb', 'compression_type',
            'capture_mode', 'created_at', 'updated_at',
        ]);

        if ($date = $request->input('date')) {
            $from = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 00:00:00", $tz)->utc();
            $to   = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 23:59:59", $tz)->utc();
            $query->whereBetween('created_at', [$from, $to]);
        }

        if ($siaga = $request->input('siaga')) {
            $query->where('siaga_level', $siaga);
        }

        if ($mode = $request->input('capture_mode')) {
            $query->where('capture_mode', $mode);
        }

        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        // Tambahkan field 'created_at_wib' yang sudah dikonversi ke WIB untuk kemudahan UI
        $items = collect($paginator->items())->map(function ($s) use ($tz) {
            return array_merge($s->toArray(), [
                'created_at_wib' => \Carbon\Carbon::parse($s->created_at)
                    ->setTimezone($tz)->format('d/m/Y H:i:s'),
            ]);
        });

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * GET /api/camera/snapshots/{id}
     *
     * Mengembalikan 1 snapshot LENGKAP dengan image_data (base64 deflate).
     * Frontend bertanggung jawab melakukan inflate untuk mendapatkan JPEG.
     */
    public function show(int $id)
    {
        $snapshot = CameraSnapshot::find($id);
        if (!$snapshot) {
            return response()->json(['success' => false, 'message' => 'Snapshot tidak ditemukan.'], 404);
        }

        $tz = 'Asia/Jakarta';
        return response()->json([
            'success' => true,
            'data'    => array_merge($snapshot->toArray(), [
                'created_at_wib' => \Carbon\Carbon::parse($snapshot->created_at)
                    ->setTimezone($tz)->format('d/m/Y H:i:s'),
            ]),
        ]);
    }

    /**
     * DELETE /api/camera/snapshots/{id}
     */
    public function destroy(int $id)
    {
        $snapshot = CameraSnapshot::find($id);
        if (!$snapshot) {
            return response()->json(['success' => false, 'message' => 'Snapshot tidak ditemukan.'], 404);
        }
        $snapshot->delete();
        return response()->json(['success' => true, 'message' => 'Snapshot dihapus.']);
    }

    /**
     * GET /api/camera/snapshots/stats
     * Ringkasan: jumlah, total ukuran, hemat berapa.
     */
    public function stats()
    {
        $totalCount = CameraSnapshot::count();
        $totalCompressedKb = (float) CameraSnapshot::sum('compressed_size_kb');
        $totalOriginalKb   = (float) CameraSnapshot::sum('original_size_kb');
        $savingPercent = $totalOriginalKb > 0
            ? round((1 - ($totalCompressedKb / $totalOriginalKb)) * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'data'    => [
                'total_snapshots'      => $totalCount,
                'total_original_kb'    => round($totalOriginalKb, 2),
                'total_compressed_kb'  => round($totalCompressedKb, 2),
                'saving_percent'       => $savingPercent,
            ],
        ]);
    }
}
