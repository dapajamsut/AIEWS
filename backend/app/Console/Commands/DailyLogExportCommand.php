<?php

namespace App\Console\Commands;

use App\Models\SensorLog;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DailyLogExportCommand extends Command
{
    protected $signature   = 'log:daily-export {--date= : Tanggal yang diekspor (Y-m-d), default kemarin}';
    protected $description = 'Export log harian ke CSV, hapus dari DB, dan simpan ke storage/exports/';

    private array $sensorOrder = ['ANEMO-01', 'TIP-01', 'WATER-01', 'BME-TEMP', 'BME-HUM', 'BME-PRES'];

    public function handle(): void
    {
        $date = $this->option('date')
            ?? Carbon::yesterday('Asia/Jakarta')->format('Y-m-d');

        $this->info("Memulai export untuk tanggal: {$date}");

        $logs = SensorLog::whereDate('created_at', $date)->orderBy('created_at')->get();

        if ($logs->isEmpty()) {
            $this->warn("Tidak ada log untuk tanggal {$date}. Export dibatalkan.");
            return;
        }

        // Kelompokkan per sesi (batch_id, atau jika null: per detik)
        $groups = $logs->groupBy(fn ($l) =>
            $l->batch_id ?? substr($l->created_at, 0, 19)
        );

        $headers = [
            'No',
            'Waktu Pencatatan',
            'Level SIAGA',
            'Lokasi',
            'Suhu Cuaca (°C)',
            'Kondisi Cuaca',
            'Kategori Cuaca',
            'Kec. Angin / ANEMO-01 (m/s)',
            'Curah Hujan / TIP-01 (mm)',
            'Tinggi Air / WATER-01 (cm)',
            'Suhu Udara / BME-TEMP (°C)',
            'Kelembapan / BME-HUM (%)',
            'Tekanan Udara / BME-PRES (hPa)',
        ];

        $dataRows = [];
        $no = 1;

        foreach ($groups as $entries) {
            $first   = $entries->first();
            $weather = is_array($first->weather_data)
                ? $first->weather_data
                : json_decode($first->weather_data ?? '{}', true);

            $sensorMap = $entries->pluck('value', 'sensor_code')->toArray();
            $waktu     = Carbon::parse($first->created_at)
                ->setTimezone('Asia/Jakarta')
                ->format('d/m/Y H:i:s');

            $row = [
                $no++,
                $waktu,
                $first->siaga_level  ?? '-',
                $first->region_name  ?? '-',
                $weather['temp']        ?? '-',
                $weather['description'] ?? '-',
                $weather['main']        ?? '-',
            ];

            foreach ($this->sensorOrder as $code) {
                $row[] = isset($sensorMap[$code])
                    ? number_format((float) $sensorMap[$code], 2, '.', '')
                    : '-';
            }

            $dataRows[] = $row;
        }

        // ── Bangun isi CSV ──
        $esc = fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"';

        $exportAt  = Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s');
        $metaLines = [
            ['LOG PENCATATAN SISTEM MONITORING BANJIR'],
            ["Tanggal Data: {$date}"],
            ["Diekspor pada: {$exportAt}"],
            ["Jumlah sesi: " . count($dataRows)],
            ["Jumlah baris sensor: " . $logs->count()],
            [],
        ];

        $csvLines = array_map(
            fn ($r) => implode(',', array_map($esc, $r)),
            $metaLines
        );
        $csvLines[] = implode(',', array_map($esc, $headers));
        foreach ($dataRows as $r) {
            $csvLines[] = implode(',', array_map($esc, $r));
        }

        $csv      = implode("\r\n", $csvLines);
        $filename = "exports/log_{$date}.csv";

        Storage::disk('local')->put($filename, "\xEF\xBB\xBF" . $csv);

        // ── Hapus log yang sudah di-export ──
        $deleted = SensorLog::whereDate('created_at', $date)->delete();

        $this->info("✅ Export selesai: {$filename}");
        $this->info("   Baris dihapus dari DB: {$deleted}");
    }
}
