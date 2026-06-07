<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi(); // WAJIB buat Sanctum

        // Trust proxy headers (X-Forwarded-Proto, X-Forwarded-Host) saat
        // Laravel diakses lewat tunnel seperti ngrok. Tanpa ini, signed URL
        // akan invalid karena scheme/host yang dilihat Laravel berbeda
        // dari APP_URL (proxy mengubah https → http internal).
        $middleware->trustProxies(at: '*');

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'login',
            'logout'
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();