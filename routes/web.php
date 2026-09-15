<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('auth/sign-in/sign-in-2'));
Route::get('/sign-in', fn () => Inertia::render('auth/sign-in/index'));
Route::get('/sign-in-2', fn () => Inertia::render('auth/sign-in/sign-in-2'));
Route::get('/sign-up', fn () => Inertia::render('auth/sign-up/index'));
Route::get('/forgot-pass', fn () => Inertia::render('auth/forgot-password/index'));
Route::get('/otp', fn () => Inertia::render('auth/otp/index'));
Route::get('/401', fn () => Inertia::render('errors/unauthorized-error'));
Route::get('/403', fn () => Inertia::render('errors/forbidden'));
Route::get('/404', fn () => Inertia::render('errors/not-found-error'));
Route::get('/500', fn () => Inertia::render('errors/general-error'));
Route::get('/503', fn () => Inertia::render('errors/maintenance-error'));
Route::get('/pricing', fn () => Inertia::render('pricing/index'));

use App\Http\Controllers\ManPowerController;

Route::group(['prefix' => '/dashboard', 'middleware' => ['auth', 'verified']], function () {
    require __DIR__.'/dashboard.php';
});

Route::middleware(['auth'])->group(function () {
    Route::prefix('mod-master/manpower')->group(function () {
        Route::get('/', [ManPowerController::class, 'index'])->name('man-power.index');
        Route::post('/', [ManPowerController::class, 'store'])->name('man-power.store');
        Route::get('/template', [ManPowerController::class, 'downloadTemplate'])->name('man-power.template');
        Route::get('/export', [ManPowerController::class, 'export'])->name('man-power.export');
        Route::post('/import', [ManPowerController::class, 'import'])->name('man-power.import');
        Route::put('/{id}', [ManPowerController::class, 'update'])->name('man-power.update');
        Route::delete('/{id}', [ManPowerController::class, 'destroy'])->name('man-power.destroy');
    });

    Route::get('/master/manpower', fn () => redirect()->route('man-power.index'));
});

require __DIR__.'/auth.php';

