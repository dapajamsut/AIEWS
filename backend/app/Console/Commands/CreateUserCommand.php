<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateUserCommand extends Command
{
    /**
     * Usage:
     *   php artisan app:create-user
     *
     * Membuat user baru di tabel `users` (akun login web admin).
     */
    protected $signature = 'app:create-user
        {--name= : Nama lengkap}
        {--email= : Email login}
        {--password= : Password (opsional, akan ditanyakan)}';

    protected $description = 'Membuat user admin web baru. Dipakai sebelum menyetujui permohonan akses.';

    public function handle(): int
    {
        $name     = $this->option('name')     ?: $this->ask('Nama lengkap user');
        $email    = $this->option('email')    ?: $this->ask('Email login');
        $password = $this->option('password') ?: $this->secret('Password (min. 6 karakter, tidak akan ditampilkan)');
        $confirm  = $this->option('password') ?: $this->secret('Ulangi password');

        if (!$this->option('password') && $password !== $confirm) {
            $this->error('Password & konfirmasi tidak cocok.');
            return self::FAILURE;
        }

        $v = Validator::make(compact('name', 'email', 'password'), [
            'name'     => 'required|string|max:150',
            'email'    => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:6',
        ]);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $msg) $this->error('• ' . $msg);
            return self::FAILURE;
        }

        $user = User::create([
            'name'     => $name,
            'email'    => $email,
            'password' => $password, // auto-hashed
        ]);

        $this->info('');
        $this->info('User berhasil dibuat.');
        $this->table(['ID', 'Nama', 'Email'], [[$user->id, $user->name, $user->email]]);
        $this->line('');
        $this->line('Sekarang buka halaman Review (tombol "Buka Halaman Verifikasi" di email),');
        $this->line('lalu masukkan email + password yang baru dibuat untuk dikirim ke pemohon.');
        return self::SUCCESS;
    }
}
