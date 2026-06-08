<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\Sensor;
use App\Models\Threshold;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CitizenZoneController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Citizen) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini hanya untuk citizen.',
            ], 403);
        }

        $zones = Zone::orderBy('zone_id')->get();

        $latestBySensor = Sensor::select('sensor_code', 'type', 'value', 'status', 'created_at')
            ->latest()
            ->get()
            ->unique('sensor_code')
            ->keyBy('sensor_code');

        $thresholds = $this->getWaterThresholds();

        $data = $zones->map(function (Zone $zone) use ($latestBySensor, $thresholds) {
            $reading     = $latestBySensor->get($zone->sensor_code);
            $siagaLevel  = $this->resolveSiagaLevel($reading, $thresholds);

            return [
                'zone_id'     => $zone->zone_id,
                'name'        => $zone->name,
                'sensor_id'   => $zone->sensor_code,
                'latitude'    => $zone->latitude,
                'longitude'   => $zone->longitude,
                'radius_m'    => $zone->radius_m,
                'siaga_level' => $siagaLevel,
            ];
        })->values();

        return response()->json([
            'data'  => $data,
            'count' => $data->count(),
        ], 200);
    }

    private function getWaterThresholds(): array
    {
        $t = Threshold::first();

        if (! $t) {
            return ['siaga1' => null, 'siaga2' => null];
        }

        return [
            'siaga1' => $t->water_siaga1 ?? $t->siaga1 ?? null,
            'siaga2' => $t->water_siaga2 ?? $t->siaga2 ?? null,
        ];
    }

    private function resolveSiagaLevel($reading, array $thresholds): string
    {
        if (! $reading) {
            return 'siaga3';
        }

        $value  = (float) $reading->value;
        $siaga1 = $thresholds['siaga1'];
        $siaga2 = $thresholds['siaga2'];

        if ($siaga1 !== null && $value >= (float) $siaga1) {
            return 'siaga1';
        }

        if ($siaga2 !== null && $value >= (float) $siaga2) {
            return 'siaga2';
        }

        return 'siaga3';
    }
}
