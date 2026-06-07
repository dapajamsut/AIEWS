<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Force root URL ke APP_URL dari .env. Ini melindungi dari kasus
        // request masuk dengan host aneh (mis. host.docker.internal dari container).
        // Tanpa ini, signed URL bisa generate dengan host yang tidak bisa diakses
        // dari browser host.
        if ($url = config('app.url')) {
            URL::forceRootUrl($url);
            if (str_starts_with($url, 'https://')) {
                URL::forceScheme('https');
            }
        }
    }
}
