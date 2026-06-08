<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccessReviewController;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Admin Access Requests Verification
Route::get('/admin/access-requests/{id}', [AccessReviewController::class, 'show'])
    ->name('admin.access.show')
    ->middleware('signed');

Route::get('/admin/access-requests/{id}/letter', [AccessReviewController::class, 'letter'])
    ->name('admin.access.letter');

Route::post('/admin/access-requests/{id}/approve', [AccessReviewController::class, 'approve'])
    ->name('admin.access.approve');

Route::post('/admin/access-requests/{id}/reject', [AccessReviewController::class, 'reject'])
    ->name('admin.access.reject');

require __DIR__.'/auth.php';
