<?php

namespace Database\Seeders;

use App\Models\Zone;
use Illuminate\Database\Seeder;

class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            [
                'zone_id'     => 'zone_water_01',
                'name'        => 'Politeknik Negeri Jakarta',
                'sensor_code' => 'WATER-01',
                'latitude'    => -6.372279,
                'longitude'   => 106.824448,
                'radius_m'    => 1000,
            ],
            // Tambahkan zona lain di sini bila ada sensor baru.
        ];

        foreach ($zones as $zone) {
            Zone::updateOrCreate(['zone_id' => $zone['zone_id']], $zone);
        }
    }
}
